import React, { useState } from 'react';
import AIDetection from './components/AIDetection';
import ModelStatus from './components/ModelStatus';
import './App.scss';

function App() {
  const [activeTab, setActiveTab] = useState('ai-detection');

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
                  className={`tab-button ${activeTab === 'ai-detection' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ai-detection')}
                >
                  <span className="tab-icon">🤖</span>
                  <span>AI Detection</span>
                </button>
                <button 
                  className={`tab-button ${activeTab === 'model-status' ? 'active' : ''}`}
                  onClick={() => setActiveTab('model-status')}
                >
                  <span className="tab-icon">⚙️</span>
                  <span>Model Status</span>
                </button>
              </div>
            </div>

            <div className="tab-content">
              {activeTab === 'ai-detection' && (
                <div className="tab-panel active">
                  <AIDetection />
                </div>
              )}

              {activeTab === 'model-status' && (
                <div className="tab-panel active">
                  <div className="model-management">
                    <h3>AI Model Management</h3>
                    <p className="section-description">
                      Monitor and manage the AI model initialization and performance status.
                    </p>
                    <ModelStatus className="mt-6" />
                    
                    <div className="system-info mt-8 p-6 bg-gray-50 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4">System Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Platform:</span>
                          <span className="ml-2 text-gray-600">Internet Computer Protocol</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Runtime:</span>
                          <span className="ml-2 text-gray-600">WebAssembly</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">AI Framework:</span>
                          <span className="ml-2 text-gray-600">Custom ONNX Runtime</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Blockchain:</span>
                          <span className="ml-2 text-gray-600">Decentralized</span>
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
