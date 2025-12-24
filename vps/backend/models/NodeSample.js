// backend/models/NodeSample.js
const mongoose = require("mongoose");

const NodeSampleSchema = new mongoose.Schema({
  key: { type: String, index: true },
  station: String,
  kind: String,
  name: String,
  at: { type: Date, default: Date.now },   // sample time
  meta: {}                                  // snapshot of meta
});

// Optional: index for querying by time
NodeSampleSchema.index({ key: 1, at: -1 });

module.exports = mongoose.model("NodeSample", NodeSampleSchema);
