const express = require('express');
const StationStatus = require('../models/StationStatusModels');  // Import the model for StationStatus
const router = express.Router();

router.post('/add_station_status', async (req, res) => {
    const { station_location, station_uptime, station_free_space, station_file_count, station_local_ip, station_public_ip } = req.body;
  
    console.log('Request Body:', req.body);  // Log the request body
  
    try {
      const timestamp = Date.now();
      const newStationData = new StationStatus({
        timestamp,
        station_location,
        station_uptime,
        station_free_space,
        station_file_count,
        station_local_ip,
        station_public_ip,
      });
  
      await newStationData.save();
      res.status(201).json(newStationData);
    } catch (err) {
      console.error('Error adding station status:', err);
      res.status(400).json({ error: 'Error adding station status' });
    }
  });

module.exports = router;