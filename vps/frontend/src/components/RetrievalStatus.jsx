import React, { useEffect, useState } from 'react';

const RetrievalStatus = () => {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInstructions = async () => {
    try {
      const response = await fetch(`/sound-locator/api/instructions/get_instructions`);
      if (!response.ok) throw new Error('Failed to fetch instructions');
      const data = await response.json();
      const newest = data.slice(-10).reverse();
      setInstructions(prev => JSON.stringify(prev) !== JSON.stringify(newest) ? newest : prev);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
    const interval = setInterval(fetchInstructions, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/sound-locator/api/instructions/delete_instructions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete instruction');
      // Optionally refetch or rely on polling
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ fontSize: '12px', textAlign: 'center' }}>Loading instructions...</div>;
  if (error) return <div style={{ fontSize: '12px', textAlign: 'center' }}>Error: {error}</div>;

  return (
    <div style={{ width: '100%', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{
        textAlign: 'center',
        fontWeight: 600,
        fontSize: '13px',
        color: '#333',
        marginBottom: '4px',
        borderBottom: '1px solid #ddd',
        paddingBottom: '2px'
      }}>
        Retrieval Status
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '2px' }}>Instruction</th>
            <th style={{ padding: '2px' }}>S1</th>
            <th style={{ padding: '2px' }}>S2</th>
            <th style={{ padding: '2px' }}>S3</th>
            <th style={{ padding: '2px' }}>S4</th>
            <th style={{ padding: '2px' }}>DEL</th>
          </tr>
        </thead>
        <tbody>
          {instructions.map(inst => (
            <tr key={inst._id}>
              <td style={{ padding: '2px', backgroundColor: inst.all_complete ? '#b6ffb6' : '#f85b5b', fontSize: '12px' }}>
                <a
                  href={`/sound-locator/api/audio/${inst.instruction_value}_combined.wav`}
                  style={{ color: '#000', textDecoration: 'none' }}
                >
                  {inst.instruction_value}
                </a>
              </td>
              <td style={{ textAlign: 'center', backgroundColor: inst.station1_complete ? '#b6ffb6' : '#f85b5b' }}>S1</td>
              <td style={{ textAlign: 'center', backgroundColor: inst.station2_complete ? '#b6ffb6' : '#f85b5b' }}>S2</td>
              <td style={{ textAlign: 'center', backgroundColor: inst.station3_complete ? '#b6ffb6' : '#f85b5b' }}>S3</td>
              <td style={{ textAlign: 'center', backgroundColor: inst.station4_complete ? '#b6ffb6' : '#f85b5b' }}>S4</td>
              <td style={{ textAlign: 'center' }}>
                <button
                  onClick={() => handleDelete(inst._id)}
                  style={{
                    fontSize: '10px',
                    padding: '2px 4px',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    border: '1px solid #aaa',
                    backgroundColor: '#ddd'
                  }}
                >
                  DEL
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RetrievalStatus;
