const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { exec } = require('child_process'); 
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { spawn } = require("child_process");
const PresetsRoutes = require('./routes/PresetsRoutes')

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (like the generated plot)
app.use('/static', express.static(path.join(__dirname, 'static')));

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected', mongoose.connection.name);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });


app.get('/', (req, res) => {
  res.send('Sensor Data Logger API');
});

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

// Routes
app.use('/presets', PresetsRoutes);

app.get("/get-ip", (req, res) => {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  // Remove IPv6 ::ffff: prefix
  ip = ip.replace(/^::ffff:/, "");

  res.json({ ip });
});

app.get('/generate_plot', (req, res) => {
  const {
    lat1, lon1,
    lat2, lon2,
    lat3, lon3,
    lat4, lon4,
    tA, tB, tC, tD
  } = req.query;

  // Validate parameters
  if (![lat1, lon1, lat2, lon2, lat3, lon3, lat4, lon4, tA, tB, tC, tD].every(Boolean)) {
    return res.status(400).send('Missing required query parameters');
  }

  const pythonCmd = `python3 services/generate-plot-local.py ${lat1} ${lon1} ${lat2} ${lon2} ${lat3} ${lon3} ${lat4} ${lon4} ${tA} ${tB} ${tC} ${tD}`;

  console.log("Running:", pythonCmd);

  exec(pythonCmd, (error, stdout, stderr) => {

    console.log("---- PYTHON STDOUT ----");
    console.log(stdout);
    console.log("---- PYTHON STDERR ----");
    console.log(stderr);

    if (error) {
      console.error("exec error:", error);
      return res.status(500).json({ error: "Python execution failed" });
    }

    // Remove leading/trailing whitespace (VERY important)
    const cleaned = stdout.trim();

    try {
      const data = JSON.parse(cleaned);
      return res.json(data);
    } catch (err) {
      console.error("JSON parse failed:\n", cleaned);
      return res.status(500).json({ error: "Invalid JSON from Python" });
    }
  });
});

const audioDirectory = '/home/mshaffer/www/sound-multilateration/vps/backend/services/merged_audio'; 
app.use('/audio', express.static(audioDirectory));

app.get('/audio-files', (req, res) => {
  fs.readdir(audioDirectory, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read directory' });
    }

    // Filter for .wav files
    const audioFiles = files.filter(file => path.extname(file).toLowerCase() === '.wav');

    // Send the list of audio files
    res.json(audioFiles);
  });
});

// DELETE audio file
app.delete('/audio/:filename', (req, res) => {
  const { filename } = req.params;

  // Basic validation: only allow .wav files to prevent accidental deletion of other files
  if (path.extname(filename).toLowerCase() !== '.wav') {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  const filePath = path.join(audioDirectory, filename);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).json({ error: 'Failed to delete file' });
      }

      console.log(`Deleted file: ${filename}`);
      res.json({ message: `File "${filename}" deleted successfully` });
    });
  });
});


const esp32Routes = require('./routes/esp32Routes');
app.use('/esp32', esp32Routes);

const stationStatusRoutes = require('./routes/StationStatusRoutes');
app.use('/stationStatus', stationStatusRoutes);

const InstructionsRoutes = require('./routes/InstructionsRoutes');
app.use('/instructions', InstructionsRoutes);

const BandwidthUsageRoutes = require('./routes/BandwidthUsageRoutes');  
app.use('/bandwidth', BandwidthUsageRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
