const mongoose = require('mongoose');

const StationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true }
});

const PresetSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  coords: { 
    type: [StationSchema], 
    required: true, 
    validate: {
      validator: v => v.length === 4,
      message: 'Exactly 4 coordinates are required'
    }
  },
  // NEW: store 4 TDOA values (tA–tD)
  times: {
    type: [Number],
    required: true,
    validate: {
      validator: v => v.length === 4,
      message: 'Exactly 4 time offsets are required'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Preset', PresetSchema);
