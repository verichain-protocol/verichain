use sha2::{Digest, Sha256};

pub fn calculate_hash(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

pub fn verify_chunk_integrity(chunk_data: &[u8], expected_hash: &str) -> bool {
    let actual_hash = calculate_hash(chunk_data);
    actual_hash == expected_hash
}
