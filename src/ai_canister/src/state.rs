// VeriChain AI Canister - State Management
// Global state management for the canister

use std::cell::RefCell;
use std::collections::HashMap;
use ic_cdk::api::time;
use crate::models::DeepfakeDetector;

thread_local! {
    static DETECTOR: RefCell<Option<DeepfakeDetector>> = RefCell::new(None);
    static USAGE_TRACKER: RefCell<HashMap<String, UserUsage>> = RefCell::new(HashMap::new());
    static PREMIUM_USERS: RefCell<HashMap<String, PremiumSubscription>> = RefCell::new(HashMap::new());
    pub static START_TIME: RefCell<Option<u64>> = RefCell::new(None);
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
    
    // Initialize detector
    let detector = DeepfakeDetector::new().expect("Failed to initialize detector");
    DETECTOR.with(|d| {
        *d.borrow_mut() = Some(detector);
    });
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
