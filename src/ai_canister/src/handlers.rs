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

#[update]
pub async fn analyze_social_media(input: SocialMediaInput) -> Result<DetectionResult, String> {
    // Validate input
    if input.frames.is_empty() {
        return Err("No frames provided for social media analysis".to_string());
    }
    
    if input.url.is_empty() {
        return Err("Social media URL cannot be empty".to_string());
    }
    
    // Validate URL format based on platform
    validate_social_media_url(&input.url, &input.platform)?;
    
    let start_time = time();
    
    let result = state::with_detector_mut(|detector| -> Result<DetectionResult, String> {
        // Use existing analyze_frames method but enhance result with social media metadata
        let mut detection_result = detector.analyze_frames(input.frames)?;
        
        // Update media type and add social media specific metadata
        detection_result.media_type = MediaType::SocialMediaVideo;
        
        // Enhance metadata with social media information
        let social_metadata = serde_json::json!({
            "platform": format!("{:?}", input.platform),
            "source_url": input.url,
            "original_metadata": detection_result.metadata,
            "extraction_method": "frontend_preprocessing"
        });
        detection_result.metadata = Some(social_metadata.to_string());
        
        Ok(detection_result)
    });
    
    match result {
        Some(Ok(mut detection_result)) => {
            let processing_time = (time() - start_time) / 1_000_000;
            detection_result.processing_time_ms = processing_time;
            Ok(detection_result)
        },
        Some(Err(e)) => Err(format!("Social media analysis failed: {}", e)),
        None => Err("Model not initialized".to_string()),
    }
}

// Validate social media URL format
fn validate_social_media_url(url: &str, platform: &SocialMediaPlatform) -> Result<(), String> {
    match platform {
        SocialMediaPlatform::YouTube => {
            if !url.contains("youtube.com") && !url.contains("youtu.be") {
                return Err("Invalid YouTube URL format".to_string());
            }
        },
        SocialMediaPlatform::Instagram => {
            if !url.contains("instagram.com") {
                return Err("Invalid Instagram URL format".to_string());
            }
        },
        SocialMediaPlatform::TikTok => {
            if !url.contains("tiktok.com") {
                return Err("Invalid TikTok URL format".to_string());
            }
        },
        SocialMediaPlatform::Twitter => {
            if !url.contains("twitter.com") && !url.contains("x.com") {
                return Err("Invalid Twitter/X URL format".to_string());
            }
        },
        SocialMediaPlatform::Facebook => {
            if !url.contains("facebook.com") && !url.contains("fb.com") {
                return Err("Invalid Facebook URL format".to_string());
            }
        },
        SocialMediaPlatform::Other(_) => {
            // Basic URL validation for other platforms
            if !url.starts_with("http://") && !url.starts_with("https://") {
                return Err("URL must start with http:// or https://".to_string());
            }
        },
    }
    Ok(())
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
            // Social media platforms
            "youtube".to_string(),
            "instagram".to_string(),
            "tiktok".to_string(),
            "twitter".to_string(),
            "facebook".to_string(),
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

// Model chunk upload endpoints
#[update]
pub async fn upload_model_chunk(chunk_id: u32, chunk_data: Vec<u8>, chunk_hash: String) -> Result<String, String> {
    // Verify chunk hash
    let calculated_hash = crate::models::deepfake_detector::DeepfakeDetector::calculate_sha256(&chunk_data);
    if calculated_hash != chunk_hash {
        return Err(format!("Chunk hash verification failed. Expected: {}, Got: {}", chunk_hash, calculated_hash));
    }
    
    // Store chunk in stable memory
    let chunk = state::ModelChunk {
        chunk_id,
        data: chunk_data,
        hash: chunk_hash,
    };
    
    state::store_model_chunk(chunk)?;
    
    // Update metadata to mark this chunk as uploaded
    if let Some(mut metadata) = state::get_model_metadata() {
        if !metadata.uploaded_chunks.contains(&chunk_id) {
            metadata.uploaded_chunks.push(chunk_id);
            metadata.uploaded_chunks.sort();
            state::store_model_metadata(metadata);
        }
    }
    
    Ok(format!("Chunk {} uploaded successfully", chunk_id))
}

#[update]
pub async fn upload_model_metadata(
    original_file: String,
    original_size: u64,
    total_chunks: u32,
    chunk_size_mb: u32
) -> Result<String, String> {
    let metadata = state::StoredModelMetadata {
        original_file,
        original_size,
        total_chunks,
        chunk_size_mb,
        uploaded_chunks: Vec::new(),
    };
    
    state::store_model_metadata(metadata);
    Ok("Model metadata uploaded successfully".to_string())
}

#[query]
pub fn get_upload_status() -> UploadStatus {
    if let Some(metadata) = state::get_model_metadata() {
        UploadStatus {
            total_chunks: metadata.total_chunks,
            uploaded_chunks: metadata.uploaded_chunks.len() as u32,
            missing_chunks: (0..metadata.total_chunks)
                .filter(|id| !metadata.uploaded_chunks.contains(id))
                .collect(),
            is_complete: state::are_all_chunks_uploaded(),
            original_size_mb: metadata.original_size as f64 / (1024.0 * 1024.0),
        }
    } else {
        UploadStatus {
            total_chunks: 0,
            uploaded_chunks: 0,
            missing_chunks: Vec::new(),
            is_complete: false,
            original_size_mb: 0.0,
        }
    }
}

#[update]
pub async fn initialize_model_from_chunks() -> Result<String, String> {
    if !state::are_all_chunks_uploaded() {
        return Err("Not all chunks have been uploaded yet".to_string());
    }
    
    // Start streaming initialization
    state::with_detector_mut(|detector| {
        detector.start_streaming_initialization()
    }).ok_or("Detector not available".to_string())??;
    
    Ok("Model streaming initialization started successfully".to_string())
}

#[update]
pub async fn continue_model_initialization(batch_size: Option<u32>) -> Result<String, String> {
    let batch_size = batch_size.unwrap_or(10); // Process 10 chunks at a time by default
    
    let result = state::with_detector_mut(|detector| {
        detector.continue_streaming_initialization(batch_size)
    }).ok_or("Detector not available".to_string())?;
    
    match result {
        Ok((completed, total)) => {
            if completed == total {
                Ok(format!("Model initialization completed successfully! Processed {}/{} chunks", completed, total))
            } else {
                Ok(format!("Model initialization in progress: {}/{} chunks processed", completed, total))
            }
        },
        Err(e) => Err(e)
    }
}

#[query]
pub async fn get_model_initialization_status() -> Result<crate::types::InitializationStatus, String> {
    state::with_detector(|detector| {
        detector.get_initialization_status()
    }).ok_or("Detector not available".to_string())?
}
