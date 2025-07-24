use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use ic_cdk::api::time;
use std::cell::RefCell;

mod types;
mod utils;
mod preprocessing;
mod storage;
mod model;
mod handlers;

use types::*;
use storage::ModelStorage;
use model::VeriChainModel;
use handlers::*;

thread_local! {
    static MODEL_STORAGE: RefCell<ModelStorage> = RefCell::new(ModelStorage::new());
    static VERICHAIN_MODEL: RefCell<VeriChainModel> = RefCell::new(
        VeriChainModel::new().expect("Failed to initialize VeriChain model")
    );
    static START_TIME: RefCell<u64> = RefCell::new(0);
}

#[init]
fn init() {
    START_TIME.with(|t| {
        *t.borrow_mut() = time();
    });
}

#[pre_upgrade]
fn pre_upgrade() {
    // Store model storage state
    MODEL_STORAGE.with(|storage| {
        let storage_ref = storage.borrow();
        ic_cdk::storage::stable_save((storage_ref.clone(),)).expect("Failed to save model storage state");
    });
    
    // Store model state if loaded
    VERICHAIN_MODEL.with(|model| {
        let model_ref = model.borrow();
        if model_ref.is_loaded() {
            // Save model data and state
            let model_state = (
                model_ref.get_model_data(),
                model_ref.get_model_hash(),
                model_ref.is_loaded(),
            );
            ic_cdk::storage::stable_save(model_state).expect("Failed to save model state");
        }
    });
    
    ic_cdk::println!("Pre-upgrade: Saved model storage and model state");
}

#[post_upgrade]
fn post_upgrade() {
    START_TIME.with(|t| {
        *t.borrow_mut() = time();
    });
    
    // Restore model storage state
    match ic_cdk::storage::stable_restore::<(ModelStorage,)>() {
        Ok((restored_storage,)) => {
            MODEL_STORAGE.with(|storage| {
                *storage.borrow_mut() = restored_storage;
            });
            ic_cdk::println!("Post-upgrade: Restored model storage state");
        }
        Err(e) => {
            ic_cdk::println!("Post-upgrade: Failed to restore model storage: {:?}", e);
        }
    }
    
    // Restore model state if available
    match ic_cdk::storage::stable_restore::<(Option<Vec<u8>>, Option<String>, bool)>() {
        Ok((model_data, _model_hash, was_loaded)) => {
            if was_loaded && model_data.is_some() {
                VERICHAIN_MODEL.with(|model| {
                    let mut model_ref = model.borrow_mut();
                    if let Some(data) = model_data {
                        match model_ref.load_from_bytes(&data) {
                            Ok(_) => {
                                ic_cdk::println!("Post-upgrade: Successfully restored loaded model");
                            }
                            Err(e) => {
                                ic_cdk::println!("Post-upgrade: Failed to reload model: {}", e);
                            }
                        }
                    }
                });
            }
        }
        Err(e) => {
            ic_cdk::println!("Post-upgrade: Failed to restore model state: {:?}", e);
        }
    }
}

// Core analysis function
#[update]
fn analyze(image_data: Vec<u8>) -> VeriChainResult<MediaAnalysisResult> {
    VERICHAIN_MODEL.with(|model| {
        let model_ref = model.borrow();
        handle_analyze(image_data, &*model_ref)
    })
}

// Model management functions
#[update]
fn upload_model_chunk(chunk_id: u32, data: Vec<u8>, hash: String) -> VeriChainResult<String> {
    MODEL_STORAGE.with(|storage| {
        let mut storage_ref = storage.borrow_mut();
        handle_upload_chunk(&mut *storage_ref, chunk_id, data, hash)
    })
}

#[update]
fn upload_model_metadata(
    original_file: String,
    original_size: u64,
    total_chunks: u32,
    chunk_size_mb: u32,
) -> VeriChainResult<String> {
    MODEL_STORAGE.with(|storage| {
        let mut storage_ref = storage.borrow_mut();
        handle_upload_metadata(&mut *storage_ref, original_file, original_size, total_chunks, chunk_size_mb)
    })
}

#[update]
fn initialize_model() -> VeriChainResult<String> {
    MODEL_STORAGE.with(|storage| {
        VERICHAIN_MODEL.with(|model| {
            let mut storage_ref = storage.borrow_mut();
            let mut model_ref = model.borrow_mut();
            handle_initialize_model(&mut *storage_ref, &mut *model_ref)
        })
    })
}

#[update]
fn continue_initialization(batch_size: Option<u32>) -> VeriChainResult<String> {
    MODEL_STORAGE.with(|storage| {
        VERICHAIN_MODEL.with(|model| {
            let mut storage_ref = storage.borrow_mut();
            let mut model_ref = model.borrow_mut();
            handle_continue_initialization(&mut *storage_ref, &mut *model_ref, batch_size)
        })
    })
}

// Query functions
#[query]
fn get_upload_status() -> UploadStatus {
    MODEL_STORAGE.with(|storage| {
        let storage_ref = storage.borrow();
        handle_get_upload_status(&*storage_ref)
    })
}

#[query]
fn get_initialization_status() -> InitializationStatus {
    MODEL_STORAGE.with(|storage| {
        let storage_ref = storage.borrow();
        handle_get_initialization_status(&*storage_ref)
    })
}

#[query]
fn get_model_info() -> ModelInfo {
    VERICHAIN_MODEL.with(|model| {
        let model_ref = model.borrow();
        handle_get_model_info(&*model_ref)
    })
}

#[query]
fn health_check() -> SystemHealth {
    VERICHAIN_MODEL.with(|model| {
        START_TIME.with(|start_time| {
            let model_ref = model.borrow();
            let start_time_val = *start_time.borrow();
            handle_health_check(&*model_ref, start_time_val)
        })
    })
}

#[query]
fn validate_image_format(image_data: Vec<u8>) -> bool {
    handle_validate_image_format(image_data)
}

#[query]
fn get_supported_formats() -> Vec<String> {
    handle_get_supported_formats()
}

// Export the candid interface
ic_cdk::export_candid!();
