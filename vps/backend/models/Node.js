const mongoose = require("mongoose")

const NodeSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  station: String,
  kind: String,       // "esp32", "rpi", "sensor", etc
  name: String,

  status: {
    type: String,
    enum: ["OK", "STALE", "OFFLINE"],
    default: "OK"
  },

  lastSeen: Date,
  meta: mongoose.Schema.Types.Mixed
}, { timestamps: true })

module.exports = mongoose.model("Node", NodeSchema)
