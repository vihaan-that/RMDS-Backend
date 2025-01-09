require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const Role = require('../models/role');

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Create admin role if it doesn't exist
        let adminRole = await Role.findOne({ name: 'admin' });
        
        if (!adminRole) {
            adminRole = await Role.create({
                name: 'admin',
                description: 'Administrator role with full access',
                permissions: [
                    {
                        resource: 'sensors',
                        actions: ['create', 'read', 'update', 'delete']
                    },
                    {
                        resource: 'assets',
                        actions: ['create', 'read', 'update', 'delete']
                    },
                    {
                        resource: 'incidents',
                        actions: ['create', 'read', 'update', 'delete']
                    },
                    {
                        resource: 'users',
                        actions: ['create', 'read', 'update', 'delete']
                    },
                    {
                        resource: 'roles',
                        actions: ['create', 'read', 'update', 'delete']
                    }
                ]
            });
            console.log('Admin role created');
        }

        // Check if admin user exists
        const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
        
        if (!adminExists) {
            // Create admin user
            await User.create({
                username: 'admin',
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                firstName: 'Admin',
                lastName: 'User',
                role: adminRole._id
            });
            console.log('Admin user created');
        }

        console.log('Admin setup complete');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAdminUser();
