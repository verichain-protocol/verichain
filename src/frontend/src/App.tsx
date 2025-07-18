import React, { useState, useCallback, useEffect } from 'react';
import { AIDetection } from './components/AIDetection';
import { ModelStatus } from './components/ModelStatus';
import { coreAIService } from './services/coreAI.service';
import { modelManagementService } from './services/modelManagement.service';
import { utilityIntegrationService } from './services/utilityIntegration.service';
import { DetectionResult, ModelInfo } from './types/ai.types';
import './App.scss';

const App: React.FC = () => {
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<ModelInfo | null>(null);
  const [isModelInitializing, setIsModelInitializing] = useState(false);

  /**
   * Initialize model on app start
   */
  useEffect(() => {
    const initializeModel = async () => {
      setIsModelInitializing(true);
      try {
        console.log('🚀 Initializing AI model...');
        const isReady = await modelManagementService.initializeModel();
        if (isReady) {
          console.log('✅ Model ready');
          const status = await modelManagementService.getModelStatus();
          setModelStatus(status);
        } else {
          console.log('❌ Model initialization failed');
        }
      } catch (error) {
        console.error('❌ Model initialization error:', error);
      } finally {
        setIsModelInitializing(false);
      }
    };

    initializeModel();

    // Start status monitoring
    modelManagementService.startStatusMonitoring((status) => {
      setModelStatus(status);
    });

    return () => {
      modelManagementService.stopStatusMonitoring();
    };
  }, []);

  /**
   * Handle detection result and track performance
   */
  const handleDetectionResult = useCallback(async (result: DetectionResult) => {
    console.log('🎯 Detection result received:', result);
    setLastResult(result);
    
    // Get performance metrics from the last operation
    const metrics = utilityIntegrationService.getLastPerformanceMetrics();
    setPerformanceData(metrics);
    console.log('📊 Performance metrics:', metrics);
  }, []);

  /**
   * Test AI canister integration
   */
  const testCanisterIntegration = useCallback(async () => {
    console.log('🧪 Testing AI canister integration...');
    
    try {
      // Test model status
      const modelInfo = await coreAIService.getModelInfo();
      console.log('🤖 Model info:', modelInfo);
      
      // Test URL validation with utility integration
      const urlTest = await utilityIntegrationService.validateSocialMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      console.log('🔗 URL validation test:', urlTest);
      
      // Test file validation with real file
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 224, 224);
      }
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const testFile = new File([blob], 'test.png', { type: 'image/png' });
          
          // Test file validation with AI canister
          const fileTest = await utilityIntegrationService.validateFile(testFile);
          console.log('📁 File validation test:', fileTest);
          
          // Test file hashing
          const hashTest = await utilityIntegrationService.hashFile(testFile);
          console.log('🔐 File hash test:', hashTest);
          
          // Test dimensions validation with AI canister
          const dimensionsTest = await utilityIntegrationService.validateMediaDimensions(224, 224);
          console.log('📐 Dimensions validation test:', dimensionsTest);
        }
      }, 'image/png');
      
      // Test file format validation with AI canister
      const formatTest = await coreAIService.validateFileFormat('test.jpg');
      console.log('📋 Format validation test:', formatTest);
      
    } catch (error) {
      console.error('❌ Canister integration test failed:', error);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1 className="app-title">
            <span className="veri">Veri</span>
            <span className="chain">Chain</span>
          </h1>
          <p className="app-subtitle">
            Professional Deepfake Detection Platform
          </p>
          <ModelStatus className="model-status-header" />
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <AIDetection 
            className="ai-detection-section"
          />

          {/* Development: AI Canister Integration Test */}
          <div className="utility-test-section">
            <h3>AI Canister Integration Test</h3>
            <div className="test-controls">
              <button 
                onClick={testCanisterIntegration}
                className="test-button"
                disabled={isModelInitializing}
              >
                {isModelInitializing ? 'Initializing Model...' : 'Test AI Integration'}
              </button>
              
              {modelStatus && (
                <div className="model-info">
                  <span className={`status-badge ${modelStatus.status}`}>
                    {modelStatus.status}
                  </span>
                  <span className="accuracy">
                    {modelStatus.accuracy}% accuracy
                  </span>
                  <span className="chunks">
                    {modelStatus.chunks_loaded}/{modelStatus.total_chunks} chunks
                  </span>
                </div>
              )}
            </div>
            
            {performanceData && (
              <div className="performance-display">
                <h4>Performance Metrics</h4>
                <pre>{JSON.stringify(performanceData, null, 2)}</pre>
              </div>
            )}
          </div>

          {lastResult && (
            <div className="last-result-display">
              <h3>Last Detection Result</h3>
              <div className="result-summary">
                <span className={`result-badge ${lastResult.is_deepfake ? 'deepfake' : 'real'}`}>
                  {lastResult.is_deepfake ? 'Deepfake Detected' : 'Real Content'}
                </span>
                <span className="confidence">
                  {(lastResult.confidence * 100).toFixed(1)}% confidence
                </span>
                <span className="processing-time">
                  {lastResult.processing_time_ms}ms
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>&copy; 2025 VeriChain Protocol. Professional deepfake detection.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
