const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Role = require('../models/role');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ 
            _id: decoded.id,
            isActive: true 
        }).populate('role');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid authentication token'
        });
    }
};

// Check if user has required permissions
exports.authorize = (resource, actions) => {
    return async (req, res, next) => {
        try {
            const userRole = req.user.role;
            
            // Admin role has all permissions
            if (userRole.name === 'admin') {
                return next();
            }

            const hasPermission = userRole.permissions.some(permission => 
                permission.resource === resource &&
                actions.every(action => permission.actions.includes(action))
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error checking permissions'
            });
        }
    };
};
