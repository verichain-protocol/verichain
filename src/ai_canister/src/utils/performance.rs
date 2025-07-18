/// VeriChain Performance Utilities
/// 
/// Utility functions for cycle counting, performance monitoring, and optimization.

use ic_cdk::api::instruction_counter;

/// Performance monitor for tracking cycles consumption
pub struct PerformanceMonitor {
    start_cycles: u64,
    checkpoints: Vec<(String, u64)>,
}

impl PerformanceMonitor {
    /// Create new performance monitor
    pub fn new() -> Self {
        Self {
            start_cycles: instruction_counter(),
            checkpoints: Vec::new(),
        }
    }

    /// Add a checkpoint with label
    pub fn checkpoint(&mut self, label: &str) {
        let current_cycles = instruction_counter();
        self.checkpoints.push((label.to_string(), current_cycles));
    }

    /// Get total cycles consumed
    pub fn total_cycles(&self) -> u64 {
        instruction_counter() - self.start_cycles
    }

    /// Get cycles between checkpoints
    pub fn get_report(&self) -> String {
        let mut report = format!("Performance Report (Total cycles: {})\n", self.total_cycles());
        
        let mut prev_cycles = self.start_cycles;
        for (label, cycles) in &self.checkpoints {
            let diff = cycles - prev_cycles;
            report.push_str(&format!("{}: {} cycles\n", label, diff));
            prev_cycles = *cycles;
        }

        report
    }
}

impl Default for PerformanceMonitor {
    fn default() -> Self {
        Self::new()
    }
}

/// Estimate memory usage for data structures
#[allow(dead_code)]
pub fn estimate_memory_usage(data_size: usize) -> f64 {
    // Rough estimation: data + overhead
    (data_size as f64 * 1.2) / (1024.0 * 1024.0) // Convert to MB
}

/// Calculate optimal chunk size for ICP efficiency
#[allow(dead_code)]
pub fn calculate_optimal_chunk_size(total_size: usize) -> usize {
    const MAX_CHUNK_SIZE: usize = 800 * 1024; // 800KB for ICP
    const MIN_CHUNK_SIZE: usize = 100 * 1024; // 100KB minimum
    
    if total_size <= MAX_CHUNK_SIZE {
        return total_size;
    }
    
    // Calculate number of chunks needed
    let num_chunks = (total_size + MAX_CHUNK_SIZE - 1) / MAX_CHUNK_SIZE;
    let optimal_size = total_size / num_chunks;
    
    optimal_size.max(MIN_CHUNK_SIZE).min(MAX_CHUNK_SIZE)
}
