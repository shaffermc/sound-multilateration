const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { exec } = require('child_process'); 
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (like the generated plot)
app.use('/static', express.static(path.join(__dirname, 'static')));

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });


app.get('/', (req, res) => {
  res.send('Sensor Data Logger API');
});

app.get('/generate_plot', (req, res) => {
  const {
    lat1, lon1,
    lat2, lon2,
    lat3, lon3,
    lat4, lon4,
    tA, tB, tC, tD,
    timestamp  // Make sure you capture the timestamp from the query string
  } = req.query;

  // Validate that all required query parameters exist, including timestamp
  if (![lat1, lon1, lat2, lon2, lat3, lon3, lat4, lon4, tA, tB, tC, tD].every(Boolean)) {
    return res.status(400).send('Missing required query parameters');
  }

  // Build the Python command including the timestamp
  const pythonCmd = `python3 services/generate_plot.py ${lat1} ${lon1} ${lat2} ${lon2} ${lat3} ${lon3} ${lat4} ${lon4} ${tA} ${tB} ${tC} ${tD}`;

  // Run the Python script
  exec(pythonCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send('Error generating plot');
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send('Error generating plot');
    }

    const plotPath = path.join(__dirname, 'static', 'output.png');

    if (fs.existsSync(plotPath)) {
      res.sendFile(plotPath);  // Send the generated plot
    } else {
      res.status(500).send('Plot not found');
    }
  });
});



const audioDirectory = '/home/mshaffer/www/sound-multilateration/vps/backend/services/audio_files'; 
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


const stationStatusRoutes = require('./routes/StationStatusRoutes');
app.use('/stationStatus', stationStatusRoutes);

const InstructionsRoutes = require('./routes/InstructionsRoutes');
app.use('/instructions', InstructionsRoutes);

const BandwidthUsageRoutes = require('./routes/BandwidthUsageRoutes');  
app.use('/bandwidth', BandwidthUsageRoutes); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
