const mongoose = require('mongoose');

const sensorValueSchema = new mongoose.Schema({
    sensor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sensor',
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    }
});

// Create an index on timestamp for better query performance
sensorValueSchema.index({ timestamp: 1 });
// Create a compound index on sensor and timestamp
sensorValueSchema.index({ sensor: 1, timestamp: 1 });

module.exports = mongoose.model('SensorValue', sensorValueSchema);
