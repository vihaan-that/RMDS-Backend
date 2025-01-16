class SensorEventManager {
    constructor() {
        this.clients = new Map(); // Map of clientId -> { response, sensors }
        this.clientId = 0;
        console.log('SensorEventManager initialized');
    }

    // Add a new client connection
    addClient(response, sensors = []) {
        const id = this.clientId++;
        console.log(`Adding new client ${id} for sensors:`, sensors);

        // Set headers for SSE
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        // Store client information
        this.clients.set(id, { response, sensors });
        console.log(`Total clients connected: ${this.clients.size}`);

        // Send initial comment to establish connection
        response.write('data: :ok\n\n');

        // Set up heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
            if (this.clients.has(id)) {
                console.log(`Sending heartbeat to client ${id}`);
                response.write('data: :ping\n\n');
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

    // Send data to all clients that are monitoring the specified sensors
    broadcastSensorData(sensorId, data) {
        console.log(`Broadcasting sensor data for sensor ${sensorId}:`, data);
        console.log(`Current clients: ${this.clients.size}`);
        
        this.clients.forEach((client, clientId) => {
            try {
                console.log(`Checking client ${clientId} for sensor ${sensorId}. Monitoring sensors:`, client.sensors);
                // Send if client is monitoring all sensors (empty array) or specific sensor
                if (client.sensors.length === 0 || client.sensors.includes(sensorId)) {
                    console.log(`Sending data to client ${clientId}`);
                    this.sendToClient(clientId, {
                        sensorId,
                        ...data
                    });
                } else {
                    console.log(`Client ${clientId} not monitoring sensor ${sensorId}`);
                }
            } catch (error) {
                console.error(`Error broadcasting to client ${clientId}:`, error);
                this.removeClient(clientId);
            }
        });
    }

    // Send data to all clients monitoring an asset's sensors
    broadcastAssetData(assetId, sensorsData) {
        console.log(`Broadcasting asset data for asset ${assetId}:`, sensorsData);
        
        this.clients.forEach((client, clientId) => {
            try {
                // Filter data based on client's sensor subscription
                const filteredData = client.sensors.length === 0 
                    ? sensorsData 
                    : sensorsData.filter(data => client.sensors.includes(data.sensorId));
                
                if (filteredData.length > 0) {
                    console.log(`Sending filtered data to client ${clientId}:`, filteredData);
                    this.sendToClient(clientId, {
                        assetId,
                        sensors: filteredData
                    });
                } else {
                    console.log(`No relevant data for client ${clientId}`);
                }
            } catch (error) {
                console.error(`Error broadcasting to client ${clientId}:`, error);
                this.removeClient(clientId);
            }
        });
    }
}

// Create a singleton instance
const sensorEventManager = new SensorEventManager();
module.exports = sensorEventManager;
