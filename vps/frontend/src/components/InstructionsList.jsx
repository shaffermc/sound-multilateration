import React, { useEffect, useState } from 'react';
const API_BASE = process.env.REACT_APP_API_BASE_URL;

const InstructionList = () => {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch instructions
  const fetchInstructions = async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const response = await fetch(`${API_BASE}/instructions/get_instructions`);
      if (!response.ok) {
        throw new Error('Failed to fetch instructions');
      }
      const data = await response.json();

      // Limit to the last 10 filtered entries
      setInstructions(data.slice(-10));
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions(); // initial load

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_BASE}/instructions/get_instructions`
        );
        const data = await response.json();
        const newest = data.slice(-10);

        // Only update if data changed
        setInstructions(prev => {
          return JSON.stringify(prev) !== JSON.stringify(newest)
            ? newest
            : prev;
        });

      } catch (err) {
        console.error("Background update failed", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []); 


  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/instructions/delete_instructions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete instruction');
      }
      // After successful deletion, refetch instructions
      //fetchInstructions();
    } catch (error) {
      console.error('Error deleting instruction:', error);
    }
  };

  if (loading) {
    return <div>Loading instructions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <table border="1">
        <thead>
          <tr>
            <th>Instruction Type</th>
            <th>Instruction Target</th>
            <th>Instruction Value</th>
            <th>Station 1 Complete</th>
            <th>Station 2 Complete</th>
            <th>Station 3 Complete</th>
            <th>Station 4 Complete</th>
            <th>All Complete</th> {/* Display All Complete */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {instructions.map((instruction) => (
            <tr key={instruction._id}>
              <td>{instruction.instruction_type}</td>
              <td>{instruction.instruction_target}</td>
              <td>{instruction.instruction_value}</td>
              <td style={{ backgroundColor: instruction.station1_complete ? '#b6ffb6' : 'transparent' }}>{instruction.station1_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td style={{ backgroundColor: instruction.station2_complete ? '#b6ffb6' : 'transparent' }}>{instruction.station2_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td style={{ backgroundColor: instruction.station3_complete ? '#b6ffb6' : 'transparent' }}>{instruction.station3_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td style={{ backgroundColor: instruction.station4_complete ? '#b6ffb6' : 'transparent' }}>{instruction.station4_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td style={{ backgroundColor: instruction.all_complete ? '#b6ffb6' : 'transparent' }}>{instruction.all_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' for All Complete */}
              <td >
                <button onClick={() => handleDelete(instruction._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InstructionList;
