const express = require('express');
const router = express.Router();
const esp32Data = require('../models/esp32Data'); // Model for ESP32 data
const esp32Event = require('../models/esp32Event'); // Model for ESP32 events

// POST route to handle ESP32 data updates
router.post('/add_esp32_data', async (req, res) => {
    try {
        console.log('ESP32 data received:', req.body);
        const { esp32_location, esp32_name, esp32_sensor_type, esp32_sensor_reading, esp32_sensor_units } = req.body;

        if (!esp32_location || !esp32_name || !esp32_sensor_type || !esp32_sensor_reading || !esp32_sensor_units) {
            return res.status(400).send('Missing required fields');
        }

        const newesp32data = new esp32Data({
            esp32_location,
            esp32_name,
            esp32_sensor_type,
            esp32_sensor_reading,
            esp32_sensor_units
        });

        await newesp32data.save();

        res.status(200).send('ESP32 data received');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing ESP32 data');
    }
});

// POST route to handle ESP32 events
router.post('/add_esp32_event', async (req, res) => {
    try {
        console.log('ESP32 event received:', req.body);
        const { esp32_location, esp32_name, esp32_event_type, esp32_event_value, esp32_event_units } = req.body;

        if (!esp32_location || !esp32_name || !esp32_event_type || !esp32_event_value || !esp32_event_units) {
            return res.status(400).send('Missing required fields');
        }

        const newesp32event = new esp32Event({
            esp32_location,
            esp32_name,
            esp32_event_type,
            esp32_event_value,
            esp32_event_units
        });

        await newesp32event.save();

        res.status(200).send('ESP32 event received');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing ESP32 event');
    }
});

// GET route to fetch the latest ESP32 data
router.get('/esp32-data/latest', async (req, res) => {
    try {
        const latestData = await esp32Data.findOne().sort({ timestamp: -1 });
        if (!latestData) return res.status(404).json({ message: 'No data found' });
        res.json(latestData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching latest data' });
    }
});

// GET route to fetch the latest ESP32 event
router.get('/esp32-events/latest', async (req, res) => {
    try {
        const latestEvent = await esp32Event.findOne().sort({ timestamp: -1 });
        if (!latestEvent) return res.status(404).json({ message: 'No event found' });
        res.json(latestEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching latest event' });
    }
});

module.exports = router;
