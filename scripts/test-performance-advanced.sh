#!/bin/bash

# VeriChain Advanced Performance Testing Script
# Tests different batch sizes for optimal streaming initialization performance

set -e

echo "🔬 VeriChain Performance Testing (Advanced)"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BATCH_SIZES=(5 10 15 20 25 30)
TEST_CYCLES=2  # Number of test cycles per batch size
RESULTS_FILE="performance_results_$(date +%Y%m%d_%H%M%S).csv"

# Function to get current cycles
get_cycles() {
    dfx canister status ai_canister | grep "Balance:" | awk '{print $2}' | tr -d "Cycles,_" | head -1
}

# Function to get memory usage
get_memory() {
    dfx canister status ai_canister | grep "Memory Size:" | awk '{print $3}' | tr -d "Bytes,"
}

# Function to reset model initialization (if available)
reset_initialization() {
    echo "  🔄 Resetting initialization state..."
    # This would reset the model initialization if such endpoint exists
    # For now, we'll use a fresh start approach
    sleep 2
}

# Function to test batch size performance
test_batch_size() {
    local batch_size=$1
    local test_num=$2
    
    echo -e "${BLUE}🧪 Testing batch size: $batch_size (Test $test_num)${NC}"
    
    # Record initial metrics
    local start_time=$(date +%s)
    local start_cycles=$(get_cycles 2>/dev/null || echo "0")
    local start_memory=$(get_memory 2>/dev/null || echo "0")
    
    echo "  📊 Initial metrics:"
    echo "    Cycles: $start_cycles"
    echo "    Memory: $start_memory bytes"
    
    # Start timing for initialization
    local init_start=$(date +%s%3N)  # milliseconds
    
    # Start streaming initialization
    echo "  🚀 Starting streaming initialization..."
    local start_result=$(dfx canister call ai_canister start_streaming_initialization 2>/dev/null)
    
    if [[ $start_result == *"Err"* ]]; then
        echo -e "  ${RED}❌ Failed to start initialization${NC}"
        echo "  Error: $start_result"
        return 1
    fi
    
    local init_end=$(date +%s%3N)
    local init_time=$((init_end - init_start))
    
    echo -e "  ${GREEN}✅ Initialization started (${init_time}ms)${NC}"
    
    # Process batches and measure performance
    local batch_count=0
    local total_processing_time=0
    local max_batches=50  # Safety limit
    
    echo "  🔄 Processing batches..."
    
    while [[ $batch_count -lt $max_batches ]]; do
        local batch_start=$(date +%s%3N)
        
        # Continue initialization with specified batch size
        local continue_result=$(dfx canister call ai_canister continue_model_initialization "(opt $batch_size)" 2>/dev/null)
        
        local batch_end=$(date +%s%3N)
        local batch_time=$((batch_end - batch_start))
        total_processing_time=$((total_processing_time + batch_time))
        
        if [[ $continue_result == *"Err"* ]]; then
            echo -e "    ${RED}❌ Batch processing failed${NC}"
            echo "    Error: $continue_result"
            break
        fi
        
        batch_count=$((batch_count + 1))
        echo "    Batch $batch_count: ${batch_time}ms"
        
        # Check initialization status
        local status_result=$(dfx canister call ai_canister get_model_initialization_status 2>/dev/null)
        
        if [[ $status_result == *"Completed"* ]]; then
            echo -e "    ${GREEN}✅ Initialization completed!${NC}"
            break
        elif [[ $status_result == *"Failed"* ]]; then
            echo -e "    ${RED}❌ Initialization failed!${NC}"
            break
        fi
        
        # Small delay between batches
        sleep 0.5
    done
    
    # Record final metrics
    local end_time=$(date +%s)
    local end_cycles=$(get_cycles 2>/dev/null || echo "0")
    local end_memory=$(get_memory 2>/dev/null || echo "0")
    
    # Calculate metrics
    local total_time=$((end_time - start_time))
    local cycles_used=0
    local memory_used=0
    
    if [[ $start_cycles -gt $end_cycles ]]; then
        cycles_used=$((start_cycles - end_cycles))
    fi
    
    if [[ $end_memory -gt $start_memory ]]; then
        memory_used=$((end_memory - start_memory))
    fi
    
    # Store results
    echo "$batch_size,$test_num,$batch_count,$total_time,$total_processing_time,$cycles_used,$memory_used,$init_time" >> "$RESULTS_FILE"
    
    echo "  📊 Results:"
    echo "    Batches processed: $batch_count"
    echo "    Total time: ${total_time}s"
    echo "    Processing time: ${total_processing_time}ms"
    echo "    Cycles used: $cycles_used"
    echo "    Memory used: $memory_used bytes"
    echo "    Init time: ${init_time}ms"
    echo "    Avg per batch: $((total_processing_time / batch_count))ms"
    
    return 0
}

# Function to analyze results
analyze_results() {
    echo -e "\n${BLUE}📈 Performance Analysis${NC}"
    echo "======================="
    
    if [[ ! -f "$RESULTS_FILE" ]]; then
        echo -e "${RED}No results file found: $RESULTS_FILE${NC}"
        return 1
    fi
    
    echo "Batch Size | Avg Batches | Avg Time | Avg Processing | Avg Cycles | Efficiency"
    echo "-----------|-------------|----------|----------------|------------|------------"
    
    for batch_size in "${BATCH_SIZES[@]}"; do
        # Calculate averages for this batch size
        local stats=$(awk -F',' -v bs="$batch_size" '
            $1==bs {
                batches_sum+=$3; time_sum+=$4; processing_sum+=$5; cycles_sum+=$6; count++
            }
            END {
                if(count>0) {
                    avg_batches = int(batches_sum/count)
                    avg_time = int(time_sum/count)
                    avg_processing = int(processing_sum/count)
                    avg_cycles = int(cycles_sum/count)
                    efficiency = (avg_processing > 0 && avg_cycles > 0) ? int(avg_batches * 1000 / avg_processing) : 0
                    print avg_batches "," avg_time "," avg_processing "," avg_cycles "," efficiency
                } else {
                    print "0,0,0,0,0"
                }
            }
        ' "$RESULTS_FILE")
        
        IFS=',' read -r avg_batches avg_time avg_processing avg_cycles efficiency <<< "$stats"
        
        printf "%10s | %11s | %8ss | %13sms | %10s | %10s\n" \
            "$batch_size" "$avg_batches" "$avg_time" "$avg_processing" "$avg_cycles" "$efficiency"
    done
    
    # Find optimal configurations
    echo -e "\n${GREEN}🏆 Optimization Recommendations:${NC}"
    
    # Most efficient (batches per second per cycle)
    local most_efficient=$(awk -F',' '
        NR>1 {
            if ($5 > 0 && $4 > 0 && $6 > 0) {
                efficiency = ($3 * 1000) / ($5 * $6 / 1000000)
                if (efficiency > max_eff) {
                    max_eff = efficiency
                    best_batch = $1
                }
            }
        }
        END {print best_batch}
    ' "$RESULTS_FILE")
    
    # Fastest (least processing time)
    local fastest=$(awk -F',' '
        NR>1 {
            avg_processing[$1] += $5
            count[$1]++
        }
        END {
            min_time = 999999999
            fastest = 0
            for (bs in avg_processing) {
                avg = avg_processing[bs] / count[bs]
                if (avg < min_time && avg > 0) {
                    min_time = avg
                    fastest = bs
                }
            }
            print fastest
        }
    ' "$RESULTS_FILE")
    
    if [[ $most_efficient -gt 0 ]]; then
        echo -e "  ${GREEN}✨ Most efficient batch size: $most_efficient${NC}"
        echo "  💡 Best balance of speed, cycles, and memory usage"
    fi
    
    if [[ $fastest -gt 0 ]]; then
        echo -e "  ${BLUE}⚡ Fastest batch size: $fastest${NC}"
        echo "  💡 Shortest processing time per batch"
    fi
    
    echo -e "\n📄 Detailed results saved to: $RESULTS_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if upload is complete
    local upload_status=$(dfx canister call ai_canister get_upload_status 2>/dev/null)
    if [[ $upload_status != *"is_complete = true"* ]]; then
        echo -e "${RED}❌ Model upload not complete. Please complete upload first.${NC}"
        echo "Current upload status:"
        echo "$upload_status"
        return 1
    fi
    
    # Check canister cycles
    local cycles=$(get_cycles 2>/dev/null || echo "0")
    if [[ $cycles -lt 50000000000 ]]; then  # 50B cycles minimum
        echo -e "${YELLOW}⚠️  Low cycles detected ($cycles). Performance tests consume cycles.${NC}"
        read -p "Continue anyway? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ Prerequisites satisfied${NC}"
    echo "  Upload complete: ✅"
    echo "  Cycles available: $cycles"
    
    return 0
}

# Main execution
main() {
    echo "🚀 Starting performance tests..."
    echo ""
    
    # Check prerequisites
    if ! check_prerequisites; then
        exit 1
    fi
    
    # Initialize results file
    echo "batch_size,test_num,batches_processed,total_time_s,processing_time_ms,cycles_used,memory_used,init_time_ms" > "$RESULTS_FILE"
    
    echo ""
    echo "📋 Test Configuration:"
    echo "  Batch sizes: ${BATCH_SIZES[*]}"
    echo "  Test cycles per size: $TEST_CYCLES"
    echo "  Results file: $RESULTS_FILE"
    echo ""
    
    # Run tests for each batch size
    for batch_size in "${BATCH_SIZES[@]}"; do
        echo -e "\n${YELLOW}🧪 Testing batch size: $batch_size${NC}"
        
        for test_num in $(seq 1 $TEST_CYCLES); do
            echo -e "\n  ${BLUE}Test $test_num of $TEST_CYCLES${NC}"
            
            if ! test_batch_size $batch_size $test_num; then
                echo -e "${RED}❌ Test failed for batch size $batch_size (test $test_num)${NC}"
                continue
            fi
            
            # Wait between tests to allow system to stabilize
            if [[ $test_num -lt $TEST_CYCLES ]]; then
                echo "  ⏳ Waiting 10 seconds before next test..."
                sleep 10
            fi
        done
        
        # Longer wait between different batch sizes
        echo "  ⏳ Waiting 30 seconds before testing next batch size..."
        sleep 30
    done
    
    # Analyze results
    analyze_results
    
    echo -e "\n${GREEN}✅ Performance testing completed!${NC}"
    echo ""
    echo "💡 Next steps:"
    echo "  1. Review the optimization recommendations above"
    echo "  2. Use the optimal batch size in production deployments"
    echo "  3. Monitor cycles and memory usage during initialization"
    echo "  4. Consider the fastest batch size for time-critical scenarios"
    echo ""
}

# Handle script arguments
case "${1:-}" in
    --analyze-only)
        if [[ -z "${2:-}" ]]; then
            echo "Usage: $0 --analyze-only <results_file>"
            exit 1
        fi
        RESULTS_FILE="$2"
        analyze_results
        ;;
    --help|-h)
        echo "VeriChain Performance Testing Script"
        echo ""
        echo "Usage: $0 [--analyze-only <file>] [--help]"
        echo ""
        echo "Options:"
        echo "  --analyze-only <file>  Only analyze existing results file"
        echo "  --help, -h             Show this help message"
        echo ""
        echo "This script tests different batch sizes for model initialization"
        echo "to find the optimal balance of speed and resource usage."
        ;;
    *)
        main
        ;;
esac
