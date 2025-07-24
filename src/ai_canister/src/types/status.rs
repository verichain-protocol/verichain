use candid::{CandidType, Deserialize};
use serde::Serialize;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SystemHealth {
    pub status: String,
    pub model_loaded: bool,
    pub uptime_seconds: u64,
    pub memory_usage_mb: f64,
    pub cycle_balance: u64,
}

impl SystemHealth {
    // Remove unused constructor
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UploadStatus {
    pub total_chunks: u32,
    pub uploaded_chunks: u32,
    pub missing_chunks: Vec<u32>,
    pub is_complete: bool,
    pub original_size_mb: f64,
}

impl UploadStatus {
    // Remove unused methods
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct InitializationStatus {
    pub is_initialized: bool,
    pub initialization_started: bool,
    pub processed_chunks: u32,
    pub total_chunks: u32,
    pub current_size_mb: f64,
    pub estimated_total_size_mb: f64,
    pub error_message: Option<String>,
}

impl InitializationStatus {
    // Remove unused methods
}
