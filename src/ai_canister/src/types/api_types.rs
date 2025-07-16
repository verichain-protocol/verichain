use candid::{CandidType, Deserialize};
use serde::Serialize;

// Core input types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MediaInput {
    pub filename: String,
    pub data: Vec<u8>,
    pub metadata: Option<String>,
}

// Social media input for URL-based analysis
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SocialMediaInput {
    pub url: String,
    pub platform: SocialMediaPlatform,
    pub frames: Vec<Vec<u8>>, // Preprocessed frames from frontend
    pub metadata: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum SocialMediaPlatform {
    YouTube,
    Instagram,
    TikTok,
    Twitter,
    Facebook,
    Other(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameResult {
    pub frame_index: usize,
    pub confidence: f32,
    pub is_deepfake: bool,
    pub timestamp_ms: u64,
}

// Output types
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct DetectionResult {
    pub is_deepfake: bool,
    pub confidence: f32,
    pub media_type: MediaType,
    pub processing_time_ms: u64,
    pub frames_analyzed: Option<usize>,
    pub metadata: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub enum MediaType {
    Image,
    Video,
    SocialMediaVideo,
}

// User management types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UsageInfo {
    pub current_usage: u32,
    pub max_usage: u32,
    pub is_premium: bool,
    pub batch_limit: usize,
    pub resets_at: u64,
}

// System types
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct ModelInfo {
    pub version: String,
    pub input_size: (u32, u32),
    pub supported_formats: Vec<String>,
    pub max_file_size_mb: u32,
    pub confidence_threshold: f32,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SystemHealth {
    pub status: String,
    pub model_loaded: bool,
    pub uptime_seconds: u64,
    pub version: String,
}

// Model upload status tracking
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UploadStatus {
    pub total_chunks: u32,
    pub uploaded_chunks: u32,
    pub missing_chunks: Vec<u32>,
    pub is_complete: bool,
    pub original_size_mb: f64,
}

// Model initialization status tracking
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

// Constants
pub const MODEL_INPUT_SIZE: (u32, u32) = (224, 224);
pub const MAX_FILE_SIZE_IMAGE_MB: u32 = 10;
pub const MAX_FILE_SIZE_VIDEO_MB: u32 = 25;
pub const SUPPORTED_IMAGE_FORMATS: &[&str] = &["jpg", "jpeg", "png"];
pub const SUPPORTED_VIDEO_FORMATS: &[&str] = &["mp4", "mov"];
pub const MODEL_CONFIDENCE_THRESHOLD: f32 = 0.5;