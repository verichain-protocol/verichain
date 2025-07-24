use candid::{CandidType, Deserialize};
use serde::Serialize;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ModelInfo {
    pub version: String,
    pub input_size: (u32, u32),
    pub supported_formats: Vec<String>,
    pub model_loaded: bool,
    pub total_parameters: Option<u64>,
}

impl ModelInfo {
    // Remove unused constructors
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ModelChunk {
    pub id: u32,
    pub data: Vec<u8>,
    pub hash: String,
}

impl ModelChunk {
    // Remove unused constructors
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ModelMetadata {
    pub original_file: String,
    pub original_size: u64,
    pub total_chunks: u32,
    pub chunk_size_mb: f64,
    pub version: String,
}

impl ModelMetadata {
    // Remove unused constructors
}
