/// VeriChain AI Types
/// TypeScript definitions for AI detection and analysis

export type MediaType = 'image' | 'video';
export type AnalysisState = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';

export interface DetectionResult {
  is_deepfake: boolean;
  confidence: number;
  media_type: string;
  processing_time_ms: number;
  metadata: string;
  model_version?: string;
  analysis_details?: AnalysisDetails;
  user_info?: UserQuotaInfo;
}

export interface UserQuotaInfo {
  tier: 'guest' | 'registered' | 'premium';
  remaining_quota: number;
  quota_resets_at: string | null; // ISO 8601 date, null for guest
  total_quota: number;
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
  verified: boolean;
  timestamp: number;
}

// User Authentication & Tier System
export interface UserTier {
  type: 'guest' | 'registered' | 'premium';
  monthly_quota: number;
  features: string[];
  priority_processing: boolean;
}

export interface AuthToken {
  token: string;
  expires_at: string;
  user_id: string;
  tier: UserTier;
}

export interface QuotaStatus {
  remaining: number;
  total: number;
  resets_at: string | null;
  tier: 'guest' | 'registered' | 'premium';
}

export const USER_TIERS: Record<string, UserTier> = {
  guest: {
    type: 'guest',
    monthly_quota: 3,
    features: ['basic_detection'],
    priority_processing: false
  },
  registered: {
    type: 'registered', 
    monthly_quota: 30,
    features: ['basic_detection', 'history', 'batch_processing'],
    priority_processing: false
  },
  premium: {
    type: 'premium',
    monthly_quota: 1000,
    features: ['basic_detection', 'history', 'batch_processing', 'api_access', 'priority_support'],
    priority_processing: true
  }
};
