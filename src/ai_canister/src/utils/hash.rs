/// VeriChain Hash Utilities
/// 
/// Utility functions for hashing, checksums, and data integrity verification.

use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Calculate SHA256 hash of data
pub fn calculate_sha256(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

/// Verify data integrity using SHA256
#[allow(dead_code)]
pub fn verify_integrity(data: &[u8], expected_hash: &str) -> bool {
    let actual_hash = calculate_sha256(data);
    actual_hash == expected_hash
}

/// Simple checksum for chunk verification
#[allow(dead_code)]
pub fn calculate_checksum(data: &[u8]) -> u32 {
    data.iter().fold(0u32, |acc, &byte| {
        acc.wrapping_add(byte as u32)
    })
}

/// Verify chunk integrity using simple checksum
#[allow(dead_code)]
pub fn verify_chunk_checksum(data: &[u8], expected_checksum: u32) -> bool {
    calculate_checksum(data) == expected_checksum
}

/// Hash utility for model chunks management
#[allow(dead_code)]
pub struct ChunkHasher {
    chunk_hashes: HashMap<u32, String>,
}

impl ChunkHasher {
    /// Create new chunk hasher
    pub fn new() -> Self {
        Self {
            chunk_hashes: HashMap::new(),
        }
    }

    /// Add chunk hash
    #[allow(dead_code)]
    pub fn add_chunk_hash(&mut self, chunk_id: u32, data: &[u8]) {
        let hash = calculate_sha256(data);
        self.chunk_hashes.insert(chunk_id, hash);
    }

    /// Verify chunk against stored hash
    #[allow(dead_code)]
    pub fn verify_chunk(&self, chunk_id: u32, data: &[u8]) -> bool {
        if let Some(expected_hash) = self.chunk_hashes.get(&chunk_id) {
            verify_integrity(data, expected_hash)
        } else {
            false
        }
    }

    /// Get all chunk hashes
    #[allow(dead_code)]
    pub fn get_chunk_hashes(&self) -> &HashMap<u32, String> {
        &self.chunk_hashes
    }

    /// Clear all stored hashes
    #[allow(dead_code)]
    pub fn clear(&mut self) {
        self.chunk_hashes.clear();
    }
}

impl Default for ChunkHasher {
    fn default() -> Self {
        Self::new()
    }
}
