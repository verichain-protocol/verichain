/**
 * VeriChain App - AI Detection Platform
 * Main application with tabbed interface for AI analysis
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Upload, 
  Link, 
  BarChart3, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Zap,
  Eye,
  Globe
} from 'lucide-react';
import './index.scss';

// Import components
import { ModelStatus } from './components/ModelStatus';
import { UserAuth } from './components/UserAuth';
import { AIDetection } from './components/AIDetection';
import { SocialMediaUpload } from './components/SocialMediaUpload';
import Analytics from './components/Analytics';
import { DetectionResult } from './types/ai.types';

type ActivePage = 'upload' | 'social' | 'analytics';

interface AppState {
  activePage: ActivePage;
  detectionResults: DetectionResult[];
  error: string | null;
  isLoading: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    activePage: 'upload',
    detectionResults: [],
    error: null,
    isLoading: false
  });

  // Navigation handler
  const setActivePage = (page: ActivePage) => {
    setState(prev => ({ ...prev, activePage: page }));
  };

  // Handle detection results from components
  const handleDetectionResult = (result: DetectionResult) => {
    setState(prev => ({
      ...prev,
      detectionResults: [result, ...prev.detectionResults.slice(0, 9)]
    }));
  };

  // Clear error handler
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <div className="verichain-app">
      {/* Header */}
            {/* Header */}
      <header className="app-header">
        <div className="header-container">
          {/* Left: VeriChain Logo */}
          <div className="header-left">
            <div className="logo-wrapper">
              <div className="logo-icon-wrapper">
                <Shield className="logo-icon" size={32} />
                <div className="logo-pulse"></div>
              </div>
              <div className="logo-text">
                <h1>
                  <span className="veri">Veri</span>
                  <span className="chain">Chain</span>
                </h1>
                <p>AI Detection Platform</p>
              </div>
            </div>
          </div>
          
          {/* Center: Model Status */}
          <div className="header-center">
            <ModelStatus className="header-model-status" />
          </div>
          
          {/* Right: Login/Register */}
          <div className="header-right">
            <UserAuth className="header-user-auth" />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-navigation">
        <div className="nav-container">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${state.activePage === 'upload' ? 'active' : ''}`}
              onClick={() => setActivePage('upload')}
            >
              <div className="tab-icon">
                <Upload size={20} />
              </div>
              <div className="tab-content">
                <span className="tab-title">Media Upload</span>
                <span className="tab-subtitle">Upload & Analyze</span>
              </div>
              <div className="tab-indicator"></div>
            </button>

            <button 
              className={`nav-tab ${state.activePage === 'social' ? 'active' : ''}`}
              onClick={() => setActivePage('social')}
            >
              <div className="tab-icon">
                <Globe size={20} />
              </div>
              <div className="tab-content">
                <span className="tab-title">Social Media</span>
                <span className="tab-subtitle">URL Analysis</span>
              </div>
              <div className="tab-indicator"></div>
            </button>

            <button 
              className={`nav-tab ${state.activePage === 'analytics' ? 'active' : ''}`}
              onClick={() => setActivePage('analytics')}
            >
              <div className="tab-icon">
                <BarChart3 size={20} />
              </div>
              <div className="tab-content">
                <span className="tab-title">Analytics</span>
                <span className="tab-subtitle">Detection History</span>
              </div>
              <div className="tab-indicator"></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Dynamic Page Content */}
      <main className="app-main">
        <div className="content-container">
          {/* Error Display */}
          {state.error && (
            <div className="error-banner">
              <div className="error-content">
                <AlertTriangle size={24} />
                <div className="error-text">
                  <h4>Detection Error</h4>
                  <p>{state.error}</p>
                </div>
                <button className="error-close" onClick={clearError}>×</button>
              </div>
            </div>
          )}

          {/* Upload Page */}
          {state.activePage === 'upload' && (
            <div className="page-content upload-page">
              <div className="page-hero">
                <div className="hero-icon">
                  <Upload size={48} />
                  <div className="hero-glow"></div>
                </div>
                <h1>Advanced Media Detection</h1>
                <p>Upload images or videos to detect deepfake manipulation with our cutting-edge AI technology</p>
              </div>
              
              <div className="page-main-content">
                <AIDetection 
                  className="enhanced-detection"
                />
              </div>
            </div>
          )}

          {/* Social Media Page */}
          {state.activePage === 'social' && (
            <div className="page-content social-page">
              <div className="page-hero">
                <div className="hero-icon">
                  <Globe size={48} />
                  <div className="hero-glow social-glow"></div>
                </div>
                <h1>Social Media Analysis</h1>
                <p>Analyze content from social media platforms with direct URL scanning</p>
              </div>
              
              <div className="page-main-content">
                <SocialMediaUpload 
                  className="enhanced-social"
                  onResult={handleDetectionResult}
                />
              </div>
            </div>
          )}

          {/* Analytics Page */}
          {state.activePage === 'analytics' && (
            <div className="page-content analytics-page">
              <div className="page-hero">
                <div className="hero-icon">
                  <BarChart3 size={48} />
                  <div className="hero-glow analytics-glow"></div>
                </div>
                <h1>Detection Analytics</h1>
                <p>Track your deepfake detection patterns and model performance</p>
              </div>
              
              <div className="page-main-content">
                <Analytics />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Ultra Modern Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Shield size={20} />
            <span>VeriChain Protocol</span>
          </div>
          <div className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#api">API</a>
            <a href="#support">Support</a>
          </div>
          <div className="footer-stats">
            <span>BCC NonceSense • 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
