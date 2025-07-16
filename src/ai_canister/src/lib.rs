// VeriChain AI Canister - Main Entry Point
// Deepfake detection and media verification service

use ic_cdk_macros::*;

mod handlers;
mod models; 
mod state;
mod types;
mod utils;
mod upload_chunks;

// Re-export public API
pub use handlers::*;
pub use types::*;
pub use upload_chunks::*;

#[init]
fn init() {
    state::initialize_canister();
}

#[pre_upgrade] 
fn pre_upgrade() {
    state::save_state();
}

#[post_upgrade]
fn post_upgrade() {
    state::load_state();
}

// Export all handler functions as canister endpoints
pub use handlers::{
    analyze_image,
    analyze_video, 
    analyze_media,
    get_model_info,
    health_check,
    verify_model_integrity,
    get_usage_info,
    upload_model_chunk,
    upload_model_metadata,
    get_upload_status,
    initialize_model_from_chunks,
};