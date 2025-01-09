const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    KpiId: {
        type: String,
        required: true
    },
    Kpi: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    VariableName: {
        type: String,
        required: true
    },
    Equipment: {
        type: String,
        required: true
    },
    System: {
        type: String,
        required: true
    },
    Priority: {
        type: String,
        enum: ['P1', 'P2', 'P3'],
        required: true
    },
    Severity: {
        type: String,
        enum: ['S1', 'S2', 'S3'],
        required: true
    },
    Owner: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create indexes for common query patterns
incidentSchema.index({ startDate: 1, endDate: 1 });
incidentSchema.index({ KpiId: 1 });
incidentSchema.index({ Priority: 1 });
incidentSchema.index({ Severity: 1 });

// Add validation to ensure endDate is after startDate
incidentSchema.pre('save', function(next) {
    if (this.endDate < this.startDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});

module.exports = mongoose.model('Incident', incidentSchema);
