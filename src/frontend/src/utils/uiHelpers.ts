/// VeriChain UI Utilities
/// Formatting and display utilities for the frontend

/**
 * Format confidence as percentage
 */
export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(1)}%`;
};

/**
 * Format processing time
 */
export const formatProcessingTime = (timeMs: number): string => {
  if (timeMs < 1000) {
    return `${timeMs}ms`;
  }
  return `${(timeMs / 1000).toFixed(1)}s`;
};

/**
 * Get confidence color based on value and detection result
 */
export const getConfidenceColor = (confidence: number, isDeepfake: boolean): string => {
  const confidencePercent = confidence * 100;
  
  if (isDeepfake) {
    // For deepfake detection, higher confidence is more concerning
    if (confidencePercent >= 90) return 'text-red-600';
    if (confidencePercent >= 70) return 'text-orange-500';
    return 'text-yellow-500';
  } else {
    // For real content, higher confidence is better
    if (confidencePercent >= 90) return 'text-green-600';
    if (confidencePercent >= 70) return 'text-blue-500';
    return 'text-gray-500';
  }
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get status icon based on analysis state
 */
export const getStatusIcon = (state: string) => {
  switch (state) {
    case 'complete':
      return '✅';
    case 'error':
      return '❌';
    case 'analyzing':
    case 'uploading':
      return '🔄';
    default:
      return '⏳';
  }
};

/**
 * Get detection badge class
 */
export const getDetectionBadgeClass = (isDeepfake: boolean, confidence: number): string => {
  const baseClass = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
  const confidencePercent = confidence * 100;
  
  if (isDeepfake) {
    if (confidencePercent >= 90) return `${baseClass} bg-red-100 text-red-800`;
    if (confidencePercent >= 70) return `${baseClass} bg-orange-100 text-orange-800`;
    return `${baseClass} bg-yellow-100 text-yellow-800`;
  } else {
    if (confidencePercent >= 90) return `${baseClass} bg-green-100 text-green-800`;
    if (confidencePercent >= 70) return `${baseClass} bg-blue-100 text-blue-800`;
    return `${baseClass} bg-gray-100 text-gray-800`;
  }
};
