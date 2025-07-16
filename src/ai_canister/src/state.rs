// VeriChain AI Canister - State Management
// Global state management for the canister

use std::cell::RefCell;
use std::collections::HashMap;
use ic_cdk::api::time;
use ic_stable_structures::{
    memory_manager::{MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
    storable::{Bound, Storable}
};
use candid::{CandidType, Deserialize};
use crate::models::DeepfakeDetector;

type Memory = VirtualMemory<DefaultMemoryImpl>;

// Storable implementations for stable memory
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ModelChunk {
    pub chunk_id: u32,
    pub data: Vec<u8>,
    pub hash: String,
}

impl Storable for ModelChunk {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct StoredModelMetadata {
    pub original_file: String,
    pub original_size: u64,
    pub total_chunks: u32,
    pub chunk_size_mb: u32,
    pub uploaded_chunks: Vec<u32>, // Track which chunks have been uploaded
}

impl Storable for StoredModelMetadata {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        std::borrow::Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

thread_local! {
    static DETECTOR: RefCell<Option<DeepfakeDetector>> = RefCell::new(None);
    static USAGE_TRACKER: RefCell<HashMap<String, UserUsage>> = RefCell::new(HashMap::new());
    static PREMIUM_USERS: RefCell<HashMap<String, PremiumSubscription>> = RefCell::new(HashMap::new());
    pub static START_TIME: RefCell<Option<u64>> = RefCell::new(None);
    
    // Stable memory for model chunks and metadata
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );
    static MODEL_CHUNKS: RefCell<Option<StableBTreeMap<u32, ModelChunk, VirtualMemory<DefaultMemoryImpl>>>> = RefCell::new(None);
    static MODEL_METADATA: RefCell<Option<StoredModelMetadata>> = RefCell::new(None);
}

#[derive(Debug, Clone)]
pub struct UserUsage {
    pub count: u32,
    pub last_reset: u64,
}

#[derive(Debug, Clone)]
pub struct PremiumSubscription {
    pub active: bool,
    pub expires_at: u64,
    #[allow(dead_code)]
    pub plan: SubscriptionPlan,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum SubscriptionPlan {
    Monthly,
    Yearly, 
    Developer,
}

pub fn initialize_canister() {
    START_TIME.with(|t| {
        *t.borrow_mut() = Some(time());
    });
    
    // Initialize stable memory structures
    MEMORY_MANAGER.with(|m| {
        let memory_manager = m.borrow();
        let chunks_memory = memory_manager.get(ic_stable_structures::memory_manager::MemoryId::new(0));
        
        MODEL_CHUNKS.with(|chunks| {
            *chunks.borrow_mut() = Some(StableBTreeMap::init(chunks_memory));
        });
    });
    
    // Initialize detector
    let detector = DeepfakeDetector::new().expect("Failed to initialize detector");
    DETECTOR.with(|d| {
        *d.borrow_mut() = Some(detector);
    });
}

// Store a model chunk in stable memory
pub fn store_model_chunk(chunk: ModelChunk) -> Result<(), String> {
    MODEL_CHUNKS.with(|chunks| {
        if let Some(chunks_map) = chunks.borrow_mut().as_mut() {
            chunks_map.insert(chunk.chunk_id, chunk);
            Ok(())
        } else {
            Err("Model chunks storage not initialized".to_string())
        }
    })
}

// Retrieve a model chunk from stable memory
pub fn get_model_chunk(chunk_id: u32) -> Option<ModelChunk> {
    MODEL_CHUNKS.with(|chunks| {
        chunks.borrow().as_ref()?.get(&chunk_id)
    })
}

// Store model metadata
pub fn store_model_metadata(metadata: StoredModelMetadata) {
    MODEL_METADATA.with(|m| {
        *m.borrow_mut() = Some(metadata);
    });
}

// Get model metadata
pub fn get_model_metadata() -> Option<StoredModelMetadata> {
    MODEL_METADATA.with(|m| {
        m.borrow().clone()
    })
}

// Check if all chunks are uploaded
pub fn are_all_chunks_uploaded() -> bool {
    if let Some(metadata) = get_model_metadata() {
        metadata.uploaded_chunks.len() == metadata.total_chunks as usize
    } else {
        false
    }
}

// Get all uploaded chunks for model reconstruction
pub fn get_all_model_chunks() -> Result<Vec<ModelChunk>, String> {
    let metadata = get_model_metadata()
        .ok_or("Model metadata not found")?;
    
    let mut chunks = Vec::with_capacity(metadata.total_chunks as usize);
    
    for chunk_id in 0..metadata.total_chunks {
        let chunk = get_model_chunk(chunk_id)
            .ok_or(format!("Chunk {} not found", chunk_id))?;
        chunks.push(chunk);
    }
    
    Ok(chunks)
}

pub fn save_state() {
    // State persistence implementation - to be added when needed
    // This would serialize state to stable memory
}

pub fn load_state() {
    // State loading implementation - to be added when needed  
    // This would deserialize state from stable memory
    initialize_canister();
}

pub fn with_detector<T, F>(f: F) -> Option<T>
where
    F: FnOnce(&DeepfakeDetector) -> T,
{
    DETECTOR.with(|d| {
        d.borrow().as_ref().map(f)
    })
}

pub fn with_detector_mut<T, F>(f: F) -> Option<T>
where
    F: FnOnce(&mut DeepfakeDetector) -> T,
{
    DETECTOR.with(|d| {
        d.borrow_mut().as_mut().map(f)
    })
}

pub fn get_usage(user_id: &str) -> Option<UserUsage> {
    USAGE_TRACKER.with(|tracker| {
        tracker.borrow().get(user_id).cloned()
    })
}

#[allow(dead_code)]
pub fn update_usage(user_id: String, usage: UserUsage) {
    USAGE_TRACKER.with(|tracker| {
        tracker.borrow_mut().insert(user_id, usage);
    });
}

pub fn is_premium_user(user_id: &str) -> bool {
    let current_time = time();
    PREMIUM_USERS.with(|users| {
        users.borrow().get(user_id).map_or(false, |sub| {
            sub.active && sub.expires_at > current_time
        })
    })
}

#[allow(dead_code)]
pub fn add_premium_user(user_id: String, subscription: PremiumSubscription) {
    PREMIUM_USERS.with(|users| {
        users.borrow_mut().insert(user_id, subscription);
    });
}
