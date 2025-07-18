/// VeriChain Model Metadata Management
/// 
/// Handles model chunk metadata and assembly information for efficient
/// model loading on Internet Computer Protocol.

use serde::{Deserialize, Serialize};

/// Metadata structure for AI model management
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ModelMetadata {
    pub original_file: String,
    pub original_size: u64, 
    pub total_chunks: u32,
    pub chunk_size_mb: u32,
    pub chunks: Vec<ChunkInfo>,
}

/// Individual chunk information for model assembly
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ChunkInfo {
    pub chunk_id: u32,
    pub filename: String,
    pub size: u64,
    pub hash: String,
}

impl ModelMetadata {
    /// Create new model metadata
    #[allow(dead_code)]
    pub fn new(
        original_file: String,
        original_size: u64,
        total_chunks: u32,
        chunk_size_mb: u32,
    ) -> Self {
        Self {
            original_file,
            original_size,
            total_chunks,
            chunk_size_mb,
            chunks: Vec::new(),
        }
    }

    /// Add chunk information
    #[allow(dead_code)]
    pub fn add_chunk(&mut self, chunk: ChunkInfo) {
        self.chunks.push(chunk);
    }

    /// Verify all chunks are present
    #[allow(dead_code)]
    pub fn is_complete(&self) -> bool {
        self.chunks.len() == self.total_chunks as usize
    }

    /// Get total chunks uploaded
    #[allow(dead_code)]
    pub fn chunks_uploaded(&self) -> u32 {
        self.chunks.len() as u32
    }

    /// Validate chunk integrity
    #[allow(dead_code)]
    pub fn validate_chunk(&self, chunk_id: u32, hash: &str) -> bool {
        self.chunks
            .iter()
            .find(|c| c.chunk_id == chunk_id)
            .map(|c| c.hash == hash)
            .unwrap_or(false)
    }
}

impl ChunkInfo {
    /// Create new chunk info
    #[allow(dead_code)]
    pub fn new(chunk_id: u32, filename: String, size: u64, hash: String) -> Self {
        Self {
            chunk_id,
            filename,
            size,
            hash,
        }
    }
}
