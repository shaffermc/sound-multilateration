// models/esp32Data.js

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
    esp32_type: {
        type: String,
        required: true
    },
    esp32_reading: {
        type: String,
        required: true
    },
    esp32_units: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create the model for ESP32Data
const ESP32Data = mongoose.model('ESP32Data', esp32DataSchema);

module.exports = ESP32Data;
