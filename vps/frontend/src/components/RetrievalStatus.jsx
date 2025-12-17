import React, { useEffect, useState } from 'react';

const RetrievalStatus = () => {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch instructions
  const fetchInstructions = async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const response = await fetch(`/instructions/get_instructions`);
      if (!response.ok) {
        throw new Error('Failed to fetch instructions');
      }
      const data = await response.json();

      // Limit to the last 10 filtered entries
      setInstructions(data.slice(-10).reverse());
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
          `/instructions/get_instructions`
        );
        const data = await response.json();
        const newest = data.slice(-10).reverse();

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
      const response = await fetch(`/instructions/delete_instructions/${id}`, {
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
        </thead>
        <tbody>
          {instructions.map((instruction) => (
            <tr key={instruction._id}>
              <td style={{ backgroundColor: instruction.all_complete ? '#b6ffb6' : '#f85b5bff' }}>
              <a href={`/audio/${instruction.instruction_value}_combined.wav`}>{instruction.instruction_value}</a></td>
              <td style={{ backgroundColor: instruction.station1_complete ? '#b6ffb6' : '#f85b5bff' }}>{instruction.station1_complete ? 'S1' : 'S1'}</td> {/* Display 'Yes' or 'No' */}
              <td style={{ backgroundColor: instruction.station2_complete ? '#b6ffb6' : '#f85b5bff' }}>{instruction.station2_complete ? 'S2' : 'S2'}</td> {/* Display 'Yes' or 'No' */}
              <td style={{ backgroundColor: instruction.station3_complete ? '#b6ffb6' : '#f85b5bff' }}>{instruction.station3_complete ? 'S3' : 'S3'}</td> {/* Display 'Yes' or 'No' */}
              <td style={{ backgroundColor: instruction.station4_complete ? '#b6ffb6' : '#f85b5bff' }}>{instruction.station4_complete ? 'S4' : 'S4'}</td> {/* Display 'Yes' or 'No' */}
              <td >
                <button onClick={() => handleDelete(instruction._id)}>DEL</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RetrievalStatus;
