use crate::types::*;
use crate::model::VeriChainModel;
use ic_cdk::api::time;

pub fn handle_get_model_info(model: &VeriChainModel) -> ModelInfo {
    let (_channels, height, width) = model.get_input_shape();
    
    ModelInfo {
        version: "VeriChain-ViT-v1.0".to_string(),
        input_size: (width, height),
        supported_formats: model.get_supported_formats(),
        model_loaded: model.is_loaded(),
        total_parameters: Some(85_800_000), // Approximate ViT parameter count
    }
}

pub fn handle_health_check(model: &VeriChainModel, start_time: u64) -> SystemHealth {
    let current_time = time();
    let uptime_seconds = (current_time - start_time) / 1_000_000_000; // Convert to seconds
    let cycle_balance = ic_cdk::api::canister_cycle_balance() as u64;
    
    // Estimate memory usage (rough calculation)
    let memory_usage_mb = if model.is_loaded() {
        327.0 // Model size + overhead
    } else {
        50.0 // Base canister overhead
    };
    
    let status = if model.is_loaded() {
        "healthy".to_string()
    } else {
        "model_not_loaded".to_string()
    };
    
    SystemHealth {
        status,
        model_loaded: model.is_loaded(),
        uptime_seconds,
        memory_usage_mb,
        cycle_balance,
    }
}
