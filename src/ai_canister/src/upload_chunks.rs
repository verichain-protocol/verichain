use candid::{CandidType, Deserialize};
use std::fs;
use std::path::Path;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ModelMetadata {
    pub total_chunks: u32,
    pub chunk_size: usize,
    pub original_size: usize,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ChunkUploadResult {
    pub success: bool,
    pub chunk_id: u32,
    pub message: String,
}

/// Upload model chunks for ICP canister deployment
pub fn upload_model_chunks() -> Result<String, String> {
    let metadata_path = "src/ai_canister/assets/model_metadata.json";
    
    if !Path::new(metadata_path).exists() {
        return Err("Model metadata not found. Run 'make model-setup' first.".to_string());
    }
    
    let metadata_content = fs::read_to_string(metadata_path)
        .map_err(|e| format!("Failed to read metadata: {}", e))?;
    
    let metadata: serde_json::Value = serde_json::from_str(&metadata_content)
        .map_err(|e| format!("Failed to parse metadata: {}", e))?;
    
    let total_chunks = metadata["total_chunks"].as_u64()
        .ok_or("Missing total_chunks in metadata")? as u32;
    
    Ok(format!("Successfully prepared {} chunks for upload", total_chunks))
}

/// Load specific chunk by ID from filesystem
pub fn load_chunk(chunk_id: u32) -> Result<Vec<u8>, String> {
    let chunk_path = format!("src/ai_canister/assets/model_chunk_{:03}.bin", chunk_id);
    
    if !Path::new(&chunk_path).exists() {
        return Err(format!("Chunk {} not found at {}. Run 'make model-setup' first.", chunk_id, chunk_path));
    }
    
    fs::read(&chunk_path)
        .map_err(|e| format!("Failed to read chunk {}: {}", chunk_id, e))
}
