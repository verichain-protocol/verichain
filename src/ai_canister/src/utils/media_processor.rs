use crate::types::*;
use std::collections::HashSet;

#[allow(dead_code)]
pub struct MediaProcessor;

#[allow(dead_code)]
impl MediaProcessor {
    // Validate media type based on file extension
    pub fn validate_media_type(filename: &str) -> bool {
        let supported_formats: HashSet<&str> = SUPPORTED_IMAGE_FORMATS.iter()
            .chain(SUPPORTED_VIDEO_FORMATS.iter())
            .copied()
            .collect();
        
        Self::get_file_extension(filename)
            .map(|ext| supported_formats.contains(&ext.to_lowercase().as_str()))
            .unwrap_or(false)
    }

    // Validate file size
    pub fn validate_file_size(data: &[u8], max_size_mb: u32) -> bool {
        let file_size_mb = data.len() as f64 / (1024.0 * 1024.0);
        file_size_mb <= max_size_mb as f64
    }

    // Get media type (image/video)
    pub fn get_media_type(filename: &str) -> String {
        if let Some(ext) = Self::get_file_extension(filename) {
            let ext_lower = ext.to_lowercase();
            
            if SUPPORTED_IMAGE_FORMATS.contains(&ext_lower.as_str()) {
                return "image".to_string();
            } else if SUPPORTED_VIDEO_FORMATS.contains(&ext_lower.as_str()) {
                return "video".to_string();
            }
        }
        
        "unknown".to_string()
    }

    // Get file extension
    fn get_file_extension(filename: &str) -> Option<&str> {
        filename.split('.').last()
    }
}
