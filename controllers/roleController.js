const Role = require('../models/role');

// Create new role (admin only)
exports.createRole = async (req, res, next) => {
    try {
        const { name, permissions, description } = req.body;

        const role = new Role({
            name,
            permissions,
            description
        });

        await role.save();

        res.status(201).json({
            success: true,
            data: role
        });
    } catch (error) {
        next(error);
    }
};

// Get all roles (admin only)
exports.getRoles = async (req, res, next) => {
    try {
        const roles = await Role.find();

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        next(error);
    }
};

// Update role (admin only)
exports.updateRole = async (req, res, next) => {
    try {
        const { roleId } = req.params;
        const updates = req.body;

        const role = await Role.findByIdAndUpdate(
            roleId,
            updates,
            { new: true, runValidators: true }
        );

        if (!role) {
            return res.status(404).json({
                success: false,
                error: 'Role not found'
            });
        }

        res.json({
            success: true,
            data: role
        });
    } catch (error) {
        next(error);
    }
};

// Delete role (admin only)
exports.deleteRole = async (req, res, next) => {
    try {
        const { roleId } = req.params;

        // Check if role is in use
        const usersWithRole = await User.countDocuments({ role: roleId });
        if (usersWithRole > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete role as it is assigned to users'
            });
        }

        const role = await Role.findByIdAndDelete(roleId);
        
        if (!role) {
            return res.status(404).json({
                success: false,
                error: 'Role not found'
            });
        }

        res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
