const mongoose = require('mongoose');

const StationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true }
});

const PresetSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  coords: { type: [StationSchema], required: true, validate: v => v.length === 4 },
  times: { type: [Number], required: true, validate: v => v.length === 4 }
}, { timestamps: true });

module.exports = mongoose.model('Preset', PresetSchema);
