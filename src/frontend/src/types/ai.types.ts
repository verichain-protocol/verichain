/// VeriChain AI Types
/// TypeScript definitions for AI detection and analysis

export interface DetectionResult {
  is_deepfake: boolean;
  confidence: number;
  media_type: string;
  processing_time_ms: number;
  metadata: string;
  model_version?: string;
  analysis_details?: AnalysisDetails;
}

export interface AnalysisDetails {
  classification: string;
  class_confidence: number;
  classes: {
    real_probability: number;
    ai_generated_probability: number;
    deepfake_probability: number;
  };
  features_detected?: string[];
  anomalies?: string[];
}

export interface ModelInfo {
  version: string;
  accuracy: number;
  status: 'ready' | 'loading' | 'error';
  last_updated: string;
  chunks_loaded: number;
  total_chunks: number;
  input_size?: [number, number];
  supported_formats?: string[];
  max_file_size_mb?: number;
  confidence_threshold?: number;
}

export interface InitializationStatus {
  is_initialized: boolean;
  is_streaming: boolean;
  processed_chunks: number;
  total_chunks: number;
  current_size_mb: number;
  estimated_total_size_mb: number;
  initialization_started: boolean;
}

export interface ValidationResult {
  is_valid: boolean;
  file_type: string;
  file_size: number;
  supported_formats: string[];
  error_message?: string;
}

export interface PerformanceMetrics {
  total_cycles: number;
  checkpoints: Array<{
    label: string;
    cycles: number;
    timestamp: number;
  }>;
  memory_usage?: number;
  processing_time_ms: number;
}

export interface HashResult {
  sha256: string;
  file_size: number;
  chunk_hashes?: string[];
  verification_status: 'verified' | 'failed' | 'pending';
}

export type MediaType = 'image' | 'video';
export type AnalysisState = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';
