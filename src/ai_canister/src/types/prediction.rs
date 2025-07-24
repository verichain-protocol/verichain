use candid::{CandidType, Deserialize};
use serde::Serialize;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum PredictionLabel {
    Real,
    AIGenerated, 
    Deepfake,
}

impl PredictionLabel {
    // Remove unused methods - keep enum clean
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct RawScores {
    pub real: f64,
    pub ai_generated: f64,
    pub deepfake: f64,
}

impl RawScores {
    pub fn new(real: f64, ai_generated: f64, deepfake: f64) -> Self {
        Self {
            real: real.max(0.01).min(0.98),
            ai_generated: ai_generated.max(0.01).min(0.98),
            deepfake: deepfake.max(0.01).min(0.98),
        }
    }

    pub fn get_max_score_and_label(&self) -> (f64, PredictionLabel) {
        let scores = [
            (self.ai_generated, PredictionLabel::AIGenerated),
            (self.deepfake, PredictionLabel::Deepfake),
            (self.real, PredictionLabel::Real),
        ];

        scores.into_iter()
            .max_by(|a, b| a.0.partial_cmp(&b.0).unwrap())
            .unwrap()
    }
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct PredictionResult {
    pub label: PredictionLabel,
    pub confidence: f64,
    pub raw_scores: RawScores,
}

impl PredictionResult {
    pub fn new(raw_scores: RawScores) -> Self {
        let (confidence, label) = raw_scores.get_max_score_and_label();
        
        Self {
            label,
            confidence: confidence.max(0.1).min(0.99),
            raw_scores,
        }
    }
}
