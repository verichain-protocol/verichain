/// VeriChain AI Canister - Utilities Module
/// 
/// Core utility functions for validation, performance monitoring, 
/// and data integrity verification.

pub mod validation;
pub mod performance;
pub mod hash;

// Re-export commonly used utilities
pub use validation::validate_image;
pub use performance::PerformanceMonitor;
pub use hash::calculate_sha256;