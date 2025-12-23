const mongoose = require('mongoose');

// Define the schema for ESP32 data
const esp32DataSchema = new mongoose.Schema({
    esp32_location: {
        type: String,
        required: true
    },
    esp32_name: {
        type: String,
        required: true
    },
    esp32_sensor_type: {
        type: String,
        required: true
    },
    esp32_sensor_reading: {
        type: String,
        required: true
    },
    esp32_sensor_units: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create the model for ESP32Data
const esp32Data = mongoose.model('esp32Data', esp32DataSchema);

module.exports = esp32Data;
