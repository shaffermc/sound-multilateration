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

// GET route to fetch recent ESP32 data
router.get('/esp32-data/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; // default 10 readings
    const recentData = await esp32Data
      .find()
      .sort({ timestamp: -1 })
      .limit(limit); // get multiple readings

    if (!recentData || recentData.length === 0)
      return res.status(404).json({ message: 'No data found' });

    res.json(recentData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching recent data' });
  }
});


// GET route to fetch recent ESP32 events
router.get('/esp32-events/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10; // default 10 readings
    const recentEvents = await esp32Event
      .find()
      .sort({ timestamp: -1 })
      .limit(limit); // get multiple readings

    if (!recentEvents || recentEvents.length === 0)
      return res.status(404).json({ message: 'No events found' });

    res.json(recentEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching recent events' });
  }
});

// GET recent ESP32 data in last N minutes
router.get('/esp32-data/recent-by-time', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 10;
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const recentData = await esp32Data.find({ timestamp: { $gte: since } }).sort({ timestamp: -1 });

    if (!recentData || recentData.length === 0)
      return res.status(404).json({ message: 'No data found' });

    res.json(recentData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching recent data' });
  }
});

// GET recent ESP32 events in last N minutes
router.get('/esp32-events/recent-by-time', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 10;
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const recentEvents = await esp32Event.find({ timestamp: { $gte: since } }).sort({ timestamp: -1 });

    if (!recentEvents || recentEvents.length === 0)
      return res.status(404).json({ message: 'No events found' });

    res.json(recentEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching recent events' });
  }
});

module.exports = router;
