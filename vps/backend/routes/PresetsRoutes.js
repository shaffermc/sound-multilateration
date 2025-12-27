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

// DELETE /presets/:id → delete one preset
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Preset.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Preset not found" });
    }

    res.json({ success: true, message: "Preset deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete preset" });
  }
});

// POST /presets → create or update a preset
router.post('/', async (req, res) => {
  console.log('PRESET BODY:', req.body);
  const { name, coords, times } = req.body;

  if (!name || !coords || coords.length !== 4 || !times || times.length !== 4) {
    return res.status(400).json({
      error: 'Invalid data. Must include name, 4 coords, and 4 times.'
    });
  }

  try {
    // Upsert: if name exists, update; otherwise create
    const preset = await Preset.findOneAndUpdate(
      { name },
      { coords, times },   // <-- include times
      { upsert: true, new: true, runValidators: true }
    );

    res.json(preset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save preset.' });
  }
});

module.exports = router;
