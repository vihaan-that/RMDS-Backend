const Sensor = require('../models/sensor');
const SensorValue = require('../models/sensorValues');
const mongoose = require('mongoose'); // mongoose is required for mongoose.Types.ObjectId

// Get sensor values based on sensor ID and timeframe
exports.getSensorValues = async (req, res, next) => {
    try {
        const { sensorId, timeRange } = req.query;
        
        if (!sensorId || !timeRange) {
            return res.status(400).json({
                success: false,
                error: 'Please provide sensorId and timeRange'
            });
        }

        // Validate sensor exists
        const sensor = await Sensor.findById(sensorId);
        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensor not found'
            });
        }

        // Calculate time range
        const endTime = new Date();
        const startTime = new Date(endTime - timeRange * 60 * 1000); // timeRange is in minutes

        console.log(`Fetching sensor values for ${sensorId} from ${startTime} to ${endTime}`);

        // Get sensor values within timeframe
        const sensorValues = await SensorValue.find({
            sensor: sensorId,
            timestamp: {
                $gte: startTime,
                $lte: endTime
            }
        }).sort({ timestamp: 1 });

        console.log(`Found ${sensorValues.length} values`);

        res.status(200).json({
            success: true,
            data: sensorValues.map(value => ({
                value: value.value,
                timestamp: value.timestamp,
                unit: sensor.unit
            }))
        });
    } catch (error) {
        console.error('Error in getSensorValues:', error);
        next(error);
    }
};

// Get statistical analysis of sensor values within a timeframe
exports.getSensorStats = async (req, res, next) => {
    try {
        const { sensorId, startTime, endTime } = req.query;
        
        if (!sensorId || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                error: 'Please provide sensorId, startTime and endTime'
            });
        }

        // Validate sensor exists
        const sensor = await Sensor.findById(sensorId);
        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensor not found'
            });
        }

        // Using MongoDB aggregation for efficient statistical calculations
        const stats = await SensorValue.aggregate([
            {
                $match: {
                    sensor: mongoose.Types.ObjectId(sensorId),
                    timestamp: {
                        $gte: new Date(startTime),
                        $lte: new Date(endTime)
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    average: { $avg: '$value' },
                    max: { $max: '$value' },
                    min: { $min: '$value' },
                    stdDev: { $stdDevPop: '$value' }
                }
            }
        ]);

        if (!stats.length) {
            return res.status(404).json({
                success: false,
                error: 'No sensor values found in the specified timeframe'
            });
        }

        const result = stats[0];
        
        res.status(200).json({
            success: true,
            data: {
                sensor: {
                    id: sensor._id,
                    name: sensor.tagName,
                    unit: sensor.unit
                },
                stats: {
                    count: result.count,
                    average: result.average,
                    max: result.max,
                    min: result.min,
                    stdDev: result.stdDev
                }
            }
        });
    } catch (error) {
        console.error('Error in getSensorStats:', error);
        next(error);
    }
};
