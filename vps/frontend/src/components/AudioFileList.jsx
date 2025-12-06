import React, { useState, useEffect } from 'react';

const AudioFileList = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch audio files from the backend API
    const fetchAudioFiles = async () => {
      try {
        const response = await fetch('http://209.46.124.94:3000/audio-files');
        if (!response.ok) {
          throw new Error('Failed to fetch audio files');
        }
        const files = await response.json();
        setAudioFiles(files);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAudioFiles();
  }, []);

  if (loading) {
    return <div>Loading audio files...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h3 style={{ textAlign: 'left' }}>Available Audio Files:</h3>
      {audioFiles.length === 0 ? (
        <p>No audio files found.</p>
      ) : (
        <table style={{ width: '30%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>File Name</th>
              <th style={styles.tableHeader}>Download</th>
            </tr>
          </thead>
          <tbody>
            {audioFiles.map((file, index) => (
              <tr key={index}>
                <td style={styles.tableData}>{file}</td>
                <td style={styles.tableData}>
                  <a href={`http://209.46.124.94:3000/audio/${file}`} download>
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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

export default AudioFileList;
