use candid::{CandidType, Deserialize};
use serde::Serialize;

// Core input types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MediaInput {
    pub filename: String,
    pub data: Vec<u8>,
    pub metadata: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameResult {
    pub frame_index: usize,
    pub confidence: f32,
    pub is_deepfake: bool,
    pub timestamp_ms: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SocialMediaInput {
    pub url: String,
    pub platform: SocialMediaPlatform,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct BatchAnalysisInput {
    pub media_items: Vec<MediaInput>,
    pub batch_id: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub enum SocialMediaPlatform {
    Instagram,
    YouTube,
    Facebook,
    Twitter,
    TikTok,
}

// Implement Display for SocialMediaPlatform
impl std::fmt::Display for SocialMediaPlatform {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SocialMediaPlatform::Instagram => write!(f, "Instagram"),
            SocialMediaPlatform::YouTube => write!(f, "YouTube"),
            SocialMediaPlatform::Facebook => write!(f, "Facebook"),
            SocialMediaPlatform::Twitter => write!(f, "Twitter"),
            SocialMediaPlatform::TikTok => write!(f, "TikTok"),
        }
    }
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
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct BatchAnalysisResult {
    pub total_items: usize,
    pub successful_analyses: usize,
    pub failed_analyses: usize,
    pub results: Vec<DetectionResult>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ApiResponse {
    pub success: bool,
    pub result: Option<DetectionResult>,
    pub error: Option<String>,
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

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserProfile {
    pub user_id: String,
    pub subscription_type: SubscriptionType,
    pub api_key: Option<String>,
    pub created_at: u64,
    pub last_active: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum SubscriptionType {
    Free,
    Monthly,
    Yearly,
    Developer,
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

// API types for developers
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ApiRequest {
    pub api_key: String,
    pub request_type: ApiRequestType,
    pub data: Vec<u8>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum ApiRequestType {
    SingleImage,
    SingleVideo,
    BatchAnalysis,
    SocialMediaAnalysis,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ApiUsageStats {
    pub total_requests: u32,
    pub successful_requests: u32,
    pub failed_requests: u32,
    pub average_response_time_ms: u64,
    pub last_request_at: u64,
}

// Configuration types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SystemConfig {
    pub max_file_size_mb: u32,
    pub max_video_length_seconds: u32,
    pub free_tier_limit: u32,
    pub premium_tier_limit: u32,
    pub batch_processing_limit: usize,
    pub supported_formats: Vec<String>,
}

// Error types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum VeriChainError {
    ModelNotInitialized,
    UnsupportedMediaType,
    FileTooLarge,
    UsageLimitExceeded,
    InvalidApiKey,
    PremiumRequired,
    ProcessingFailed(String),
    NetworkError(String),
    InvalidInput(String),
}

impl std::fmt::Display for VeriChainError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            VeriChainError::ModelNotInitialized => write!(f, "AI model not initialized"),
            VeriChainError::UnsupportedMediaType => write!(f, "Unsupported media type"),
            VeriChainError::FileTooLarge => write!(f, "File size exceeds limit"),
            VeriChainError::UsageLimitExceeded => write!(f, "Usage limit exceeded"),
            VeriChainError::InvalidApiKey => write!(f, "Invalid API key"),
            VeriChainError::PremiumRequired => write!(f, "Premium subscription required"),
            VeriChainError::ProcessingFailed(msg) => write!(f, "Processing failed: {}", msg),
            VeriChainError::NetworkError(msg) => write!(f, "Network error: {}", msg),
            VeriChainError::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
        }
    }
}

// Analytics types
#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct AnalyticsData {
    pub total_analyses: u64,
    pub deepfake_detected: u64,
    pub authentic_detected: u64,
    pub average_confidence: f32,
    pub processing_time_stats: ProcessingTimeStats,
}

#[derive(CandidType, Deserialize, Clone, Debug, Serialize)]
pub struct ProcessingTimeStats {
    pub min_ms: u64,
    pub max_ms: u64,
    pub average_ms: u64,
}

// Webhook types for notifications
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct WebhookConfig {
    pub url: String,
    pub secret: String,
    pub events: Vec<WebhookEvent>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum WebhookEvent {
    AnalysisCompleted,
    BatchCompleted,
    UsageLimitWarning,
    SubscriptionExpiring,
}

// Rate limiting types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct RateLimitInfo {
    pub requests_remaining: u32,
    pub reset_time: u64,
    pub limit_type: RateLimitType,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum RateLimitType {
    PerMinute,
    PerHour,
    PerDay,
    PerMonth,
}

// Social media specific types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SocialMediaMetadata {
    pub platform: SocialMediaPlatform,
    pub post_id: Option<String>,
    pub author: Option<String>,
    pub timestamp: Option<u64>,
    pub engagement_stats: Option<EngagementStats>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct EngagementStats {
    pub likes: u32,
    pub shares: u32,
    pub comments: u32,
    pub views: u32,
}

// Notification types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct NotificationPreferences {
    pub email_notifications: bool,
    pub webhook_notifications: bool,
    pub usage_alerts: bool,
    pub security_alerts: bool,
}

// Export utility functions
impl MediaInput {
    #[allow(dead_code)]
    pub fn new(filename: String, data: Vec<u8>) -> Self {
        Self {
            filename,
            data,
            metadata: None,
        }
    }

    #[allow(dead_code)]
    pub fn with_metadata(filename: String, data: Vec<u8>, metadata: String) -> Self {
        Self {
            filename,
            data,
            metadata: Some(metadata.to_string()),
        }
    }

    #[allow(dead_code)]
    pub fn get_file_extension(&self) -> Option<&str> {
        self.filename.split('.').last()
    }

    #[allow(dead_code)]
    pub fn get_file_size(&self) -> usize {
        self.data.len()
    }
}

impl ApiResponse {
    #[allow(dead_code)]
    pub fn success(result: DetectionResult) -> Self {
        Self {
            success: true,
            result: Some(result),
            error: None,
        }
    }

    #[allow(dead_code)]
    pub fn error(error: String) -> Self {
        Self {
            success: false,
            result: None,
            error: Some(error),
        }
    }

    #[allow(dead_code)]
    pub fn from_verichain_error(error: VeriChainError) -> Self {
        Self {
            success: false,
            result: None,
            error: Some(error.to_string()),
        }
    }
}

impl DetectionResult {
    #[allow(dead_code)]
    pub fn new_image(is_deepfake: bool, confidence: f32, processing_time_ms: u64) -> Self {
        Self {
            is_deepfake,
            confidence,
            media_type: MediaType::Image,
            processing_time_ms,
            frames_analyzed: Some(1),
            metadata: None,
        }
    }

    #[allow(dead_code)]
    pub fn new_video(
        is_deepfake: bool,
        confidence: f32,
        processing_time_ms: u64,
        frames_analyzed: usize,
    ) -> Self {
        Self {
            is_deepfake,
            confidence,
            media_type: MediaType::Video,
            processing_time_ms,
            frames_analyzed: Some(frames_analyzed),
            metadata: None,
        }
    }

    #[allow(dead_code)]
    pub fn with_metadata(mut self, metadata: serde_json::Value) -> Self {
        self.metadata = Some(metadata.to_string());
        self
    }
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
#[allow(dead_code)]
pub const MAX_FRAMES_PER_VIDEO: usize = 30;
pub const MAX_FILE_SIZE_IMAGE_MB: u32 = 10;
pub const MAX_FILE_SIZE_VIDEO_MB: u32 = 25;
#[allow(dead_code)]
pub const FREE_TIER_MONTHLY_LIMIT: u32 = 3;
#[allow(dead_code)]
pub const PREMIUM_TIER_MONTHLY_LIMIT: u32 = 1000;
#[allow(dead_code)]
pub const DEVELOPER_TIER_MONTHLY_LIMIT: u32 = 10000;
#[allow(dead_code)]
pub const MAX_BATCH_SIZE: usize = 50;
pub const SUPPORTED_IMAGE_FORMATS: &[&str] = &["jpg", "jpeg", "png"];
pub const SUPPORTED_VIDEO_FORMATS: &[&str] = &["mp4", "mov"];
pub const MODEL_CONFIDENCE_THRESHOLD: f32 = 0.5;