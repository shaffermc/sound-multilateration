const mongoose = require('mongoose');

const StationStatusSchema = new mongoose.Schema(
{
  timestamp: {
    type: Number,  
    default: Date.now,  // Default to the current time in milliseconds
  },
  station_location: String,
  station_uptime: String, 
  station_free_space: String, 
  station_file_count: String,
  station_local_ip: String,
  station_public_ip: String,
});

const StationStatus = mongoose.model('StationStatus', StationStatusSchema);

module.exports = StationStatus;
