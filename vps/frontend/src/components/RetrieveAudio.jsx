import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const RetrieveAudio = () => {
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

  // Handle date change
  const handleDateChange = (date) => {
    setInstructionValue(date);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newInstruction = {
      instruction_type: "sound_request",
      instruction_target: "ALL",
      instruction_value: formatDate(instructionValue), // Convert Date object to string
      station1_complete: false, 
      station2_complete: false,
      station3_complete: false, 
      station4_complete: false,
      all_complete: false, 
    };

    try {
      const response = await axios.post('http://209.46.124.94:3000/instructions/add_instructions', newInstruction);
      setMessage('Request submitted. Audio processing. ');
      setInstructionValue(null); // Reset to null
      //window.location.reload();

    } catch (error) {
      setMessage('Error adding instruction. Please try again.');
      console.error(error);
    }
  };

  return (
    <div>
      <h2  style={{ textAlign: 'left' }}>Sound Source Locator</h2>
      Please select the date and time of sound:
      <form onSubmit={handleSubmit}>
        <div>
          <label>(Date/Time):</label>
          <DatePicker
            selected={instructionValue}  // Use the Date object directly
            onChange={handleDateChange}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm:ss"
            timeIntervals={5}  // 5 minute increments
            required
          />
        </div>
        <button type="submit">Submit Request</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default RetrieveAudio;
