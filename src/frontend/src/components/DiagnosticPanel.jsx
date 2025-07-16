import React, { useState } from 'react';
import { checkBrowserSupport } from '../utils/videoProcessor';
import './DiagnosticPanel.scss';

const DiagnosticPanel = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [testFile, setTestFile] = useState(null);
  const [testResults, setTestResults] = useState([]);

  const runDiagnostics = () => {
    const support = checkBrowserSupport();
    const results = [];
    
    // Test basic browser features
    results.push({
      test: 'File API Support',
      status: !!window.File && !!window.FileReader && !!window.FileList && !!window.Blob ? 'PASS' : 'FAIL',
      details: `File: ${!!window.File}, FileReader: ${!!window.FileReader}, FileList: ${!!window.FileList}, Blob: ${!!window.Blob}`
    });

    results.push({
      test: 'Canvas Support',
      status: support.canvas2d ? 'PASS' : 'FAIL',
      details: `2D Context: ${support.canvas2d}`
    });

    results.push({
      test: 'Video Element Support',
      status: support.videoElement ? 'PASS' : 'FAIL',
      details: `Video Element: ${support.videoElement}`
    });

    // Test video codec support
    const video = document.createElement('video');
    const codecTests = [
      { name: 'MP4 Basic', codec: 'video/mp4', result: video.canPlayType('video/mp4') },
      { name: 'MP4 H.264', codec: 'video/mp4; codecs="avc1.42E01E"', result: video.canPlayType('video/mp4; codecs="avc1.42E01E"') },
      { name: 'WebM', codec: 'video/webm', result: video.canPlayType('video/webm') },
      { name: 'WebM VP8', codec: 'video/webm; codecs="vp8"', result: video.canPlayType('video/webm; codecs="vp8"') },
    ];

    codecTests.forEach(test => {
      results.push({
        test: `Codec: ${test.name}`,
        status: test.result !== '' ? 'SUPPORTED' : 'NOT SUPPORTED',
        details: `canPlayType result: "${test.result}"`
      });
    });

    // Test security restrictions
    try {
      const testCanvas = document.createElement('canvas');
      const testCtx = testCanvas.getContext('2d');
      testCtx.fillRect(0, 0, 10, 10);
      const dataUrl = testCanvas.toDataURL();
      results.push({
        test: 'Canvas Export',
        status: dataUrl.startsWith('data:image') ? 'PASS' : 'FAIL',
        details: `Can export canvas: ${dataUrl.length > 50}`
      });
    } catch (error) {
      results.push({
        test: 'Canvas Export',
        status: 'FAIL',
        details: `Error: ${error.message}`
      });
    }

    // Test URL.createObjectURL
    try {
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testUrl = URL.createObjectURL(testBlob);
      URL.revokeObjectURL(testUrl);
      results.push({
        test: 'Object URL Creation',
        status: 'PASS',
        details: 'Can create and revoke object URLs'
      });
    } catch (error) {
      results.push({
        test: 'Object URL Creation',
        status: 'FAIL',
        details: `Error: ${error.message}`
      });
    }

    setDiagnostics({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      support,
      results
    });
  };

  const testFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setTestFile(file);
    const newResults = [...testResults];
    
    newResults.push({
      timestamp: new Date().toLocaleTimeString(),
      test: 'File Selection',
      status: 'SUCCESS',
      details: `Selected: ${file.name} (${file.size} bytes, ${file.type})`
    });

    // Test file reading
    const reader = new FileReader();
    
    reader.onload = () => {
      newResults.push({
        timestamp: new Date().toLocaleTimeString(),
        test: 'File Reading',
        status: 'SUCCESS',
        details: `Read ${reader.result.byteLength || reader.result.length} bytes`
      });
      setTestResults([...newResults]);
    };
    
    reader.onerror = (error) => {
      newResults.push({
        timestamp: new Date().toLocaleTimeString(),
        test: 'File Reading',
        status: 'FAILED',
        details: `Error: ${error.message || 'Unknown error'}`
      });
      setTestResults([...newResults]);
    };

    // Test different read methods
    try {
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
        
        // Also test with ArrayBuffer for images
        const reader2 = new FileReader();
        reader2.onload = () => {
          newResults.push({
            timestamp: new Date().toLocaleTimeString(),
            test: 'ArrayBuffer Reading',
            status: 'SUCCESS',
            details: `ArrayBuffer size: ${reader2.result.byteLength} bytes`
          });
          setTestResults([...newResults]);
        };
        reader2.onerror = (error) => {
          newResults.push({
            timestamp: new Date().toLocaleTimeString(),
            test: 'ArrayBuffer Reading',
            status: 'FAILED',
            details: `Error: ${error.message || 'Unknown error'}`
          });
          setTestResults([...newResults]);
        };
        reader2.readAsArrayBuffer(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      newResults.push({
        timestamp: new Date().toLocaleTimeString(),
        test: 'File Reading Setup',
        status: 'FAILED',
        details: `Error: ${error.message}`
      });
    }

    setTestResults([...newResults]);
  };

  const clearResults = () => {
    setTestResults([]);
    setTestFile(null);
  };

  return (
    <div className="diagnostic-panel">
      <div className="diagnostic-header">
        <h3>🔧 VeriChain Diagnostic Panel</h3>
        <p>Debug file upload and video processing issues</p>
      </div>

      <div className="diagnostic-section">
        <h4>Browser Capability Test</h4>
        <button onClick={runDiagnostics} className="diagnostic-button">
          Run Diagnostics
        </button>
        
        {diagnostics && (
          <div className="diagnostics-results">
            <div className="diagnostic-info">
              <strong>Browser:</strong> {diagnostics.userAgent.split(' ').slice(-2).join(' ')}
              <br />
              <strong>Test Time:</strong> {new Date(diagnostics.timestamp).toLocaleString()}
            </div>
            
            <div className="results-table">
              {diagnostics.results.map((result, index) => (
                <div key={index} className={`result-row ${result.status.toLowerCase()}`}>
                  <span className="test-name">{result.test}</span>
                  <span className="test-status">{result.status}</span>
                  <span className="test-details">{result.details}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="diagnostic-section">
        <h4>File Upload Test</h4>
        <div className="file-test-area">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={testFileUpload}
            className="file-test-input"
          />
          <button onClick={clearResults} className="clear-button">
            Clear Results
          </button>
        </div>

        {testFile && (
          <div className="file-info">
            <strong>Selected File:</strong> {testFile.name}
            <br />
            <strong>Size:</strong> {(testFile.size / 1024).toFixed(2)} KB
            <br />
            <strong>Type:</strong> {testFile.type}
            <br />
            <strong>Last Modified:</strong> {new Date(testFile.lastModified).toLocaleString()}
          </div>
        )}

        {testResults.length > 0 && (
          <div className="test-results">
            <h5>File Test Results:</h5>
            {testResults.map((result, index) => (
              <div key={index} className={`test-result ${result.status.toLowerCase()}`}>
                <span className="timestamp">[{result.timestamp}]</span>
                <span className="test-name">{result.test}:</span>
                <span className="status">{result.status}</span>
                <div className="details">{result.details}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="diagnostic-section">
        <h4>Environment Info</h4>
        <div className="env-info">
          <div><strong>Protocol:</strong> {window.location.protocol}</div>
          <div><strong>Host:</strong> {window.location.host}</div>
          <div><strong>User Agent:</strong> {navigator.userAgent}</div>
          <div><strong>Cookies Enabled:</strong> {navigator.cookieEnabled ? 'Yes' : 'No'}</div>
          <div><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</div>
          <div><strong>Touch Support:</strong> {'ontouchstart' in window ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPanel;
