const Asset = require('../models/asset');
const Sensor = require('../models/sensor');
const SensorValue = require('../models/sensorValues');

// Get sensors and their latest values based on asset
exports.getAssetData = async (req, res, next) => {
    try {
        const { assetId, startTime, endTime } = req.query;
        
        if (!assetId) {
            return res.status(400).json({
                success: false,
                error: 'Please provide assetId'
            });
        }

        // Get asset with populated sensors
        const asset = await Asset.findById(assetId).populate('sensors');
        
        if (!asset) {
            return res.status(404).json({
                success: false,
                error: 'Asset not found'
            });
        }

        // If timeframe is provided, get sensor values within that timeframe
        let sensorValues = [];
        if (startTime && endTime) {
            sensorValues = await SensorValue.find({
                sensor: { $in: asset.sensors.map(sensor => sensor._id) },
                timestamp: {
                    $gte: new Date(startTime),
                    $lte: new Date(endTime)
                }
            }).sort({ timestamp: 1 });
        } else {
            // If no timeframe provided, get only the latest value for each sensor
            sensorValues = await Promise.all(
                asset.sensors.map(async (sensor) => {
                    const latestValue = await SensorValue.findOne({
                        sensor: sensor._id
                    }).sort({ timestamp: -1 });
                    return latestValue;
                })
            );
        }

        res.status(200).json({
            success: true,
            data: {
                asset,
                sensorValues
            }
        });
    } catch (error) {
        next(error);
    }
};
