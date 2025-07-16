import React, { useState, useCallback } from 'react';
import { ai_canister } from 'declarations/ai_canister';
import './App.scss';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image or video file');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Convert file to bytes
      const fileBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);

      const response = await ai_canister.analyze_media({
        filename: file.name,
        data: Array.from(fileBytes),
        media_type: file.type.startsWith('image/') ? { Image: null } : { Video: null }
      });

      if (response.success && response.result) {
        setAnalysisResult(response.result);
      } else {
        alert(response.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setSelectedFile(null);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence < 0.3) return 'low';
    if (confidence < 0.7) return 'medium';
    return 'high';
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="brand">
            <img src="/logo2.svg" alt="VeriChain" className="logo" />
            <h1>VeriChain</h1>
            <span className="tagline">Blockchain-Powered Deepfake Detection</span>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {!analysisResult && (
            <div className="upload-section">
              <h2>Upload Media for Analysis</h2>
              <p>Upload an image or video to detect potential deepfake content using AI</p>
              
              <div 
                className={`upload-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*,video/*"
                  onChange={handleChange}
                  disabled={isAnalyzing}
                />
                <label htmlFor="file-upload" className="upload-label">
                  {isAnalyzing ? (
                    <div className="analyzing">
                      <div className="spinner"></div>
                      <span>Analyzing {selectedFile?.name}...</span>
                    </div>
                  ) : (
                    <div className="upload-content">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <span>Drag & drop files here or click to browse</span>
                      <small>Supports JPG, PNG, WebP, MP4, WebM (max 50MB)</small>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="results-section">
              <div className="results-header">
                <h2>Analysis Results</h2>
                <button onClick={resetAnalysis} className="btn-secondary">
                  Analyze Another File
                </button>
              </div>

              <div className="result-card">
                <div className={`result-status ${analysisResult.is_deepfake ? 'deepfake' : 'authentic'}`}>
                  <div className="status-icon">
                    {analysisResult.is_deepfake ? '⚠️' : '✅'}
                  </div>
                  <div className="status-text">
                    <h3>{analysisResult.is_deepfake ? 'Potential Deepfake Detected' : 'Appears Authentic'}</h3>
                    <p>
                      {analysisResult.is_deepfake 
                        ? 'This media shows signs of artificial manipulation'
                        : 'No significant signs of deepfake manipulation detected'
                      }
                    </p>
                  </div>
                </div>

                <div className="confidence-meter">
                  <label>Confidence Score</label>
                  <div className="meter">
                    <div 
                      className={`fill ${getConfidenceColor(analysisResult.confidence)}`}
                      style={{width: `${analysisResult.confidence * 100}%`}}
                    />
                  </div>
                  <span className="confidence-value">
                    {(analysisResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="analysis-details">
                  <h4>Analysis Details</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Media Type</label>
                      <span>{analysisResult.media_type.Image ? 'Image' : 'Video'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Processing Time</label>
                      <span>{analysisResult.processing_time_ms}ms</span>
                    </div>
                    {analysisResult.frames_analyzed && (
                      <div className="detail-item">
                        <label>Frames Analyzed</label>
                        <span>{analysisResult.frames_analyzed}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="blockchain-verification">
                  <h4>🔗 Blockchain Verification</h4>
                  <p>This analysis was performed on the Internet Computer blockchain, ensuring transparency and immutability of results.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 VeriChain. Powered by Internet Computer Protocol.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
