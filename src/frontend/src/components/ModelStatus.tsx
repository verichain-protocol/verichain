/**
 * VeriChain AI Model Status Component
 * Professional monitoring and display interface for AI model initialization and health status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader, Info, Database, Zap, Play, SkipForward } from 'lucide-react';
import { coreAIService } from '../services/coreAI.service';
import { modelManagementService } from '../services/modelManagement.service';
import { InitializationStatus } from '../types/ai.types';
import { formatFileSize } from '../utils/uiHelpers';

interface ModelStatusProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface StatusDisplayState {
  loading: boolean;
  error: string;
  isRefreshing: boolean;
}

export const ModelStatus: React.FC<ModelStatusProps> = ({ 
  className = '', 
  autoRefresh = true,
  refreshInterval = 5000 
}) => {
  // State management
  const [status, setStatus] = useState<InitializationStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [displayState, setDisplayState] = useState<StatusDisplayState>({
    loading: true,
    error: '',
    isRefreshing: false
  });

  /**
   * Fetch current status from AI canister
   */
  const fetchStatus = useCallback(async (): Promise<void> => {
    try {
      setDisplayState(prev => ({ ...prev, isRefreshing: true, error: '' }));

      const [statusResult, modelInfoResult] = await Promise.allSettled([
        modelManagementService.getInitializationStatus(),
        coreAIService.getModelInfo().catch(() => null)
      ]);

      // Extract results safely
      const initStatus = statusResult.status === 'fulfilled' ? statusResult.value : null;
      const info = modelInfoResult.status === 'fulfilled' ? modelInfoResult.value : null;

      setStatus(initStatus);
      setModelInfo(info);
      
      setDisplayState(prev => ({ ...prev, loading: false, isRefreshing: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch model status';
      setDisplayState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false, 
        isRefreshing: false 
      }));
      console.error('Status fetch error:', error);
    }
  }, []);

  /**
   * Initialize status on component mount
   */
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Setup automatic status refresh
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStatus]);

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback((): void => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Start model initialization process
   */
  const handleStartInitialization = useCallback(async (): Promise<void> => {
    try {
      setDisplayState(prev => ({ ...prev, error: '' }));
      await modelManagementService.startStreamingInitialization();
      await fetchStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start initialization';
      setDisplayState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [fetchStatus]);

  /**
   * Continue initialization with batch processing
   */
  const handleContinueInitialization = useCallback(async (): Promise<void> => {
    try {
      setDisplayState(prev => ({ ...prev, error: '' }));
      await modelManagementService.continueInitialization(10);
      await fetchStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to continue initialization';
      setDisplayState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [fetchStatus]);

  /**
   * Calculate and format progress percentage
   */
  const getProgressPercentage = useCallback((): number => {
    if (!status || status.total_chunks === 0) return 0;
    return (status.processed_chunks / status.total_chunks) * 100;
  }, [status]);

  /**
   * Render status indicator with appropriate styling
   */
  const renderStatusIndicator = (): JSX.Element | null => {
    if (!status) return null;

    if (status.is_initialized) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Model Ready</span>
        </div>
      );
    }

    if (status.is_streaming) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span className="font-medium">Initializing...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-yellow-600">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">Not Initialized</span>
      </div>
    );
  };

  /**
   * Render initialization progress bar
   */
  const renderProgressBar = (): JSX.Element | null => {
    if (!status || status.total_chunks === 0) return null;

    const progressPercentage = getProgressPercentage();

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Initialization Progress</span>
          <span>{status.processed_chunks}/{status.total_chunks} chunks</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              status.is_initialized ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">
          {progressPercentage.toFixed(1)}% complete
        </div>
      </div>
    );
  };

  /**
   * Render action buttons based on current state
   */
  const renderActionButtons = (): JSX.Element | null => {
    if (!status || status.is_initialized) return null;

    return (
      <div className="pt-4 border-t border-gray-200">
        <div className="flex space-x-3">
          {!status.initialization_started && (
            <button
              onClick={handleStartInitialization}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Start Initialization</span>
            </button>
          )}
          
          {status.is_streaming && (
            <button
              onClick={handleContinueInitialization}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              <span>Continue Loading</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (displayState.loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <Loader className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading model status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">AI Model Status</h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={displayState.isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className={`w-5 h-5 ${displayState.isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Content */}
      <div className="p-4 space-y-4">
        {/* Error Display */}
        {displayState.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-sm">{displayState.error}</span>
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Current Status:</span>
          {renderStatusIndicator()}
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Detailed Information Grid */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Initialization Information */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>Initialization Details</span>
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chunks Processed:</span>
                  <span className="font-medium">{status.processed_chunks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Chunks:</span>
                  <span className="font-medium">{status.total_chunks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Size:</span>
                  <span className="font-medium">
                    {formatFileSize(status.current_size_mb * 1024 * 1024)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Size:</span>
                  <span className="font-medium">
                    {formatFileSize(status.estimated_total_size_mb * 1024 * 1024)}
                  </span>
                </div>
              </div>
            </div>

            {/* Model Information */}
            {modelInfo && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Model Specifications</span>
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{modelInfo.version}</span>
                  </div>
                  {modelInfo.input_size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Input Size:</span>
                      <span className="font-medium">
                        {modelInfo.input_size[0]}×{modelInfo.input_size[1]}
                      </span>
                    </div>
                  )}
                  {modelInfo.max_file_size_mb && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max File Size:</span>
                      <span className="font-medium">{modelInfo.max_file_size_mb}MB</span>
                    </div>
                  )}
                  {modelInfo.confidence_threshold && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Threshold:</span>
                      <span className="font-medium">
                        {(modelInfo.confidence_threshold * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default ModelStatus;
