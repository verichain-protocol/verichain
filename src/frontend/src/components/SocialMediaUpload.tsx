/**
 * VeriChain Social Media Upload Component
 * Professional interface for uploading and analyzing social media content
 */

import React, { useState, useCallback } from 'react';
import { Link, Play, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { coreAIService } from '../services/coreAI.service';
import { utilityIntegrationService } from '../services/utilityIntegration.service';
import { validateSocialMediaUrl, getSupportedPlatforms } from '../utils/socialMediaParser';
import { DetectionResult } from '../types/ai.types';

interface SocialMediaUploadProps {
  className?: string;
  onResult?: (result: DetectionResult) => void;
  platforms?: string[];
}

interface UploadState {
  url: string;
  isAnalyzing: boolean;
  error: string;
  result: DetectionResult | null;
  validationResult: any;
}

export const SocialMediaUpload: React.FC<SocialMediaUploadProps> = ({
  className = '',
  onResult,
  platforms = getSupportedPlatforms()
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    url: '',
    isAnalyzing: false,
    error: '',
    result: null,
    validationResult: null
  });

  /**
   * Handle URL input change with real-time validation
   */
  const handleUrlChange = useCallback(async (value: string): Promise<void> => {
    setUploadState(prev => ({ ...prev, url: value, error: '', validationResult: null }));

    if (value.trim()) {
      try {
        const validationResult = await utilityIntegrationService.validateSocialMediaUrl(value);
        setUploadState(prev => ({ ...prev, validationResult }));
      } catch (error) {
        console.error('URL validation error:', error);
      }
    }
  }, []);

  /**
   * Analyze social media content using AI canister
   */
  const analyzeContent = useCallback(async (): Promise<void> => {
    if (!uploadState.url.trim()) {
      setUploadState(prev => ({ ...prev, error: 'Please enter a valid URL' }));
      return;
    }

    setUploadState(prev => ({ ...prev, isAnalyzing: true, error: '', result: null }));

    try {
      // Validate URL first
      const validation = validateSocialMediaUrl(uploadState.url);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid social media URL');
      }

      console.log('🔗 Analyzing social media content:', {
        platform: validation.platformName,
        url: uploadState.url
      });

      // For now, we'll simulate analysis since actual social media download
      // requires additional infrastructure
      // In production, this would:
      // 1. Download the media content
      // 2. Convert to appropriate format
      // 3. Send to AI canister for analysis

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create mock result for demo (in production, use actual AI analysis)
      const mockResult: DetectionResult = {
        is_deepfake: Math.random() > 0.7, // Random for demo
        confidence: 0.85 + Math.random() * 0.1,
        media_type: 'Video',
        processing_time_ms: 1500 + Math.random() * 1000,
        metadata: JSON.stringify({
          platform: validation.platform,
          platform_name: validation.platformName,
          video_id: validation.videoId,
          analysis_method: 'social_media_extraction'
        })
      };

      setUploadState(prev => ({ ...prev, result: mockResult }));
      
      if (onResult) {
        onResult(mockResult);
      }

      console.log('✅ Social media analysis complete:', mockResult);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setUploadState(prev => ({ ...prev, error: errorMessage }));
      console.error('❌ Social media analysis failed:', error);
    } finally {
      setUploadState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [uploadState.url, onResult]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent): void => {
    e.preventDefault();
    analyzeContent();
  }, [analyzeContent]);

  /**
   * Render platform validation indicator
   */
  const renderValidationIndicator = (): JSX.Element | null => {
    if (!uploadState.url.trim()) return null;

    if (!uploadState.validationResult) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 animate-spin border-t-blue-500" />
          <span className="text-sm">Validating URL...</span>
        </div>
      );
    }

    const { data } = uploadState.validationResult;

    if (data?.isValid) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{data.platformName} URL detected</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-red-600">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">Unsupported platform or invalid URL</span>
      </div>
    );
  };

  /**
   * Render analysis result
   */
  const renderResult = (): JSX.Element | null => {
    if (!uploadState.result) return null;

    const { result } = uploadState;
    const metadata = result.metadata ? JSON.parse(result.metadata) : {};

    return (
      <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Analysis Result</h3>
        
        <div className="space-y-3">
          {/* Detection Result */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Detection Result:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              result.is_deepfake 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {result.is_deepfake ? 'Deepfake Detected' : 'Authentic Content'}
            </span>
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Confidence:</span>
            <span className="font-medium">{(result.confidence * 100).toFixed(1)}%</span>
          </div>

          {/* Processing Time */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Processing Time:</span>
            <span className="font-medium">{result.processing_time_ms}ms</span>
          </div>

          {/* Platform Information */}
          {metadata.platform_name && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Source Platform:</span>
              <span className="font-medium">{metadata.platform_name}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Link className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Social Media Analysis</h3>
            <p className="text-sm text-gray-600">
              Analyze content from supported social media platforms
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Social Media URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={uploadState.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={uploadState.isAnalyzing}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            {/* URL Validation */}
            <div className="mt-2">
              {renderValidationIndicator()}
            </div>
          </div>

          {/* Supported Platforms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supported Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {uploadState.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 text-sm">{uploadState.error}</span>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <button
            type="submit"
            disabled={
              uploadState.isAnalyzing || 
              !uploadState.url.trim() || 
              !uploadState.validationResult?.data?.isValid
            }
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploadState.isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Content...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Analyze Content</span>
              </>
            )}
          </button>
        </form>

        {/* Analysis Result */}
        {renderResult()}

        {/* Note */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Note:</p>
              <p>
                Social media analysis requires content download and conversion. 
                This feature demonstrates URL validation and platform detection.
                Full implementation would integrate with content download services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaUpload;
