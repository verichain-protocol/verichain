mod models;
mod types;
mod utils;

use ic_cdk::api::msg_caller;
use ic_cdk::management_canister::raw_rand;
use ic_cdk::spawn;
use ic_cdk_macros::*;
use getrandom::register_custom_getrandom;
use getrandom::Error;
use rand::rngs::StdRng;
use rand::SeedableRng;
use rand::RngCore;
use std::cell::RefCell;
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

use models::DeepfakeDetector;
use types::*;
use utils::*;

thread_local! {
    static RNG: RefCell<Option<StdRng>> = RefCell::new(None);
    static DETECTOR: RefCell<Option<DeepfakeDetector>> = RefCell::new(None);
    static USAGE_TRACKER: RefCell<HashMap<String, UserUsage>> = RefCell::new(HashMap::new());
    static PREMIUM_USERS: RefCell<HashMap<String, PremiumSubscription>> = RefCell::new(HashMap::new());
}

#[derive(Debug, Clone)]
struct UserUsage {
    count: u32,
    last_reset: u64,
}

#[derive(Debug, Clone)]
struct PremiumSubscription {
    active: bool,
    expires_at: u64,
    plan: SubscriptionPlan,
}

#[derive(Debug, Clone)]
enum SubscriptionPlan {
    Monthly,
    Yearly,
    Developer,
}

fn init_rng() {
    spawn(async {
        let seed_bytes: Vec<u8> = raw_rand().await.unwrap();
        let mut seed = [0u8; 32];
        seed.copy_from_slice(&seed_bytes[..32]);
        RNG.with(|r| *r.borrow_mut() = Some(StdRng::from_seed(seed)));
    });
}

fn custom_getrandom(dest: &mut [u8]) -> Result<(), Error> {
    RNG.with(|r| {
        if let Some(rng) = r.borrow_mut().as_mut() {
            rng.fill_bytes(dest);
        }
    });
    Ok(())
}

register_custom_getrandom!(custom_getrandom);

#[init]
fn init() {
    init_rng();
    let detector = DeepfakeDetector::new().expect("Failed to initialize detector");
    DETECTOR.with(|d| {
        *d.borrow_mut() = Some(detector);
    });
}

#[post_upgrade]
fn post_upgrade() {
    init_rng();
    let detector = DeepfakeDetector::new()
        .expect("Failed to initialize detector after upgrade");
    DETECTOR.with(|d| *d.borrow_mut() = Some(detector));
}

// Core analysis endpoints
#[update]
async fn analyze_media(input: MediaInput) -> ApiResponse {
    let caller_id = msg_caller().to_string();
    
    // Check usage limits
    if !check_usage_limit(&caller_id) {
        return ApiResponse {
            success: false,
            result: None,
            error: Some("Usage limit exceeded".to_string()),
        };
    }

    // Validate input
    if let Err(error) = validate_media_input(&input) {
        return ApiResponse {
            success: false,
            result: None,
            error: Some(error),
        };
    }

    // Process media
    let result = DETECTOR.with(|detector| {
        let detector = detector.borrow();
        let detector = detector.as_ref().unwrap();
        
        match MediaProcessor::get_media_type(&input.filename).as_str() {
            "image" => detector.analyze_image(&input.data),
            "video" => detector.analyze_video(&input.data),
            _ => Err("Unsupported media type".to_string()),
        }
    });

    match result {
        Ok(detection_result) => {
            increment_usage(&caller_id);
            ApiResponse {
                success: true,
                result: Some(detection_result),
                error: None,
            }
        }
        Err(e) => ApiResponse {
            success: false,
            result: None,
            error: Some(e),
        },
    }
}

#[update]
async fn analyze_social_media(input: SocialMediaInput) -> ApiResponse {
    let caller_id = msg_caller().to_string();
    
    if !check_usage_limit(&caller_id) {
        return ApiResponse {
            success: false,
            result: None,
            error: Some("Usage limit exceeded".to_string()),
        };
    }

    // Extract media from social media URL
    let media_data = match SocialMediaParser::extract_media_from_url(&input.url, &input.platform).await {
        Ok(data) => data,
        Err(e) => return ApiResponse {
            success: false,
            result: None,
            error: Some(e),
        },
    };

    // Analyze extracted media
    let result = DETECTOR.with(|detector| {
        let detector = detector.borrow();
        let detector = detector.as_ref().unwrap();
        
        detector.analyze_video(&media_data.media_data)
    });

    match result {
        Ok(detection_result) => {
            increment_usage(&caller_id);
            ApiResponse {
                success: true,
                result: Some(detection_result),
                error: None,
            }
        }
        Err(e) => ApiResponse {
            success: false,
            result: None,
            error: Some(e),
        },
    }
}

#[update]
async fn analyze_batch(input: BatchAnalysisInput) -> ApiResponse {
    let caller_id = msg_caller().to_string();
    
    // Check if user has premium access
    if !is_premium_user(&caller_id) {
        return ApiResponse {
            success: false,
            result: None,
            error: Some("Batch analysis requires premium subscription".to_string()),
        };
    }

    // Check usage limits for batch size
    if input.media_items.len() > get_batch_limit(&caller_id) {
        return ApiResponse {
            success: false,
            result: None,
            error: Some("Batch size exceeds limit".to_string()),
        };
    }

    let mut results = Vec::new();
    let mut successful_analyses = 0;
    let total_items = input.media_items.len();

    for media_item in input.media_items {
        if let Err(error) = validate_media_input(&media_item) {
            results.push(DetectionResult {
                is_deepfake: false,
                confidence: 0.0,
                media_type: MediaType::Image,
                processing_time_ms: 0,
                frames_analyzed: None,
                metadata: Some(serde_json::json!({
                    "error": "Analysis failed",
                    "filename": media_item.filename
                }).to_string()),
            });
            continue;
        }

        let result = DETECTOR.with(|detector| {
            let detector = detector.borrow();
            let detector = detector.as_ref().unwrap();
            
            match MediaProcessor::get_media_type(&media_item.filename).as_str() {
                "image" => detector.analyze_image(&media_item.data),
                "video" => detector.analyze_video(&media_item.data),
                _ => Err("Unsupported media type".to_string()),
            }
        });

        match result {
            Ok(detection_result) => {
                results.push(detection_result);
                successful_analyses += 1;
            }
            Err(e) => {
                results.push(DetectionResult {
                    is_deepfake: false,
                    confidence: 0.0,
                    media_type: MediaType::Image,
                    processing_time_ms: 0,
                    frames_analyzed: None,
                    metadata: Some(serde_json::json!({
                        "error": "Analysis failed",
                        "filename": media_item.filename
                    }).to_string()),
                });
            }
        }
    }

    // Update usage based on successful analyses
    for _ in 0..successful_analyses {
        increment_usage(&caller_id);
    }

    let batch_result = BatchAnalysisResult {
        total_items: total_items,
        successful_analyses,
        failed_analyses: total_items - successful_analyses,
        results,
    };

    ApiResponse {
        success: true,
        result: Some(DetectionResult {
            is_deepfake: false,
            confidence: 0.0,
            media_type: MediaType::Image,
            processing_time_ms: 0,
            frames_analyzed: None,
            metadata: Some(serde_json::to_value(batch_result).unwrap().to_string()),
        }),
        error: None,
    }
}

// User management endpoints
#[query]
fn get_usage_info() -> UsageInfo {
    let caller_id = msg_caller().to_string();
    let current_time = get_current_timestamp();
    
    let usage = USAGE_TRACKER.with(|tracker| {
        let mut tracker = tracker.borrow_mut();
        let user_usage = tracker.entry(caller_id.clone())
            .or_insert(UserUsage {
                count: 0,
                last_reset: current_time,
            });

        // Reset usage if it's a new month
        if should_reset_usage(user_usage.last_reset, current_time) {
            user_usage.count = 0;
            user_usage.last_reset = current_time;
        }

        user_usage.clone()
    });

    let is_premium = is_premium_user(&caller_id);
    let max_usage = if is_premium { 1000 } else { 3 };
    let batch_limit = get_batch_limit(&caller_id);

    UsageInfo {
        current_usage: usage.count,
        max_usage,
        is_premium,
        batch_limit,
        resets_at: get_next_reset_timestamp(usage.last_reset),
    }
}

#[update]
fn subscribe_premium(plan: String) -> ApiResponse {
    let caller_id = msg_caller().to_string();
    
    let subscription_plan = match plan.as_str() {
        "monthly" => SubscriptionPlan::Monthly,
        "yearly" => SubscriptionPlan::Yearly,
        "developer" => SubscriptionPlan::Developer,
        _ => return ApiResponse {
            success: false,
            result: None,
            error: Some("Invalid subscription plan".to_string()),
        },
    };

    let current_time = get_current_timestamp();
    let expires_at = match subscription_plan {
        SubscriptionPlan::Monthly => current_time + (30 * 24 * 60 * 60), // 30 days
        SubscriptionPlan::Yearly => current_time + (365 * 24 * 60 * 60), // 365 days
        SubscriptionPlan::Developer => current_time + (365 * 24 * 60 * 60), // 365 days
    };

    PREMIUM_USERS.with(|users| {
        let mut users = users.borrow_mut();
        users.insert(caller_id, PremiumSubscription {
            active: true,
            expires_at,
            plan: subscription_plan,
        });
    });

    ApiResponse {
        success: true,
        result: None,
        error: None,
    }
}

// API endpoints for developers
#[query]
fn get_api_key() -> ApiResponse {
    let caller_id = msg_caller().to_string();
    
    if !is_premium_user(&caller_id) {
        return ApiResponse {
            success: false,
            result: None,
            error: Some("API access requires premium subscription".to_string()),
        };
    }

    // Generate API key (in production, use proper key generation)
    let api_key = format!("vca_{}", generate_random_string(32));
    
    ApiResponse {
        success: true,
        result: Some(DetectionResult {
            is_deepfake: false,
            confidence: 0.0,
            media_type: MediaType::Image,
            processing_time_ms: 0,
            frames_analyzed: None,
            metadata: Some(serde_json::json!({
                "api_key": api_key,
                "documentation": "https://docs.verichain.app/api",
                "rate_limit": "1000 requests/month"
            }).to_string()),
        }),
        error: None,
    }
}

// System endpoints
#[query]
fn get_model_info() -> ModelInfo {
    DETECTOR.with(|detector| {
        let detector = detector.borrow();
        let detector_info = detector.as_ref().unwrap().get_model_info();
        types::ModelInfo {
            version: detector_info.version,
            input_size: detector_info.input_size,
            supported_formats: detector_info.supported_formats,
            max_file_size_mb: detector_info.max_file_size_mb,
            confidence_threshold: detector_info.confidence_threshold,
        }
    })
}

#[query]
fn health_check() -> SystemHealth {
    let model_healthy = DETECTOR.with(|detector| {
        detector.borrow().as_ref().map_or(false, |d| d.health_check())
    });

    SystemHealth {
        status: if model_healthy { "healthy".to_string() } else { "unhealthy".to_string() },
        model_loaded: model_healthy,
        uptime_seconds: get_uptime_seconds(),
        version: "1.0.0".to_string(),
    }
}

// Helper functions
fn validate_media_input(input: &MediaInput) -> Result<(), String> {
    if !MediaProcessor::validate_media_type(&input.filename) {
        return Err("Unsupported media type".to_string());
    }

    let max_size = match MediaProcessor::get_media_type(&input.filename).as_str() {
        "image" => 10,
        "video" => 50,
        _ => return Err("Unknown media type".to_string()),
    };

    if !MediaProcessor::validate_file_size(&input.data, max_size) {
        return Err(format!("File too large. Max size: {}MB", max_size));
    }

    Ok(())
}

fn check_usage_limit(caller_id: &str) -> bool {
    let current_time = get_current_timestamp();
    
    USAGE_TRACKER.with(|tracker| {
        let mut tracker = tracker.borrow_mut();
        let user_usage = tracker.entry(caller_id.to_string())
            .or_insert(UserUsage {
                count: 0,
                last_reset: current_time,
            });

        // Reset usage if it's a new month
        if should_reset_usage(user_usage.last_reset, current_time) {
            user_usage.count = 0;
            user_usage.last_reset = current_time;
        }

        let max_usage = if is_premium_user(caller_id) { 1000 } else { 3 };
        user_usage.count < max_usage
    })
}

fn increment_usage(caller_id: &str) {
    USAGE_TRACKER.with(|tracker| {
        let mut tracker = tracker.borrow_mut();
        if let Some(usage) = tracker.get_mut(caller_id) {
            usage.count += 1;
        }
    });
}

fn is_premium_user(caller_id: &str) -> bool {
    let current_time = get_current_timestamp();
    
    PREMIUM_USERS.with(|users| {
        users.borrow().get(caller_id).map_or(false, |sub| {
            sub.active && sub.expires_at > current_time
        })
    })
}

fn get_batch_limit(caller_id: &str) -> usize {
    if is_premium_user(caller_id) {
        50
    } else {
        1
    }
}

fn should_reset_usage(last_reset: u64, current_time: u64) -> bool {
    // Reset on the 1st of each month
    let last_reset_days = last_reset / (24 * 60 * 60);
    let current_days = current_time / (24 * 60 * 60);
    
    // Simple month calculation (approximately 30 days)
    let last_reset_month = last_reset_days / 30;
    let current_month = current_days / 30;
    
    current_month > last_reset_month
}

fn get_next_reset_timestamp(last_reset: u64) -> u64 {
    let days_since_reset = (get_current_timestamp() - last_reset) / (24 * 60 * 60);
    let days_until_reset = 30 - (days_since_reset % 30);
    get_current_timestamp() + (days_until_reset * 24 * 60 * 60)
}

fn get_current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn get_uptime_seconds() -> u64 {
    // Simple uptime calculation
    static mut START_TIME: Option<u64> = None;
    
    unsafe {
        if START_TIME.is_none() {
            START_TIME = Some(get_current_timestamp());
        }
        get_current_timestamp() - START_TIME.unwrap_or(0)
    }
}

fn generate_random_string(length: usize) -> String {
    const CHARSET: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    
    RNG.with(|rng| {
        let mut rng = rng.borrow_mut();
        if let Some(rng) = rng.as_mut() {
            (0..length)
                .map(|_| {
                    let idx = (rng.next_u32() as usize) % CHARSET.len();
                    CHARSET[idx] as char
                })
                .collect()
        } else {
            "default_key".to_string()
        }
    })
}