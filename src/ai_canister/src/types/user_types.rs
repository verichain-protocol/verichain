/// VeriChain User Types
/// 
/// Type definitions for user management, usage tracking, and access control.

use candid::{CandidType, Deserialize};

/// User usage information and limits
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UsageInfo {
    pub current_usage: u32,
    pub max_usage: u32,
    pub is_premium: bool,
    pub batch_limit: usize,
    pub resets_at: u64,
}
