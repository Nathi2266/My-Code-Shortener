import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const Analysis = () => {
  const location = useLocation();
  const [analysisData, setAnalysisData] = useState(null);

  useEffect(() => {
    if (location.state && location.state.analysisResults) {
      setAnalysisData(location.state.analysisResults);
    }
  }, [location.state]);

  if (!analysisData) {
    return <div>No analysis data available.</div>;
  }

  return (
    <div>
      <h2>Code Analysis Results</h2>
      <p>Language Detected: <strong>{analysisData.language}</strong></p>
      
      {/* Conditionally render analysis sections based on the content */}
      {analysisData.analysis && (
        <pre>{JSON.stringify(analysisData.analysis, null, 2)}</pre>
      )}

      {analysisData.message && (
        <p>{analysisData.message}</p>
      )}
      
      {/* ... other parts of your analysis UI ... */}
      
    </div>
  );
};

export default Analysis;
