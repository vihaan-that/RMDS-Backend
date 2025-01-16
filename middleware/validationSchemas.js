const Joi = require('joi');
const mongoose = require('mongoose');

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

// Common schemas
const timeframeSchema = {
    startTime: Joi.date().iso().required()
        .messages({
            'date.base': 'Start time must be a valid date',
            'date.format': 'Start time must be in ISO format',
            'any.required': 'Start time is required'
        }),
    endTime: Joi.date().iso().min(Joi.ref('startTime')).required()
        .messages({
            'date.base': 'End time must be a valid date',
            'date.format': 'End time must be in ISO format',
            'date.min': 'End time must be after start time',
            'any.required': 'End time is required'
        })
};

// Sensor validation schemas
const sensorSchemas = {
    create: Joi.object({
        tagName: Joi.string().required().trim()
            .messages({
                'string.empty': 'Tag name cannot be empty',
                'any.required': 'Tag name is required'
            }),
        tagDescription: Joi.string().required().trim()
            .messages({
                'string.empty': 'Tag description cannot be empty',
                'any.required': 'Tag description is required'
            }),
        unit: Joi.string().required().trim()
            .messages({
                'string.empty': 'Unit cannot be empty',
                'any.required': 'Unit is required'
            })
    }),
    
    sensorValue: Joi.object({
        value: Joi.number().required()
            .messages({
                'number.base': 'Value must be a number',
                'any.required': 'Value is required'
            }),
        timestamp: Joi.date().iso().default(Date.now)
            .messages({
                'date.base': 'Timestamp must be a valid date',
                'date.format': 'Timestamp must be in ISO format'
            })
    }),

    getSensorValues: Joi.object({
        sensorId: Joi.string().custom(isValidObjectId).required()
            .messages({
                'any.invalid': 'Invalid sensor ID format',
                'any.required': 'Sensor ID is required'
            }),
        timeRange: Joi.number().integer().min(1).max(60)
            .messages({
                'number.base': 'Time range must be a number',
                'number.integer': 'Time range must be an integer',
                'number.min': 'Time range must be at least 1 minute',
                'number.max': 'Time range cannot exceed 60 minutes'
            })
    }),

    getSensorStats: Joi.object({
        sensorId: Joi.string().custom(isValidObjectId).required()
            .messages({
                'any.invalid': 'Invalid sensor ID format',
                'any.required': 'Sensor ID is required'
            }),
        ...timeframeSchema
    }),

    liveSensorParams: Joi.object({
        sensorId: Joi.string().custom(isValidObjectId).required()
            .messages({
                'any.invalid': 'Invalid sensor ID format',
                'any.required': 'Sensor ID is required'
            })
    })
};

// Asset validation schemas
const assetSchemas = {
    create: Joi.object({
        projectName: Joi.string().required().trim()
            .messages({
                'string.empty': 'Project name cannot be empty',
                'any.required': 'Project name is required'
            }),
        assetName: Joi.string().required().trim()
            .messages({
                'string.empty': 'Asset name cannot be empty',
                'any.required': 'Asset name is required'
            }),
        sensors: Joi.array().items(
            Joi.string().custom(isValidObjectId)
        ).default([])
            .messages({
                'array.base': 'Sensors must be an array',
                'any.invalid': 'Invalid sensor ID format'
            })
    }),

    getAssetData: Joi.object({
        assetId: Joi.string().custom(isValidObjectId).required()
            .messages({
                'any.invalid': 'Invalid asset ID format',
                'any.required': 'Asset ID is required'
            }),
        ...timeframeSchema
    }),

    liveAssetParams: Joi.object({
        assetId: Joi.string().custom(isValidObjectId).required()
            .messages({
                'any.invalid': 'Invalid asset ID format',
                'any.required': 'Asset ID is required'
            })
    })
};

// Incident validation schemas
const incidentSchemas = {
    create: Joi.object({
        KpiId: Joi.string().required().trim()
            .messages({
                'string.empty': 'KPI ID cannot be empty',
                'any.required': 'KPI ID is required'
            }),
        Kpi: Joi.string().required().trim()
            .messages({
                'string.empty': 'KPI cannot be empty',
                'any.required': 'KPI is required'
            }),
        startDate: Joi.date().iso().required()
            .messages({
                'date.base': 'Start date must be a valid date',
                'date.format': 'Start date must be in ISO format',
                'any.required': 'Start date is required'
            }),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
            .messages({
                'date.base': 'End date must be a valid date',
                'date.format': 'End date must be in ISO format',
                'date.min': 'End date must be after start date',
                'any.required': 'End date is required'
            }),
        VariableName: Joi.string().required().trim()
            .messages({
                'string.empty': 'Variable name cannot be empty',
                'any.required': 'Variable name is required'
            }),
        Equipment: Joi.string().required().trim()
            .messages({
                'string.empty': 'Equipment cannot be empty',
                'any.required': 'Equipment is required'
            }),
        System: Joi.string().required().trim()
            .messages({
                'string.empty': 'System cannot be empty',
                'any.required': 'System is required'
            }),
        Description: Joi.string().required().trim()
            .messages({
                'string.empty': 'Description cannot be empty',
                'any.required': 'Description is required'
            }),
        Status: Joi.string().required().trim()
            .messages({
                'string.empty': 'Status cannot be empty',
                'any.required': 'Status is required'
            }),
        Priority: Joi.string().required().trim()
            .messages({
                'string.empty': 'Priority cannot be empty',
                'any.required': 'Priority is required'
            }),
        AssignedTo: Joi.string().required().trim()
            .messages({
                'string.empty': 'AssignedTo cannot be empty',
                'any.required': 'AssignedTo is required'
            })
    }),

    getIncidents: Joi.object({
        startTime: Joi.date().iso()
            .messages({
                'date.base': 'Start time must be a valid date',
                'date.format': 'Start time must be in ISO format'
            }),
        endTime: Joi.date().iso().min(Joi.ref('startTime'))
            .messages({
                'date.base': 'End time must be a valid date',
                'date.format': 'End time must be in ISO format',
                'date.min': 'End time must be after start time'
            }),
        status: Joi.string().valid('open', 'closed', 'all')
            .messages({
                'any.only': 'Status must be one of: open, closed, all'
            })
    })
};

// User validation schemas
const userSchemas = {
    login: Joi.object({
        email: Joi.string().email().required()
            .messages({
                'string.email': 'Please provide a valid email',
                'any.required': 'Email is required'
            }),
        password: Joi.string().required()
            .messages({
                'string.empty': 'Password cannot be empty',
                'any.required': 'Password is required'
            })
    }),

    create: Joi.object({
        username: Joi.string().required().min(3).max(30)
            .messages({
                'string.empty': 'Username cannot be empty',
                'string.min': 'Username must be at least 3 characters long',
                'string.max': 'Username cannot exceed 30 characters',
                'any.required': 'Username is required'
            }),
        email: Joi.string().email().required()
            .messages({
                'string.email': 'Please provide a valid email',
                'any.required': 'Email is required'
            }),
        password: Joi.string().required().min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .messages({
                'string.empty': 'Password cannot be empty',
                'string.min': 'Password must be at least 8 characters long',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                'any.required': 'Password is required'
            }),
        firstName: Joi.string().required()
            .messages({
                'string.empty': 'First name cannot be empty',
                'any.required': 'First name is required'
            }),
        lastName: Joi.string().required()
            .messages({
                'string.empty': 'Last name cannot be empty',
                'any.required': 'Last name is required'
            }),
        roleId: Joi.string().custom(isValidObjectId).required()
            .messages({
                'any.invalid': 'Invalid role ID format',
                'any.required': 'Role ID is required'
            })
    }),

    update: Joi.object({
        username: Joi.string().min(3).max(30),
        email: Joi.string().email(),
        firstName: Joi.string(),
        lastName: Joi.string(),
        roleId: Joi.string().custom(isValidObjectId),
        isActive: Joi.boolean()
    })
};

// Role validation schemas
const roleSchemas = {
    create: Joi.object({
        name: Joi.string().required()
            .messages({
                'string.empty': 'Role name cannot be empty',
                'any.required': 'Role name is required'
            }),
        permissions: Joi.array().items(
            Joi.object({
                resource: Joi.string().valid('sensors', 'assets', 'incidents', 'users', 'roles').required()
                    .messages({
                        'any.only': 'Invalid resource type',
                        'any.required': 'Resource is required'
                    }),
                actions: Joi.array().items(
                    Joi.string().valid('create', 'read', 'update', 'delete')
                ).required()
                    .messages({
                        'any.only': 'Invalid action type',
                        'any.required': 'Actions are required'
                    })
            })
        ).required()
            .messages({
                'array.base': 'Permissions must be an array',
                'any.required': 'Permissions are required'
            }),
        description: Joi.string().required()
            .messages({
                'string.empty': 'Description cannot be empty',
                'any.required': 'Description is required'
            })
    }),

    update: Joi.object({
        name: Joi.string(),
        permissions: Joi.array().items(
            Joi.object({
                resource: Joi.string().valid('sensors', 'assets', 'incidents', 'users', 'roles'),
                actions: Joi.array().items(
                    Joi.string().valid('create', 'read', 'update', 'delete')
                )
            })
        ),
        description: Joi.string()
    })
};

module.exports = {
    sensorSchemas,
    assetSchemas,
    incidentSchemas,
    userSchemas,
    roleSchemas
};
