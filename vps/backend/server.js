const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { exec } = require('child_process');  // To execute the Python script
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

// Simple route
app.get('/', (req, res) => {
  res.send('Sensor Data Logger API');
});

// Route to generate plot
app.get('/generate_plot', (req, res) => {
  const { t_A, t_B, t_C } = req.query;

  // Run the Python script to generate the plot image
  exec(`python3 generate_plot.py ${t_A} ${t_B} ${t_C}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send('Error generating plot');
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send('Error generating plot');
    }

    // The Python script generates the plot as 'plot.png' in the static directory
    const plotPath = path.join(__dirname, 'static', 'plot.png');
    
    // Check if the plot image exists, then send it to the client
    if (fs.existsSync(plotPath)) {
      res.sendFile(plotPath);  // Send the generated plot as a response
    } else {
      res.status(500).send('Plot not found');
    }
  });
});

// Example route for audio files (optional, can be adapted as needed)
const audioDirectory = '/home/mshaffer/www/stations/audio';  // Path to your audio directory
app.use('/audio', express.static(audioDirectory));

// Route to get all audio files (adjust as per your requirements)
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

// Other routes (sensor data, station status, etc.)
// Assuming these are defined elsewhere, like in routes/SensorDataRoutes.js, etc.
const sensorDataRoutes = require('./routes/SensorDataRoutes');
app.use('/sensorData', sensorDataRoutes);

const sensorEventRoutes = require('./routes/SensorEventRoutes');
app.use('/sensorEvent', sensorEventRoutes);

const stationStatusRoutes = require('./routes/StationStatusRoutes');
app.use('/stationStatus', stationStatusRoutes);

const InstructionsRoutes = require('./routes/InstructionsRoutes');
app.use('/instructions', InstructionsRoutes);

// Add the Bandwidth routes (for bandwidth data upload, get, and update)
const BandwidthUsageRoutes = require('./routes/BandwidthUsageRoutes');  // Import your bandwidth routes
app.use('/bandwidth', BandwidthUsageRoutes);  // Use the bandwidth routes

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
