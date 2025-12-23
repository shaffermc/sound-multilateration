const express = require('express');
const BandwidthUsageModel = require('../models/BandwidthUsageModel');  // Import the BandwidthUsage model
const router = express.Router();

// Add or update bandwidth usage data for a station
router.post('/upload', async (req, res) => {
  const { station_id, daily_upload, daily_download, date } = req.body;

  console.log('Request Body:', req.body);  // Log the request body

  try {
    const timestamp = Date.now();
    
    // Ensure the date is set to the start of the day (midnight) to group by day
    const dayStart = new Date(date).setHours(0, 0, 0, 0);

    // Check if an entry already exists for this station and day
    let stationUsage = await BandwidthUsageModel.findOne({ station_id, date: new Date(dayStart) });

    if (stationUsage) {
      // Update the existing record by adding new usage
      stationUsage.daily_upload += daily_upload;  // Add the new upload usage to the existing total
      stationUsage.daily_download += daily_download;  // Add the new download usage to the existing total
      stationUsage.total_daily_bandwidth = stationUsage.daily_upload + stationUsage.daily_download;  // Recalculate total daily bandwidth
      stationUsage.timestamp = timestamp;  // Update timestamp
      await stationUsage.save();
      res.status(200).json({ message: 'Bandwidth usage updated successfully.' });
    } else {
      // Create a new record if no existing entry is found
      const newStationUsage = new BandwidthUsageModel({
        station_id,
        daily_upload,
        daily_download,
        total_daily_bandwidth: daily_upload + daily_download,  // Calculate total daily bandwidth
        date: new Date(dayStart),
        timestamp,
      });
      await newStationUsage.save();
      res.status(201).json(newStationUsage);  // Return the newly created data
    }
  } catch (err) {
    console.error('Error uploading bandwidth data:', err);
    res.status(400).json({ error: 'Error uploading bandwidth data' });
  }
});

// Get the daily bandwidth usage for a station on a specific date
router.get('/usage/:station_id/:date', async (req, res) => {
  const { station_id, date } = req.params;

  try {
    console.log(`Fetching usage for station: ${station_id} on date: ${date}`);
    
    // Ensure the date is set to the start of the day (midnight)
    const dayStart = new Date(date).setHours(0, 0, 0, 0);

    // Find the bandwidth usage for the station on this day
    const stationUsage = await BandwidthUsageModel.findOne({ station_id, date: new Date(dayStart) });

    if (!stationUsage) {
      return res.status(404).json({ message: 'No data found for this station on the specified date.' });
    }

    res.status(200).json(stationUsage);  // Return the found usage data
  } catch (err) {
    console.error('Error fetching bandwidth usage:', err);
    res.status(500).json({ error: 'Error fetching bandwidth usage' });
  }
});

// Get daily bandwidth usage data for a single station
router.get('/usage/:station_id', async (req, res) => {
  const { station_id } = req.params;

  try {
    console.log(`Fetching all usage data for station: ${station_id}`);

    // Find all records for this station and sort by date descending
    const stationUsages = await BandwidthUsageModel.find({ station_id }).sort({ date: -1 });

    if (stationUsages.length === 0) {
      return res.status(404).json({ message: 'No usage data found for this station.' });
    }

    res.status(200).json(stationUsages);  // Return all usage data
  } catch (err) {
    console.error('Error fetching all bandwidth usage:', err);
    res.status(500).json({ error: 'Error fetching bandwidth usage data' });
  }
});

// Get daily bandwidth usage data for multiple stations
router.get('/usage', async (req, res) => {
  const { station_id } = req.query; // Get station_id's from query parameters

  if (!station_id) {
    return res.status(400).json({ error: 'Station id are required.' });
  }

  // Split the comma-separated station names into an array
  const stationsArray = station_id.split(',');

  try {
    console.log(`Fetching usage for stations: ${stationsArray.join(', ')}`);
    
    // Find the bandwidth usage for the stations
    const stationUsages = await BandwidthUsageModel.find({ station_id: { $in: stationsArray } }).sort({ date: -1 });

    if (stationUsages.length === 0) {
      return res.status(404).json({ message: 'No usage data found for the specified station.' });
    }

    res.status(200).json(stationUsages);  // Return the found usage data for the stations
  } catch (err) {
    console.error('Error fetching bandwidth usage:', err);
    res.status(500).json({ error: 'Error fetching bandwidth usage data' });
  }
});

// Update daily usage for a specific station on a given date
router.put('/update/:station_id/:date', async (req, res) => {
  const { station_id, date } = req.params;
  const { daily_upload, daily_download } = req.body;

  try {
    console.log(`Updating usage for station: ${station_id} on date: ${date}`);
    
    // Ensure the date is set to the start of the day (midnight)
    const dayStart = new Date(date).setHours(0, 0, 0, 0);

    // Find the station's usage record for that day
    let stationUsage = await BandwidthUsageModel.findOne({ station_id, date: new Date(dayStart) });

    if (!stationUsage) {
      return res.status(404).json({ message: 'No data found for this station on the specified date.' });
    }

    // Update the daily upload and download with the new values
    stationUsage.daily_upload = daily_upload;  // Set the new upload value
    stationUsage.daily_download = daily_download;  // Set the new download value
    stationUsage.total_daily_bandwidth = daily_upload + daily_download;  // Recalculate the total daily bandwidth
    stationUsage.timestamp = Date.now();  // Update timestamp
    await stationUsage.save();

    res.status(200).json({ message: 'Bandwidth usage updated successfully.' });
  } catch (err) {
    console.error('Error updating bandwidth usage:', err);
    res.status(500).json({ error: 'Error updating bandwidth usage' });
  }
});

module.exports = router;
