use crate::types::*;
use crate::model::VeriChainModel;
use crate::utils::validate_image_data;
use ic_cdk::api::time;

pub fn handle_analyze(image_data: Vec<u8>, model: &VeriChainModel) -> VeriChainResult<MediaAnalysisResult> {
    let start_time = time();
    
    // Validate input
    validate_image_data(&image_data)?;
    
    // Check if model is loaded
    if !model.is_loaded() {
        return Err("Model is not loaded. Please initialize the model first.".to_string());
    }
    
    // Perform prediction
    let prediction = model.predict(&image_data)?;
    
    let processing_time = (time() - start_time) / 1_000_000; // Convert to milliseconds
    
    Ok(MediaAnalysisResult {
        prediction,
        processing_time_ms: processing_time,
        input_size: image_data.len() as u32,
        model_version: "VeriChain-ViT-v1.0".to_string(),
        processed_at: time(),
    })
}

pub fn handle_validate_image_format(image_data: Vec<u8>) -> bool {
    validate_image_data(&image_data).is_ok()
}

pub fn handle_get_supported_formats() -> Vec<String> {
    vec!["PNG".to_string(), "JPEG".to_string(), "JPG".to_string()]
}
