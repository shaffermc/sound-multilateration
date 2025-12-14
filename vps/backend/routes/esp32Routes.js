const express = require('express');
const router = express.Router();
const ESP32Data = require('../models/esp32Data'); // Model for ESP32 data
const ESP32Event = require('../models/esp32Event'); // Model for ESP32 events

// POST route to handle ESP32 data updates
router.post('/update_esp32_data', async (req, res) => {
    try {
        const { esp32_location, esp32_name, esp32_type, esp32_reading, esp32_units } = req.body;

        if (!esp32_location || !esp32_name || !esp32_type || !esp32_reading || !esp32_units) {
            return res.status(400).send('Missing required fields');
        }

        // Create a new ESP32Data entry (if you want to store this data in a DB)
        const newESP32Data = new ESP32Data({
            esp32_location,
            esp32_name,
            esp32_type,
            esp32_reading,
            esp32_units
        });

        // Save to the database (optional, but useful for logging)
        await newESP32Data.save();

        res.status(200).send('ESP32 data received');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing ESP32 data');
    }
});

// POST route to handle ESP32 events (like Wi-Fi status or system uptime)
router.post('/add_esp32_event', async (req, res) => {
    try {
        const { esp32_location, esp32_event_type, esp32_event_value, esp32_event_units } = req.body;

        if (!esp32_location || !esp32_event_type || !esp32_event_value || !esp32_event_units) {
            return res.status(400).send('Missing required fields');
        }

        // Create a new ESP32Event entry
        const newESP32Event = new ESP32Event({
            esp32_location,
            esp32_event_type,
            esp32_event_value,
            esp32_event_units
        });

        // Save the event to the database (optional)
        await newESP32Event.save();

        res.status(200).send('ESP32 event received');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing ESP32 event');
    }
});

module.exports = router;
