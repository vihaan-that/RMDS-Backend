const mongoose = require('mongoose');
const Asset = require('../models/asset');
const Sensor = require('../models/sensor');
const SensorValue = require('../models/sensorValues');

// Store previous values for each sensor to generate realistic variations
const sensorPreviousValues = new Map();

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/powerplant', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Clear existing data
        await Asset.deleteMany({});
        await Sensor.deleteMany({});
        await SensorValue.deleteMany({});

        console.log('Cleared existing data');

        const projectName = 'PowerPlantAutomation';
        const assets = [];

        // Create 2 assets for the project
        for (let i = 1; i <= 2; i++) {
            const assetName = `Asset-${i}`;
            const sensors = [];

            // Create 10 sensors for each asset
            for (let j = 1; j <= 10; j++) {
                const tagName = `Sensor-${i}-${j}`;
                const tagDescription = `Description for ${tagName}`;
                const unit = ['Celsius', 'kW', 'kPa', 'RPM'][Math.floor(Math.random() * 4)];

                const sensor = new Sensor({
                    tagName,
                    tagDescription,
                    unit,
                });

                await sensor.save();
                sensors.push(sensor._id);
                
                // Initialize previous value for this sensor
                const initialValue = generateValue(unit);
                sensorPreviousValues.set(sensor._id.toString(), initialValue);
                console.log(`Created sensor: ${tagName} with initial value: ${initialValue} ${unit}`);
            }

            const asset = new Asset({
                projectName,
                assetName,
                sensors,
            });

            await asset.save();
            assets.push(asset);
            console.log(`Created asset: ${assetName}`);
        }

        console.log('Assets and sensors created successfully');

        // Function to generate a random value based on the unit and previous value
        function generateValue(unit, previousValue = null) {
            let baseValue;
            let maxChange;
            
            switch (unit) {
                case 'Celsius':
                    baseValue = previousValue !== null ? previousValue : 60;
                    maxChange = 2; // Maximum 2°C change per second
                    return clampValue(baseValue + (Math.random() - 0.5) * maxChange, 0, 100);
                
                case 'kW':
                    baseValue = previousValue !== null ? previousValue : 500;
                    maxChange = 20; // Maximum 20kW change per second
                    return clampValue(baseValue + (Math.random() - 0.5) * maxChange, 0, 1000);
                
                case 'kPa':
                    baseValue = previousValue !== null ? previousValue : 250;
                    maxChange = 10; // Maximum 10kPa change per second
                    return clampValue(baseValue + (Math.random() - 0.5) * maxChange, 0, 500);
                
                case 'RPM':
                    baseValue = previousValue !== null ? previousValue : 1500;
                    maxChange = 50; // Maximum 50 RPM change per second
                    return clampValue(baseValue + (Math.random() - 0.5) * maxChange, 0, 3000);
                
                default:
                    return parseFloat((Math.random() * 100).toFixed(2));
            }
        }

        // Helper function to clamp value between min and max
        function clampValue(value, min, max) {
            return parseFloat(Math.min(Math.max(value, min), max).toFixed(2));
        }

        // Generate sensor values every second
        setInterval(async () => {
            try {
                const allSensors = await Sensor.find({});
                const timestamp = new Date();

                const sensorValuePromises = allSensors.map(async sensor => {
                    const sensorId = sensor._id.toString();
                    const previousValue = sensorPreviousValues.get(sensorId);
                    const value = generateValue(sensor.unit, previousValue);
                    
                    // Store the new value as previous value for next iteration
                    sensorPreviousValues.set(sensorId, value);

                    const sensorValue = new SensorValue({
                        sensor: sensor._id,
                        value,
                        timestamp
                    });

                    await sensorValue.save();
                    console.log(`Added value for ${sensor.tagName}: ${value} ${sensor.unit} (previous: ${previousValue})`);
                });

                await Promise.all(sensorValuePromises);
                console.log(`Sensor values added at ${timestamp.toISOString()}`);
            } catch (error) {
                console.error('Error generating sensor values:', error);
            }
        }, 1000);

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('Disconnecting from MongoDB...');
    mongoose.disconnect().then(() => {
        console.log('Disconnected from MongoDB');
        process.exit(0);
    });
});

// Start the seeding process
seedDatabase();
