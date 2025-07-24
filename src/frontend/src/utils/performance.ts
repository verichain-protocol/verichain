/// VeriChain Frontend Performance Utilities
/// Using AI canister performance monitoring

import { PerformanceCheckpoint, UtilityPerformanceMetrics } from '../types/utility.types';

export class PerformanceMonitor {
  private startTime: number;
  private checkpoints: PerformanceCheckpoint[] = [];
  private memoryBaseline: number;

  constructor() {
    this.startTime = performance.now();
    this.memoryBaseline = this.getMemoryUsage();
  }

  /**
   * Add a performance checkpoint
   */
  checkpoint(label: string): void {
    const checkpoint: PerformanceCheckpoint = {
      label,
      timestamp: performance.now(),
      memory: this.getMemoryUsage()
    };
    this.checkpoints.push(checkpoint);
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Get performance report
   */
  getReport(): UtilityPerformanceMetrics {
    const endTime = performance.now();
    return {
      start_time: this.startTime,
      end_time: endTime,
      duration_ms: endTime - this.startTime,
      checkpoints: this.checkpoints,
      memory_peak: Math.max(...this.checkpoints.map(c => c.memory || 0))
    };
  }

  /**
   * Get total execution time
   */
  getTotalTime(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Get time between checkpoints
   */
  getCheckpointDurations(): Array<{ label: string; duration: number }> {
    const durations: Array<{ label: string; duration: number }> = [];
    
    for (let i = 0; i < this.checkpoints.length; i++) {
      const current = this.checkpoints[i];
      const previous = i === 0 ? { timestamp: this.startTime } : this.checkpoints[i - 1];
      
      durations.push({
        label: current.label,
        duration: current.timestamp - previous.timestamp
      });
    }
    
    return durations;
  }

  /**
   * Reset monitor
   */
  reset(): void {
    this.startTime = performance.now();
    this.checkpoints = [];
    this.memoryBaseline = this.getMemoryUsage();
  }
}

/**
 * Utility functions for performance tracking (mirrors AI canister)
 */
export const trackAsyncOperation = async <T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; metrics: UtilityPerformanceMetrics }> => {
  const monitor = new PerformanceMonitor();
  monitor.checkpoint(`${label} - Start`);
  
  try {
    const result = await operation();
    monitor.checkpoint(`${label} - Complete`);
    
    return {
      result,
      metrics: monitor.getReport()
    };
  } catch (error) {
    monitor.checkpoint(`${label} - Error`);
    throw error;
  }
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: number | undefined;
  return ((...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};
