const mongoose = require('mongoose');

// Define the schema for the sound requests
const InstructionsSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Number,  // Storing timestamp as a Unix timestamp (in milliseconds)
      default: Date.now,  // Default to the current time in milliseconds
    },
    instruction_type: String,
    instruction_target: String,
    instruction_value: String,
    station1_complete: {
      type: Boolean,
      default: false,  // Default value for this field
    },
    station2_complete: {
      type: Boolean,
      default: false,  // Default value for this field
    },
    station3_complete: {
      type: Boolean,
      default: false,  // Default value for this field
    },
    all_complete: {
      type: Boolean,
      default: false,  // Default value for this field
    }
  }
);

// Create and export the model
const Instructions = mongoose.model('Instructions', InstructionsSchema);
module.exports = Instructions;
