const User = require('../models/user');
const Role = require('../models/role');

// Create new user (admin only)
exports.createUser = async (req, res, next) => {
    try {
        const { username, email, password, firstName, lastName, roleId } = req.body;

        // Check if role exists
        const role = await Role.findById(roleId);
        if (!role) {
            return res.status(404).json({
                success: false,
                error: 'Role not found'
            });
        }

        // Create user
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName,
            role: roleId
        });

        await user.save();

        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: role.name
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get all users (admin only)
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find()
            .select('-password')
            .populate('role');

        res.json({
            success: true,
            data: users.map(user => ({
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name,
                isActive: user.isActive,
                lastLogin: user.lastLogin
            }))
        });
    } catch (error) {
        next(error);
    }
};

// Update user (admin only)
exports.updateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        // Remove sensitive fields
        delete updates.password;

        if (updates.roleId) {
            const role = await Role.findById(updates.roleId);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    error: 'Role not found'
                });
            }
            updates.role = updates.roleId;
            delete updates.roleId;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        ).populate('role');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name,
                isActive: user.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};

// Delete user (admin only)
exports.deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
