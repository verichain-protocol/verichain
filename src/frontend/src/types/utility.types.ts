/// VeriChain Utility Types
/// TypeScript definitions for utility functions and services

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  requireSignature?: boolean;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ChunkHasherOptions {
  chunkSize: number;
  parallel: boolean;
  algorithm: 'sha256' | 'md5';
}

export interface PerformanceCheckpoint {
  label: string;
  timestamp: number;
  memory?: number;
  cycles?: number;
}

export interface UtilityPerformanceMetrics {
  start_time: number;
  end_time: number;
  duration_ms: number;
  checkpoints: PerformanceCheckpoint[];
  memory_peak?: number;
}

export interface SocialMediaPost {
  platform: string;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  format?: string;
}

export interface UtilityServiceConfig {
  enableValidation: boolean;
  enablePerformance: boolean;
  enableHashing: boolean;
  enableLogging: boolean;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  performance?: UtilityPerformanceMetrics;
}
