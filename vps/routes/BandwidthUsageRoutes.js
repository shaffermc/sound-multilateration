const express = require('express');
const BandwidthUsageModel = require('../models/BandwidthUsageModel');  // Import the BandwidthUsage model
const router = express.Router();

// Add or update bandwidth usage data for a device
router.post('/upload', async (req, res) => {
  const { device_id, device_name, daily_upload, daily_download, date } = req.body;

  console.log('Request Body:', req.body);  // Log the request body

  try {
    const timestamp = Date.now();
    
    // Ensure the date is set to the start of the day (midnight) to group by day
    const dayStart = new Date(date).setHours(0, 0, 0, 0);

    // Check if an entry already exists for this device and day
    let deviceUsage = await BandwidthUsageModel.findOne({ device_id, date: new Date(dayStart) });

    if (deviceUsage) {
      // Update the existing record by adding new usage
      deviceUsage.daily_upload += daily_upload;  // Add the new upload usage to the existing total
      deviceUsage.daily_download += daily_download;  // Add the new download usage to the existing total
      deviceUsage.total_daily_bandwidth = deviceUsage.daily_upload + deviceUsage.daily_download;  // Recalculate total daily bandwidth
      deviceUsage.timestamp = timestamp;  // Update timestamp
      await deviceUsage.save();
      res.status(200).json({ message: 'Bandwidth usage updated successfully.' });
    } else {
      // Create a new record if no existing entry is found
      const newDeviceUsage = new BandwidthUsageModel({
        device_id,
        device_name,
        daily_upload,
        daily_download,
        total_daily_bandwidth: daily_upload + daily_download,  // Calculate total daily bandwidth
        date: new Date(dayStart),
        timestamp,
      });
      await newDeviceUsage.save();
      res.status(201).json(newDeviceUsage);  // Return the newly created data
    }
  } catch (err) {
    console.error('Error uploading bandwidth data:', err);
    res.status(400).json({ error: 'Error uploading bandwidth data' });
  }
});

// Get the daily bandwidth usage for a device on a specific date
router.get('/usage/:device_id/:date', async (req, res) => {
  const { device_id, date } = req.params;

  try {
    console.log(`Fetching usage for device: ${device_id} on date: ${date}`);
    
    // Ensure the date is set to the start of the day (midnight)
    const dayStart = new Date(date).setHours(0, 0, 0, 0);

    // Find the bandwidth usage for the device on this day
    const deviceUsage = await BandwidthUsageModel.findOne({ device_id, date: new Date(dayStart) });

    if (!deviceUsage) {
      return res.status(404).json({ message: 'No data found for this device on the specified date.' });
    }

    res.status(200).json(deviceUsage);  // Return the found usage data
  } catch (err) {
    console.error('Error fetching bandwidth usage:', err);
    res.status(500).json({ error: 'Error fetching bandwidth usage' });
  }
});

// Get daily bandwidth usage data for a single device
router.get('/usage/:device_id', async (req, res) => {
  const { device_id } = req.params;

  try {
    console.log(`Fetching all usage data for device: ${device_id}`);

    // Find all records for this device and sort by date descending
    const deviceUsages = await BandwidthUsageModel.find({ device_id }).sort({ date: -1 });

    if (deviceUsages.length === 0) {
      return res.status(404).json({ message: 'No usage data found for this device.' });
    }

    res.status(200).json(deviceUsages);  // Return all usage data
  } catch (err) {
    console.error('Error fetching all bandwidth usage:', err);
    res.status(500).json({ error: 'Error fetching bandwidth usage data' });
  }
});

// Get daily bandwidth usage data for multiple devices
router.get('/usage', async (req, res) => {
  const { device_names } = req.query; // Get device_names from query parameters

  if (!device_names) {
    return res.status(400).json({ error: 'Device names are required.' });
  }

  // Split the comma-separated device names into an array
  const devicesArray = device_names.split(',');

  try {
    console.log(`Fetching usage for devices: ${devicesArray.join(', ')}`);
    
    // Find the bandwidth usage for the devices
    const deviceUsages = await BandwidthUsageModel.find({ device_name: { $in: devicesArray } }).sort({ date: -1 });

    if (deviceUsages.length === 0) {
      return res.status(404).json({ message: 'No usage data found for the specified devices.' });
    }

    res.status(200).json(deviceUsages);  // Return the found usage data for the devices
  } catch (err) {
    console.error('Error fetching bandwidth usage:', err);
    res.status(500).json({ error: 'Error fetching bandwidth usage data' });
  }
});

// Update daily usage for a specific device on a given date
router.put('/update/:device_id/:date', async (req, res) => {
  const { device_id, date } = req.params;
  const { daily_upload, daily_download } = req.body;

  try {
    console.log(`Updating usage for device: ${device_id} on date: ${date}`);
    
    // Ensure the date is set to the start of the day (midnight)
    const dayStart = new Date(date).setHours(0, 0, 0, 0);

    // Find the device's usage record for that day
    let deviceUsage = await BandwidthUsageModel.findOne({ device_id, date: new Date(dayStart) });

    if (!deviceUsage) {
      return res.status(404).json({ message: 'No data found for this device on the specified date.' });
    }

    // Update the daily upload and download with the new values
    deviceUsage.daily_upload = daily_upload;  // Set the new upload value
    deviceUsage.daily_download = daily_download;  // Set the new download value
    deviceUsage.total_daily_bandwidth = daily_upload + daily_download;  // Recalculate the total daily bandwidth
    deviceUsage.timestamp = Date.now();  // Update timestamp
    await deviceUsage.save();

    res.status(200).json({ message: 'Bandwidth usage updated successfully.' });
  } catch (err) {
    console.error('Error updating bandwidth usage:', err);
    res.status(500).json({ error: 'Error updating bandwidth usage' });
  }
});

module.exports = router;
