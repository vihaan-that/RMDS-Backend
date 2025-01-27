class AssetEventManager {
    constructor() {
        this.clients = new Map(); // Map of clientId -> { response, assets }
        this.assetSensors = new Map(); // Map of assetId -> Set of sensorIds
        this.sensorData = new Map(); // Map of sensorId -> latest data
        this.clientId = 0;
        console.log('AssetEventManager initialized');
    }

    // Register sensors for an asset
    registerAssetSensors(assetId, sensorIds) {
        console.log(`Registering sensors for asset ${assetId}:`, sensorIds);
        this.assetSensors.set(assetId, new Set(sensorIds));
    }

    // Add a new client connection
    addClient(response, assets = []) {
        const id = this.clientId++;
        console.log(`Adding new client ${id} for assets:`, assets);
        
        // Set headers for SSE
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        // Store client information
        this.clients.set(id, { response, assets });
        console.log(`Total clients connected: ${this.clients.size}`);

        // Set up heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
            if (this.clients.has(id)) {
                console.log(`Sending heartbeat to client ${id}`);
                response.write('data: { "type": "ping" }\n\n');
            } else {
                console.log(`Client ${id} no longer exists, clearing heartbeat`);
                clearInterval(heartbeat);
            }
        }, 30000); // Send heartbeat every 30 seconds

        // Handle client disconnect
        response.on('close', () => {
            console.log(`Client ${id} connection closed, removing client`);
            this.removeClient(id);
            clearInterval(heartbeat);
        });

        return id;
    }

    // Remove a client
    removeClient(clientId) {
        console.log(`Removing client ${clientId}`);
        const client = this.clients.get(clientId);
        if (client) {
            try {
                client.response.end();
            } catch (error) {
                console.error(`Error ending response for client ${clientId}:`, error);
            }
            this.clients.delete(clientId);
            console.log(`Client ${clientId} removed. Total clients: ${this.clients.size}`);
        } else {
            console.log(`Client ${clientId} not found`);
        }
    }

    // Update sensor data and trigger asset updates
    updateSensorData(sensorId, data) {
        console.log(`Updating sensor data for sensor ${sensorId}:`, data);
        this.sensorData.set(sensorId, data);

        // Find assets that contain this sensor
        this.assetSensors.forEach((sensors, assetId) => {
            if (sensors.has(sensorId)) {
                this.broadcastAssetData(assetId);
            }
        });
    }

    // Get aggregated data for an asset
    getAssetData(assetId) {
        const sensors = this.assetSensors.get(assetId);
        if (!sensors) {
            console.log(`No sensors found for asset ${assetId}`);
            return null;
        }

        const sensorDataArray = [];
        sensors.forEach(sensorId => {
            const data = this.sensorData.get(sensorId);
            if (data) {
                sensorDataArray.push({
                    sensorId,
                    ...data
                });
            }
        });

        return {
            assetId,
            timestamp: new Date().toISOString(),
            sensors: sensorDataArray
        };
    }

    // Send data to specific client
    sendToClient(clientId, data) {
        console.log(`Attempting to send data to client ${clientId}:`, data);
        const client = this.clients.get(clientId);
        if (client && client.response.writable) {
            try {
                const message = `data: ${JSON.stringify(data)}\n\n`;
                console.log(`Sending message to client ${clientId}:`, message);
                client.response.write(message);
                console.log(`Data sent successfully to client ${clientId}`);
            } catch (error) {
                console.error(`Error sending data to client ${clientId}:`, error);
                this.removeClient(clientId);
            }
        } else {
            console.log(`Client ${clientId} not found or response not writable`);
            if (client) {
                this.removeClient(clientId);
            }
        }
    }

    // Broadcast asset data to relevant clients
    broadcastAssetData(assetId) {
        console.log(`Broadcasting asset data for asset ${assetId}`);
        const assetData = this.getAssetData(assetId);
        if (!assetData) return;

        this.clients.forEach((client, clientId) => {
            try {
                // Send if client is monitoring all assets (empty array) or specific asset
                if (client.assets.length === 0 || client.assets.includes(assetId)) {
                    console.log(`Sending asset data to client ${clientId}`);
                    this.sendToClient(clientId, {
                        type: 'asset_data',
                        data: assetData
                    });
                }
            } catch (error) {
                console.error(`Error broadcasting to client ${clientId}:`, error);
                this.removeClient(clientId);
            }
        });
    }
}

// Create a singleton instance
const assetEventManager = new AssetEventManager();
module.exports = assetEventManager;