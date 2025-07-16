#!/bin/bash

# VeriChain Performance Testing Script
# Tests different batch sizes for optimal streaming initialization performance

set -e

echo "🔬 VeriChain Performance Testing"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test batch sizes
BATCH_SIZES=(5 10 15 20 25 30)
TEST_CYCLES=2  # Number of test cycles per batch size

# Function to get current cycles
get_cycles() {
    dfx canister status ai_canister | grep "Balance:" | awk '{print $2}' | tr -d "Cycles,_"
}

# Function to get initialization status
get_init_status() {
    dfx canister call ai_canister get_model_initialization_status --output json 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "Unknown"
}

# Function to test a specific batch size
test_batch_size() {
    local batch_size=$1
    echo "🧪 Testing batch size: $batch_size"
    
    # Start streaming initialization
    echo "  Starting streaming initialization..."
    start_result=$(dfx canister call ai_canister initialize_model_from_chunks 2>&1)
    
    if [[ $start_result == *"Err"* ]]; then
        echo "  ❌ Failed to start initialization: $start_result"
        return 1
    fi
    
    echo "  ✅ Initialization started successfully"
    
    # Track timing and progress
    local start_time=$(date +%s)
    local total_processed=0
    local iteration=0
    
    while true; do
        iteration=$((iteration + 1))
        echo "    Iteration $iteration: Processing batch of $batch_size chunks..."
        
        # Continue initialization with specified batch size
        local iter_start=$(date +%s)
        continue_result=$(dfx canister call ai_canister continue_model_initialization "(opt $batch_size)" 2>&1)
        local iter_end=$(date +%s)
        local iter_duration=$((iter_end - iter_start))
        
        if [[ $continue_result == *"Err"* ]]; then
            echo "    ❌ Error in iteration $iteration: $continue_result"
            return 1
        fi
        
        # Extract progress information
        if [[ $continue_result == *"completed successfully"* ]]; then
            echo "    ✅ Model initialization completed!"
            local end_time=$(date +%s)
            local total_duration=$((end_time - start_time))
            echo "    📈 Total time: ${total_duration}s, Iterations: $iteration"
            echo "    📈 Average per iteration: $((total_duration / iteration))s"
            return 0
        elif [[ $continue_result == *"in progress"* ]]; then
            # Extract processed chunks count
            if [[ $continue_result =~ ([0-9]+)/([0-9]+).*chunks.*processed ]]; then
                local processed=${BASH_REMATCH[1]}
                local total=${BASH_REMATCH[2]}
                total_processed=$processed
                echo "    📊 Progress: $processed/$total chunks ($(((processed * 100) / total))%)"
                echo "    ⏱️  Iteration time: ${iter_duration}s"
            fi
        fi
        
        # Safety check - don't run forever
        if [ $iteration -gt 50 ]; then
            echo "    ⚠️  Max iterations reached, stopping test"
            return 1
        fi
        
        # Brief pause between iterations
        sleep 1
    done
}

# Function to reset model state
reset_model_state() {
    echo "🔄 Resetting model state for next test..."
    # Note: In a real scenario, you might need to redeploy or clear state
    # For now, we'll assume the model is in a testable state
    sleep 2
}

# Main testing loop
echo "🎯 Starting performance tests..."
echo ""

for batch_size in "${BATCH_SIZES[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Testing Batch Size: $batch_size"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if test_batch_size $batch_size; then
        echo "✅ Batch size $batch_size: SUCCESS"
    else
        echo "❌ Batch size $batch_size: FAILED"
    fi
    
    echo ""
    
    # Reset for next test (if needed)
    # reset_model_state
    
    # For now, we'll only test the first successful batch size
    # to avoid re-initializing the model multiple times
    echo "📝 Note: Testing with first successful batch size only to avoid re-upload"
    break
done

echo ""
echo "🏁 Performance testing completed!"
echo ""
echo "💡 Recommendations:"
echo "   - Batch sizes 10-20 typically provide good balance of speed vs. instruction limits"
echo "   - Smaller batches (5-10): More reliable, less risk of timeout"
echo "   - Larger batches (20-30): Faster overall, but higher risk of instruction limits"
echo "   - Monitor canister cycles consumption for cost optimization"
