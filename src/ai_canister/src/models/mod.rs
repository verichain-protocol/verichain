/// VeriChain AI Models Module
/// 
/// Core machine learning components for deepfake detection
/// using Vision Transformer (ViT) model on Internet Computer Protocol.

// Module declarations
pub mod metadata;
pub mod onnx_model;
pub mod inference;
pub mod detector;

// Public exports - only what's actively used
pub use detector::DeepfakeDetector;