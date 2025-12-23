const express = require('express');
const router = express.Router();
const esp32Data = require('../models/esp32Data'); // Model for ESP32 data
const esp32Event = require('../models/esp32Event'); // Model for ESP32 events

// POST route to handle ESP32 data updates
router.post('/add_esp32_data', async (req, res) => {
    try {
        const { esp32_location, esp32_name, esp32_sensor_type, esp32_sensor_reading, esp32_sensor_units } = req.body;

        if (!esp32_location || !esp32_name || !esp32_sensor_type || !esp32_sensor_reading || !esp32_sensor_units) {
            return res.status(400).send('Missing required fields');
        }

        // Normalize the sensor type
        const normalizedType = esp32_sensor_type.toLowerCase().replace(/\s+/g, '_');

        const newesp32data = new esp32Data({
            esp32_location,
            esp32_name,
            esp32_sensor_type: normalizedType,
            esp32_sensor_reading: parseFloat(esp32_sensor_reading),
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

// GET route to fetch voltage chart data
// /esp32-data/voltage-chart?from=ISO&to=ISO&interval=minutes
router.get('/esp32-data/voltage-chart', async (req, res) => {
    try {
        const { from, to, interval = 10 } = req.query;
        if (!from || !to) return res.status(400).json({ error: 'Missing from or to date' });

        const fromDate = new Date(from);
        const toDate = new Date(to);
        const intervalMs = parseInt(interval) * 60 * 1000;

        const pipeline = [
            {
                $match: {
                    esp32_sensor_type: { $in: ['solar_panel_voltage', 'battery_voltage'] },
                    timestamp: { $gte: fromDate, $lte: toDate }
                }
            },
            {
                $project: {
                    esp32_sensor_type: 1,
                    esp32_sensor_reading: 1,
                    timestamp: 1,
                    intervalBucket: {
                        $toLong: {
                            $divide: [
                                { $toLong: { $subtract: ['$timestamp', new Date(0)] } },
                                intervalMs
                            ]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: { type: '$esp32_sensor_type', bucket: '$intervalBucket' },
                    avgValue: { $avg: '$esp32_sensor_reading' },
                    timestamp: { $min: '$timestamp' }
                }
            },
            {
                $sort: { timestamp: 1 }
            }
        ];

        const data = await esp32Data.aggregate(pipeline);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching voltage chart data' });
    }
});

// GET latest sensor readings per device (one per sensor type)
router.get('/esp32-data/latest-snapshot', async (req, res) => {
  try {
    const devices = ['S1E1', 'S1E2', 'S1E3'];

    const data = await esp32Data.aggregate([
      {
        $match: {
          esp32_name: { $in: devices }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            esp32_name: '$esp32_name',
            esp32_sensor_type: '$esp32_sensor_type'
          },
          doc: { $first: '$$ROOT' } // newest per sensor
        }
      },
      {
        $replaceRoot: { newRoot: '$doc' }
      },
      {
        $sort: { esp32_name: 1, esp32_sensor_type: 1 }
      }
    ]);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching latest sensor snapshot' });
  }
});

// GET latest event per device
router.get('/esp32-events/latest-by-device', async (req, res) => {
  try {
    const devices = ['S1E1', 'S1E2', 'S1E3'];
    const events = await esp32Event.aggregate([
      { $match: { esp32_name: { $in: devices } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$esp32_name',
          doc: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$doc' } }
    ]);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching latest ESP32 events' });
  }
});


module.exports = router;
