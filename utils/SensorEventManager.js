class SensorEventManager {
    constructor() {
        this.clients = new Map(); // Map of clientId -> { response, sensors }
        this.clientId = 0;
    }

    // Add a new client connection
    addClient(response, sensors = []) {
        const id = this.clientId++;
        
        // Set SSE headers
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Store client information
        this.clients.set(id, { response, sensors });

        // Handle client disconnect
        response.on('close', () => {
            this.clients.delete(id);
        });

        return id;
    }

    // Remove a client
    removeClient(clientId) {
        this.clients.delete(clientId);
    }

    // Send data to specific client
    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (client) {
            client.response.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    }

    // Send data to all clients that are monitoring the specified sensors
    broadcastSensorData(sensorId, data) {
        this.clients.forEach((client, clientId) => {
            // Send if client is monitoring all sensors (empty array) or specific sensor
            if (client.sensors.length === 0 || client.sensors.includes(sensorId)) {
                this.sendToClient(clientId, {
                    sensorId,
                    ...data
                });
            }
        });
    }

    // Send data to all clients monitoring an asset's sensors
    broadcastAssetData(assetId, sensorsData) {
        this.clients.forEach((client, clientId) => {
            // Filter data based on client's sensor subscription
            const filteredData = client.sensors.length === 0 
                ? sensorsData 
                : sensorsData.filter(data => client.sensors.includes(data.sensorId));
            
            if (filteredData.length > 0) {
                this.sendToClient(clientId, {
                    assetId,
                    sensors: filteredData
                });
            }
        });
    }
}

// Create a singleton instance
const sensorEventManager = new SensorEventManager();
module.exports = sensorEventManager;
