const express = require('express');
const router = express.Router();
const validateRequest = require('../middleware/validateRequest');
const { sensorSchemas, assetSchemas, incidentSchemas } = require('../middleware/validationSchemas');
const { authenticate } = require('../middleware/auth');

const sensorController = require('../controllers/sensorController');
const incidentController = require('../controllers/incidentController');
const assetController = require('../controllers/assetController');
const liveDataController = require('../controllers/liveDataController');

// Public routes
router.get('/project-assets', assetController.getProjectAssets);

// Live data routes (SSE)
router.get(
    '/live/sensor/:sensorId',
    validateRequest(sensorSchemas.liveSensorParams, 'params'),
    liveDataController.sseMiddleware,
    liveDataController.streamSensorData
);

router.get(
    '/live/asset/:assetId',
    validateRequest(assetSchemas.liveAssetParams, 'params'),
    liveDataController.sseMiddleware,
    liveDataController.streamAssetData
);

// Sensor data routes
router.get(
    '/sensor-values',
    validateRequest(sensorSchemas.getSensorValues, 'query'),
    sensorController.getSensorValues
);

router.get(
    '/sensor-stats',
    validateRequest(sensorSchemas.getSensorStats, 'query'),
    sensorController.getSensorStats
);

// Protected routes (require authentication)
router.use(authenticate);

// Incident routes
router.get(
    '/incidents',
    validateRequest(incidentSchemas.getIncidents, 'query'),
    incidentController.getIncidents
);

// Asset routes
router.get(
    '/asset-data',
    validateRequest(assetSchemas.getAssetData, 'query'),
    assetController.getAssetData
);

module.exports = router;
