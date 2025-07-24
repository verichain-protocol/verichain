use crate::types::{ModelChunk, ModelMetadata};
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use candid::CandidType;

#[derive(Default, Clone, Serialize, Deserialize, CandidType)]
pub struct ModelStorage {
    chunks: HashMap<u32, ModelChunk>,
    metadata: Option<ModelMetadata>,
    model_data: Option<Vec<u8>>,
    upload_complete: bool,
    initialization_started: bool,
    is_initialized: bool,
    total_chunks: u32,
    uploaded_chunks: u32,
    processed_chunks: u32,
}

impl ModelStorage {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn store_chunk(&mut self, chunk: ModelChunk) -> Result<(), String> {
        if self.chunks.contains_key(&chunk.id) {
            return Err(format!("Chunk {} already exists", chunk.id));
        }
        
        self.chunks.insert(chunk.id, chunk);
        self.uploaded_chunks = self.chunks.len() as u32;
        
        // Check if upload is complete
        if let Some(metadata) = &self.metadata {
            self.upload_complete = self.uploaded_chunks >= metadata.total_chunks;
        }
        
        Ok(())
    }

    pub fn store_metadata(&mut self, metadata: ModelMetadata) -> Result<(), String> {
        self.total_chunks = metadata.total_chunks;
        self.metadata = Some(metadata);
        
        // Recheck upload completion status
        self.upload_complete = self.uploaded_chunks >= self.total_chunks;
        
        Ok(())
    }

    pub fn get_metadata(&self) -> Option<&ModelMetadata> {
        self.metadata.as_ref()
    }

    pub fn is_upload_complete(&self) -> bool {
        self.upload_complete && self.uploaded_chunks == self.total_chunks
    }

    pub fn get_missing_chunks(&self) -> Vec<u32> {
        let mut missing = Vec::new();
        for i in 0..self.total_chunks {
            if !self.chunks.contains_key(&i) {
                missing.push(i);
            }
        }
        missing
    }

    pub fn start_initialization(&mut self) -> Result<(), String> {
        if !self.is_upload_complete() {
            return Err("Cannot start initialization: upload not complete".to_string());
        }
        
        if self.initialization_started {
            return Err("Initialization already started".to_string());
        }
        
        self.initialization_started = true;
        self.processed_chunks = 0;
        Ok(())
    }

    pub fn process_chunks_batch(&mut self, batch_size: u32) -> Result<u32, String> {
        if !self.initialization_started {
            return Err("Initialization not started".to_string());
        }
        
        if self.is_initialized {
            return Err("Model already initialized".to_string());
        }
        
        let start_chunk = self.processed_chunks;
        let end_chunk = std::cmp::min(start_chunk + batch_size, self.total_chunks);
        
        let mut model_data = self.model_data.take().unwrap_or_default();
        
        // Process chunks in order
        for chunk_id in start_chunk..end_chunk {
            if let Some(chunk) = self.chunks.get(&chunk_id) {
                model_data.extend_from_slice(&chunk.data);
                self.processed_chunks += 1;
            } else {
                return Err(format!("Missing chunk {} during initialization", chunk_id));
            }
        }
        
        self.model_data = Some(model_data);
        
        // Check if initialization is complete
        if self.processed_chunks >= self.total_chunks {
            self.is_initialized = true;
        }
        
        Ok(end_chunk - start_chunk)
    }

    pub fn get_model_data(&self) -> Option<&Vec<u8>> {
        self.model_data.as_ref()
    }

    pub fn is_initialized(&self) -> bool {
        self.is_initialized
    }

    pub fn get_initialization_progress(&self) -> (u32, u32) {
        (self.processed_chunks, self.total_chunks)
    }

    pub fn get_current_size_mb(&self) -> f64 {
        if let Some(data) = &self.model_data {
            data.len() as f64 / (1024.0 * 1024.0)
        } else {
            0.0
        }
    }

    pub fn get_estimated_total_size_mb(&self) -> f64 {
        if let Some(metadata) = &self.metadata {
            metadata.original_size as f64 / (1024.0 * 1024.0)
        } else {
            0.0
        }
    }

    pub fn get_upload_stats(&self) -> (u32, u32, Vec<u32>, bool, f64) {
        (
            self.total_chunks,
            self.uploaded_chunks,
            self.get_missing_chunks(),
            self.upload_complete,
            self.get_estimated_total_size_mb(),
        )
    }
}
