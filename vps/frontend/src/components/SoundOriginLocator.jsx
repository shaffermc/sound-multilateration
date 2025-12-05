import { useState } from 'react';

function SoundOriginLocator() {
  // State variables for the plot URL and the time variables
  const [imageUrl, setImageUrl] = useState('');
  const [tA, setTA] = useState(0.5);      // Time for sound to reach sensor A
  const [tB, setTB] = useState(2.35);   // Time for sound to reach sensor B
  const [tC, setTC] = useState(1.5);    // Time for sound to reach sensor C
  
  // Constants
  const speedOfSound = 343; // meters per second (speed of sound in air)

  // Function to fetch the plot based on the current time values
  const fetchPlot = async () => {
    const timestamp = new Date().getTime();  // Get the current timestamp to prevent caching
    const response = await fetch(`http://209.46.124.94:3000/generate_plot?t_A=${tA}&t_B=${tB}&t_C=${tC}&timestamp=${timestamp}`);
    if (response.ok) {
      const plotUrl = `http://209.46.124.94:3000/static/plot.png?${timestamp}`;  // Append timestamp to the image URL
      setImageUrl(plotUrl);
    } else {
      console.error('Error fetching plot');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Controls and Time Info */}
      <div style={{ marginBottom: '20px' }}>
        <div>
          <div>
            <strong>AB:</strong>
            <input 
              type="number" 
              value={tA.toFixed(2)} 
              onChange={(e) => setTA(parseFloat(e.target.value))} 
              step="0.01"
              style={{ width: '80px', fontSize: '14px', padding: '5px', marginRight: '10px' }}
            />
            seconds
          </div>
          <div>
            <strong>BC:</strong>
            <input 
              type="number" 
              value={tB.toFixed(2)} 
              onChange={(e) => setTB(parseFloat(e.target.value))} 
              step="0.01"
              style={{ width: '80px', fontSize: '14px', padding: '5px', marginRight: '10px' }}
            />
            seconds
          </div>
          <div>
            <strong>AC:</strong>
            <input 
              type="number" 
              value={tC.toFixed(2)} 
              onChange={(e) => setTC(parseFloat(e.target.value))} 
              step="0.01"
              style={{ width: '80px', fontSize: '14px', padding: '5px', marginRight: '10px' }}
            />
            seconds
          </div>
          
          <button onClick={fetchPlot} style={{ fontSize: '14px', padding: '8px 15px', marginTop: '10px' }}>Refresh Plot</button>
        </div>
      </div>

      {/* Image at the bottom, full width */}
      <div>
        {imageUrl ? (
          <img src={imageUrl} alt="Generated Plot" style={{ width: '100%', height: 'auto' }} />
        ) : (
          <p>Loading plot...</p>
        )}
      </div>
    </div>
  );
}

export default SoundOriginLocator;
