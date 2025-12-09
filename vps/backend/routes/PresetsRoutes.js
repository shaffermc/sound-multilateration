const express = require('express');
const router = express.Router();
const Preset = require('../models/PresetsModels');

// GET /presets → return all presets
router.get('/', async (req, res) => {
  try {
    const presets = await Preset.find().sort({ createdAt: -1 });
    res.json(presets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching presets.' });
  }
});

// POST /presets → create a new preset
router.post('/', async (req, res) => {
  const { name, coords, times } = req.body;

  if (!name || !coords || !times || coords.length !== 4 || times.length !== 4) {
    return res.status(400).json({ error: 'Invalid data. Must include name, 4 coords, and 4 times.' });
  }

  try {
    // Upsert: if name exists, update; otherwise create
    const preset = await Preset.findOneAndUpdate(
      { name },
      { coords, times },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(preset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save preset.' });
  }
});

module.exports = router;
