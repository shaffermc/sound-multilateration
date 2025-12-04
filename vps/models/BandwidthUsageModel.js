const mongoose = require('mongoose');

// Define the schema for Device Daily Bandwidth Usage
const BandwidthUsageSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,  // Unique identifier for each device (e.g., MAC address or UUID)
      required: true,
    },
    device_name: {
      type: String,  // Name or type of the device (e.g., Raspberry Pi, Laptop, etc.)
      required: true,
    },
    date: {
      type: Date,  // The date for which bandwidth is being tracked
      required: true,
    },
    daily_upload: {
      type: Number,  // Total daily upload bandwidth usage in megabytes
      default: 0,  // Default is 0 MB
    },
    daily_download: {
      type: Number,  // Total daily download bandwidth usage in megabytes
      default: 0,  // Default is 0 MB
    },
    total_daily_bandwidth: {
      type: Number,  // Total daily bandwidth usage (upload + download) in megabytes
      default: 0,  // Default is 0 MB
    },
    timestamp: {
      type: Number,  // Timestamp when the record was last updated
      default: Date.now,
    }
  },
  {
    timestamps: true,  // Automatically add createdAt and updatedAt fields
  }
);

// Create the model based on the schema
const BandwidthUsageModel = mongoose.model('BandwidthUsage', BandwidthUsageSchema);

// Export the model
module.exports = BandwidthUsageModel;
