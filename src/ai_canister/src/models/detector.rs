/// VeriChain Deepfake Detector
/// 
/// Main detection logic coordinating model loading, preprocessing,
/// and inference for optimal performance on Internet Computer Protocol.

use super::{
    metadata::ModelMetadata,
    onnx_model::{VeriChainONNXModel, ONNXNode},
    inference::InferenceEngine,
};
use crate::types::{
    FrameResult,
    DetectionResult, 
    MediaType,
    MODEL_INPUT_SIZE,
    MAX_FILE_SIZE_IMAGE_MB,
    MAX_FILE_SIZE_VIDEO_MB,
};
use crate::utils::{validate_image, PerformanceMonitor, calculate_sha256};
use serde_json;
use image::DynamicImage;
use std::collections::HashMap;

/// Main deepfake detector coordinating all components
pub struct DeepfakeDetector {
    model: Option<VeriChainONNXModel>,
    inference_engine: InferenceEngine,
    chunks: HashMap<u32, Vec<u8>>,
    metadata: Option<ModelMetadata>,
    model_initialized: bool,
}

impl DeepfakeDetector {
    /// Create new detector instance
    pub fn new() -> Self {
        Self {
            model: None,
            inference_engine: InferenceEngine::new(),
            chunks: HashMap::new(),
            metadata: None,
            model_initialized: false,
        }
    }

    /// Analyze image for deepfake detection with performance monitoring
    pub fn analyze_image(&mut self, image_data: &[u8], filename: Option<&str>) -> Result<DetectionResult, String> {
        let mut perf = PerformanceMonitor::new();
        
        if !self.model_initialized {
            return Err("Model not initialized".to_string());
        }

        // Validate input using utility function
        if let Some(fname) = filename {
            validate_image(fname, image_data)?;
        } else {
            // Basic validation without filename
            let max_size = (MAX_FILE_SIZE_IMAGE_MB * 1024 * 1024) as usize;
            if image_data.len() > max_size {
                return Err(format!("Image too large: {}MB max", MAX_FILE_SIZE_IMAGE_MB));
            }
        }
        
        perf.checkpoint("validation");

        // Load and preprocess image
        let image = image::load_from_memory(image_data)
            .map_err(|e| format!("Failed to load image: {}", e))?;

        let preprocessed = self.preprocess_image(image)?;
        perf.checkpoint("preprocessing");

        // Run inference
        let model = self.model.as_ref()
            .ok_or("Model not loaded")?;

        let mut result = self.inference_engine.execute_inference(model, preprocessed)?;
        perf.checkpoint("inference");

        // Add performance metadata
        if let Some(ref mut metadata) = result.metadata {
            let mut meta: serde_json::Value = serde_json::from_str(metadata)
                .unwrap_or_else(|_| serde_json::json!({}));
            meta["performance"] = serde_json::json!({
                "total_cycles": perf.total_cycles(),
                "performance_report": perf.get_report()
            });
            result.metadata = Some(meta.to_string());
        }

        Ok(result)
    }

    /// Analyze video for deepfake detection
    pub fn analyze_video(&mut self, video_data: &[u8]) -> Result<DetectionResult, String> {
        if !self.model_initialized {
            return Err("Model not initialized".to_string());
        }

        // Validate input
        if video_data.is_empty() {
            return Err("Empty video data".to_string());
        }

        let max_size = (MAX_FILE_SIZE_VIDEO_MB * 1024 * 1024) as usize;
        if video_data.len() > max_size {
            return Err(format!("Video too large: {}MB max", MAX_FILE_SIZE_VIDEO_MB));
        }

        // Extract key frames for analysis
        let frames = self.extract_key_frames(video_data)?;
        if frames.is_empty() {
            return Err("No frames extracted from video".to_string());
        }

        self.analyze_frames(frames)
    }

    /// Analyze extracted frames
    pub fn analyze_frames(&mut self, frames: Vec<Vec<u8>>) -> Result<DetectionResult, String> {
        if !self.model_initialized {
            return Err("Model not initialized".to_string());
        }

        if frames.is_empty() {
            return Err("No frames provided".to_string());
        }

        let mut frame_results = Vec::new();
        let mut total_confidence = 0.0;
        let mut deepfake_count = 0;

        for (idx, frame_data) in frames.iter().enumerate() {
            match self.analyze_image(frame_data, None) {
                Ok(result) => {
                    total_confidence += result.confidence;
                    if result.is_deepfake {
                        deepfake_count += 1;
                    }
                    
                    frame_results.push(FrameResult {
                        frame_index: idx,
                        confidence: result.confidence,
                        is_deepfake: result.is_deepfake,
                        timestamp_ms: (idx as u64) * 1000, // Assume 1 frame per second
                    });
                }
                Err(e) => {
                    return Err(format!("Frame {} analysis failed: {}", idx, e));
                }
            }
        }

        // Aggregate results
        let avg_confidence = total_confidence / frames.len() as f32;
        let deepfake_ratio = deepfake_count as f32 / frames.len() as f32;
        let is_deepfake = deepfake_ratio > 0.5;

        // Create metadata
        let metadata = serde_json::json!({
            "frames_analyzed": frames.len(),
            "deepfake_frames": deepfake_count,
            "deepfake_ratio": deepfake_ratio,
            "average_confidence": avg_confidence,
            "frame_results": frame_results,
            "analysis_type": "multi_frame"
        });

        Ok(DetectionResult {
            is_deepfake,
            confidence: avg_confidence,
            media_type: MediaType::Video,
            processing_time_ms: 0,
            frames_analyzed: Some(frames.len()),
            metadata: Some(metadata.to_string()),
        })
    }

    /// Initialize model from uploaded chunks
    pub fn initialize_from_chunks(&mut self) -> Result<(), String> {
        if self.chunks.is_empty() {
            return Err("No chunks uploaded".to_string());
        }

        // Assemble model data
        let model_data = self.assemble_chunks()?;
        
        // Initialize model
        self.initialize_model(model_data)?;
        self.model_initialized = true;

        Ok(())
    }

    /// Get upload status
    pub fn get_upload_status(&self) -> (u32, u32, bool) {
        let chunks_uploaded = self.chunks.len() as u32;
        let total_chunks = self.metadata
            .as_ref()
            .map(|m| m.total_chunks)
            .unwrap_or(410); // Default for 327MB model
        
        let upload_complete = chunks_uploaded >= total_chunks;
        (chunks_uploaded, total_chunks, upload_complete)
    }

    /// Start streaming initialization (compatibility method)
    pub fn start_streaming_initialization(&mut self) -> Result<(), String> {
        self.initialize_from_chunks()
    }

    /// Continue streaming initialization with batch processing
    pub fn continue_streaming_initialization(&mut self, _batch_size: u32) -> Result<(u32, u32), String> {
        let (uploaded, total, _) = self.get_upload_status();
        Ok((uploaded, total))
    }

    /// Get initialization status
    pub fn get_initialization_status(&self) -> Result<crate::types::InitializationStatus, String> {
        let (uploaded, total, complete) = self.get_upload_status();
        let current_size_mb = (uploaded as f64 * 0.8).max(0.0); // Estimate based on 800KB chunks
        let estimated_total_mb = (total as f64 * 0.8).max(327.0); // Default to 327MB
        
        Ok(crate::types::InitializationStatus {
            is_initialized: self.model_initialized,
            is_streaming: false, // streaming flag
            processed_chunks: uploaded,
            total_chunks: total,
            current_size_mb,
            estimated_total_size_mb: estimated_total_mb,
            initialization_started: complete,
        })
    }

    /// Get loading statistics
    pub fn get_loading_stats(&self) -> Result<String, String> {
        let (uploaded, total, complete) = self.get_upload_status();
        let stats = serde_json::json!({
            "chunks_uploaded": uploaded,
            "total_chunks": total,
            "upload_complete": complete,
            "model_initialized": self.model_initialized,
            "estimated_size_mb": uploaded as f64 * 0.8
        });
        Ok(stats.to_string())
    }

    /// Calculate SHA256 hash for chunk verification
    pub fn calculate_sha256(data: &[u8]) -> String {
        calculate_sha256(data)
    }

    /// Verify model integrity
    pub fn verify_model_integrity(&self) -> Result<bool, String> {
        let model = self.model.as_ref()
            .ok_or("Model not loaded")?;

        Ok(model.validate())
    }

    /// Preprocess image for model input
    fn preprocess_image(&self, image: DynamicImage) -> Result<Vec<f32>, String> {
        // Resize to model input size
        let resized = image.resize_exact(
            MODEL_INPUT_SIZE.0 as u32,
            MODEL_INPUT_SIZE.1 as u32,
            image::imageops::FilterType::Lanczos3,
        );

        // Convert to RGB
        let rgb_image = resized.to_rgb8();
        
        // Normalize pixel values to [0, 1] and convert to CHW format
        let mut pixels = Vec::with_capacity((3 * MODEL_INPUT_SIZE.0 * MODEL_INPUT_SIZE.1) as usize);
        
        // Channel-first format: R, G, B channels separately
        for channel in 0..3 {
            for pixel in rgb_image.pixels() {
                let value = pixel[channel] as f32 / 255.0;
                pixels.push(value);
            }
        }

        Ok(pixels)
    }

    /// Extract key frames from video (simplified for ICP efficiency)
    fn extract_key_frames(&self, _video_data: &[u8]) -> Result<Vec<Vec<u8>>, String> {
        // For ICP efficiency, we expect frames to be pre-extracted by frontend
        // This is a placeholder that would need actual video processing
        Err("Video frame extraction should be done in frontend for ICP efficiency".to_string())
    }

    /// Assemble model from chunks
    fn assemble_chunks(&self) -> Result<Vec<u8>, String> {
        if self.chunks.is_empty() {
            return Err("No chunks to assemble".to_string());
        }

        // Sort chunks by ID and concatenate
        let mut sorted_chunks: Vec<_> = self.chunks.iter().collect();
        sorted_chunks.sort_by_key(|(id, _)| *id);

        let mut model_data = Vec::new();
        for (_, chunk_data) in sorted_chunks {
            model_data.extend_from_slice(chunk_data);
        }

        Ok(model_data)
    }

    /// Initialize ONNX model from binary data
    fn initialize_model(&mut self, _model_data: Vec<u8>) -> Result<(), String> {
        // Parse ONNX model data (simplified for ICP)
        let mut model = VeriChainONNXModel::new();
        
        // For production, this would parse actual ONNX format
        // For now, create a simple model structure
        self.create_simplified_model(&mut model)?;
        
        self.model = Some(model);
        Ok(())
    }

    /// Create simplified model for ICP deployment
    fn create_simplified_model(&self, model: &mut VeriChainONNXModel) -> Result<(), String> {
        // Add basic ViT structure optimized for ICP
        
        // Input layer
        let input_node = ONNXNode::new(
            "input".to_string(),
            "Input".to_string(),
            vec![],
            vec!["input_tensor".to_string()],
        );
        model.add_node(input_node);

        // Feature extraction (simplified)
        let conv_node = ONNXNode::new(
            "feature_extract".to_string(),
            "Conv".to_string(),
            vec!["input_tensor".to_string(), "conv_weight".to_string()],
            vec!["features".to_string()],
        );
        model.add_node(conv_node);

        // Classification head
        let classifier_node = ONNXNode::new(
            "classifier".to_string(),
            "MatMul".to_string(),
            vec!["features".to_string(), "classifier_weight".to_string()],
            vec!["logits".to_string()],
        );
        model.add_node(classifier_node);

        // Output softmax
        let output_node = ONNXNode::new(
            "output".to_string(),
            "Softmax".to_string(),
            vec!["logits".to_string()],
            vec!["output".to_string()],
        );
        model.add_node(output_node);

        // Add simplified weights
        model.add_weight("conv_weight".to_string(), vec![0.1; 1000]);
        model.add_weight("classifier_weight".to_string(), vec![0.01; 3000]);

        Ok(())
    }
}
