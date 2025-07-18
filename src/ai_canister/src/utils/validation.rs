/// VeriChain Validation Utilities
/// 
/// Utility functions for input validation and data sanitization.

use crate::types::{
    MAX_FILE_SIZE_IMAGE_MB, 
    MAX_FILE_SIZE_VIDEO_MB,
    SUPPORTED_IMAGE_FORMATS,
    SUPPORTED_VIDEO_FORMATS,
};

/// Validate image file
pub fn validate_image(filename: &str, data: &[u8]) -> Result<(), String> {
    // Check file size
    let max_size = (MAX_FILE_SIZE_IMAGE_MB * 1024 * 1024) as usize;
    if data.len() > max_size {
        return Err(format!("Image too large: {}MB max", MAX_FILE_SIZE_IMAGE_MB));
    }

    // Check file extension
    if let Some(ext) = get_file_extension(filename) {
        if !SUPPORTED_IMAGE_FORMATS.contains(&ext.as_str()) {
            return Err(format!("Unsupported image format: {}", ext));
        }
    } else {
        return Err("No file extension found".to_string());
    }

    // Basic magic number check
    if !is_valid_image_format(data) {
        return Err("Invalid image file format".to_string());
    }

    Ok(())
}

/// Validate video file
#[allow(dead_code)]
pub fn validate_video(filename: &str, data: &[u8]) -> Result<(), String> {
    // Check file size
    let max_size = (MAX_FILE_SIZE_VIDEO_MB * 1024 * 1024) as usize;
    if data.len() > max_size {
        return Err(format!("Video too large: {}MB max", MAX_FILE_SIZE_VIDEO_MB));
    }

    // Check file extension
    if let Some(ext) = get_file_extension(filename) {
        if !SUPPORTED_VIDEO_FORMATS.contains(&ext.as_str()) {
            return Err(format!("Unsupported video format: {}", ext));
        }
    } else {
        return Err("No file extension found".to_string());
    }

    Ok(())
}

/// Get file extension from filename
pub fn get_file_extension(filename: &str) -> Option<String> {
    filename
        .rfind('.')
        .and_then(|pos| {
            let ext = &filename[pos + 1..];
            if ext.is_empty() {
                None
            } else {
                Some(ext.to_lowercase())
            }
        })
}

/// Check if data has valid image magic numbers
pub fn is_valid_image_format(data: &[u8]) -> bool {
    if data.len() < 4 {
        return false;
    }

    // JPEG magic numbers
    if data.starts_with(&[0xFF, 0xD8, 0xFF]) {
        return true;
    }

    // PNG magic numbers
    if data.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
        return true;
    }

    false
}

/// Sanitize filename for security
#[allow(dead_code)]
pub fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '-' || *c == '_')
        .collect::<String>()
        .trim_matches('.')
        .to_string()
}
