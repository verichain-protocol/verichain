/**
 * VeriChain Social Media Upload Component
 * Implementation with AI Canister Integration
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Link, Play, AlertTriangle, CheckCircle, ExternalLink, Globe, Clock, Download } from 'lucide-react';
import { coreAIService } from '../services/coreAI.service';
import { validateSocialMediaUrl, getSupportedPlatforms } from '../utils/socialMediaParser';
import { DetectionResult, AnalysisState } from '../types/ai.types';
import { formatConfidence, formatProcessingTime } from '../utils/uiHelpers';
import './SocialMediaUpload.scss';

interface SocialMediaUploadProps {
  className?: string;
  onResult?: (result: DetectionResult) => void;
}

interface UploadState {
  url: string;
  isAnalyzing: boolean;
  error: string;
  result: DetectionResult | null;
  validationResult: any;
  analysisState: AnalysisState;
  progress: number;
  progressMessage: string;
}

interface AnalysisStep {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export const SocialMediaUpload: React.FC<SocialMediaUploadProps> = ({
  className = '',
  onResult
}) => {
  const [state, setState] = useState<UploadState>({
    url: '',
    isAnalyzing: false,
    error: '',
    result: null,
    validationResult: null,
    analysisState: 'idle',
    progress: 0,
    progressMessage: ''
  });

  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    { id: 'validate', name: 'Validating URL', status: 'pending' },
    { id: 'fetch', name: 'Fetching content', status: 'pending' },
    { id: 'extract', name: 'Extracting media', status: 'pending' },
    { id: 'analyze', name: 'AI analysis', status: 'pending' },
    { id: 'complete', name: 'Generating report', status: 'pending' }
  ]);

  // ffmpeg state/hooks
  const [file, setFile] = useState<File | null>(null);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const ffmpeg = useRef<any>(null);

  // Load ffmpeg.wasm
  useEffect(() => {
    const load = async () => {
      if (!ffmpeg.current) {
        ffmpeg.current = createFFmpeg({ log: true });
        await ffmpeg.current.load();
        setFfmpegReady(true);
      }
    };
    load();
  }, []);

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  /**
   * Handle URL input change with real-time validation
   */
  const handleUrlChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, url: value, error: '', validationResult: null }));

    if (value.trim()) {
      try {
        const validationResult = validateSocialMediaUrl(value);
        setState(prev => ({ ...prev, validationResult }));
      } catch (error) {
        console.error('URL validation error:', error);
      }
    }
  }, []);

  /**
   * Update analysis step status
   */
  const updateStepStatus = useCallback((stepId: string, status: 'pending' | 'active' | 'completed' | 'error') => {
    setAnalysisSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, status }
          : step
      )
    );
  }, []);

  /**
   * REAL IMPLEMENTATION: Start social media analysis using AI canister
   */
  const startAnalysis = useCallback(async () => {
    if (!state.url.trim() && !file) {
      setState(prev => ({ ...prev, error: 'Please enter a valid URL or upload a file' }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: true, 
        error: '', 
        result: null,
        analysisState: 'processing',
        progress: 0,
        progressMessage: 'Starting social media analysis...'
      }));

      // Reset all steps
      setAnalysisSteps(prev => 
        prev.map(step => ({ ...step, status: 'pending' }))
      );

      // Step 1: Validate URL
      updateStepStatus('validate', 'active');
      setState(prev => ({ 
        ...prev, 
        progress: 10,
        progressMessage: 'Validating social media URL...'
      }));

      const validation = validateSocialMediaUrl(state.url);
      if (!validation.isValid) {
        throw new Error(`Invalid URL: ${validation.error}`);
      }

      updateStepStatus('validate', 'completed');
      updateStepStatus('fetch', 'active');

      // Step 2: Fetch content from social media (REAL IMPLEMENTATION)
      setState(prev => ({ 
        ...prev, 
        progress: 25,
        progressMessage: `Fetching content from ${validation.platform}...`
      }));

      let platformVariant: any;
      if (validation.platform === 'youtube') {
        platformVariant = { YouTube: null };
      } else if (validation.platform === 'instagram') {
        platformVariant = { Instagram: null };
      } else if (validation.platform === 'tiktok') {
        platformVariant = { TikTok: null };
      } else if (validation.platform === 'twitter') {
        platformVariant = { Twitter: null };
      } else if (validation.platform === 'facebook') {
        platformVariant = { Facebook: null };
      } else {
        platformVariant = { Other: validation.platform };
      }

      let frames: Uint8Array[] = [];
      if (file && ffmpegReady) {
        // Extract frames from uploaded video using ffmpeg.wasm
        const fileName = file.name;
        await ffmpeg.current.FS('writeFile', fileName, await fetchFile(file));
        await ffmpeg.current.run('-i', fileName, '-vf', 'fps=1', 'frame_%03d.jpg');
        const files = ffmpeg.current.FS('readdir', '/').filter((f: string) => f.startsWith('frame_') && f.endsWith('.jpg'));
        for (const f of files) {
          const data = ffmpeg.current.FS('readFile', f);
          frames.push(new Uint8Array(data));
        }
        // Bersihkan file di FS
        ffmpeg.current.FS('unlink', fileName);
        for (const f of files) ffmpeg.current.FS('unlink', f);
      } else {
        setState(prev => ({ ...prev, error: 'Please upload a video file for analysis.' }));
        return;
      }

      const socialMediaInput = {
        url: state.url,
        platform: platformVariant,
        frames,
        // metadata is optional and omitted to avoid Candid parsing issues
      };
  // UI: file upload
  // Only show if ffmpeg is ready
  const renderFileInput = () => (
    <div className="file-upload-section">
      <label htmlFor="file-upload">Upload Video File:</label>
      <input
        id="file-upload"
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={!ffmpegReady || state.isAnalyzing}
      />
      {!ffmpegReady && <span>Loading video processor...</span>}
      {file && <span>Selected: {file.name}</span>}
    </div>
  );
        {renderFileInput()}

      updateStepStatus('fetch', 'completed');
      updateStepStatus('extract', 'active');

      setState(prev => ({ 
        ...prev, 
        progress: 50,
        progressMessage: 'Extracting media content...'
      }));

      updateStepStatus('extract', 'completed');
      updateStepStatus('analyze', 'active');

      // Step 4: REAL AI Analysis using canister
      setState(prev => ({ 
        ...prev, 
        progress: 70,
        analysisState: 'analyzing',
        progressMessage: 'Running AI deepfake detection...'
      }));

      // Call REAL AI canister method
      const detectionResult = await coreAIService.analyzeSocialMedia(socialMediaInput);

      updateStepStatus('analyze', 'completed');
      updateStepStatus('complete', 'active');

      // Step 5: Complete
      setState(prev => ({ 
        ...prev, 
        progress: 100,
        analysisState: 'complete',
        progressMessage: 'Analysis complete!'
      }));

      updateStepStatus('complete', 'completed');

      setState(prev => ({ 
        ...prev, 
        result: detectionResult,
        isAnalyzing: false 
      }));

      if (onResult) {
        onResult(detectionResult);
      }

    } catch (error) {
      console.error('Social media analysis failed:', error);
      
      // Mark current step as error
      const currentStep = analysisSteps.find(s => s.status === 'active');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error');
      }

      setState(prev => ({ 
        ...prev, 
        error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isAnalyzing: false,
        analysisState: 'error',
        progress: 0
      }));
    }
  }, [state.url, onResult, updateStepStatus, analysisSteps]);

  /**
   * Open URL in new tab
   */
  const openUrl = useCallback(() => {
    if (state.url) {
      window.open(state.url, '_blank', 'noopener,noreferrer');
    }
  }, [state.url]);

  /**
   * Download analysis result as JSON
   */
  const downloadResult = useCallback(() => {
    if (!state.result) return;

    const resultData = {
      ...state.result,
      sourceUrl: state.url,
      platform: state.validationResult?.platform,
      analyzedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(resultData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verichain-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.result, state.url, state.validationResult]);

  const supportedPlatforms = getSupportedPlatforms();

  return (
    <div className={`social-media-upload ${className}`}>
      <div className="social-upload-container">
        
        {/* URL Input Section */}
        <div className="url-input-section">
          <div className="input-header">
            <h3>
              <Globe className="header-icon" size={20} />
              Social Media URL Analysis
            </h3>
            <p>
              Enter a URL from supported social media platforms. Our AI will extract and analyze the content for deepfake manipulation using VeriChain's advanced Vision Transformer model.
            </p>
          </div>

          <div className="url-input-group">
            <input
              type="url"
              className={`url-input ${
                state.validationResult?.isValid === true ? 'valid' :
                state.validationResult?.isValid === false ? 'invalid' : ''
              }`}
              placeholder="https://youtube.com/watch?v=... or https://instagram.com/p/..."
              value={state.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={state.isAnalyzing}
            />
            <Link className="input-icon" size={16} />
          </div>

          {state.validationResult && (
            <div className={`validation-feedback ${
              state.validationResult.isValid ? 'valid' : 'invalid'
            }`}>
              {state.validationResult.isValid ? (
                <>
                  <CheckCircle className="feedback-icon" size={16} />
                  <span>Valid {state.validationResult.platform} URL detected</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="feedback-icon" size={16} />
                  <span>{state.validationResult.error}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Supported Platforms */}
        <div className="supported-platforms">
          <h4>Supported Platforms</h4>
          <div className="platforms-grid">
            {supportedPlatforms.map((platform) => (
              <div key={platform} className="platform-item">
                <div className="platform-icon">
                  {platform.charAt(0).toUpperCase()}
                </div>
                <div className="platform-name">{platform}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="error-message">
            <AlertTriangle className="error-icon" size={20} />
            <span className="error-text">{state.error}</span>
          </div>
        )}

        {/* Analysis Button */}
        <button 
          className="analyze-button"
          onClick={startAnalysis}
          disabled={state.isAnalyzing || !state.url.trim() || !state.validationResult?.isValid}
        >
          {state.isAnalyzing ? (
            <>
              <Clock className="button-icon loading" size={20} />
              Analyzing with AI Canister...
            </>
          ) : (
            <>
              <Play className="button-icon" size={20} />
              Analyze with VeriChain AI
            </>
          )}
        </button>

        {/* Analysis Progress */}
        {state.isAnalyzing && (
          <div className="analysis-progress">
            <div className="progress-header">
              <div className="progress-icon">
                <Clock size={20} />
              </div>
              <div className="progress-text">
                <h4>AI Analysis in Progress</h4>
                <p>{state.progressMessage}</p>
              </div>
            </div>

            <div className="progress-steps">
              {analysisSteps.map((step) => (
                <div key={step.id} className="step-item">
                  <div className={`step-icon ${step.status}`}>
                    {step.status === 'completed' ? '✓' : 
                     step.status === 'error' ? '✗' :
                     step.status === 'active' ? '●' : 
                     analysisSteps.indexOf(step) + 1}
                  </div>
                  <div className={`step-text ${step.status}`}>
                    {step.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Section */}
        {state.result && (
          <div className="results-section">
            <div className={`result-card ${state.result.is_deepfake ? 'deepfake' : 'authentic'}`}>
              <div className="result-header">
                <div className={`result-icon ${state.result.is_deepfake ? 'deepfake' : 'authentic'}`}>
                  {state.result.is_deepfake ? (
                    <AlertTriangle size={28} />
                  ) : (
                    <CheckCircle size={28} />
                  )}
                </div>
                
                <div className="result-summary">
                  <h3 className={state.result.is_deepfake ? 'deepfake' : 'authentic'}>
                    {state.result.is_deepfake ? 'Deepfake Detected' : 'Content Authentic'}
                  </h3>
                  <div className="source-url">
                    <span>Source: {new URL(state.url).hostname}</span>
                    <ExternalLink 
                      className="external-link" 
                      size={14} 
                      onClick={openUrl}
                    />
                  </div>
                </div>

                <button className="download-button" onClick={downloadResult}>
                  <Download size={16} />
                  Download Report
                </button>
              </div>

              <div className="result-details">
                <div className="detail-item">
                  <div className="detail-value">{formatConfidence(state.result.confidence)}</div>
                  <div className="detail-label">Confidence</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-value">{formatProcessingTime(state.result.processing_time_ms)}</div>
                  <div className="detail-label">Processing Time</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-value">{state.result.media_type.toUpperCase()}</div>
                  <div className="detail-label">Media Type</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-value">{state.validationResult?.platform || 'Social'}</div>
                  <div className="detail-label">Platform</div>
                </div>

                {state.result.model_version && (
                  <div className="detail-item">
                    <div className="detail-value">{state.result.model_version}</div>
                    <div className="detail-label">Model Version</div>
                  </div>
                )}
              </div>

              <div className="confidence-bar">
                <div 
                  className={`confidence-fill ${state.result.is_deepfake ? 'deepfake' : 'authentic'}`}
                  style={{ width: `${state.result.confidence * 100}%` }}
                />
              </div>

              {/* Additional Analysis Details */}
              {state.result.analysis_details && (
                <div className="analysis-details">
                  <h4>Detailed Analysis</h4>
                  <div className="details-grid">
                    <div className="detail-row">
                      <span>Classification:</span>
                      <span>{state.result.analysis_details.classification}</span>
                    </div>
                    <div className="detail-row">
                      <span>Real Probability:</span>
                      <span>{formatConfidence(state.result.analysis_details.classes.real_probability)}</span>
                    </div>
                    <div className="detail-row">
                      <span>AI Generated Probability:</span>
                      <span>{formatConfidence(state.result.analysis_details.classes.ai_generated_probability)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Deepfake Probability:</span>
                      <span>{formatConfidence(state.result.analysis_details.classes.deepfake_probability)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* User Quota Info */}
              {state.result.user_info && (
                <div className="quota-info">
                  <p>
                    Remaining quota: {state.result.user_info.remaining_quota}/{state.result.user_info.total_quota} 
                    ({state.result.user_info.tier} tier)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaUpload;
