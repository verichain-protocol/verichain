/**
 * VeriChain AI Detection Component
 * Main interface for deepfake detection using AI canister
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, AlertTriangle, CheckCircle, Eye, Camera, Film, X, Play } from 'lucide-react';
import { coreAIService } from '../services/coreAI.service';
import { DetectionResult, MediaType, AnalysisState } from '../types/ai.types';
import { 
  formatConfidence, 
  formatProcessingTime, 
  formatFileSize 
} from '../utils/uiHelpers';
import './AIDetection.scss';

interface AIDetectionProps {
  className?: string;
  onResult?: (result: DetectionResult) => void;
}

interface AnalysisProgress {
  state: AnalysisState;
  progress: number;
  message: string;
}

export const AIDetection: React.FC<AIDetectionProps> = ({ className = '', onResult }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    state: 'idle',
    progress: 0,
    message: ''
  });
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process selected file
  const processSelectedFile = useCallback((file: File) => {
    // Reset previous states
    setError('');
    setResult(null);
    setAnalysisProgress({ state: 'idle', progress: 0, message: '' });

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setError('Please select a valid image or video file');
      return;
    }

    // Validate file size (2MB max for canister limit)
    const maxSize = 2 * 1024 * 1024; // 2MB to stay under canister limit
    if (file.size > maxSize) {
      setError('File size must be less than 2MB due to canister limitations');
      return;
    }

    // Set file and generate preview
    setSelectedFile(file);
    setMediaType(isImage ? 'image' : 'video');
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processSelectedFile(file);
  }, [processSelectedFile]);

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      processSelectedFile(file);
    }
  }, [processSelectedFile]);

  // Remove selected file
  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    setAnalysisProgress({ state: 'idle', progress: 0, message: '' });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Start analysis
  const startAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setError('');
      setResult(null);
      setAnalysisProgress({
        state: 'processing',
        progress: 10,
        message: 'Preparing file for analysis...'
      });

      // Convert file to array buffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      setAnalysisProgress({
        state: 'processing',
        progress: 30,
        message: 'Uploading to AI canister...'
      });

      // Call AI service with real implementation
      let detectionResult: DetectionResult;
      if (mediaType === 'image') {
        detectionResult = await coreAIService.analyzeImage(uint8Array);
      } else {
        detectionResult = await coreAIService.analyzeVideo(uint8Array);
      }

      setAnalysisProgress({
        state: 'complete',
        progress: 100,
        message: 'Analysis completed!'
      });

      setResult(detectionResult);
      if (onResult) {
        onResult(detectionResult);
      }

    } catch (err) {
      console.error('Analysis failed:', err);
      setError(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setAnalysisProgress({
        state: 'error',
        progress: 0,
        message: 'Analysis failed'
      });
    }
  }, [selectedFile, mediaType, onResult]);

  // Browse files
  const browseFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`ai-detection ${className}`}>
      <div className="detection-container">
        
        {/* Upload Section */}
        <div className="upload-section">
          <div 
            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={browseFiles}
          >
            <div className="upload-icon">
              <Upload size={32} />
            </div>
            
            <div className="upload-text">
              <h3>Upload Media for Analysis</h3>
              <p>
                Drag and drop your image or video here, or click to browse files.
                Our AI will analyze the content for deepfake manipulation.
              </p>
              
              <div className="supported-formats">
                <span className="format-tag">JPG</span>
                <span className="format-tag">PNG</span>
                <span className="format-tag">MP4</span>
                <span className="format-tag">WEBM</span>
                <span className="format-tag">MOV</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="file-input"
              accept="image/*,video/*"
              onChange={handleFileSelect}
            />
          </div>

          <button className="browse-button" onClick={browseFiles}>
            Browse Files
          </button>
        </div>

        {/* File Preview */}
        {selectedFile && (
          <div className="file-preview">
            <div className="preview-header">
              <div className="file-info">
                <div className="file-icon">
                  {mediaType === 'image' ? <Camera size={20} /> : <Film size={20} />}
                </div>
                <div className="file-details">
                  <h4>{selectedFile.name}</h4>
                  <p>{formatFileSize(selectedFile.size)} • {mediaType.toUpperCase()}</p>
                </div>
              </div>
              
              <button className="remove-button" onClick={removeFile}>
                <X size={20} />
              </button>
            </div>

            <div className="preview-content">
              <div className="media-preview">
                {mediaType === 'image' ? (
                  <img src={previewUrl} alt="Preview" />
                ) : (
                  <video src={previewUrl} controls />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertTriangle className="error-icon" size={20} />
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Analysis Section */}
        {selectedFile && (
          <div className="analysis-section">
            {analysisProgress.state !== 'idle' && analysisProgress.state !== 'error' && (
              <div className="analysis-progress">
                <div className="progress-header">
                  <div className="progress-icon">
                    <Eye size={20} />
                  </div>
                  <div className="progress-text">
                    <h4>AI Analysis in Progress</h4>
                    <p>{analysisProgress.message}</p>
                  </div>
                </div>
                
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${analysisProgress.progress}%` }}
                  />
                </div>
                
                <div className="progress-percentage">
                  {Math.round(analysisProgress.progress)}%
                </div>
              </div>
            )}

            {analysisProgress.state === 'idle' && (
              <button 
                className="analyze-button"
                onClick={startAnalysis}
                disabled={!selectedFile}
              >
                <Play size={20} />
                Start AI Analysis
              </button>
            )}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="results-section">
            <div className={`result-card ${result.is_deepfake ? 'deepfake' : 'authentic'}`}>
              <div className="result-header">
                <div className={`result-icon ${result.is_deepfake ? 'deepfake' : 'authentic'}`}>
                  {result.is_deepfake ? (
                    <AlertTriangle size={28} />
                  ) : (
                    <CheckCircle size={28} />
                  )}
                </div>
                
                <div className="result-summary">
                  <h3 className={result.is_deepfake ? 'deepfake' : 'authentic'}>
                    {result.is_deepfake ? 'Deepfake Detected' : 'Content Authentic'}
                  </h3>
                  <div className="confidence-score">
                    Confidence: {formatConfidence(result.confidence)}
                  </div>
                </div>
                
                <div className={`result-badge ${result.is_deepfake ? 'deepfake' : 'authentic'}`}>
                  {result.is_deepfake ? 'Manipulated' : 'Original'}
                </div>
              </div>

              <div className="result-details">
                <div className="detail-item">
                  <div className="detail-value">{formatConfidence(result.confidence)}</div>
                  <div className="detail-label">Confidence</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-value">{formatProcessingTime(result.processing_time_ms)}</div>
                  <div className="detail-label">Processing Time</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-value">{result.media_type.toUpperCase()}</div>
                  <div className="detail-label">Media Type</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-value">{result.model_version}</div>
                  <div className="detail-label">Model Version</div>
                </div>
              </div>

              <div className="confidence-bar">
                <div 
                  className={`confidence-fill ${result.is_deepfake ? 'deepfake' : 'authentic'}`}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDetection;
