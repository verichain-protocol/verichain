/// VeriChain Media Types
/// 
/// Type definitions for media input, output and related data structures.

use candid::{CandidType, Deserialize};
use serde::Serialize;

/// Core input types for media processing
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MediaInput {
    pub filename: String,
    pub data: Vec<u8>,
    pub metadata: Option<String>,
}

/// Social media input for URL-based analysis
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SocialMediaInput {
    pub url: String,
    pub platform: SocialMediaPlatform,
    pub frames: Vec<Vec<u8>>, // Preprocessed frames from frontend
    pub metadata: Option<String>,
}

/// Supported social media platforms
#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum SocialMediaPlatform {
    YouTube,
    Instagram,
    TikTok,
    Twitter,
    Facebook,
    Other(String),
}

/// Frame-level analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameResult {
    pub frame_index: usize,
    pub confidence: f32,
    pub is_deepfake: bool,
    pub timestamp_ms: u64,
}

/// Detection result for media analysis
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct DetectionResult {
    pub is_deepfake: bool,
    pub confidence: f32,
    pub media_type: MediaType,
    pub processing_time_ms: u64,
    pub frames_analyzed: Option<usize>,
    pub metadata: Option<String>,
}

/// Media type enumeration
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub enum MediaType {
    Image,
    Video,
    SocialMediaVideo,
}

/// Constants for media processing
pub const MODEL_INPUT_SIZE: (u32, u32) = (224, 224);
pub const MAX_FILE_SIZE_IMAGE_MB: u32 = 2;  // Reduced to 2MB for canister payload limit
pub const MAX_FILE_SIZE_VIDEO_MB: u32 = 2;  // Reduced to 2MB for canister payload limit
pub const SUPPORTED_IMAGE_FORMATS: &[&str] = &["jpg", "jpeg", "png"];
pub const SUPPORTED_VIDEO_FORMATS: &[&str] = &["mp4", "mov"];
pub const MODEL_CONFIDENCE_THRESHOLD: f32 = 0.5;
