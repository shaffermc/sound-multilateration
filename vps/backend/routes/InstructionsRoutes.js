const express = require('express');
const Instructions = require('../models/InstructionsModels'); // Path to the Instructions model

const router = express.Router();

// ----------------------------
// Create a new instruction
// ----------------------------
router.post('/add_instructions', async (req, res) => {
  try {
    const {
      instruction_type,
      instruction_target,
      instruction_value,
      station1_complete,
      station2_complete,
      station3_complete,
      station4_complete,
      all_complete
    } = req.body;

    const newInstruction = new Instructions({
      instruction_type,
      instruction_target,
      instruction_value,
      station1_complete: station1_complete || false,
      station2_complete: station2_complete || false,
      station3_complete: station3_complete || false,
      station4_complete: station4_complete || false,
      all_complete: all_complete || false
    });

    await newInstruction.save();
    res.status(201).json({ message: 'Instruction added successfully', instruction: newInstruction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding instruction' });
  }
});

// ----------------------------
// Update an instruction by ID
// ----------------------------
router.put('/update_instructions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Update the instruction
    let updatedInstruction = await Instructions.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedInstruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }

    res.status(200).json({ message: 'Instruction updated successfully', instruction: updatedInstruction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating instruction' });
  }
});

// ----------------------------
// Delete an instruction by ID
// ----------------------------
router.delete('/delete_instructions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedInstruction = await Instructions.findByIdAndDelete(id);

    if (!deletedInstruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }

    res.status(200).json({ message: 'Instruction deleted successfully', instruction: deletedInstruction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting instruction' });
  }
});

// ----------------------------
// Get all instructions
// ----------------------------
router.get('/get_instructions', async (req, res) => {
  try {
    const instructions = await Instructions.find();
    res.status(200).json(instructions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching instructions' });
  }
});

// ----------------------------
// Get a single instruction by ID
// ----------------------------
router.get('/get_instructions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const instruction = await Instructions.findById(id);

    if (!instruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }

    res.status(200).json(instruction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching instruction' });
  }
});

module.exports = router;
