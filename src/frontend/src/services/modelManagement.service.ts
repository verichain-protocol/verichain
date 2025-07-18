/**
 * VeriChain Model Management Service
 * Professional service for handling AI model initialization, status monitoring, and lifecycle management
 */

import { coreAIService } from './coreAI.service';
import { ModelInfo, InitializationStatus } from '../types/ai.types';

export interface UploadStatus {
  chunks_uploaded: number;
  total_chunks: number;
  upload_complete: boolean;
  last_chunk_uploaded?: number;
}

export interface ModelHealthStatus {
  healthy: boolean;
  issues: string[];
  performance: {
    avg_processing_time_ms: number;
    last_successful_analysis: string;
    total_analyses: number;
  };
}

export class ModelManagementService {
  private statusCheckInterval: NodeJS.Timeout | null = null;
  private readonly STATUS_CHECK_INTERVAL = 5000; // 5 seconds
  private readonly DEFAULT_BATCH_SIZE = 10;
  private readonly EXPECTED_MODEL_SIZE_MB = 327;

  /**
   * Initialize the AI model on application startup
   * @returns Promise<boolean> - True if initialization was successful or model is already ready
   */
  async initializeModel(): Promise<boolean> {
    try {
      console.log('Initializing AI model...');
      
      const isHealthy = await coreAIService.healthCheck();
      if (!isHealthy) {
        console.error('AI canister health check failed');
        return false;
      }

      const status = await this.getInitializationStatus();
      if (status.is_initialized) {
        console.log('Model is already initialized and ready');
        return true;
      }

      console.log('Model requires initialization, starting streaming process...');
      await this.startStreamingInitialization();
      return true;
    } catch (error) {
      console.error('Model initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current model status and information
   * @returns Promise<ModelInfo> - Current model status
   */
  async getModelStatus(): Promise<ModelInfo> {
    return await coreAIService.getModelInfo();
  }

  /**
   * Get detailed initialization status from the AI canister
   * @returns Promise<InitializationStatus> - Current initialization state
   */
  async getInitializationStatus(): Promise<InitializationStatus> {
    try {
      const actor = (coreAIService as any).actor;
      if (!actor) {
        throw new Error('AI service actor not available');
      }

      const status = await actor.get_initialization_status();
      
      return {
        is_initialized: Boolean(status.is_initialized),
        is_streaming: Boolean(status.is_streaming),
        processed_chunks: Number(status.processed_chunks) || 0,
        total_chunks: Number(status.total_chunks) || 0,
        current_size_mb: Number(status.current_size_mb) || 0,
        estimated_total_size_mb: Number(status.estimated_total_size_mb) || this.EXPECTED_MODEL_SIZE_MB,
        initialization_started: Boolean(status.initialization_started)
      };
    } catch (error) {
      console.error('Failed to retrieve initialization status:', error);
      return this.getDefaultInitializationStatus();
    }
  }

  /**
   * Start the streaming initialization process
   * @returns Promise<void>
   */
  async startStreamingInitialization(): Promise<void> {
    try {
      const actor = (coreAIService as any).actor;
      if (!actor) {
        throw new Error('AI service actor not available');
      }

      await actor.initialize_model_from_chunks();
      console.log('Streaming initialization started successfully');
    } catch (error) {
      console.error('Failed to start streaming initialization:', error);
      throw new Error(`Streaming initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Continue model initialization with batch processing
   * @param batchSize - Number of chunks to process in this batch
   * @returns Promise<[number, number]> - [processed_chunks, total_chunks]
   */
  async continueInitialization(batchSize: number = this.DEFAULT_BATCH_SIZE): Promise<[number, number]> {
    try {
      const actor = (coreAIService as any).actor;
      if (!actor) {
        throw new Error('AI service actor not available');
      }

      const result = await actor.continue_model_initialization([batchSize]);
      const [processed, total] = result;
      
      console.log(`Processed batch: ${processed}/${total} chunks (${((processed / total) * 100).toFixed(1)}% complete)`);
      return result;
    } catch (error) {
      console.error('Failed to continue initialization:', error);
      throw new Error(`Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get loading statistics from the AI canister
   * @returns Promise<any> - Loading statistics
   */
  async getLoadingStats(): Promise<any> {
    try {
      const actor = (coreAIService as any).actor;
      if (!actor) {
        throw new Error('AI service actor not available');
      }

      const stats = await actor.get_loading_stats();
      console.log('Retrieved loading statistics:', stats);
      return stats;
    } catch (error) {
      console.error('Failed to retrieve loading statistics:', error);
      throw new Error(`Loading statistics retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive model information
   * @returns Promise<any> - Model information
   */
  async getModelInfo(): Promise<any> {
    return await coreAIService.getModelInfo();
  }

  /**
   * Start automatic status monitoring with callback
   * @param callback - Function to call with updated status
   */
  startStatusMonitoring(callback: (status: ModelInfo) => void): void {
    if (this.statusCheckInterval) {
      this.stopStatusMonitoring();
    }

    this.statusCheckInterval = setInterval(async () => {
      try {
        const status = await this.getModelStatus();
        callback(status);
      } catch (error) {
        console.error('Status monitoring error:', error);
      }
    }, this.STATUS_CHECK_INTERVAL);

    console.log('Status monitoring started');
  }

  /**
   * Stop automatic status monitoring
   */
  stopStatusMonitoring(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
      console.log('Status monitoring stopped');
    }
  }

  /**
   * Perform comprehensive health check
   * @returns Promise<ModelHealthStatus> - Health status with details
   */
  async performHealthCheck(): Promise<ModelHealthStatus> {
    try {
      const isHealthy = await coreAIService.healthCheck();
      
      return {
        healthy: isHealthy,
        issues: isHealthy ? [] : ['AI canister not responding'],
        performance: {
          avg_processing_time_ms: 1500, // This would be tracked over time
          last_successful_analysis: new Date().toISOString(),
          total_analyses: 0 // This would be tracked over time
        }
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        healthy: false,
        issues: ['Health check failed', error instanceof Error ? error.message : 'Unknown error'],
        performance: {
          avg_processing_time_ms: 0,
          last_successful_analysis: 'never',
          total_analyses: 0
        }
      };
    }
  }

  /**
   * Get default initialization status for error cases
   * @returns InitializationStatus - Default status
   */
  private getDefaultInitializationStatus(): InitializationStatus {
    return {
      is_initialized: false,
      is_streaming: false,
      processed_chunks: 0,
      total_chunks: 0,
      current_size_mb: 0,
      estimated_total_size_mb: this.EXPECTED_MODEL_SIZE_MB,
      initialization_started: false
    };
  }

  /**
   * Calculate initialization progress percentage
   * @param status - Current initialization status
   * @returns number - Progress percentage (0-100)
   */
  calculateProgress(status: InitializationStatus): number {
    if (status.total_chunks === 0) return 0;
    return (status.processed_chunks / status.total_chunks) * 100;
  }

  /**
   * Check if model is ready for use
   * @returns Promise<boolean> - True if model is ready
   */
  async isModelReady(): Promise<boolean> {
    try {
      const status = await this.getInitializationStatus();
      return status.is_initialized;
    } catch (error) {
      console.error('Failed to check model readiness:', error);
      return false;
    }
  }
}

// Singleton instance for application-wide use
export const modelManagementService = new ModelManagementService();

// Default export for convenience
export default modelManagementService;
