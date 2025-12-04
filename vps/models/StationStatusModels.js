const mongoose = require('mongoose');

// Define the schema for StationStatus data
const StationStatusSchema = new mongoose.Schema(
{
  timestamp: {
    type: Number,  // Storing timestamp as a Unix timestamp (in milliseconds)
    default: Date.now,  // Default to the current time in milliseconds
  },
  station_location: String,
  station_uptime: String,  // You can make this a Number if uptime is a number (seconds)
  station_free_space: String,  // You can make this a Number if it's the free space in bytes
  station_file_count: String,
  station_local_ip: String,
  station_public_ip: String,
});

const StationStatus = mongoose.model('StationStatus', StationStatusSchema);

module.exports = StationStatus;
