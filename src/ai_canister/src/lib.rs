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

use models::DeepfakeDetector;
use types::*;
use utils::*;

thread_local! {
    static RNG: RefCell<Option<StdRng>> = RefCell::new(None);
    static DETECTOR: RefCell<Option<DeepfakeDetector>> = RefCell::new(None);
    static USAGE_TRACKER: RefCell<HashMap<String, u32>> = RefCell::new(HashMap::new());
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
    let detector = DeepfakeDetector::new().expect("Failed to initialize detector");
    DETECTOR.with(|d| {
        *d.borrow_mut() = Some(detector);
    });
}

#[post_upgrade]
fn post_upgrade() {
    let detector = DeepfakeDetector::new()
        .expect("Failed to initialize detector after upgrade");
    DETECTOR.with(|d| *d.borrow_mut() = Some(detector));
}

#[update]
async fn analyze_media(input: MediaInput) -> ApiResponse {
    init_rng();
    let caller_id = msg_caller().to_string();
    
    if !check_usage_limit(&caller_id) {
        return ApiResponse {
            success: false,
            result: None,
            error: Some("Usage limit exceeded".to_string()),
        };
    }

    if !MediaProcessor::validate_media_type(&input.filename) {
        return ApiResponse {
            success: false,
            result: None,
            error: Some("Unsupported media type".to_string()),
        };
    }

    if !MediaProcessor::validate_file_size(&input.data, 50) {
        return ApiResponse {
            success: false,
            result: None,
            error: Some("File too large".to_string()),
        };
    }

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

    let media_data = match SocialMediaParser::extract_media_from_url(&input.url, &input.platform).await {
        Ok(data) => data,
        Err(e) => return ApiResponse {
            success: false,
            result: None,
            error: Some(e),
        },
    };

    let result = DETECTOR.with(|detector| {
        let detector = detector.borrow();
        let detector = detector.as_ref().unwrap();
        
        detector.analyze_video(&media_data)
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

#[query]
fn get_usage_info() -> (u32, u32) {
    let caller_id = msg_caller().to_string();
    let current_usage = USAGE_TRACKER.with(|tracker| {
        tracker.borrow().get(&caller_id).cloned().unwrap_or(0)
    });
    
    let max_usage = if is_authenticated(&caller_id) { 30 } else { 3 };
    
    (current_usage, max_usage)
}

fn check_usage_limit(caller_id: &str) -> bool {
    let current_usage = USAGE_TRACKER.with(|tracker| {
        tracker.borrow().get(caller_id).cloned().unwrap_or(0)
    });
    
    let max_usage = if is_authenticated(caller_id) { 30 } else { 3 };
    current_usage < max_usage
}

fn increment_usage(caller_id: &str) {
    USAGE_TRACKER.with(|tracker| {
        let mut tracker = tracker.borrow_mut();
        let current = tracker.get(caller_id).cloned().unwrap_or(0);
        tracker.insert(caller_id.to_string(), current + 1);
    });
}

fn is_authenticated(_caller_id: &str) -> bool {
    false
}