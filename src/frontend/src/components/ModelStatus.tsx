/**
 * VeriChain AI Model Status Component
 * Monitors and displays AI model initialization and health status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader, Info, Database, Zap } from 'lucide-react';
import { aiService, InitializationStatus, formatFileSize } from '../services/aiService';

interface ModelStatusProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const ModelStatus: React.FC<ModelStatusProps> = ({ 
  className = '', 
  autoRefresh = true,
  refreshInterval = 5000 
}) => {
  const [status, setStatus] = useState<InitializationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<any>(null);

  // Fetch status from AI canister
  const fetchStatus = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError('');

      const [initStatus, info, stats] = await Promise.all([
        aiService.getInitializationStatus(),
        aiService.getModelInfo().catch(() => null),
        aiService.getLoadingStats().catch(() => null)
      ]);

      setStatus(initStatus);
      setModelInfo(info);
      setLoadingStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch model status';
      setError(errorMessage);
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initialize status on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-refresh status
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchStatus]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Start model initialization
  const startInitialization = useCallback(async () => {
    try {
      setError('');
      await aiService.startStreamingInitialization();
      await fetchStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start initialization';
      setError(errorMessage);
    }
  }, [fetchStatus]);

  // Continue initialization batch
  const continueInitialization = useCallback(async () => {
    try {
      setError('');
      await aiService.continueInitialization(10); // Process 10 chunks at a time
      await fetchStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to continue initialization';
      setError(errorMessage);
    }
  }, [fetchStatus]);

  // Render status indicators
  const renderStatusIndicator = () => {
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

  // Render progress bar
  const renderProgress = () => {
    if (!status || status.total_chunks === 0) return null;

    const progressPercentage = (status.processed_chunks / status.total_chunks) * 100;

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

  if (loading) {
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
      {/* Header */}
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
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Content */}
      <div className="p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Current Status:</span>
          {renderStatusIndicator()}
        </div>

        {/* Progress */}
        {renderProgress()}

        {/* Model Statistics */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>Initialization Info</span>
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chunks Processed:</span>
                  <span className="font-medium">{status.processed_chunks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Chunks:</span>
                  <span className="font-medium">{status.total_chunks}</span>
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

            {modelInfo && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Model Info</span>
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{modelInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Input Size:</span>
                    <span className="font-medium">
                      {modelInfo.input_size[0]}×{modelInfo.input_size[1]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max File Size:</span>
                    <span className="font-medium">{modelInfo.max_file_size_mb}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Threshold:</span>
                    <span className="font-medium">
                      {(modelInfo.confidence_threshold * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {status && !status.is_initialized && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              {!status.initialization_started && (
                <button
                  onClick={startInitialization}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Initialization
                </button>
              )}
              
              {status.is_streaming && (
                <button
                  onClick={continueInitialization}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue Loading
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Statistics */}
        {loadingStats && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Loading Statistics
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
              <pre className="whitespace-pre-wrap text-gray-600">
                {JSON.stringify(loadingStats, null, 2)}
              </pre>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default ModelStatus;
