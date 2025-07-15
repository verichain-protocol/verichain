use crate::types::*;
use std::collections::HashSet;

pub struct MediaProcessor;

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
    pub fn get_file_extension(filename: &str) -> Option<&str> {
        filename.split('.').last()
    }

    // Validate media input comprehensively
    pub fn validate_media_input(input: &MediaInput) -> Result<(), VeriChainError> {
        // Check filename
        if input.filename.is_empty() {
            return Err(VeriChainError::InvalidInput("Filename is empty".to_string()));
        }

        // Check file extension
        if !Self::validate_media_type(&input.filename) {
            return Err(VeriChainError::UnsupportedMediaType);
        }

        // Check file size
        let media_type = Self::get_media_type(&input.filename);
        let max_size = match media_type.as_str() {
            "image" => MAX_FILE_SIZE_IMAGE_MB,
            "video" => MAX_FILE_SIZE_VIDEO_MB,
            _ => return Err(VeriChainError::UnsupportedMediaType),
        };

        if !Self::validate_file_size(&input.data, max_size) {
            return Err(VeriChainError::FileTooLarge);
        }

        // Check if data is empty
        if input.data.is_empty() {
            return Err(VeriChainError::InvalidInput("File data is empty".to_string()));
        }

        // Basic magic number validation
        if !Self::validate_magic_numbers(&input.data, &media_type) {
            return Err(VeriChainError::InvalidInput("Invalid file format".to_string()));
        }

        Ok(())
    }

    // Validate file magic numbers
    fn validate_magic_numbers(data: &[u8], media_type: &str) -> bool {
        if data.len() < 8 {
            return false;
        }

        match media_type {
            "image" => {
                // JPEG magic numbers
                if data.len() >= 3 && data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF {
                    return true;
                }
                
                // PNG magic numbers
                if data.len() >= 8 && data[0..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] {
                    return true;
                }
                
                false
            }
            "video" => {
                // MP4 magic numbers (ftyp)
                if data.len() >= 8 && data[4..8] == [0x66, 0x74, 0x79, 0x70] {
                    return true;
                }
                
                // MOV magic numbers (also ftyp)
                if data.len() >= 8 && data[4..8] == [0x66, 0x74, 0x79, 0x70] {
                    return true;
                }
                
                false
            }
            _ => false,
        }
    }

    // Get file size in MB
    pub fn get_file_size_mb(data: &[u8]) -> f64 {
        data.len() as f64 / (1024.0 * 1024.0)
    }

    // Get recommended compression settings
    pub fn get_compression_settings(media_type: &str) -> CompressionSettings {
        match media_type {
            "image" => CompressionSettings {
                quality: 85,
                max_width: 1920,
                max_height: 1080,
                format: "jpeg".to_string(),
            },
            "video" => CompressionSettings {
                quality: 75,
                max_width: 1280,
                max_height: 720,
                format: "mp4".to_string(),
            },
            _ => CompressionSettings::default(),
        }
    }

    // Extract metadata from media
    pub fn extract_metadata(data: &[u8], media_type: &str) -> MediaMetadata {
        let file_size = data.len();
        let file_size_mb = Self::get_file_size_mb(data);
        
        MediaMetadata {
            file_size,
            file_size_mb,
            media_type: media_type.to_string(),
            estimated_processing_time_ms: Self::estimate_processing_time(file_size_mb, media_type),
            compression_recommended: Self::should_compress(file_size_mb, media_type),
        }
    }

    // Estimate processing time based on file size and type
    fn estimate_processing_time(file_size_mb: f64, media_type: &str) -> u64 {
        match media_type {
            "image" => {
                // Base time: 500ms, additional 100ms per MB
                (500.0 + (file_size_mb * 100.0)) as u64
            }
            "video" => {
                // Base time: 2000ms, additional 1000ms per MB
                (2000.0 + (file_size_mb * 1000.0)) as u64
            }
            _ => 1000,
        }
    }

    // Check if compression is recommended
    fn should_compress(file_size_mb: f64, media_type: &str) -> bool {
        match media_type {
            "image" => file_size_mb > 5.0,
            "video" => file_size_mb > 20.0,
            _ => false,
        }
    }

    // Validate batch input
    pub fn validate_batch_input(input: &BatchAnalysisInput) -> Result<(), VeriChainError> {
        if input.media_items.is_empty() {
            return Err(VeriChainError::InvalidInput("Batch is empty".to_string()));
        }

        if input.media_items.len() > MAX_BATCH_SIZE {
            return Err(VeriChainError::InvalidInput(
                format!("Batch size exceeds maximum of {}", MAX_BATCH_SIZE)
            ));
        }

        // Calculate total size
        let total_size: usize = input.media_items.iter()
            .map(|item| item.data.len())
            .sum();
        
        let total_size_mb = total_size as f64 / (1024.0 * 1024.0);
        
        // Maximum batch size: 500MB
        if total_size_mb > 500.0 {
            return Err(VeriChainError::InvalidInput(
                "Total batch size exceeds 500MB limit".to_string()
            ));
        }

        // Validate each item
        for (index, item) in input.media_items.iter().enumerate() {
            if let Err(e) = Self::validate_media_input(item) {
                return Err(VeriChainError::InvalidInput(
                    format!("Item {} validation failed: {}", index, e)
                ));
            }
        }

        Ok(())
    }

    // Get supported formats
    pub fn get_supported_formats() -> Vec<String> {
        SUPPORTED_IMAGE_FORMATS.iter()
            .chain(SUPPORTED_VIDEO_FORMATS.iter())
            .map(|&s| s.to_string())
            .collect()
    }

    // Check if format is supported
    pub fn is_format_supported(extension: &str) -> bool {
        let ext_lower = extension.to_lowercase();
        SUPPORTED_IMAGE_FORMATS.contains(&ext_lower.as_str()) ||
        SUPPORTED_VIDEO_FORMATS.contains(&ext_lower.as_str())
    }

    // Get maximum file size for media type
    pub fn get_max_file_size(media_type: &str) -> u32 {
        match media_type {
            "image" => MAX_FILE_SIZE_IMAGE_MB,
            "video" => MAX_FILE_SIZE_VIDEO_MB,
            _ => 0,
        }
    }
}

// Helper structs
#[derive(Debug, Clone)]
pub struct CompressionSettings {
    pub quality: u8,
    pub max_width: u32,
    pub max_height: u32,
    pub format: String,
}

impl Default for CompressionSettings {
    fn default() -> Self {
        Self {
            quality: 80,
            max_width: 1920,
            max_height: 1080,
            format: "jpeg".to_string(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct MediaMetadata {
    pub file_size: usize,
    pub file_size_mb: f64,
    pub media_type: String,
    pub estimated_processing_time_ms: u64,
    pub compression_recommended: bool,
}

// Unit tests
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_media_type() {
        assert!(MediaProcessor::validate_media_type("image.jpg"));
        assert!(MediaProcessor::validate_media_type("video.mp4"));
        assert!(!MediaProcessor::validate_media_type("document.pdf"));
        assert!(!MediaProcessor::validate_media_type(""));
    }

    #[test]
    fn test_get_media_type() {
        assert_eq!(MediaProcessor::get_media_type("test.jpg"), "image");
        assert_eq!(MediaProcessor::get_media_type("test.mp4"), "video");
        assert_eq!(MediaProcessor::get_media_type("test.pdf"), "unknown");
    }

    #[test]
    fn test_file_size_validation() {
        let small_data = vec![0u8; 1024]; // 1KB
        let large_data = vec![0u8; 11 * 1024 * 1024]; // 11MB
        
        assert!(MediaProcessor::validate_file_size(&small_data, 10));
        assert!(!MediaProcessor::validate_file_size(&large_data, 10));
    }

    #[test]
    fn test_magic_number_validation() {
        // JPEG magic numbers
        let jpeg_data = vec![0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46];
        assert!(MediaProcessor::validate_magic_numbers(&jpeg_data, "image"));
        
        // PNG magic numbers
        let png_data = vec![0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        assert!(MediaProcessor::validate_magic_numbers(&png_data, "image"));
        
        // Invalid data
        let invalid_data = vec![0x00, 0x00, 0x00, 0x00];
        assert!(!MediaProcessor::validate_magic_numbers(&invalid_data, "image"));
    }
}