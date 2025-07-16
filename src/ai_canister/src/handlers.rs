// VeriChain AI Canister - Request Handlers
// HTTP endpoint handlers for media analysis

use ic_cdk_macros::*;
use ic_cdk::api::{time, msg_caller};
use crate::types::*;
use crate::state;

#[update]
pub async fn analyze_image(data: Vec<u8>) -> Result<DetectionResult, String> {
    let start_time = time();
    
    let result = state::with_detector_mut(|detector| {
        detector.analyze_image(&data)
    });
    
    match result {
        Some(Ok(mut detection_result)) => {
            let processing_time = (time() - start_time) / 1_000_000;
            detection_result.processing_time_ms = processing_time;
            Ok(detection_result)
        },
        Some(Err(e)) => Err(format!("Analysis failed: {}", e)),
        None => Err("Model not initialized".to_string()),
    }
}

#[update]
pub async fn analyze_video(data: Vec<u8>) -> Result<DetectionResult, String> {
    let start_time = time();
    
    let result = state::with_detector_mut(|detector| {
        detector.analyze_video(&data)
    });
    
    match result {
        Some(Ok(mut detection_result)) => {
            let processing_time = (time() - start_time) / 1_000_000;
            detection_result.processing_time_ms = processing_time;
            Ok(detection_result)
        },
        Some(Err(e)) => Err(format!("Analysis failed: {}", e)),
        None => Err("Model not initialized".to_string()),
    }
}

#[update]
pub async fn analyze_media(input: MediaInput) -> Result<DetectionResult, String> {
    // Validate input first
    if input.data.is_empty() {
        return Err("Empty media data".to_string());
    }
    
    // Check file type and route to appropriate handler
    let extension = input.filename.split('.').last().unwrap_or("").to_lowercase();
    match extension.as_str() {
        "jpg" | "jpeg" | "png" | "webp" => analyze_image(input.data).await,
        "mp4" | "avi" | "mov" | "webm" => analyze_video(input.data).await,
        _ => Err("Unsupported file format".to_string()),
    }
}

#[query]
pub fn get_model_info() -> ModelInfo {
    ModelInfo {
        version: "1.0.0".to_string(),
        input_size: MODEL_INPUT_SIZE,
        supported_formats: vec![
            "jpg".to_string(),
            "jpeg".to_string(), 
            "png".to_string(),
            "webp".to_string(),
            "mp4".to_string(),
            "avi".to_string(),
            "mov".to_string(),
            "webm".to_string(),
        ],
        max_file_size_mb: MAX_FILE_SIZE_VIDEO_MB,
        confidence_threshold: MODEL_CONFIDENCE_THRESHOLD,
    }
}

#[query]
pub fn health_check() -> SystemHealth {
    let has_detector = state::with_detector(|_| true).unwrap_or(false);
    let uptime = state::START_TIME.with(|t| {
        t.borrow().map(|start| (time() - start) / 1_000_000_000).unwrap_or(0)
    });
    
    SystemHealth {
        status: if has_detector { "healthy".to_string() } else { "initializing".to_string() },
        model_loaded: has_detector,
        uptime_seconds: uptime,
        version: "1.0.0".to_string(),
    }
}

#[query]
pub fn verify_model_integrity() -> bool {
    state::with_detector(|detector| {
        detector.verify_model_integrity().unwrap_or(false)
    }).unwrap_or(false)
}

#[query]
pub fn get_usage_info() -> UsageInfo {
    let caller_id = msg_caller().to_string();
    let current_time = time();
    
    let usage = state::get_usage(&caller_id).unwrap_or(state::UserUsage {
        count: 0,
        last_reset: current_time,
    });
    
    let is_premium = state::is_premium_user(&caller_id);
    let max_usage = if is_premium { 1000 } else { 3 };
    let batch_limit = if is_premium { 50 } else { 1 };

    UsageInfo {
        current_usage: usage.count,
        max_usage,
        is_premium,
        batch_limit,
        resets_at: usage.last_reset + (30 * 24 * 60 * 60 * 1_000_000_000), // 30 days in nanoseconds
    }
}
