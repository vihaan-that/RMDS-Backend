const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    permissions: [{
        resource: {
            type: String,
            required: true,
            enum: ['sensors', 'assets', 'incidents', 'users', 'roles']
        },
        actions: [{
            type: String,
            required: true,
            enum: ['create', 'read', 'update', 'delete']
        }]
    }],
    description: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create indexes
roleSchema.index({ name: 1 });

module.exports = mongoose.model('Role', roleSchema);
