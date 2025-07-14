use candid::{CandidType, Deserialize};

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MediaInput {
    pub filename: String,
    pub data: Vec<u8>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SocialMediaInput {
    pub url: String,
    pub platform: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ApiResponse {
    pub success: bool,
    pub result: Option<DeepfakeResult>,
    pub error: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct DeepfakeResult {
    pub is_deepfake: bool,
    pub confidence: f32,
    pub analysis_time: u64,
    pub media_type: String,
    pub frame_results: Option<Vec<FrameResult>>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct FrameResult {
    pub frame_number: u32,
    pub timestamp: f64,
    pub is_deepfake: bool,
    pub confidence: f32,
}