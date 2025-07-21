use candid::{CandidType, Deserialize};
use serde::Serialize;
use crate::types::prediction::PredictionResult;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct MediaAnalysisResult {
    pub prediction: PredictionResult,
    pub processing_time_ms: u64,
    pub input_size: u32,
    pub model_version: String,
    pub processed_at: u64,
}

impl MediaAnalysisResult {
    // Remove unused constructor
}
