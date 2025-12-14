const mongoose = require('mongoose');

// Define the schema for ESP32 events
const esp32EventSchema = new mongoose.Schema({
    esp32_location: {
        type: String,
        required: true
    },
    esp32_event_type: {
        type: String,
        required: true
    },
    esp32_event_value: {
        type: String,
        required: true
    },
    esp32_event_units: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create the model for ESP32Event
const ESP32Event = mongoose.model('ESP32Event', esp32EventSchema);

module.exports = ESP32Event;
