const express = require('express');
const router = express.Router();
const validateRequest = require('../middleware/validateRequest');
const { sensorSchemas, assetSchemas, incidentSchemas } = require('../middleware/validationSchemas');

const sensorController = require('../controllers/sensorController');
const incidentController = require('../controllers/incidentController');
const assetController = require('../controllers/assetController');
const liveDataController = require('../controllers/liveDataController');

// Sensor routes
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

// Live data routes (SSE)
router.get(
    '/live/sensor/:sensorId',
    validateRequest(sensorSchemas.getSensorValues.extract('sensorId'), 'params'),
    liveDataController.sseMiddleware,
    liveDataController.streamSensorData
);

router.get(
    '/live/asset/:assetId',
    validateRequest(assetSchemas.getAssetData.extract('assetId'), 'params'),
    liveDataController.sseMiddleware,
    liveDataController.streamAssetData
);

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
