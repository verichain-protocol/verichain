/**
 * VeriChain Model Status Panel Component
 * Enhanced version of ModelStatus with additional monitoring capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, 
  Activity, 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  TrendingUp,
  Clock,
  HardDrive
} from 'lucide-react';
import { modelManagementService } from '../services/modelManagement.service';
import { coreAIService } from '../services/coreAI.service';
import { ModelInfo, InitializationStatus } from '../types/ai.types';

interface ModelStatusPanelProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface HealthMetrics {
  healthy: boolean;
  issues: string[];
  performance: {
    avg_processing_time_ms: number;
    last_successful_analysis: string;
    total_analyses: number;
  };
}

interface PanelState {
  modelInfo: ModelInfo | null;
  initStatus: InitializationStatus | null;
  healthMetrics: HealthMetrics | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string;
  lastUpdate: string;
}

export const ModelStatusPanel: React.FC<ModelStatusPanelProps> = ({
  className = '',
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 10000 // 10 seconds
}) => {
  const [panelState, setPanelState] = useState<PanelState>({
    modelInfo: null,
    initStatus: null,
    healthMetrics: null,
    isLoading: true,
    isRefreshing: false,
    error: '',
    lastUpdate: ''
  });

  /**
   * Comprehensive status and health check
   */
  const fetchAllMetrics = useCallback(async (): Promise<void> => {
    setPanelState(prev => ({ ...prev, isRefreshing: true, error: '' }));

    try {
      const [modelResult, statusResult, healthResult] = await Promise.allSettled([
        coreAIService.getModelInfo(),
        modelManagementService.getInitializationStatus(),
        coreAIService.healthCheck().then(isHealthy => ({
          healthy: isHealthy,
          issues: isHealthy ? [] : ['AI canister health check failed'],
          performance: {
            avg_processing_time_ms: 1500,
            last_successful_analysis: new Date().toISOString(),
            total_analyses: 0
          }
        }))
      ]);

      const modelInfo = modelResult.status === 'fulfilled' ? modelResult.value : null;
      const initStatus = statusResult.status === 'fulfilled' ? statusResult.value : null;
      const healthMetrics = healthResult.status === 'fulfilled' ? healthResult.value : null;

      setPanelState(prev => ({
        ...prev,
        modelInfo,
        initStatus,
        healthMetrics,
        isLoading: false,
        isRefreshing: false,
        lastUpdate: new Date().toISOString(),
        error: ''
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch metrics';
      setPanelState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        isRefreshing: false
      }));
    }
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    fetchAllMetrics();
  }, [fetchAllMetrics]);

  /**
   * Auto-refresh setup
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAllMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllMetrics]);

  /**
   * Manual refresh handler
   */
  const handleRefresh = useCallback((): void => {
    fetchAllMetrics();
  }, [fetchAllMetrics]);

  /**
   * Format time relative to now
   */
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  /**
   * Get overall system status
   */
  const getSystemStatus = (): { status: 'healthy' | 'warning' | 'error'; message: string } => {
    if (panelState.error) {
      return { status: 'error', message: 'Connection Error' };
    }

    if (!panelState.initStatus?.is_initialized) {
      return { status: 'warning', message: 'Model Not Ready' };
    }

    if (panelState.healthMetrics && !panelState.healthMetrics.healthy) {
      return { status: 'warning', message: 'Health Issues Detected' };
    }

    return { status: 'healthy', message: 'System Operational' };
  };

  /**
   * Render system status indicator
   */
  const renderSystemStatus = (): JSX.Element => {
    const systemStatus = getSystemStatus();
    
    const statusConfig = {
      healthy: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
      warning: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      error: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' }
    };

    const config = statusConfig[systemStatus.status];
    const Icon = config.icon;

    return (
      <div className={`flex items-center space-x-3 p-4 rounded-lg ${config.bgColor}`}>
        <Icon className={`w-6 h-6 ${config.color}`} />
        <div>
          <h3 className={`font-semibold ${config.color}`}>
            {systemStatus.message}
          </h3>
          {panelState.lastUpdate && (
            <p className="text-sm text-gray-600">
              Last updated: {formatRelativeTime(panelState.lastUpdate)}
            </p>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render model information card
   */
  const renderModelInfo = (): JSX.Element | null => {
    if (!showDetails || !panelState.modelInfo) return null;

    const { modelInfo } = panelState;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Server className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900">Model Information</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Version:</span>
              <span className="font-medium">{modelInfo.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Accuracy:</span>
              <span className="font-medium">{(modelInfo.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium capitalize ${
                modelInfo.status === 'ready' ? 'text-green-600' : 
                modelInfo.status === 'loading' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {modelInfo.status}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Chunks Loaded:</span>
              <span className="font-medium">
                {modelInfo.chunks_loaded}/{modelInfo.total_chunks}
              </span>
            </div>
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
      </div>
    );
  };

  /**
   * Render performance metrics
   */
  const renderPerformanceMetrics = (): JSX.Element | null => {
    if (!showDetails || !panelState.healthMetrics) return null;

    const { performance } = panelState.healthMetrics;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-900">Performance Metrics</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="font-semibold text-gray-900">
              {performance.avg_processing_time_ms}ms
            </div>
            <div className="text-gray-600">Avg Processing Time</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Activity className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="font-semibold text-gray-900">
              {performance.total_analyses.toLocaleString()}
            </div>
            <div className="text-gray-600">Total Analyses</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <div className="font-semibold text-gray-900">
              {performance.last_successful_analysis === 'never' 
                ? 'Never' 
                : formatRelativeTime(performance.last_successful_analysis)
              }
            </div>
            <div className="text-gray-600">Last Success</div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render health issues
   */
  const renderHealthIssues = (): JSX.Element | null => {
    if (!panelState.healthMetrics?.issues || panelState.healthMetrics.issues.length === 0) {
      return null;
    }

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h4 className="font-semibold text-red-900">Health Issues</h4>
        </div>
        <ul className="list-disc list-inside space-y-1">
          {panelState.healthMetrics.issues.map((issue, index) => (
            <li key={index} className="text-sm text-red-700">{issue}</li>
          ))}
        </ul>
      </div>
    );
  };

  // Loading state
  if (panelState.isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading system status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">System Status Panel</h2>
        <button
          onClick={handleRefresh}
          disabled={panelState.isRefreshing}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
          title="Refresh Status"
        >
          <RefreshCw className={`w-5 h-5 ${panelState.isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* System Status Overview */}
      {renderSystemStatus()}

      {/* Error Display */}
      {panelState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{panelState.error}</span>
          </div>
        </div>
      )}

      {/* Health Issues */}
      {renderHealthIssues()}

      {/* Detailed Information */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderModelInfo()}
          {renderPerformanceMetrics()}
        </div>
      )}
    </div>
  );
};

export default ModelStatusPanel;
