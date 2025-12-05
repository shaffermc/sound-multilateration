const mongoose = require('mongoose');

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
      default: false, 
    },
    station2_complete: {
      type: Boolean,
      default: false, 
    },
    station3_complete: {
      type: Boolean,
      default: false, 
    },
    station4_complete: {
      type: Boolean,
      default: false,
    },
    all_complete: {
      type: Boolean,
      default: false, 
    }
  }
);

const Instructions = mongoose.model('Instructions', InstructionsSchema);
module.exports = Instructions;
