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
  

  router.get('/get_station_status', async (req, res) => {
    try {
      // List of station locations to fetch status for (add locations to this array as needed)
      const locations = ['ZERO1','ZERO2','ZERO3'];  // Add more locations to this array when needed
  
      // Array to store the latest station status for each location
      const latestStatusPromises = locations.map(async (location) => {
        // Fetch the most recent station status for the current location
        const latestStatus = await StationStatus.find({ station_location: location })
          .sort({ timestamp: -1 })  // Sort by timestamp in descending order
          .limit(1);  // Limit to the most recent status for this location
  
        return { location, status: latestStatus[0] };  // Return the location and the latest status entry
      });
  
      // Wait for all the promises to resolve and gather the results
      const latestStatusResults = await Promise.all(latestStatusPromises);
  
      // Filter out any locations that didn't return any status
      const filteredResults = latestStatusResults.filter(result => result.status);
  
      if (filteredResults.length > 0) {
        res.status(200).json(filteredResults);  // Return the latest station status for each location
      } else {
        res.status(404).json({ message: 'No station status found for the specified locations.' });
      }
    } catch (err) {
      console.error('Error fetching station status:', err);
      res.status(500).json({ error: 'Error fetching station status' });
    }
  });
  
  

module.exports = router;
