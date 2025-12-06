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
      <table  style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Instruction Type</th>
            <th style={styles.tableHeader}>Instruction Target</th>
            <th style={styles.tableHeader}>Instruction Value</th>
            <th style={styles.tableHeader}>Station 1 Complete</th>
            <th style={styles.tableHeader}>Station 2 Complete</th>
            <th style={styles.tableHeader}>Station 3 Complete</th>
            <th style={styles.tableHeader}>Station 4 Complete</th>
            <th style={styles.tableHeader}>All Complete</th> {/* Display All Complete */}
            <th style={styles.tableHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {instructions.map((instruction) => (
            <tr key={instruction._id}>
              <td style={styles.tableData}>{instruction.instruction_type}</td>
              <td style={styles.tableData}>{instruction.instruction_target}</td>
              <td style={styles.tableData}>{instruction.instruction_value}</td>
              <td style={styles.tableData}>{instruction.station1_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td style={styles.tableData}>{instruction.station2_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td style={styles.tableData}>{instruction.station3_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td style={styles.tableData}>{instruction.station4_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' */}
              <td style={styles.tableData}>{instruction.all_complete ? 'Yes' : 'No'}</td> {/* Display 'Yes' or 'No' for All Complete */}
              <td style={styles.tableData}>
                <button onClick={() => handleDelete(instruction._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// CSS styles for the table
const styles = {
  tableHeader: {
    border: '2px solid #000',
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2',
  },
  tableData: {
    border: '2px solid #000',
    padding: '8px',
    textAlign: 'left',
  },
};

export default InstructionList;
