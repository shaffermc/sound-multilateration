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
        <table border="1">
          <thead>
            <tr>
              <th >File Name</th>
              <th >Download</th>
            </tr>
          </thead>
          <tbody>
            {audioFiles.map((file, index) => (
              <tr key={index}>
                <td >{file}</td>
                <td >
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

export default AudioFileList;
