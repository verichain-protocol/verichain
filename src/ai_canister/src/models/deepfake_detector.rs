use crate::types::api_types::{
    FrameResult,
    DetectionResult,
    MediaType,
    ModelInfo
};
use crate::types::api_types::{
    MODEL_INPUT_SIZE,
    MAX_FILE_SIZE_IMAGE_MB,
    MAX_FILE_SIZE_VIDEO_MB,
    MAX_FRAMES_PER_VIDEO,
    MODEL_CONFIDENCE_THRESHOLD
};

use image::{ImageBuffer, Rgb, DynamicImage, ImageFormat};
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

#[cfg(not(target_arch = "wasm32"))]
use opencv::{core, imgproc, videoio, prelude::*};

pub struct DeepfakeDetector {
    model_data: Vec<u8>,
    initialized: bool,
}

impl DeepfakeDetector {
    // Initialize detector with ONNX model
    pub fn new() -> Result<Self, String> {
        let model_data = Self::load_model_data()?;
        
        Ok(DeepfakeDetector {
            model_data,
            initialized: true,
        })
    }

    // Load ONNX model from assets
    fn load_model_data() -> Result<Vec<u8>, String> {
        let model_bytes = include_bytes!("../../assets/verichain-model.onnx");
        
        if model_bytes.is_empty() {
            return Err("ONNX model file is empty".to_string());
        }
        
        Ok(model_bytes.to_vec())
    }

    // Analyze single image for deepfake detection
    pub fn analyze_image(&self, image_data: &[u8]) -> Result<DetectionResult, String> {
        if !self.initialized {
            return Err("Model not initialized".to_string());
        }

        // Validate file size
        if image_data.len() > MAX_FILE_SIZE_IMAGE_MB as usize * 1024 * 1024 {
            return Err(format!("Image size exceeds {}MB limit", MAX_FILE_SIZE_IMAGE_MB));
        }

        let start_time = std::time::Instant::now();
        
        let image = self.decode_image(image_data)?;
        let preprocessed = self.preprocess_image(image)?;
        let confidence = self.run_onnx_inference(&preprocessed)?;
        
        let processing_time = start_time.elapsed().as_millis() as u64;
        
        Ok(DetectionResult {
            is_deepfake: confidence > MODEL_CONFIDENCE_THRESHOLD,
            confidence,
            media_type: MediaType::Image,
            processing_time_ms: processing_time,
            frames_analyzed: Some(1),
            metadata: Some(serde_json::json!({
                "model_version": "1.0.0",
                "threshold": MODEL_CONFIDENCE_THRESHOLD,
                "input_size": MODEL_INPUT_SIZE,
                "file_size_mb": image_data.len() as f64 / (1024.0 * 1024.0)
            }).to_string()),
        })
    }

    // Analyze video for deepfake detection
    pub fn analyze_video(&self, video_data: &[u8]) -> Result<DetectionResult, String> {
        if !self.initialized {
            return Err("Model not initialized".to_string());
        }

        // Validate file size
        if video_data.len() > MAX_FILE_SIZE_VIDEO_MB as usize * 1024 * 1024 {
            return Err(format!("Video size exceeds {}MB limit", MAX_FILE_SIZE_VIDEO_MB));
        }

        let start_time = std::time::Instant::now();
        
        let frames = self.extract_video_frames(video_data)?;
        
        if frames.is_empty() {
            return Err("No frames extracted from video".to_string());
        }

        let mut frame_results = Vec::new();
        let mut total_confidence = 0.0;
        let mut deepfake_count = 0;

        // Process each extracted frame
        for (index, frame) in frames.iter().enumerate() {
            let preprocessed = self.preprocess_image(frame.clone())?;
            let confidence = self.run_onnx_inference(&preprocessed)?;
            
            let is_deepfake = confidence > MODEL_CONFIDENCE_THRESHOLD;
            if is_deepfake {
                deepfake_count += 1;
            }
            
            total_confidence += confidence;
            
            frame_results.push(FrameResult {
                frame_index: index,
                confidence,
                is_deepfake,
                timestamp_ms: Self::calculate_timestamp(index, &frames),
            });
        }

        let average_confidence = total_confidence / frames.len() as f32;
        let deepfake_percentage = (deepfake_count as f32 / frames.len() as f32) * 100.0;
        
        // Video considered deepfake if >30% of frames are deepfakes
        let is_video_deepfake = deepfake_percentage > 30.0;
        
        let processing_time = start_time.elapsed().as_millis() as u64;

        Ok(DetectionResult {
            is_deepfake: is_video_deepfake,
            confidence: average_confidence,
            media_type: MediaType::Video,
            processing_time_ms: processing_time,
            frames_analyzed: Some(frames.len()),
            metadata: Some(serde_json::json!({
                "model_version": "1.0.0",
                "threshold": MODEL_CONFIDENCE_THRESHOLD,
                "input_size": MODEL_INPUT_SIZE,
                "deepfake_frames": deepfake_count,
                "deepfake_percentage": deepfake_percentage,
                "frame_results": frame_results,
                "file_size_mb": video_data.len() as f64 / (1024.0 * 1024.0)
            }).to_string()),
        })
    }

    // Analyze preprocessed frames from frontend
    pub fn analyze_frames(&self, frames_data: Vec<Vec<u8>>) -> Result<DetectionResult, String> {
        if !self.initialized {
            return Err("Model not initialized".to_string());
        }

        if frames_data.is_empty() {
            return Err("No frames provided".to_string());
        }

        let start_time = std::time::Instant::now();
        let mut frame_results = Vec::new();
        let mut total_confidence = 0.0;
        let mut deepfake_count = 0;

        for (index, frame_data) in frames_data.iter().enumerate() {
            let image = self.decode_image(frame_data)?;
            let preprocessed = self.preprocess_image(image)?;
            let confidence = self.run_onnx_inference(&preprocessed)?;
            
            let is_deepfake = confidence > MODEL_CONFIDENCE_THRESHOLD;
            if is_deepfake {
                deepfake_count += 1;
            }
            
            total_confidence += confidence;
            
            frame_results.push(FrameResult {
                frame_index: index,
                confidence,
                is_deepfake,
                timestamp_ms: (index as u64 * 1000) / 30, // Assuming 30fps
            });
        }

        let average_confidence = total_confidence / frames_data.len() as f32;
        let deepfake_percentage = (deepfake_count as f32 / frames_data.len() as f32) * 100.0;
        let is_video_deepfake = deepfake_percentage > 30.0;
        
        let processing_time = start_time.elapsed().as_millis() as u64;

        Ok(DetectionResult {
            is_deepfake: is_video_deepfake,
            confidence: average_confidence,
            media_type: MediaType::Video,
            processing_time_ms: processing_time,
            frames_analyzed: Some(frames_data.len()),
            metadata: Some(serde_json::json!({
                "model_version": "1.0.0",
                "threshold": MODEL_CONFIDENCE_THRESHOLD,
                "deepfake_frames": deepfake_count,
                "deepfake_percentage": deepfake_percentage,
                "frame_results": frame_results
            }).to_string()),
        })
    }

    // Decode image from bytes or base64
    fn decode_image(&self, image_data: &[u8]) -> Result<DynamicImage, String> {
        // Try base64 decoding first
        if let Ok(decoded) = BASE64.decode(image_data) {
            return image::load_from_memory(&decoded)
                .map_err(|e| format!("Failed to decode base64 image: {}", e));
        }

        // Try raw bytes
        image::load_from_memory(image_data)
            .map_err(|e| format!("Failed to decode image: {}", e))
    }

    // Preprocess image for Vision Transformer
    fn preprocess_image(&self, image: DynamicImage) -> Result<Vec<f32>, String> {
        let resized = image.resize_exact(
            MODEL_INPUT_SIZE.0,
            MODEL_INPUT_SIZE.1,
            image::imageops::FilterType::Lanczos3
        );

        let rgb_image = resized.to_rgb8();
        let mut normalized = Vec::with_capacity(
            (MODEL_INPUT_SIZE.0 * MODEL_INPUT_SIZE.1 * 3) as usize
        );

        // Convert to CHW format and normalize for ViT
        for channel in 0..3 {
            for y in 0..MODEL_INPUT_SIZE.1 {
                for x in 0..MODEL_INPUT_SIZE.0 {
                    let pixel = rgb_image.get_pixel(x, y);
                    let value = (pixel[channel] as f32 / 255.0 - 0.5) / 0.5; // Normalize to [-1, 1]
                    normalized.push(value);
                }
            }
        }

        Ok(normalized)
    }

    // Extract frames from video using OpenCV
    #[cfg(not(target_arch = "wasm32"))]
    fn extract_video_frames(&self, video_data: &[u8]) -> Result<Vec<DynamicImage>, String> {
        use std::io::Write;
        use std::fs;

        let temp_path = format!("/tmp/verichain_video_{}.mp4", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs()
        );

        // Write video to temp file
        let mut temp_file = std::fs::File::create(&temp_path)
            .map_err(|e| format!("Failed to create temp file: {}", e))?;
        
        temp_file.write_all(video_data)
            .map_err(|e| format!("Failed to write video data: {}", e))?;

        let result = self.process_video_file(&temp_path);
        
        // Cleanup
        fs::remove_file(&temp_path).ok();
        
        result
    }

    #[cfg(not(target_arch = "wasm32"))]
    fn process_video_file(&self, video_path: &str) -> Result<Vec<DynamicImage>, String> {
        let mut cap = videoio::VideoCapture::from_file(video_path, videoio::CAP_ANY)
            .map_err(|e| format!("Failed to open video: {}", e))?;

        if !cap.is_opened().unwrap_or(false) {
            return Err("Failed to open video capture".to_string());
        }

        let fps = cap.get(videoio::CAP_PROP_FPS).unwrap_or(30.0);
        let frame_count = cap.get(videoio::CAP_PROP_FRAME_COUNT).unwrap_or(0.0);

        let frame_interval = if frame_count > MAX_FRAMES_PER_VIDEO as f64 {
            (frame_count / MAX_FRAMES_PER_VIDEO as f64).ceil() as i32
        } else {
            1
        };

        let mut frames = Vec::new();
        let mut frame_index = 0;
        let mut mat = Mat::default();

        while frames.len() < MAX_FRAMES_PER_VIDEO {
            let ret = cap.read(&mut mat)
                .map_err(|e| format!("Failed to read frame: {}", e))?;

            if !ret || mat.empty() {
                break;
            }

            if frame_index % frame_interval == 0 {
                let image = self.mat_to_dynamic_image(&mat)?;
                frames.push(image);
            }

            frame_index += 1;
        }

        if frames.is_empty() {
            return Err("No frames extracted from video".to_string());
        }

        Ok(frames)
    }

    // For WASM environment, delegate to frontend
    #[cfg(target_arch = "wasm32")]
    fn extract_video_frames(&self, _video_data: &[u8]) -> Result<Vec<DynamicImage>, String> {
        Err("Video frame extraction not supported in WASM. Use analyze_frames() with preprocessed frames from frontend.".to_string())
    }

    #[cfg(not(target_arch = "wasm32"))]
    fn mat_to_dynamic_image(&self, mat: &Mat) -> Result<DynamicImage, String> {
        let rows = mat.rows();
        let cols = mat.cols();
        
        if rows <= 0 || cols <= 0 {
            return Err("Invalid matrix dimensions".to_string());
        }

        let mut rgb_mat = Mat::default();
        imgproc::cvt_color(mat, &mut rgb_mat, imgproc::COLOR_BGR2RGB, 0)
            .map_err(|e| format!("Failed to convert color: {}", e))?;

        let data = rgb_mat.data_bytes()
            .map_err(|e| format!("Failed to get matrix data: {}", e))?;

        let img_buffer = ImageBuffer::<Rgb<u8>, Vec<u8>>::from_raw(
            cols as u32,
            rows as u32,
            data.to_vec(),
        ).ok_or("Failed to create image buffer")?;

        Ok(DynamicImage::ImageRgb8(img_buffer))
    }

    // ONNX model inference
    fn run_onnx_inference(&self, input_data: &[f32]) -> Result<f32, String> {
        // For production, integrate with onnxruntime-rs
        // This is a placeholder implementation
        
        if input_data.len() != (MODEL_INPUT_SIZE.0 * MODEL_INPUT_SIZE.1 * 3) as usize {
            return Err("Invalid input data size".to_string());
        }

        // Simulate ONNX inference with statistical analysis
        let mean = input_data.iter().sum::<f32>() / input_data.len() as f32;
        let variance = input_data.iter()
            .map(|x| (x - mean).powi(2))
            .sum::<f32>() / input_data.len() as f32;
        
        // Simple heuristic for deepfake detection
        let edge_detection_score = self.calculate_edge_score(input_data);
        let texture_score = self.calculate_texture_score(input_data);
        
        let confidence = ((variance * 0.4) + (edge_detection_score * 0.3) + (texture_score * 0.3))
            .min(1.0)
            .max(0.0);
        
        Ok(confidence)
    }

    // Calculate edge detection score
    fn calculate_edge_score(&self, input_data: &[f32]) -> f32 {
        let width = MODEL_INPUT_SIZE.0 as usize;
        let height = MODEL_INPUT_SIZE.1 as usize;
        
        let mut edge_score = 0.0;
        let mut count = 0;
        
        for y in 1..height-1 {
            for x in 1..width-1 {
                let idx = y * width + x;
                if idx < input_data.len() {
                    let center = input_data[idx];
                    let left = input_data[idx - 1];
                    let right = input_data[idx + 1];
                    let top = input_data[idx - width];
                    let bottom = input_data[idx + width];
                    
                    let gradient = ((right - left).abs() + (bottom - top).abs()) / 2.0;
                    edge_score += gradient;
                    count += 1;
                }
            }
        }
        
        if count > 0 {
            edge_score / count as f32
        } else {
            0.0
        }
    }

    // Calculate texture score
    fn calculate_texture_score(&self, input_data: &[f32]) -> f32 {
        let mut texture_score = 0.0;
        let window_size = 5;
        let width = MODEL_INPUT_SIZE.0 as usize;
        let height = MODEL_INPUT_SIZE.1 as usize;
        
        for y in window_size..height-window_size {
            for x in window_size..width-window_size {
                let mut local_variance = 0.0;
                let mut local_mean = 0.0;
                let mut count = 0;
                
                for dy in -(window_size as i32)..(window_size as i32) {
                    for dx in -(window_size as i32)..(window_size as i32) {
                        let ny = (y as i32 + dy) as usize;
                        let nx = (x as i32 + dx) as usize;
                        let idx = ny * width + nx;
                        
                        if idx < input_data.len() {
                            local_mean += input_data[idx];
                            count += 1;
                        }
                    }
                }
                
                if count > 0 {
                    local_mean /= count as f32;
                    
                    for dy in -(window_size as i32)..(window_size as i32) {
                        for dx in -(window_size as i32)..(window_size as i32) {
                            let ny = (y as i32 + dy) as usize;
                            let nx = (x as i32 + dx) as usize;
                            let idx = ny * width + nx;
                            
                            if idx < input_data.len() {
                                local_variance += (input_data[idx] - local_mean).powi(2);
                            }
                        }
                    }
                    
                    local_variance /= count as f32;
                    texture_score += local_variance;
                }
            }
        }
        
        texture_score / ((height - 2 * window_size) * (width - 2 * window_size)) as f32
    }

    // Calculate timestamp for video frame
    fn calculate_timestamp(frame_index: usize, frames: &[DynamicImage]) -> u64 {
        let assumed_fps = 30.0;
        (frame_index as f64 * 1000.0 / assumed_fps) as u64
    }

    // Get model information
    pub fn get_model_info(&self) -> ModelInfo {
        ModelInfo {
            version: "1.0.0".to_string(),
            input_size: MODEL_INPUT_SIZE,
            supported_formats: vec![
                "jpg".to_string(),
                "jpeg".to_string(),
                "png".to_string(),
                "mp4".to_string(),
                "mov".to_string(),
            ],
            max_file_size_mb: MAX_FILE_SIZE_VIDEO_MB as u32,
            confidence_threshold: MODEL_CONFIDENCE_THRESHOLD,
        }
    }

    // Health check
    pub fn health_check(&self) -> bool {
        self.initialized && !self.model_data.is_empty()
    }

    // Validate file format
    pub fn validate_file_format(&self, filename: &str) -> bool {
        let supported_extensions = ["jpg", "jpeg", "png", "mp4", "mov"];
        
        if let Some(extension) = filename.split('.').last() {
            supported_extensions.contains(&extension.to_lowercase().as_str())
        } else {
            false
        }
    }
}

impl Default for DeepfakeDetector {
    fn default() -> Self {
        Self::new().unwrap_or_else(|_| DeepfakeDetector {
            model_data: Vec::new(),
            initialized: false,
        })
    }
}