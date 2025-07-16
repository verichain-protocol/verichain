import React, { useState } from 'react';
import './App.scss';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [socialUrl, setSocialUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [modelStatus, setModelStatus] = useState('ready');
  const [streamingStatus, setStreamingStatus] = useState('ready');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadStatus('uploading');
      // Simulate upload process
      setTimeout(() => {
        setUploadStatus('analyzing');
        setTimeout(() => {
          setUploadStatus('complete');
          setAnalysisResult({
            filename: file.name,
            result: 'Authentic',
            confidence: 94.7,
            timestamp: new Date().toLocaleString()
          });
        }, 2000);
      }, 1000);
    }
  };

  const handleSocialAnalyze = () => {
    if (socialUrl) {
      setUploadStatus('analyzing');
      setTimeout(() => {
        setUploadStatus('complete');
        setAnalysisResult({
          url: socialUrl,
          result: 'Deepfake Detected',
          confidence: 87.3,
          timestamp: new Date().toLocaleString()
        });
      }, 3000);
    }
  };

  const handleStartStreaming = () => {
    setStreamingStatus('streaming');
    setTimeout(() => setStreamingStatus('ready'), 5000);
  };

  const handlePauseStreaming = () => {
    setStreamingStatus('paused');
  };

  const handleRestartModel = () => {
    setModelStatus('restarting');
    setTimeout(() => setModelStatus('ready'), 3000);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="brand">
            <div className="logo-section">
              <img src="/favicon.ico" alt="VeriChain" className="logo" />
              <h1>VeriChain</h1>
            </div>
            <span className="tagline">Blockchain-Powered Deepfake Detection</span>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="hero-section">
            <h2>AI-Powered Deepfake Detection</h2>
            <p>Leverage cutting-edge AI and blockchain technology to verify the authenticity of digital media content with unparalleled accuracy and transparency.</p>
          </div>

          <div className="analysis-methods">
            <div className="tab-navigation">
              <div className="tab-container">
                <button 
                  className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upload')}
                >
                  <span className="tab-icon">📁</span>
                  <span>File Upload</span>
                </button>
                <button 
                  className={`tab-button ${activeTab === 'social' ? 'active' : ''}`}
                  onClick={() => setActiveTab('social')}
                >
                  <span className="tab-icon">🌐</span>
                  <span>Social Media</span>
                </button>
                <button 
                  className={`tab-button ${activeTab === 'diagnostic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('diagnostic')}
                >
                  <span className="tab-icon">🔧</span>
                  <span>Diagnostics</span>
                </button>
                <button 
                  className={`tab-button ${activeTab === 'streaming' ? 'active' : ''}`}
                  onClick={() => setActiveTab('streaming')}
                >
                  <span className="tab-icon">⚡</span>
                  <span>Model Stream</span>
                </button>
              </div>
            </div>

            <div className="tab-content">
              {activeTab === 'upload' && (
                <div className="content-card upload-tab">
                  <div className="upload-header">
                    <div className="upload-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                    <h3>Upload Media Files</h3>
                    <p>Analyze images and videos directly from your device using state-of-the-art deepfake detection algorithms.</p>
                  </div>
                  
                  <div className="upload-zone">
                    <input 
                      type="file" 
                      id="file-upload" 
                      accept="image/*,video/*" 
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload" className="upload-label">
                      <div className="upload-content">
                        <div className="upload-visual">
                          <div className="upload-circle">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7,10 12,15 17,10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </div>
                        </div>
                        <h3>Drop files here or click to browse</h3>
                        <p>Select images or videos to analyze for deepfake manipulation</p>
                        <div className="file-types">
                          <span className="file-type">JPG</span>
                          <span className="file-type">PNG</span>
                          <span className="file-type">WebP</span>
                          <span className="file-type">MP4</span>
                          <span className="file-type">WebM</span>
                        </div>
                        <small>Maximum file size: 50MB</small>
                      </div>
                    </label>
                  </div>

                  {uploadStatus !== 'idle' && (
                    <div className="analysis-progress">
                      <div className="progress-header">
                        <h4>
                          {uploadStatus === 'uploading' && 'Uploading file...'}
                          {uploadStatus === 'analyzing' && 'Analyzing content...'}
                          {uploadStatus === 'complete' && 'Analysis Complete'}
                        </h4>
                      </div>
                      {uploadStatus !== 'complete' && (
                        <div className="progress-bar">
                          <div className="progress-fill"></div>
                        </div>
                      )}
                      {analysisResult && (
                        <div className="analysis-result">
                          <div className="result-header">
                            <span className={`result-badge ${analysisResult.result.toLowerCase().includes('authentic') ? 'authentic' : 'deepfake'}`}>
                              {analysisResult.result}
                            </span>
                            <span className="confidence">Confidence: {analysisResult.confidence}%</span>
                          </div>
                          <div className="result-details">
                            <p><strong>File:</strong> {analysisResult.filename || 'Social Media Content'}</p>
                            {analysisResult.url && <p><strong>URL:</strong> {analysisResult.url}</p>}
                            <p><strong>Analyzed:</strong> {analysisResult.timestamp}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'social' && (
                <div className="content-card social-tab">
                  <div className="social-header">
                    <div className="social-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </div>
                    <h3>Social Media Analysis</h3>
                    <p>Analyze videos from social media platforms by providing a direct URL to the content.</p>
                  </div>
                  <div className="social-content">
                    <div className="url-input-section">
                      <label htmlFor="social-url">Video URL</label>
                      <div className="input-group">
                        <input 
                          type="url" 
                          id="social-url" 
                          value={socialUrl}
                          onChange={(e) => setSocialUrl(e.target.value)}
                          placeholder="Paste YouTube, TikTok, Instagram, or other social media video URL here..."
                          className="url-input"
                        />
                        <button 
                          className="btn primary"
                          onClick={handleSocialAnalyze}
                          disabled={!socialUrl || uploadStatus === 'analyzing'}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                          </svg>
                          {uploadStatus === 'analyzing' ? 'Analyzing...' : 'Analyze'}
                        </button>
                      </div>
                    </div>
                    <div className="supported-platforms">
                      <h4>Supported Platforms</h4>
                      <div className="platform-list">
                        <span className="platform">YouTube</span>
                        <span className="platform">TikTok</span>
                        <span className="platform">Instagram</span>
                        <span className="platform">Twitter</span>
                        <span className="platform">Facebook</span>
                      </div>
                    </div>
                  </div>

                  {uploadStatus !== 'idle' && analysisResult && (
                    <div className="analysis-progress">
                      <div className="analysis-result">
                        <div className="result-header">
                          <span className={`result-badge ${analysisResult.result.toLowerCase().includes('authentic') ? 'authentic' : 'deepfake'}`}>
                            {analysisResult.result}
                          </span>
                          <span className="confidence">Confidence: {analysisResult.confidence}%</span>
                        </div>
                        <div className="result-details">
                          <p><strong>URL:</strong> {analysisResult.url}</p>
                          <p><strong>Analyzed:</strong> {analysisResult.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'diagnostic' && (
                <div className="content-card diagnostic-tab">
                  <div className="diagnostic-header">
                    <div className="diagnostic-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                      </svg>
                    </div>
                    <h3>System Diagnostics</h3>
                    <p>Check system health, browser compatibility, and troubleshoot any issues with the analysis engine.</p>
                  </div>
                  <div className="diagnostic-content">
                    <div className="diagnostic-section">
                      <h4>Browser Capability Test</h4>
                      <button className="btn primary diagnostic-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M9 12l2 2 4-4"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                        Run Diagnostics
                      </button>
                    </div>
                    <div className="diagnostic-section">
                      <h4>File Upload Test</h4>
                      <div className="test-upload">
                        <input type="file" id="test-file" accept="image/*,video/*" />
                        <label htmlFor="test-file" className="btn secondary">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Choose Test File
                        </label>
                        <button className="btn secondary">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 6h18"/>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                            <polyline points="10,11 10,17"/>
                            <polyline points="14,11 14,17"/>
                          </svg>
                          Clear Results
                        </button>
                      </div>
                    </div>
                    <div className="diagnostic-section">
                      <h4>Environment Info</h4>
                      <div className="env-info">
                        <div className="info-item">
                          <label>Protocol:</label>
                          <span>https:</span>
                        </div>
                        <div className="info-item">
                          <label>Host:</label>
                          <span>localhost:3000</span>
                        </div>
                        <div className="info-item">
                          <label>User Agent:</label>
                          <span>Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36</span>
                        </div>
                        <div className="info-item">
                          <label>Cookies Enabled:</label>
                          <span>Yes</span>
                        </div>
                        <div className="info-item">
                          <label>Online:</label>
                          <span>Yes</span>
                        </div>
                        <div className="info-item">
                          <label>Touch Support:</label>
                          <span>No</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'streaming' && (
                <div className="content-card streaming-tab">
                  <div className="streaming-header">
                    <div className="streaming-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    </div>
                    <h3>AI Model Status & Streaming</h3>
                    <p>Monitor and manage the AI model initialization, streaming status, and system performance.</p>
                  </div>
                  
                  <div className="streaming-content">
                    <div className="status-grid">
                      <div className="status-card">
                        <div className="status-header">
                          <span className="status-icon">🤖</span>
                          <h4>Model Status</h4>
                        </div>
                        <div className="status-value">
                          <span className={`status-indicator ${modelStatus}`}></span>
                          {modelStatus === 'ready' && 'Ready'}
                          {modelStatus === 'restarting' && 'Restarting...'}
                        </div>
                      </div>

                      <div className="status-card">
                        <div className="status-header">
                          <span className="status-icon">📡</span>
                          <h4>Streaming Status</h4>
                        </div>
                        <div className="status-value">
                          <span className={`status-indicator ${streamingStatus}`}></span>
                          {streamingStatus === 'ready' && 'Ready'}
                          {streamingStatus === 'streaming' && 'Streaming'}
                          {streamingStatus === 'paused' && 'Paused'}
                        </div>
                      </div>

                      <div className="status-card">
                        <div className="status-header">
                          <span className="status-icon">📊</span>
                          <h4>Memory Usage</h4>
                        </div>
                        <div className="status-value">
                          <div className="memory-bar">
                            <div className="memory-fill" style={{ width: '67%' }}></div>
                          </div>
                          <span>67%</span>
                        </div>
                      </div>

                      <div className="status-card">
                        <div className="status-header">
                          <span className="status-icon">⚡</span>
                          <h4>Performance</h4>
                        </div>
                        <div className="status-value">
                          <div className="perf-metrics">
                            <div>Response: 120ms</div>
                            <div>Throughput: 15fps</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="model-controls" style={{ textAlign: 'left', margin: 0, padding: 0 }}>
                      <h4 style={{ margin: '0 0 1rem 0', padding: 0, textAlign: 'left' }}>Model Controls</h4>
                      <div className="control-buttons model-control-buttons" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '1rem', margin: 0, padding: 0 }}>
                        <button 
                          className="btn primary"
                          onClick={handleStartStreaming}
                          disabled={streamingStatus === 'streaming'}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                          Start Streaming
                        </button>
                        <button 
                          className="btn secondary"
                          onClick={handlePauseStreaming}
                          disabled={streamingStatus !== 'streaming'}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="6" y="4" width="4" height="16"/>
                            <rect x="14" y="4" width="4" height="16"/>
                          </svg>
                          Pause
                        </button>
                        <button 
                          className="btn secondary"
                          onClick={handleRestartModel}
                          disabled={modelStatus === 'restarting'}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="23 4 23 10 17 10"/>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                          </svg>
                          Restart Model
                        </button>
                      </div>
                    </div>

                    <div className="system-logs">
                      <h4>System Logs</h4>
                      <div className="log-container">
                        <div className="log-entry">
                          <span className="log-time">09:37:15</span>
                          <span className="log-message">Model initialization started</span>
                        </div>
                        <div className="log-entry">
                          <span className="log-time">09:37:16</span>
                          <span className="log-message streaming">Streaming service connected</span>
                        </div>
                        <div className="log-entry">
                          <span className="log-time">09:37:17</span>
                          <span className="log-message">Model weights loaded successfully</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
