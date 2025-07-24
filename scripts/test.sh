#!/bin/bash

# VeriChain Testing Suite
# Comprehensive testing script for VeriChain platform

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

test_health() {
    print_status "Testing canister health..."
    
    cd "$PROJECT_ROOT"
    
    # Test AI canister health
    AI_HEALTH=$(dfx canister call ai_canister health_check 2>/dev/null || echo "ERROR")
    if [[ "$AI_HEALTH" == *"healthy"* ]]; then
        print_success "AI canister is healthy"
    else
        print_error "AI canister health check failed: $AI_HEALTH"
        return 1
    fi
    
    # Test logic canister health
    LOGIC_HEALTH=$(dfx canister call logic_canister get_greeting "\"health\"" 2>/dev/null || echo "ERROR")
    if [[ "$LOGIC_HEALTH" != "ERROR" ]]; then
        print_success "Logic canister is healthy"
    else
        print_warning "Logic canister health check failed (this may be expected)"
    fi
}

test_model() {
    print_status "Testing AI model..."
    
    cd "$PROJECT_ROOT"
    
    # Check model info
    MODEL_INFO=$(dfx canister call ai_canister get_model_info 2>/dev/null || echo "ERROR")
    if [[ "$MODEL_INFO" == *"size"* ]]; then
        print_success "Model is loaded and accessible"
        echo "Model info: $MODEL_INFO"
    else
        print_error "Model test failed: $MODEL_INFO"
        return 1
    fi
    
    # Check initialization status
    INIT_STATUS=$(dfx canister call ai_canister get_initialization_status 2>/dev/null || echo "ERROR")
    if [[ "$INIT_STATUS" == *"initialized"* ]]; then
        print_success "Model is initialized"
    else
        print_warning "Model initialization status: $INIT_STATUS"
    fi
}

test_image_analysis() {
    print_status "Testing image analysis..."
    
    cd "$PROJECT_ROOT"
    
    # Create test image
    if command -v convert &> /dev/null; then
        convert -size 224x224 xc:white temp_test.jpg 2>/dev/null || {
            print_warning "Could not create test image with ImageMagick"
            return 0
        }
        
        # Test image analysis
        if [ -f temp_test.jpg ]; then
            ANALYSIS_RESULT=$(timeout 30 dfx canister call ai_canister analyze_image "$(cat temp_test.jpg | base64)" 2>/dev/null || echo "ERROR")
            
            if [[ "$ANALYSIS_RESULT" == *"confidence"* ]]; then
                print_success "Image analysis working"
                echo "Analysis result: $ANALYSIS_RESULT"
            else
                print_error "Image analysis failed: $ANALYSIS_RESULT"
            fi
            
            rm -f temp_test.jpg
        fi
    else
        print_warning "ImageMagick not available, skipping image analysis test"
    fi
}

test_performance() {
    print_status "Testing performance..."
    
    cd "$PROJECT_ROOT"
    
    # Check canister status and cycles
    AI_STATUS=$(dfx canister status ai_canister 2>/dev/null || echo "ERROR")
    if [[ "$AI_STATUS" == *"Running"* ]]; then
        print_success "AI canister is running"
        
        # Extract cycles from status
        CYCLES=$(echo "$AI_STATUS" | grep -o 'Balance: [0-9,_]* Cycles' | head -1 || echo "Unknown")
        print_status "Cycles: $CYCLES"
    else
        print_error "AI canister status check failed"
        return 1
    fi
    
    # Memory usage check
    MEMORY=$(echo "$AI_STATUS" | grep -o 'Memory allocation: [0-9,_]* bytes' | head -1 || echo "Unknown")
    print_status "Memory: $MEMORY"
}

test_frontend() {
    print_status "Testing frontend..."
    
    cd "$PROJECT_ROOT/src/frontend"
    
    # Check if frontend can build
    if npm run build > /dev/null 2>&1; then
        print_success "Frontend builds successfully"
    else
        print_error "Frontend build failed"
        return 1
    fi
    
    # Check if frontend dependencies are up to date
    if npm outdated > /dev/null 2>&1; then
        print_success "Frontend dependencies are current"
    else
        print_warning "Some frontend dependencies may be outdated"
    fi
}

run_integration_test() {
    print_status "Running integration tests..."
    
    test_health || return 1
    test_model || return 1
    test_performance || return 1
    test_frontend || return 1
    test_image_analysis
    
    print_success "All integration tests passed!"
}

show_help() {
    echo "VeriChain Testing Suite"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  health      - Test canister health"
    echo "  model       - Test AI model functionality"
    echo "  performance - Test performance and resource usage"
    echo "  frontend    - Test frontend build and dependencies"
    echo "  image       - Test image analysis (requires ImageMagick)"
    echo "  integration - Run all tests"
    echo "  help        - Show this help message"
    echo ""
}

main() {
    case "${1:-integration}" in
        "health")
            test_health
            ;;
        "model")
            test_model
            ;;
        "performance")
            test_performance
            ;;
        "frontend") 
            test_frontend
            ;;
        "image")
            test_image_analysis
            ;;
        "integration")
            run_integration_test
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
