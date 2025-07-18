/// VeriChain System Types
/// 
/// Type definitions for system status, health monitoring, and administration.

use candid::{CandidType, Deserialize};
use serde::Serialize;

/// System health status
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SystemHealth {
    pub status: String,
    pub model_loaded: bool,
    pub uptime_seconds: u64,
    pub version: String,
}

/// Model information and capabilities
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct ModelInfo {
    pub version: String,
    pub input_size: (u32, u32),
    pub supported_formats: Vec<String>,
    pub max_file_size_mb: u32,
    pub confidence_threshold: f32,
}

/// Model upload status tracking
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UploadStatus {
    pub total_chunks: u32,
    pub uploaded_chunks: u32,
    pub missing_chunks: Vec<u32>,
    pub is_complete: bool,
    pub original_size_mb: f64,
}

/// Model initialization status tracking
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct InitializationStatus {
    pub is_initialized: bool,
    pub is_streaming: bool,
    pub processed_chunks: u32,
    pub total_chunks: u32,
    pub current_size_mb: f64,
    pub estimated_total_size_mb: f64,
    pub initialization_started: bool,
}
