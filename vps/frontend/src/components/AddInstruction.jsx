import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const AddInstruction = () => {
  const [instructionType, setInstructionType] = useState('');
  const [instructionTarget, setInstructionTarget] = useState('');
  const [instructionValue, setInstructionValue] = useState(null); // Store as Date object
  const [message, setMessage] = useState('');

  // Function to format date into YYYY-MM-DD-HH-MM-SS
  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2); // Month is 0-indexed, so add 1
    const day = (`0${date.getDate()}`).slice(-2);
    const hours = (`0${date.getHours()}`).slice(-2);
    const minutes = (`0${date.getMinutes()}`).slice(-2);
    const seconds = (`0${date.getSeconds()}`).slice(-2);

    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'instructionType':
        setInstructionType(value);
        break;
      case 'instructionTarget':
        setInstructionTarget(value);
        break;
      default:
        break;
    }
  };

  // Handle date change
  const handleDateChange = (date) => {
    setInstructionValue(date);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newInstruction = {
      instruction_type: instructionType,
      instruction_target: instructionTarget,
      instruction_value: formatDate(instructionValue), // Convert Date object to string
      station1_complete: false, // Default to false
      station2_complete: false, // Default to false
      station3_complete: false, // Default to false
      station4_complete: false,
      all_complete: false, // Default to false
    };

    try {
      const response = await axios.post('http://209.46.124.94:3000/instructions/add_instructions', newInstruction);
      setMessage('Instruction added successfully!');
      // Clear the form after submission
      setInstructionType('');
      setInstructionTarget('');
      setInstructionValue(null); // Reset to null
    } catch (error) {
      setMessage('Error adding instruction. Please try again.');
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Add a New Instruction</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Instruction Type:</label>
          <select
            name="instructionType"
            value={instructionType}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Instruction Type</option>
            <option value="sound_request">Sound Request</option>
            <option value="erase_recordings">Erase Recordings</option>
            <option value="reboot">Reboot</option>
          </select>
        </div>

        <div>
          <label>Instruction Target:</label>
          <select
            name="instructionTarget"
            value={instructionTarget}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Instruction Target</option>
            <option value="ALL">ALL</option>
            <option value="1">Station 1</option>
            <option value="2">Station 2</option>
            <option value="3">Station 3</option>
            <option value="4">Station 4</option>
          </select>
        </div>

        <div>
          <label>Instruction Value (Date/Time):</label>
          <DatePicker
            selected={instructionValue}  // Use the Date object directly
            onChange={handleDateChange}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm:ss"
            timeIntervals={5}  // 5 minute increments
            required
          />
        </div>

        <button type="submit">Add Instruction</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default AddInstruction;
