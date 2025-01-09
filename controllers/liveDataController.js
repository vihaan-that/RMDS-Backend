const Asset = require('../models/asset');
const Sensor = require('../models/sensor');
const SensorValue = require('../models/sensorValues');
const sensorEventManager = require('../utils/SensorEventManager');
const mongoose = require('mongoose');

// Set up change stream for sensor values
const setupChangeStream = () => {
    const pipeline = [
        {
            $match: {
                operationType: 'insert'
            }
        }
    ];

    const changeStream = SensorValue.watch(pipeline, { fullDocument: 'updateLookup' });
    
    changeStream.on('change', async (change) => {
        const sensorValue = change.fullDocument;
        
        // Broadcast to clients monitoring this sensor
        sensorEventManager.broadcastSensorData(sensorValue.sensor.toString(), {
            value: sensorValue.value,
            timestamp: sensorValue.timestamp
        });
    });

    return changeStream;
};

// Initialize change stream
const changeStream = setupChangeStream();

// Stream live data for a single sensor
exports.streamSensorData = async (req, res, next) => {
    try {
        const { sensorId } = req.params;

        // Validate sensor exists
        const sensor = await Sensor.findById(sensorId);
        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensor not found'
            });
        }

        // Add client to event manager with specific sensor
        sensorEventManager.addClient(res, [sensorId]);

        // Send initial data
        const latestValue = await SensorValue.findOne({ sensor: sensorId })
            .sort({ timestamp: -1 });
        
        if (latestValue) {
            res.write(`data: ${JSON.stringify({
                sensorId,
                value: latestValue.value,
                timestamp: latestValue.timestamp
            })}\n\n`);
        }

    } catch (error) {
        next(error);
    }
};

// Stream live data for all sensors in an asset
exports.streamAssetData = async (req, res, next) => {
    try {
        const { assetId } = req.params;

        // Validate asset exists and get its sensors
        const asset = await Asset.findById(assetId).populate('sensors');
        if (!asset) {
            return res.status(404).json({
                success: false,
                error: 'Asset not found'
            });
        }

        const sensorIds = asset.sensors.map(sensor => sensor._id.toString());

        // Add client to event manager with asset's sensors
        sensorEventManager.addClient(res, sensorIds);

        // Send initial data for all sensors
        const latestValues = await SensorValue.aggregate([
            {
                $match: {
                    sensor: { $in: sensorIds.map(id => mongoose.Types.ObjectId(id)) }
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: '$sensor',
                    latestValue: { $first: '$$ROOT' }
                }
            }
        ]);

        if (latestValues.length > 0) {
            const initialData = {
                assetId,
                sensors: latestValues.map(item => ({
                    sensorId: item._id.toString(),
                    value: item.latestValue.value,
                    timestamp: item.latestValue.timestamp
                }))
            };
            res.write(`data: ${JSON.stringify(initialData)}\n\n`);
        }

    } catch (error) {
        next(error);
    }
};

// Middleware to handle SSE connection headers
exports.sseMiddleware = (req, res, next) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    next();
};
