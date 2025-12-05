import React, { useEffect, useState } from 'react';

const InstructionList = () => {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch instructions
  const fetchInstructions = async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const response = await fetch('http://209.46.124.94:3000/instructions/get_instructions');
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

  // Call fetchInstructions when the component mounts
  useEffect(() => {
    fetchInstructions();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://209.46.124.94:3000/instructions/delete_instructions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete instruction');
      }
      // After successful deletion, refetch instructions
      fetchInstructions();
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
              <td>{instruction.station1_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td>{instruction.station2_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td>{instruction.station3_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td>{instruction.station4_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td>{instruction.all_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' for All Complete */}
              <td>
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
