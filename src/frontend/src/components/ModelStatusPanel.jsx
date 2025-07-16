import React, { useState, useEffect } from 'react';
import { ai_canister } from '../../../declarations/ai_canister';
import './ModelStatusPanel.scss';

const ModelStatusPanel = () => {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [initStatus, setInitStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [isInitializing, setIsInitializing] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), { timestamp, message, type }]);
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch upload status
      const uploadResult = await ai_canister.get_upload_status();
      setUploadStatus(uploadResult);
      
      // Fetch initialization status
      const initResult = await ai_canister.get_model_initialization_status();
      setInitStatus(initResult);
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError(err.message);
      addLog(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startStreaming = async () => {
    try {
      setIsInitializing(true);
      addLog('Starting streaming initialization...', 'info');
      
      const result = await ai_canister.start_streaming_initialization();
      addLog(`Streaming started: ${JSON.stringify(result)}`, 'success');
      
      // Start faster polling during initialization
      setRefreshInterval(2000);
    } catch (err) {
      console.error('Failed to start streaming:', err);
      addLog(`Failed to start streaming: ${err.message}`, 'error');
      setIsInitializing(false);
    }
  };

  const continueInitialization = async () => {
    try {
      addLog('Continuing model initialization...', 'info');
      
      const result = await ai_canister.continue_model_initialization();
      addLog(`Continue result: ${JSON.stringify(result)}`, 'success');
    } catch (err) {
      console.error('Failed to continue initialization:', err);
      addLog(`Failed to continue: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    // Reset refresh interval when initialization completes
    if (initStatus?.status === 'Completed') {
      setRefreshInterval(5000);
      setIsInitializing(false);
      addLog('Model initialization completed!', 'success');
    } else if (initStatus?.status === 'Failed') {
      setRefreshInterval(5000);
      setIsInitializing(false);
      addLog('Model initialization failed!', 'error');
    }
  }, [initStatus]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadProgress = () => {
    if (!uploadStatus) return 0;
    const { chunks_uploaded, total_chunks } = uploadStatus;
    return total_chunks > 0 ? (chunks_uploaded / total_chunks) * 100 : 0;
  };

  const getInitProgress = () => {
    if (!initStatus || !initStatus.progress) return 0;
    const { processed_chunks, total_chunks } = initStatus.progress;
    return total_chunks > 0 ? (processed_chunks / total_chunks) * 100 : 0;
  };

  if (loading && !uploadStatus) {
    return (
      <div className="model-status-panel loading">
        <div className="spinner"></div>
        <p>Loading model status...</p>
      </div>
    );
  }

  return (
    <div className="model-status-panel">
      <h2>🤖 AI Model Status</h2>
      
      {error && (
        <div className="status-section error">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Upload Status */}
      <div className="status-section">
        <h3>📤 Upload Status</h3>
        {uploadStatus ? (
          <div className="status-content">
            <div className="progress-bar">
              <div 
                className="progress-fill upload" 
                style={{ width: `${getUploadProgress()}%` }}
              ></div>
              <span className="progress-text">
                {uploadStatus.chunks_uploaded}/{uploadStatus.total_chunks} chunks 
                ({getUploadProgress().toFixed(1)}%)
              </span>
            </div>
            <div className="status-details">
              <p><strong>Status:</strong> {uploadStatus.is_complete ? '✅ Complete' : '🔄 In Progress'}</p>
              <p><strong>Total Size:</strong> {formatBytes(uploadStatus.total_size || 0)}</p>
              <p><strong>SHA256:</strong> <code>{uploadStatus.sha256_hash || 'N/A'}</code></p>
            </div>
          </div>
        ) : (
          <p className="status-placeholder">No upload data available</p>
        )}
      </div>

      {/* Initialization Status */}
      <div className="status-section">
        <h3>🧠 Model Initialization</h3>
        {initStatus ? (
          <div className="status-content">
            <div className="status-indicator">
              <span className={`status-badge ${initStatus.status?.toLowerCase()}`}>
                {initStatus.status}
              </span>
            </div>
            
            {initStatus.progress && (
              <div className="progress-bar">
                <div 
                  className="progress-fill init" 
                  style={{ width: `${getInitProgress()}%` }}
                ></div>
                <span className="progress-text">
                  {initStatus.progress.processed_chunks}/{initStatus.progress.total_chunks} chunks 
                  ({getInitProgress().toFixed(1)}%)
                </span>
              </div>
            )}
            
            {initStatus.error && (
              <div className="error-message">
                <p><strong>Error:</strong> {initStatus.error}</p>
              </div>
            )}
            
            <div className="action-buttons">
              {uploadStatus?.is_complete && initStatus.status === 'NotStarted' && (
                <button 
                  onClick={startStreaming} 
                  className="btn primary"
                  disabled={isInitializing}
                >
                  {isInitializing ? '🔄 Starting...' : '🚀 Start Initialization'}
                </button>
              )}
              
              {initStatus.status === 'InProgress' && (
                <button 
                  onClick={continueInitialization} 
                  className="btn secondary"
                >
                  ⏭️ Continue Initialization
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="status-placeholder">No initialization data available</p>
        )}
      </div>

      {/* Activity Logs */}
      <div className="status-section">
        <h3>📋 Activity Logs</h3>
        <div className="logs-container">
          {logs.length === 0 ? (
            <p className="status-placeholder">No activity logs yet</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`log-entry ${log.type}`}>
                <span className="log-timestamp">[{log.timestamp}]</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Refresh Controls */}
      <div className="status-section">
        <h3>⚙️ Controls</h3>
        <div className="controls">
          <button onClick={fetchStatus} className="btn secondary" disabled={loading}>
            {loading ? '🔄 Refreshing...' : '🔄 Refresh Now'}
          </button>
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="refresh-select"
          >
            <option value={2000}>2 seconds</option>
            <option value={5000}>5 seconds</option>
            <option value={10000}>10 seconds</option>
            <option value={30000}>30 seconds</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ModelStatusPanel;
