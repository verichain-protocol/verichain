#!/bin/bash

# Error recovery testing script for streaming model initialization
# Tests various error scenarios and recovery mechanisms

echo "🛡️  VeriChain Error Recovery Testing"
echo "=================================="

# Function to check canister status
check_canister_status() {
    echo "📊 Checking canister status..."
    dfx canister status ai_canister
    echo ""
}

# Function to check model initialization status
check_initialization_status() {
    echo "🔍 Checking initialization status..."
    status=$(dfx canister call ai_canister get_model_initialization_status 2>&1)
    echo "$status"
    echo ""
    return 0
}

# Function to check upload status
check_upload_status() {
    echo "📥 Checking upload status..."
    status=$(dfx canister call ai_canister get_upload_status 2>&1)
    echo "$status"
    echo ""
    return 0
}

# Test 1: Try to initialize without all chunks uploaded
test_incomplete_upload_initialization() {
    echo "🧪 Test 1: Initialize with incomplete upload"
    echo "─────────────────────────────────────────────"
    
    result=$(dfx canister call ai_canister initialize_model_from_chunks 2>&1)
    
    if [[ $result == *"Not all chunks have been uploaded yet"* ]]; then
        echo "✅ PASS: Correctly rejected initialization with incomplete upload"
        echo "   Message: $result"
    else
        echo "❌ FAIL: Should have rejected incomplete upload"
        echo "   Unexpected result: $result"
    fi
    echo ""
}

# Test 2: Try to continue initialization without starting
test_continue_without_start() {
    echo "🧪 Test 2: Continue initialization without starting"
    echo "────────────────────────────────────────────────"
    
    result=$(dfx canister call ai_canister continue_model_initialization "(opt 10)" 2>&1)
    
    if [[ $result == *"Streaming initialization not started"* ]]; then
        echo "✅ PASS: Correctly rejected continue without start"
        echo "   Message: $result"
    else
        echo "❌ FAIL: Should have rejected continue without start"
        echo "   Unexpected result: $result"
    fi
    echo ""
}

# Test 3: Test with invalid batch size
test_invalid_batch_size() {
    echo "🧪 Test 3: Test with edge case batch sizes"
    echo "─────────────────────────────────────────────"
    
    # Test with batch size 0
    echo "  Testing batch size 0..."
    result=$(dfx canister call ai_canister continue_model_initialization "(opt 0)" 2>&1)
    echo "    Result: $result"
    
    # Test with very large batch size
    echo "  Testing batch size 1000..."
    result=$(dfx canister call ai_canister continue_model_initialization "(opt 1000)" 2>&1)
    echo "    Result: $result"
    
    echo ""
}

# Test 4: Test health check during various states
test_health_check_states() {
    echo "🧪 Test 4: Health check during different states"
    echo "──────────────────────────────────────────────"
    
    echo "  Health check before initialization:"
    health=$(dfx canister call ai_canister health_check 2>&1)
    echo "    $health"
    
    echo ""
}

# Test 5: Test memory and cycles during streaming
test_resource_monitoring() {
    echo "🧪 Test 5: Resource monitoring during streaming"
    echo "─────────────────────────────────────────────"
    
    echo "  Current canister status:"
    check_canister_status
    
    echo "  Memory usage analysis:"
    status=$(dfx canister status ai_canister)
    if [[ $status =~ Memory\ Size:\ ([0-9,]+)\ Bytes ]]; then
        memory_bytes=${BASH_REMATCH[1]//,/}
        memory_mb=$((memory_bytes / 1024 / 1024))
        echo "    Memory: ${memory_mb}MB"
        
        if [ $memory_mb -gt 500 ]; then
            echo "    ⚠️  High memory usage detected"
        else
            echo "    ✅ Memory usage within normal range"
        fi
    fi
    
    if [[ $status =~ Balance:\ ([0-9,_]+)\ Cycles ]]; then
        cycles=${BASH_REMATCH[1]//[,_]/}
        cycles_billions=$((cycles / 1000000000))
        echo "    Cycles: ${cycles_billions}B cycles"
        
        if [ $cycles_billions -lt 100 ]; then
            echo "    ⚠️  Low cycles detected - consider topping up"
        else
            echo "    ✅ Cycles balance sufficient"
        fi
    fi
    
    echo ""
}

# Test 6: Test endpoint availability
test_endpoint_availability() {
    echo "🧪 Test 6: Endpoint availability test"
    echo "───────────────────────────────────────"
    
    endpoints=(
        "health_check"
        "get_upload_status"
        "get_model_initialization_status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        echo "  Testing $endpoint..."
        result=$(dfx canister call ai_canister $endpoint 2>&1)
        
        if [[ $result == *"Err"* ]] || [[ $result == *"error"* ]]; then
            echo "    ❌ FAIL: $endpoint returned error"
            echo "       $result"
        else
            echo "    ✅ PASS: $endpoint working"
        fi
    done
    
    echo ""
}

# Test 7: Test rapid successive calls
test_rapid_calls() {
    echo "🧪 Test 7: Rapid successive calls test"
    echo "────────────────────────────────────────"
    
    echo "  Making 5 rapid calls to get_model_initialization_status..."
    for i in {1..5}; do
        echo "    Call $i..."
        result=$(dfx canister call ai_canister get_model_initialization_status 2>&1)
        if [[ $result == *"Err"* ]]; then
            echo "      ❌ Call $i failed: $result"
        else
            echo "      ✅ Call $i succeeded"
        fi
        sleep 0.5
    done
    
    echo ""
}

# Main test execution
echo "🚀 Starting error recovery tests..."
echo ""

echo "📋 Initial Status Check:"
check_canister_status
check_upload_status
check_initialization_status

echo "🧪 Running Error Recovery Tests:"
echo ""

test_incomplete_upload_initialization
test_continue_without_start
test_invalid_batch_size
test_health_check_states
test_resource_monitoring
test_endpoint_availability
test_rapid_calls

echo "🏁 Error recovery testing completed!"
echo ""
echo "💡 Summary:"
echo "   - Tested error conditions and edge cases"
echo "   - Verified proper error messages and handling"
echo "   - Monitored resource usage and availability"
echo "   - All critical endpoints should be responsive"
echo ""
echo "📋 Next Steps:"
echo "   1. Review any failed tests above"
echo "   2. Check canister logs if issues found: dfx canister logs ai_canister"
echo "   3. Monitor performance during actual model upload"
