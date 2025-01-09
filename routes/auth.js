const express = require('express');
const router = express.Router();
const validateRequest = require('../middleware/validateRequest');
const { userSchemas, roleSchemas } = require('../middleware/validationSchemas');
const { authenticate, authorize } = require('../middleware/auth');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const roleController = require('../controllers/roleController');

// Auth routes
router.post(
    '/login',
    validateRequest(userSchemas.login),
    authController.login
);

router.get(
    '/profile',
    authenticate,
    authController.getProfile
);

// User management routes (admin only)
router.post(
    '/users',
    authenticate,
    authorize('users', ['create']),
    validateRequest(userSchemas.create),
    userController.createUser
);

router.get(
    '/users',
    authenticate,
    authorize('users', ['read']),
    userController.getUsers
);

router.patch(
    '/users/:userId',
    authenticate,
    authorize('users', ['update']),
    validateRequest(userSchemas.update),
    userController.updateUser
);

router.delete(
    '/users/:userId',
    authenticate,
    authorize('users', ['delete']),
    userController.deleteUser
);

// Role management routes (admin only)
router.post(
    '/roles',
    authenticate,
    authorize('roles', ['create']),
    validateRequest(roleSchemas.create),
    roleController.createRole
);

router.get(
    '/roles',
    authenticate,
    authorize('roles', ['read']),
    roleController.getRoles
);

router.patch(
    '/roles/:roleId',
    authenticate,
    authorize('roles', ['update']),
    validateRequest(roleSchemas.update),
    roleController.updateRole
);

router.delete(
    '/roles/:roleId',
    authenticate,
    authorize('roles', ['delete']),
    roleController.deleteRole
);

module.exports = router;
