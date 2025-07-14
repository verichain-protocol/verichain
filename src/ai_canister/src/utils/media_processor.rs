pub struct MediaProcessor;

impl MediaProcessor {
    pub fn validate_media_type(filename: &str) -> bool {
        let allowed_extensions = ["jpg", "jpeg", "png", "mp4", "mov"];
        
        if let Some(extension) = filename.split('.').last() {
            allowed_extensions.contains(&extension.to_lowercase().as_str())
        } else {
            false
        }
    }

    pub fn get_media_type(filename: &str) -> String {
        match filename.split('.').last() {
            Some("jpg") | Some("jpeg") | Some("png") => "image".to_string(),
            Some("mp4") | Some("mov") => "video".to_string(),
            _ => "unknown".to_string(),
        }
    }

    pub fn validate_file_size(data: &[u8], max_size_mb: usize) -> bool {
        let max_size_bytes = max_size_mb * 1024 * 1024;
        data.len() <= max_size_bytes
    }
}