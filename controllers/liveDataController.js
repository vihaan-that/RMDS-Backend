const Asset = require('../models/asset');
const Sensor = require('../models/sensor');
const SensorValue = require('../models/sensorValues');
const sensorEventManager = require('../utils/SensorEventManager');
const mongoose = require('mongoose');

// Poll for new sensor values
const startPolling = () => {
    console.log('Starting sensor value polling');
    let lastPollTime = new Date();

    setInterval(async () => {
        try {
            const currentTime = new Date();
            console.log(`Polling for new values since ${lastPollTime.toISOString()}`);

            // Find all sensor values added since last poll
            const newValues = await SensorValue.find({
                timestamp: { $gt: lastPollTime }
            }).populate('sensor');

            if (newValues.length > 0) {
                console.log(`Found ${newValues.length} new values`);
                
                // Group values by sensor
                const sensorValues = new Map();
                newValues.forEach(value => {
                    const sensorId = value.sensor._id.toString();
                    if (!sensorValues.has(sensorId) || value.timestamp > sensorValues.get(sensorId).timestamp) {
                        sensorValues.set(sensorId, {
                            value: value.value,
                            timestamp: value.timestamp,
                            unit: value.sensor.unit
                        });
                    }
                });

                // Broadcast latest value for each sensor
                sensorValues.forEach((data, sensorId) => {
                    console.log('Broadcasting sensor data:', { sensorId, ...data });
                    sensorEventManager.broadcastSensorData(sensorId, data);
                });
            } else {
                console.log('No new values found');
            }

            lastPollTime = currentTime;
        } catch (error) {
            console.error('Error polling for sensor values:', error);
        }
    }, 1000); // Poll every second
};

// Initialize polling
console.log('Initializing sensor value polling');
startPolling();

// Middleware to handle SSE connection headers
exports.sseMiddleware = (req, res, next) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
};

// Stream live data for a single sensor
exports.streamSensorData = async (req, res, next) => {
    try {
        const { sensorId } = req.params;
        console.log(`Client requesting live data for sensor ${sensorId}`);

        // Validate sensor exists
        const sensor = await Sensor.findById(sensorId);
        if (!sensor) {
            console.error(`Sensor ${sensorId} not found`);
            return res.status(404).json({
                success: false,
                error: 'Sensor not found'
            });
        }

        console.log(`Found sensor:`, sensor);

        // Add client to event manager with specific sensor
        const clientId = sensorEventManager.addClient(res, [sensorId]);
        console.log(`Added client ${clientId} for sensor ${sensorId}`);

        // Send initial data
        const latestValue = await SensorValue.findOne({ sensor: sensorId })
            .sort({ timestamp: -1 });
        
        if (latestValue) {
            console.log(`Sending initial value for sensor ${sensorId}:`, latestValue);
            const data = {
                value: latestValue.value,
                timestamp: latestValue.timestamp,
                unit: sensor.unit
            };
            sensorEventManager.sendToClient(clientId, data);
        } else {
            console.log(`No initial value found for sensor ${sensorId}`);
        }

        // Handle client disconnect
        req.on('close', () => {
            console.log(`Client ${clientId} disconnected from sensor ${sensorId}`);
            sensorEventManager.removeClient(clientId);
        });

    } catch (error) {
        console.error(`Error in streamSensorData:`, error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};

// Stream live data for all sensors in an asset
exports.streamAssetData = async (req, res, next) => {
    try {
        const { assetId } = req.params;
        console.log(`Client requesting live data for asset ${assetId}`);

        // Validate asset exists and get its sensors
        const asset = await Asset.findById(assetId).populate('sensors');
        if (!asset) {
            console.error(`Asset ${assetId} not found`);
            return res.status(404).json({
                success: false,
                error: 'Asset not found'
            });
        }

        const sensorIds = asset.sensors.map(sensor => sensor._id.toString());
        console.log(`Found sensors for asset:`, sensorIds);

        // Add client to event manager with asset's sensors
        const clientId = sensorEventManager.addClient(res, sensorIds);
        console.log(`Added client ${clientId} for asset ${assetId}`);

        // Send initial data for each sensor
        const latestValues = await Promise.all(sensorIds.map(async sensorId => {
            const value = await SensorValue.findOne({ sensor: sensorId })
                .sort({ timestamp: -1 })
                .populate('sensor');
            if (value) {
                return {
                    sensorId,
                    value: value.value,
                    timestamp: value.timestamp,
                    unit: value.sensor.unit
                };
            }
            return null;
        }));

        const validValues = latestValues.filter(Boolean);
        if (validValues.length > 0) {
            console.log(`Sending initial values for asset ${assetId}:`, validValues);
            validValues.forEach(data => {
                sensorEventManager.sendToClient(clientId, data);
            });
        } else {
            console.log(`No initial values found for asset ${assetId}`);
        }

        // Handle client disconnect
        req.on('close', () => {
            console.log(`Client ${clientId} disconnected from asset ${assetId}`);
            sensorEventManager.removeClient(clientId);
        });

    } catch (error) {
        console.error(`Error in streamAssetData:`, error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};
