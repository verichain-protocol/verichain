/// VeriChain Utility Integration Service
/// Integrates frontend with AI canister utility functions

import { coreAIService } from './coreAI.service';
import { 
  FileValidator, 
  PerformanceMonitor, 
  ChunkHasher
} from '../utils';
import { validateSocialMediaUrl } from '../utils/socialMediaParser';
import { 
  ServiceResponse, 
  UtilityPerformanceMetrics,
  FileValidationOptions 
} from '../types/utility.types';

export class UtilityIntegrationService {
  private performanceMonitor: PerformanceMonitor;
  private chunkHasher: ChunkHasher;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.chunkHasher = new ChunkHasher();
  }

  /**
   * Validate file using AI canister functions
   */
  async validateFile(
    file: File, 
    options: FileValidationOptions = {}
  ): Promise<ServiceResponse<{ isValid: boolean; errors: any[]; canisterValidation: boolean }>> {
    this.performanceMonitor.reset();
    this.performanceMonitor.checkpoint('File validation start');

    try {
      // Frontend validation
      const frontendResult = await FileValidator.validateFile(file, options);
      this.performanceMonitor.checkpoint('Frontend validation complete');
      
      // AI canister validation
      const canisterValidation = await coreAIService.validateFileFormat(file.name);
      this.performanceMonitor.checkpoint('Canister validation complete');
      
      // Combine results
      const errors = [...frontendResult.errors];
      if (!canisterValidation) {
        errors.push({
          code: 'CANISTER_VALIDATION_FAILED',
          message: 'File format not supported by AI canister',
          field: 'format'
        });
      }
      
      return {
        success: true,
        data: {
          isValid: frontendResult.isValid && canisterValidation,
          errors,
          canisterValidation
        },
        performance: this.performanceMonitor.getReport()
      };
    } catch (error) {
      this.performanceMonitor.checkpoint('File validation error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        performance: this.performanceMonitor.getReport()
      };
    }
  }

  /**
   * Validate media dimensions using AI canister
   */
  async validateMediaDimensions(
    width: number, 
    height: number
  ): Promise<ServiceResponse<{ isValid: boolean; canisterValidation: boolean }>> {
    this.performanceMonitor.reset();
    this.performanceMonitor.checkpoint('Dimension validation start');

    try {
      // AI canister validation
      const canisterValidation = await coreAIService.validateMediaDimensions(width, height);
      this.performanceMonitor.checkpoint('Canister dimension validation complete');
      
      // Frontend validation
      const MIN_DIMENSION = 32;
      const MAX_DIMENSION = 4096;
      const frontendValidation = width >= MIN_DIMENSION && height >= MIN_DIMENSION &&
                                width <= MAX_DIMENSION && height <= MAX_DIMENSION;
      
      return {
        success: true,
        data: {
          isValid: frontendValidation && canisterValidation,
          canisterValidation
        },
        performance: this.performanceMonitor.getReport()
      };
    } catch (error) {
      this.performanceMonitor.checkpoint('Dimension validation error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Dimension validation failed',
        performance: this.performanceMonitor.getReport()
      };
    }
  }

  /**
   * Hash file with performance tracking
   */
  async hashFile(file: File): Promise<ServiceResponse<{
    fileHash: string;
    chunkHashes: string[];
    totalChunks: number;
  }>> {
    this.performanceMonitor.reset();
    this.performanceMonitor.checkpoint('File hashing start');

    try {
      const result = await this.chunkHasher.hashFile(file);
      this.performanceMonitor.checkpoint('File hashing complete');
      
      return {
        success: true,
        data: result,
        performance: this.performanceMonitor.getReport()
      };
    } catch (error) {
      this.performanceMonitor.checkpoint('File hashing error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hashing failed',
        performance: this.performanceMonitor.getReport()
      };
    }
  }

  /**
   * Validate social media URL
   */
  async validateSocialMediaUrl(url: string): Promise<ServiceResponse<any>> {
    this.performanceMonitor.reset();
    this.performanceMonitor.checkpoint('URL validation start');

    try {
      const result = validateSocialMediaUrl(url);
      this.performanceMonitor.checkpoint('URL validation complete');
      
      return {
        success: true,
        data: result,
        performance: this.performanceMonitor.getReport()
      };
    } catch (error) {
      this.performanceMonitor.checkpoint('URL validation error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'URL validation failed',
        performance: this.performanceMonitor.getReport()
      };
    }
  }

  /**
   * Get performance metrics from last operation
   */
  getLastPerformanceMetrics(): UtilityPerformanceMetrics {
    return this.performanceMonitor.getReport();
  }

  /**
   * Track async operation with performance monitoring
   */
  async trackOperation<T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<ServiceResponse<T>> {
    this.performanceMonitor.reset();
    this.performanceMonitor.checkpoint(`${label} - Start`);

    try {
      const result = await operation();
      this.performanceMonitor.checkpoint(`${label} - Complete`);
      
      return {
        success: true,
        data: result,
        performance: this.performanceMonitor.getReport()
      };
    } catch (error) {
      this.performanceMonitor.checkpoint(`${label} - Error`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : `${label} failed`,
        performance: this.performanceMonitor.getReport()
      };
    }
  }
}

// Singleton instance
export const utilityIntegrationService = new UtilityIntegrationService();
