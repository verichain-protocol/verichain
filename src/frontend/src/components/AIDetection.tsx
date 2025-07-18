/**
 * VeriChain AI Detection Component
 * Main interface for deepfake detection using AI model
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, AlertTriangle, CheckCircle, Clock, Eye, Camera, Film } from 'lucide-react';
import { aiService, DetectionResult, formatConfidence, formatProcessingTime, getConfidenceColor, formatFileSize } from '../services/aiService';

interface AIDetectionProps {
  className?: string;
}

type MediaType = 'image' | 'video';
type AnalysisState = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';

interface AnalysisProgress {
  state: AnalysisState;
  progress: number;
  message: string;
}

export const AIDetection: React.FC<AIDetectionProps> = ({ className = '' }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    state: 'idle',
    progress: 0,
    message: ''
  });
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setAnalysisProgress({
        state: 'error',
        progress: 0,
        message: 'Please select a valid image or video file'
      });
      return;
    }

    setSelectedFile(file);
    setMediaType(isImage ? 'image' : 'video');
    setResult(null);
    setAnalysisProgress({ state: 'idle', progress: 0, message: '' });

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Simulate file input event for drag & drop
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        
        const fakeEvent = {
          target: fileInputRef.current
        } as React.ChangeEvent<HTMLInputElement>;
        handleFileSelect(fakeEvent);
      }
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // Start AI analysis
  const startAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setAnalysisProgress({
        state: 'uploading',
        progress: 10,
        message: 'Preparing file for analysis...'
      });

      // Validate file format with AI canister
      const isFormatValid = await aiService.validateFileFormat(selectedFile.name);
      if (!isFormatValid) {
        throw new Error('File format not supported by AI model');
      }

      setAnalysisProgress({
        state: 'analyzing',
        progress: 30,
        message: 'Analyzing with AI model...'
      });

      let analysisResult: DetectionResult;

      if (mediaType === 'image') {
        analysisResult = await aiService.analyzeImage(selectedFile);
      } else {
        // For videos, use the direct video analysis
        // The AI canister will handle frame extraction
        analysisResult = await aiService.analyzeVideo(selectedFile);
      }

      setAnalysisProgress({
        state: 'complete',
        progress: 100,
        message: 'Analysis complete!'
      });

      setResult(analysisResult);

    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisProgress({
        state: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Analysis failed. Please try again.'
      });
    }
  }, [selectedFile, mediaType]);

  // Reset the analysis
  const resetAnalysis = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setPreviewUrl('');
    setAnalysisProgress({ state: 'idle', progress: 0, message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Render analysis results
  const renderResults = () => {
    try {
      console.log('🎨 Rendering results...');
      console.log('📊 Result object:', result);
      
      if (!result) {
        console.log('❌ No result to render');
        return null;
      }

      console.log('🔍 Result properties:', {
        is_deepfake: result.is_deepfake,
        confidence: result.confidence,
        media_type: result.media_type,
        processing_time_ms: result.processing_time_ms,
        metadata: result.metadata
      });

      const confidence = Number(result.confidence) || 0;
      const confidenceColor = getConfidenceColor(confidence, result.is_deepfake);
      console.log('🎨 Confidence color:', confidenceColor);
      
      // Safely parse metadata
      let metadata: any = {};
      try {
        metadata = result.metadata ? JSON.parse(result.metadata) : {};
        console.log('📋 Parsed metadata:', metadata);
        console.log('🎯 Classification:', metadata.classification);
        console.log('🎯 Classes:', metadata.classes);
      } catch (error) {
        console.warn('Failed to parse metadata:', error);
        console.log('Raw metadata string:', result.metadata);
        metadata = {};
      }

      // Get classification info - prioritize metadata classification
      const classification = metadata.classification || 'Real'; // Default to Real if no metadata
      const classConfidence = metadata.class_confidence || confidence;
      const classes = metadata.classes || {
        real_probability: 0.33,
        ai_generated_probability: 0.33,
        deepfake_probability: 0.34
      };
      
      console.log('🏷️ Final classification:', classification);
      console.log('📊 Final classes:', classes);

    return (
      <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          {classification === 'Real' ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : classification === 'Deepfake' ? (
            <AlertTriangle className="w-8 h-8 text-red-500" />
          ) : classification === 'AI-Generated' ? (
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-gray-500" />
          )}
          <div>
            <h3 className="text-xl font-bold">
              {classification === 'Real' ? '✅ Real Content' : 
               classification === 'Deepfake' ? '🚨 Deepfake Detected' : 
               classification === 'AI-Generated' ? '⚠️ AI-Generated Content' :
               '❓ Classification Uncertain'}
            </h3>
            <p className="text-gray-600 text-sm">
              {classification === 'Real' ? 'This appears to be genuine, unaltered media' : 
               classification === 'Deepfake' ? 'This content shows signs of deepfake manipulation' : 
               classification === 'AI-Generated' ? 'This content appears to be AI-generated' :
               'Unable to determine content authenticity'}
            </p>
          </div>
        </div>

        {/* 3-Class Classification Results */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3 text-gray-800">Classification Results</h4>
          <div className="space-y-3">
            {/* Real Probability */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Real Content</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(classes.real_probability || 0) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium min-w-[3rem]">
                  {((classes.real_probability || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* AI Generated Probability */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="font-medium">AI-Generated</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${(classes.ai_generated_probability || 0) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium min-w-[3rem]">
                  {((classes.ai_generated_probability || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Deepfake Probability */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium">Deepfake</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${(classes.deepfake_probability || 0) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium min-w-[3rem]">
                  {((classes.deepfake_probability || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Primary Classification:</span>
              <span className="font-semibold text-gray-900">
                {classification}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Confidence:</span>
              <span 
                className="font-semibold"
                style={{ color: confidenceColor }}
              >
                {formatConfidence(classConfidence)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Processing Time:</span>
              <span className="font-medium">
                {formatProcessingTime(Number(result.processing_time_ms) || 0)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Media Type:</span>
              <span className="font-medium capitalize">
                {(result.media_type || 'Unknown').toString().toLowerCase()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {metadata.detection_method && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Detection Method:</span>
                <span className="font-medium text-sm">
                  {metadata.detection_method}
                </span>
              </div>
            )}

            {result.frames_analyzed && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Frames Analyzed:</span>
                <span className="font-medium">{result.frames_analyzed}</span>
              </div>
            )}

            {metadata.deepfake_percentage && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Deepfake Frames:</span>
                <span className="font-medium">
                  {metadata.deepfake_percentage.toFixed(1)}%
                </span>
              </div>
            )}

            {metadata.file_size_mb && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">File Size:</span>
                <span className="font-medium">
                  {metadata.file_size_mb.toFixed(2)} MB
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Confidence Level</span>
            <span>{formatConfidence(confidence)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${confidence * 100}%`,
                backgroundColor: confidenceColor
              }}
            />
          </div>
        </div>

        {/* Technical Details */}
        {metadata && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
              <pre className="whitespace-pre-wrap text-gray-600">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          </details>
        )}
      </div>
    );
    } catch (error) {
      console.error('Error rendering results:', error);
      return (
        <div className="mt-6 p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Displaying Results</h3>
              <p className="text-red-600">There was an error displaying the analysis results. Please try again.</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                VeriChain AI Detection
              </h1>
              <p className="text-gray-600">
                Advanced deepfake detection using blockchain-powered AI
              </p>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="p-6">
          {!selectedFile && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Upload className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Upload Image or Video
                  </p>
                  <p className="text-gray-600">
                    Drag and drop your file here, or click to browse
                  </p>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Camera className="w-4 h-4" />
                    <span>JPG, PNG</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Film className="w-4 h-4" />
                    <span>MP4, MOV</span>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* File Preview */}
          {selectedFile && previewUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${mediaType === 'image' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {mediaType === 'image' ? (
                      <Camera className="w-5 h-5 text-green-600" />
                    ) : (
                      <Film className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(selectedFile.size)} • {mediaType.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetAnalysis}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Remove
                </button>
              </div>

              {/* Media Preview */}
              <div className="relative max-w-md mx-auto">
                {mediaType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full rounded-lg shadow-md"
                  />
                ) : (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full rounded-lg shadow-md"
                  />
                )}
              </div>
            </div>
          )}

          {/* Analysis Progress */}
          {selectedFile && analysisProgress.state !== 'idle' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                {analysisProgress.state === 'error' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : analysisProgress.state === 'complete' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-500 animate-spin" />
                )}
                <span className="font-medium text-gray-900">
                  {analysisProgress.message}
                </span>
              </div>
              
              {analysisProgress.state !== 'error' && analysisProgress.state !== 'complete' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analysisProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {selectedFile && analysisProgress.state === 'idle' && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={startAnalysis}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Eye className="w-5 h-5" />
                <span>Analyze for Deepfakes</span>
              </button>
            </div>
          )}

          {analysisProgress.state === 'complete' && (
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={resetAnalysis}
                className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Analyze New File
              </button>
            </div>
          )}

          {analysisProgress.state === 'error' && (
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={startAnalysis}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={resetAnalysis}
                className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Select New File
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        {renderResults()}
      </div>
    </div>
  );
};

export default AIDetection;
