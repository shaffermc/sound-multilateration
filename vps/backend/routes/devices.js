const express = require("express");
const router = express.Router();
const Device = require("../models/Device"); // your mongoose model

router.get("/", async (req, res) => {
  try {
    const devices = await Device.find({});
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

module.exports = router;
