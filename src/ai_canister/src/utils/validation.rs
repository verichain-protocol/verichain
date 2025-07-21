const MAX_IMAGE_SIZE: usize = 10 * 1024 * 1024; // 10MB
const MIN_IMAGE_SIZE: usize = 1024; // 1KB

pub fn validate_image_data(data: &[u8]) -> Result<(), String> {
    if data.is_empty() {
        return Err("Image data is empty".to_string());
    }
    
    if data.len() < MIN_IMAGE_SIZE {
        return Err(format!("Image too small: {} bytes (minimum {} bytes)", 
                          data.len(), MIN_IMAGE_SIZE));
    }
    
    if data.len() > MAX_IMAGE_SIZE {
        return Err(format!("Image too large: {} bytes (maximum {} bytes)", 
                          data.len(), MAX_IMAGE_SIZE));
    }
    
    // Check for common image format headers
    if !is_supported_format(data) {
        return Err("Unsupported image format. Only PNG, JPEG, and JPG are supported".to_string());
    }
    
    Ok(())
}

pub fn is_supported_format(data: &[u8]) -> bool {
    if data.len() < 8 {
        return false;
    }
    
    // PNG magic bytes
    if data.starts_with(&[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) {
        return true;
    }
    
    // JPEG magic bytes
    if data.starts_with(&[0xFF, 0xD8, 0xFF]) {
        return true;
    }
    
    false
}

pub fn validate_chunk_id(chunk_id: u32, total_chunks: u32) -> Result<(), String> {
    if chunk_id >= total_chunks {
        return Err(format!("Invalid chunk ID: {} (total chunks: {})", 
                          chunk_id, total_chunks));
    }
    Ok(())
}

pub fn validate_batch_size(batch_size: u32) -> Result<(), String> {
    const MIN_BATCH_SIZE: u32 = 1;
    const MAX_BATCH_SIZE: u32 = 200;
    
    if batch_size < MIN_BATCH_SIZE {
        return Err(format!("Batch size too small: {} (minimum: {})", 
                          batch_size, MIN_BATCH_SIZE));
    }
    
    if batch_size > MAX_BATCH_SIZE {
        return Err(format!("Batch size too large: {} (maximum: {})", 
                          batch_size, MAX_BATCH_SIZE));
    }
    
    Ok(())
}
