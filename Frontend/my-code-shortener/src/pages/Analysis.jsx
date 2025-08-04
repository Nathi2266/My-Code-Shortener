import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// A mapping of common languages to their file extensions
const languageExtensions = {
  python: 'py',
  javascript: 'js',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  html: 'html',
  css: 'css',
  // Add more languages as needed
};

const Analysis = () => {
  const location = useLocation();
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('py'); // Default to Python

  useEffect(() => {
    if (location.state && location.state.analysisResults) {
      setAnalysisData(location.state.analysisResults);
      // Set the dropdown to the detected language if it exists
      if (location.state.analysisResults.language) {
        setSelectedLanguage(languageExtensions[location.state.analysisResults.language] || 'txt');
      }
    }
  }, [location.state]);

  const handleDownload = () => {
    if (!analysisData || !analysisData.code) {
      return;
    }

    const filename = `analyzed_code.${selectedLanguage}`;
    const blob = new Blob([analysisData.code], { type: 'text/plain' });
    const href = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  if (!analysisData) {
    return <div>No analysis data available.</div>;
  }

  return (
    <div>
      <h2>Code Analysis Results</h2>
      <p>Language Detected: <strong>{analysisData.language}</strong></p>
      
      {/* Download controls */}
      <div style={{ marginTop: '20px' }}>
        <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
          {Object.entries(languageExtensions).map(([lang, ext]) => (
            <option key={ext} value={ext}>
              {lang}
            </option>
          ))}
        </select>
        <button onClick={handleDownload} style={{ marginLeft: '10px' }}>
          Download Code
        </button>
      </div>

      {/* Code display (for context) */}
      <pre>
        <code>{analysisData.code}</code>
      </pre>

      {/* ... other parts of your analysis UI ... */}
      {analysisData.analysis && (
        <pre>{JSON.stringify(analysisData.analysis, null, 2)}</pre>
      )}

      {analysisData.message && (
        <p>{analysisData.message}</p>
      )}
      
    </div>
  );
};

export default Analysis;
