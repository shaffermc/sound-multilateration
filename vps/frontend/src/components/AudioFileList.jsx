import React, { useState, useEffect } from 'react';

const AudioFileList = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch audio files from the backend API
    const fetchAudioFiles = async () => {
      try {
        const response = await fetch('/api/audio-files');
        if (!response.ok) {
          throw new Error('Failed to fetch audio files');
        }
        const files = await response.json();
        return files;
      } catch (error) {
        setError(error.message);
        return [];
      }
    };

    // Polling function to periodically check for updates
    const pollForUpdates = async () => {
      try {
        setLoading(true);
        const newFiles = await fetchAudioFiles();

        // If new files are different from the current state, update the state
        setAudioFiles((prevFiles) => {
          // Only update the table if there is a difference
          if (JSON.stringify(prevFiles) !== JSON.stringify(newFiles)) {
            return newFiles;
          }
          return prevFiles; // No changes, so return the current state
        });
      } catch (error) {
        setError('Failed to fetch audio files');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch of audio files
    pollForUpdates();

    // Set up polling every 30 seconds
    const intervalId = setInterval(() => {
      pollForUpdates();
    }, 30000); // Poll every 30 seconds

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);

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
              <th>File Name</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {audioFiles.map((file, index) => (
              <tr key={index}>
                <td>{file}</td>
                <td>
                  <a href={`${API_BASE}/api/audio/${file}`} download>
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
