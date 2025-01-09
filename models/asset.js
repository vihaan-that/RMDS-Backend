const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    projectName: {
        type: String,
        required: true
    },
    assetName: {
        type: String,
        required: true
    },
    sensors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sensor'
    }]
}, {
    timestamps: true
});

// Create compound index for project and asset name
assetSchema.index({ projectName: 1, assetName: 1 }, { unique: true });

module.exports = mongoose.model('Asset', assetSchema);
