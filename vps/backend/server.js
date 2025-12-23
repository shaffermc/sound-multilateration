const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ===== Express app FIRST =====
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== HTTP + Socket.IO =====
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // tighten later
  }
});

module.exports = { io };

// ===== MongoDB =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected:', mongoose.connection.name);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// ===== Static =====
app.use('/static', express.static(path.join(__dirname, 'static')));

// ===== Socket device route =====
app.use("/device", require("./routes/deviceUpdate"));
app.use("/devices", require("./routes/devices"));

// ===== Routes =====
const PresetsRoutes = require('./routes/PresetsRoutes');
app.use('/presets', PresetsRoutes);

const esp32Routes = require('./routes/esp32Routes');
app.use('/esp32', esp32Routes);

const stationStatusRoutes = require('./routes/StationStatusRoutes');
app.use('/stationStatus', stationStatusRoutes);

const InstructionsRoutes = require('./routes/InstructionsRoutes');
app.use('/instructions', InstructionsRoutes);

const BandwidthUsageRoutes = require('./routes/BandwidthUsageRoutes');
app.use('/bandwidth', BandwidthUsageRoutes);

// ===== Health =====
app.get('/', (req, res) => {
  res.send('Express Server');
});

app.get("/get-ip", (req, res) => {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // If IPv6-mapped IPv4, remove the ::ffff: prefix
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  res.send(ip);
});

// ===== Audio =====
const audioDirectory = '/home/mshaffer/www/sound-multilateration/vps/backend/services/merged_audio';
app.use('/audio', express.static(audioDirectory));

app.get('/audio-files', (req, res) => {
  fs.readdir(audioDirectory, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read directory' });
    res.json(files.filter(f => path.extname(f).toLowerCase() === '.wav'));
  });
});

app.delete('/audio/:filename', (req, res) => {
  const { filename } = req.params;
  if (path.extname(filename).toLowerCase() !== '.wav') {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  const filePath = path.join(audioDirectory, filename);
  fs.unlink(filePath, err => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ message: `${filename} deleted` });
  });
});

// ===== START SERVER (ONLY ONCE) =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
