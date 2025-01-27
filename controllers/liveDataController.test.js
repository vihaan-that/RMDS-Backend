const { startPolling } = require('./liveDataController');
const SensorValue = require('../models/sensorValues');
const sensorEventManager = require('../utils/SensorEventManager');

jest.mock('../models/sensorValues');
jest.mock('../utils/SensorEventManager');

describe('startPolling', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        global.setInterval = jest.fn((callback, interval) => {
            return setTimeout(callback, interval);
        });
        global.clearInterval = jest.fn((id) => {
            clearTimeout(id);
        });
        sensorEventManager.clients = new Set();
        sensorEventManager.broadcastSensorData = jest.fn();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.resetAllMocks();
    });

    test('should start polling if not already active', () => {
        startPolling();
        expect(setInterval).toHaveBeenCalledTimes(1);
    });

    test('should not start polling if already active', () => {
        startPolling();
        startPolling();
        expect(setInterval).toHaveBeenCalledTimes(1);
    });

    test('should stop polling if no active clients', () => {
        startPolling();
        sensorEventManager.clients.size = 0;
        jest.advanceTimersByTime(1000);
        expect(clearInterval).toHaveBeenCalledTimes(1);
    });

    test('should find and broadcast new sensor values', async () => {
        sensorEventManager.clients.size = 1;
        const mockValues = [
            { sensor: { _id: '1', unit: 'C' }, value: 25, timestamp: new Date() }
        ];
        SensorValue.find.mockResolvedValue(mockValues);

        startPolling();
        jest.advanceTimersByTime(1000);

        await Promise.resolve(); // Wait for promises to resolve

        expect(SensorValue.find).toHaveBeenCalledTimes(1);
        expect(sensorEventManager.broadcastSensorData).toHaveBeenCalledWith('1', {
            value: 25,
            timestamp: mockValues[0].timestamp,
            unit: 'C',
            sensorId: '1'
        });
    });
});