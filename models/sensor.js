const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
    tagName: {
        type: String,
        required: true,
        unique: true
    },
    tagDescription: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Sensor', sensorSchema);
