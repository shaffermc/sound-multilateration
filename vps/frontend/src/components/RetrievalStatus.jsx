import React, { useEffect, useState } from 'react';

const RetrievalStatus = () => {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInstructions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/sound-locator/api/instructions/get_instructions`);
      if (!response.ok) throw new Error('Failed to fetch instructions');
      const data = await response.json();
      setInstructions(data.slice(-10).reverse());
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
      const response = await fetch(`/sound-locator/api/instructions/delete_instructions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete instruction');
      fetchInstructions();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading instructions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '13px', color: '#333', marginBottom: '6px' }}>
        Retrieval Status
      </div>

      {instructions.length === 0 ? (
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#555' }}>No instructions yet.</div>
      ) : (
        instructions.map((inst) => (
          <div
            key={inst._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              padding: '4px',
              backgroundColor: inst.all_complete ? '#b6ffb6' : '#f85b5bff',
              borderRadius: '4px',
            }}
          >
            <a
              href={`/sound-locator/api/audio/${inst.instruction_value}_combined.wav`}
              style={{ color: '#000', textDecoration: 'none', flex: 1 }}
            >
              {inst.instruction_value}
            </a>
            <div style={{ display: 'flex', gap: '2px', marginLeft: '4px' }}>
              <span style={{ color: inst.station1_complete ? '#0a0' : '#a00' }}>S1</span>
              <span style={{ color: inst.station2_complete ? '#0a0' : '#a00' }}>S2</span>
              <span style={{ color: inst.station3_complete ? '#0a0' : '#a00' }}>S3</span>
              <span style={{ color: inst.station4_complete ? '#0a0' : '#a00' }}>S4</span>
            </div>
            <button
              onClick={() => handleDelete(inst._id)}
              style={{
                marginLeft: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: '#ddd',
                border: '1px solid #aaa',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              DEL
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default RetrievalStatus;
