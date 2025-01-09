const Sensor = require('../models/sensor');
const SensorValue = require('../models/sensorValues');
const mongoose = require('mongoose'); // mongoose is required for mongoose.Types.ObjectId

// Get sensor values based on sensor ID and timeframe
exports.getSensorValues = async (req, res, next) => {
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

        // Get sensor values within timeframe
        const sensorValues = await SensorValue.find({
            sensor: sensorId,
            timestamp: {
                $gte: new Date(startTime),
                $lte: new Date(endTime)
            }
        }).sort({ timestamp: 1 });

        res.status(200).json({
            success: true,
            data: {
                sensor,
                values: sensorValues
            }
        });
    } catch (error) {
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
                    // For median and standard deviation, we need all values
                    values: { $push: '$value' }
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
        const values = result.values.sort((a, b) => a - b);
        
        // Calculate median
        const mid = Math.floor(values.length / 2);
        const median = values.length % 2 === 0
            ? (values[mid - 1] + values[mid]) / 2
            : values[mid];

        // Calculate standard deviation
        const mean = result.average;
        const squareDiffs = values.map(value => {
            const diff = value - mean;
            return diff * diff;
        });
        const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
        const standardDeviation = Math.sqrt(avgSquareDiff);

        // Calculate statistics in chunks if dataset is large
        const calculateMode = (values) => {
            const frequency = {};
            let maxFreq = 0;
            let mode = null;

            values.forEach(value => {
                frequency[value] = (frequency[value] || 0) + 1;
                if (frequency[value] > maxFreq) {
                    maxFreq = frequency[value];
                    mode = value;
                }
            });

            return mode;
        };

        const mode = calculateMode(values);

        res.status(200).json({
            success: true,
            data: {
                sensor: {
                    id: sensor._id,
                    tagName: sensor.tagName,
                    unit: sensor.unit
                },
                timeframe: {
                    start: new Date(startTime),
                    end: new Date(endTime)
                },
                statistics: {
                    count: result.count,
                    average: result.average,
                    median: median,
                    mode: mode,
                    standardDeviation: standardDeviation,
                    max: result.max,
                    min: result.min
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
