/**
 * VeriChain Diagnostic Panel Component
 * Professional interface for displaying performance metrics, validation results, and system diagnostics
 */

import React, { useState, useEffect } from 'react';
import { Activity, Shield, Hash, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { utilityIntegrationService } from '../services/utilityIntegration.service';
import { UtilityPerformanceMetrics } from '../types/utility.types';

interface DiagnosticPanelProps {
  className?: string;
  showPerformance?: boolean;
  showValidation?: boolean;
  showHash?: boolean;
  file?: File | null;
}

interface DiagnosticData {
  performance: UtilityPerformanceMetrics | null;
  validation: any | null;
  hash: any | null;
  lastUpdate: string;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  className = '',
  showPerformance = true,
  showValidation = true,
  showHash = true,
  file = null
}) => {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData>({
    performance: null,
    validation: null,
    hash: null,
    lastUpdate: ''
  });
  const [isRunning, setIsRunning] = useState(false);

  /**
   * Run comprehensive diagnostics
   */
  const runDiagnostics = async (targetFile?: File): Promise<void> => {
    if (!targetFile) return;

    setIsRunning(true);
    try {
      const results: Partial<DiagnosticData> = {
        lastUpdate: new Date().toISOString()
      };

      // Run validation diagnostics
      if (showValidation) {
        const validationResult = await utilityIntegrationService.validateFile(targetFile, {
          maxSize: 100 * 1024 * 1024, // 100MB
          requireSignature: true
        });
        results.validation = validationResult;
        results.performance = validationResult.performance || null;
      }

      // Run hash diagnostics
      if (showHash) {
        const hashResult = await utilityIntegrationService.hashFile(targetFile);
        results.hash = hashResult;
        if (!results.performance) {
          results.performance = hashResult.performance || null;
        }
      }

      setDiagnosticData(prev => ({ ...prev, ...results }));
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Auto-run diagnostics when file changes
   */
  useEffect(() => {
    if (file) {
      runDiagnostics(file);
    }
  }, [file]);

  /**
   * Format duration in milliseconds
   */
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  /**
   * Format bytes to human readable
   */
  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  /**
   * Render performance metrics section
   */
  const renderPerformanceMetrics = (): JSX.Element | null => {
    if (!showPerformance || !diagnosticData.performance) return null;

    const { performance } = diagnosticData;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Performance Metrics</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Duration:</span>
              <span className="font-medium">{formatDuration(performance.duration_ms)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Start Time:</span>
              <span className="font-medium">
                {new Date(performance.start_time).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">End Time:</span>
              <span className="font-medium">
                {new Date(performance.end_time).toLocaleTimeString()}
              </span>
            </div>
            {performance.memory_peak && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Peak Memory:</span>
                <span className="font-medium">{formatBytes(performance.memory_peak)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Checkpoints:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {performance.checkpoints.map((checkpoint, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-600 truncate">{checkpoint.label}:</span>
                  <span className="font-medium ml-2">
                    {formatDuration(checkpoint.timestamp - performance.start_time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render validation results section
   */
  const renderValidationResults = (): JSX.Element | null => {
    if (!showValidation || !diagnosticData.validation) return null;

    const { validation } = diagnosticData;
    const { data } = validation;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Shield className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Validation Results</h3>
        </div>

        <div className="space-y-3">
          {/* Overall Status */}
          <div className="flex items-center space-x-2">
            {data?.isValid ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">File validation passed</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-medium">File validation failed</span>
              </>
            )}
          </div>

          {/* Canister Validation */}
          {data?.canisterValidation !== undefined && (
            <div className="flex items-center space-x-2">
              {data.canisterValidation ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-700">AI Canister validation passed</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">AI Canister validation failed</span>
                </>
              )}
            </div>
          )}

          {/* Validation Errors */}
          {data?.errors && data.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Issues Found:</h4>
              <div className="space-y-1">
                {data.errors.map((error: any, index: number) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-red-700">{error.code}:</span>
                      <span className="text-red-600 ml-1">{error.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render hash analysis section
   */
  const renderHashAnalysis = (): JSX.Element | null => {
    if (!showHash || !diagnosticData.hash) return null;

    const { hash } = diagnosticData;
    const { data } = hash;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Hash className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Hash Analysis</h3>
        </div>

        <div className="space-y-3">
          {/* File Hash */}
          <div>
            <label className="text-sm font-medium text-gray-700">File SHA-256:</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border text-xs font-mono break-all">
              {data?.fileHash}
            </div>
          </div>

          {/* Chunk Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Chunks:</span>
              <span className="font-medium">{data?.totalChunks || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chunk Hashes:</span>
              <span className="font-medium">{data?.chunkHashes?.length || 0}</span>
            </div>
          </div>

          {/* First few chunk hashes */}
          {data?.chunkHashes && data.chunkHashes.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Chunk Hashes (first 3):
              </label>
              <div className="mt-1 space-y-1">
                {data.chunkHashes.slice(0, 3).map((chunkHash: string, index: number) => (
                  <div key={index} className="p-2 bg-gray-50 rounded border text-xs font-mono break-all">
                    #{index + 1}: {chunkHash}
                  </div>
                ))}
                {data.chunkHashes.length > 3 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    ... and {data.chunkHashes.length - 3} more chunks
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render status indicator
   */
  const renderStatusIndicator = (): JSX.Element => {
    if (isRunning) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <Clock className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Running diagnostics...</span>
        </div>
      );
    }

    if (diagnosticData.lastUpdate) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">
            Last updated: {new Date(diagnosticData.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Info className="w-4 h-4" />
        <span className="text-sm">Upload a file to run diagnostics</span>
      </div>
    );
  };

  if (!file) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center">
          <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No file selected for diagnostics</p>
          <p className="text-sm text-gray-500">Upload a file to see detailed analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">File Diagnostics</h2>
          {renderStatusIndicator()}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Analyzing: {file.name} ({formatBytes(file.size)})
        </p>
      </div>

      {/* Diagnostic Sections */}
      {renderPerformanceMetrics()}
      {renderValidationResults()}
      {renderHashAnalysis()}
    </div>
  );
};

export default DiagnosticPanel;
