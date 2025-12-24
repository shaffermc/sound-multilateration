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
  cors: { origin: "*" }
})
console.log("socket.io version:", require("socket.io").Server ? "4.x" : "unknown")

const onErr = (err) => {
  console.log("socket connect_error", err)
  console.log("socket connect_error message", err?.message)
  console.log("socket connect_error description", err?.description)
  console.log("socket connect_error context", err?.context)
}

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

// ===== Routes =====
const PresetsRoutes = require('./routes/PresetsRoutes');
app.use('/presets', PresetsRoutes);

const InstructionsRoutes = require('./routes/InstructionsRoutes');
app.use('/instructions', InstructionsRoutes);

app.use("/node", require("./routes/nodeUpdate"))

app.use("/nodes", require("./routes/nodes"))

const NodeHistoryRoutes = require("./routes/nodeHistory");
app.use("/nodes", NodeHistoryRoutes);  

// ===== Health =====
app.get('/', (req, res) => {
  res.send('Express Server');
});

app.get("/get-ip", (req, res) => {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  // Remove IPv6 ::ffff: prefix
  ip = ip.replace(/^::ffff:/, "");

  res.json({ ip });
});

// ====== Generate Plot =====

app.get("/generate_plot_json", (req, res) => {
  const q = req.query;

  // Validate that all parameters exist
  const required = [
    "lat1","lon1","lat2","lon2","lat3","lon3","lat4","lon4",
    "tA","tB","tC","tD"
  ];

  for (const r of required) {
    if (!(r in q)) {
      return res.status(400).json({ error: `Missing parameter ${r}` });
    }
  }

  // Build argument list for python script
  const args = [
    "services/generate_plot.py",
    q.lat1, q.lon1,
    q.lat2, q.lon2,
    q.lat3, q.lon3,
    q.lat4, q.lon4,
    q.tA, q.tB, q.tC, q.tD
  ];

  const python = spawn("python3", args);

  let output = "";
  let errorOutput = "";

  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  python.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: "Python script failed",
        details: errorOutput
      });
    }

    try {
      const json = JSON.parse(output);
      res.json(json);
    } catch (err) {
      res.status(500).json({
        error: "Invalid JSON from Python",
        raw: output
      });
    }
  });
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
