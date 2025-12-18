import React, { useState, useEffect } from 'react';

const AudioFileList = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAudioFiles = async () => {
      try {
        const response = await fetch('/sound-locator/api/audio-files');
        if (!response.ok) throw new Error('Failed to fetch audio files');
        return await response.json();
      } catch (err) {
        setError(err.message);
        return [];
      }
    };

    const pollForUpdates = async () => {
      setLoading(true);
      const newFiles = await fetchAudioFiles();
      setAudioFiles((prevFiles) =>
        JSON.stringify(prevFiles) !== JSON.stringify(newFiles) ? newFiles : prevFiles
      );
      setLoading(false);
    };

    pollForUpdates();
    const intervalId = setInterval(pollForUpdates, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleDelete = async (file) => {
    if (!window.confirm(`Are you sure you want to delete "${file}"?`)) return;

    try {
      const response = await fetch(`/sound-locator/api/audio/${file}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete audio file');

      // Remove the file from state
      setAudioFiles((prevFiles) => prevFiles.filter((f) => f !== file));
    } catch (err) {
      alert(`Error deleting file: ${err.message}`);
    }
  };

  if (loading) return <div>Loading audio files...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: "100%",
        textAlign: "center",
        fontSize: "13px",
        fontWeight: "600",
        letterSpacing: "0.5px",
        color: "#333",
        margin: "8px 0 4px 0",
        paddingBottom: "4px",
        borderBottom: "1px solid #ddd"
      }}>
        Audio Files
      </div>

      {audioFiles.length === 0 ? (
        <p>No audio files yet.</p>
      ) : (
        audioFiles.map((file, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', width: '90%', alignItems: 'center' }}>
            <span style={{ fontSize: "12px", overflowWrap: "anywhere" }}>{file}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <a href={`/sound-locator/api/audio/${file}`} download>
                <button style={{
                  fontSize: "12px",
                  padding: "2px 6px",
                  backgroundColor: "#b6ffb6",
                  border: "1px solid #aaa",
                  borderRadius: "3px",
                  cursor: "pointer"
                }}>Download</button>
              </a>
              <button
                onClick={() => handleDelete(file)}
                style={{
                  fontSize: "12px",
                  padding: "2px 6px",
                  backgroundColor: "#ffb6b6",
                  border: "1px solid #aaa",
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AudioFileList;
