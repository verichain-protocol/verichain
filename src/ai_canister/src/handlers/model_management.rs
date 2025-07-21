use crate::types::*;
use crate::storage::ModelStorage;
use crate::model::VeriChainModel;
use crate::utils::{verify_chunk_integrity, validate_chunk_id, validate_batch_size};

pub fn handle_upload_chunk(
    storage: &mut ModelStorage, 
    chunk_id: u32, 
    data: Vec<u8>, 
    expected_hash: String
) -> VeriChainResult<String> {
    // Verify chunk integrity
    if !verify_chunk_integrity(&data, &expected_hash) {
        return Err(format!("Chunk {} integrity verification failed", chunk_id));
    }
    
    // Validate chunk ID if we have metadata
    if let Some(metadata) = storage.get_metadata() {
        validate_chunk_id(chunk_id, metadata.total_chunks)?;
    }
    
    // Create and store chunk
    let chunk = ModelChunk {
        id: chunk_id,
        data,
        hash: expected_hash,
    };
    
    storage.store_chunk(chunk)?;
    
    Ok(format!("Chunk {} uploaded successfully", chunk_id))
}

pub fn handle_upload_metadata(
    storage: &mut ModelStorage,
    original_file: String,
    original_size: u64,
    total_chunks: u32,
    chunk_size_mb: u32,
) -> VeriChainResult<String> {
    let metadata = ModelMetadata {
        original_file,
        original_size,
        total_chunks,
        chunk_size_mb: chunk_size_mb as f64,
        version: "VeriChain-ViT-v1.0".to_string(),
    };
    
    storage.store_metadata(metadata)?;
    
    Ok("Metadata uploaded successfully".to_string())
}

pub fn handle_get_upload_status(storage: &ModelStorage) -> UploadStatus {
    let (total_chunks, uploaded_chunks, missing_chunks, is_complete, original_size_mb) = 
        storage.get_upload_stats();
    
    UploadStatus {
        total_chunks,
        uploaded_chunks,
        missing_chunks,
        is_complete,
        original_size_mb,
    }
}

pub fn handle_initialize_model(
    storage: &mut ModelStorage,
    model: &mut VeriChainModel,
) -> VeriChainResult<String> {
    // Check if upload is complete
    if !storage.is_upload_complete() {
        let missing = storage.get_missing_chunks();
        return Err(format!("Cannot initialize: {} chunks missing: {:?}", 
                          missing.len(), missing));
    }
    
    // Start initialization
    storage.start_initialization()?;
    
    // Determine optimal batch size based on total chunks
    let total_chunks = storage.get_initialization_progress().1;
    let batch_size = calculate_optimal_batch_size(total_chunks);
    
    // Process first batch
    let processed = storage.process_chunks_batch(batch_size)?;
    
    // If all chunks processed in one go, load the model
    if storage.is_initialized() {
        if let Some(model_data) = storage.get_model_data() {
            model.load_from_bytes(model_data)?;
            return Ok("Model initialized and loaded successfully".to_string());
        }
    }
    
    Ok(format!("Initialization started. Processed {} chunks in first batch", processed))
}

pub fn handle_continue_initialization(
    storage: &mut ModelStorage,
    model: &mut VeriChainModel,
    batch_size: Option<u32>,
) -> VeriChainResult<String> {
    if storage.is_initialized() {
        return Err("Model already initialized".to_string());
    }
    
    let total_chunks = storage.get_initialization_progress().1;
    let batch_size = batch_size.unwrap_or_else(|| calculate_optimal_batch_size(total_chunks));
    
    validate_batch_size(batch_size)?;
    
    let processed = storage.process_chunks_batch(batch_size)?;
    
    // Check if initialization is complete
    if storage.is_initialized() {
        if let Some(model_data) = storage.get_model_data() {
            model.load_from_bytes(model_data)?;
            return Ok(format!("Model initialization completed! Processed {} chunks in final batch", processed));
        }
    }
    
    let (current, total) = storage.get_initialization_progress();
    Ok(format!("Processed {} chunks. Progress: {}/{}", processed, current, total))
}

pub fn handle_get_initialization_status(storage: &ModelStorage) -> InitializationStatus {
    let (processed_chunks, total_chunks) = storage.get_initialization_progress();
    
    InitializationStatus {
        is_initialized: storage.is_initialized(),
        initialization_started: processed_chunks > 0 || storage.is_initialized(),
        processed_chunks,
        total_chunks,
        current_size_mb: storage.get_current_size_mb(),
        estimated_total_size_mb: storage.get_estimated_total_size_mb(),
        error_message: None,
    }
}

fn calculate_optimal_batch_size(total_chunks: u32) -> u32 {
    match total_chunks {
        0..=200 => 50,
        201..=350 => 75,
        _ => 100,
    }
}
