// backend/routes/nodeHistory.js
const express = require("express");
const router = express.Router();
const NodeSample = require("../models/NodeSample");

// GET /nodes/history/:station/:kind/:id?days=3
router.get("/history/:station/:kind/:id", async (req, res) => {
  try {
    const { station, kind, id } = req.params;
    const days = Number(req.query.days || 3);

    const key = `${station}:${kind}:${id}`;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const samples = await NodeSample
      .find({ key, at: { $gte: since } })
      .sort({ at: 1 })
      .lean();

    const data = samples.map(s => ({
      ts: s.at,
      // Convert to a short label; you can tweak format later
      timeLabel: new Date(s.at).toLocaleString(),
      // Pull the voltages out of meta
      solar_voltage: s.meta?.solar_voltage ?? null,
      battery_voltage: s.meta?.battery_voltage ?? null
    }));

    res.json(data);
  } catch (err) {
    console.error("history error", err);
    res.status(500).json({ error: "history_failed" });
  }
});

module.exports = router;
