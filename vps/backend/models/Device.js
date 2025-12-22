const mongoose = require("mongoose")

const DeviceSchema = new mongoose.Schema({
  key: String,
  station: String,
  deviceType: String,
  deviceId: String,
  status: String,
  lastSeen: Date,
  uptime: Number,
  rssi: Number
}, { timestamps: true })

module.exports = mongoose.model("Device", DeviceSchema)
