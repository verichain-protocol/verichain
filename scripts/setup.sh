#!/bin/bash

# VeriChain Complete Setup Script
# Professional setup script for VeriChain deepfake detection platform

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MODEL_URL="${MODEL_DOWNLOAD_URL:-https://huggingface.co/einrafh/verichain-deepfake-models/resolve/main/models/onnx/verichain-model.onnx}"
MODEL_CHUNK_SIZE="${MODEL_CHUNK_SIZE_MB:-0.8}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check dfx
    if ! command -v dfx &> /dev/null; then
        print_error "DFX is not installed. Please install DFX first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js >= 16.0.0"
        exit 1
    fi
    
    # Check Rust
    if ! command -v cargo &> /dev/null; then
        print_error "Rust is not installed. Please install Rust >= 1.70.0"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python >= 3.7"
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

setup_environment() {
    print_status "Setting up environment..."
    
    cd "$PROJECT_ROOT"
    
    # Copy environment file if not exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
        else
            print_warning ".env.example not found, creating basic .env"
            cat > .env << EOF
MODEL_CHUNK_SIZE_MB=0.8
MODEL_DOWNLOAD_URL=https://huggingface.co/einrafh/verichain-deepfake-models/resolve/main/models/onnx/verichain-model.onnx
DEPLOY_NETWORK=local
EOF
        fi
    fi
    
    print_success "Environment setup completed"
}

install_dependencies() {
    print_status "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install root dependencies
    npm install
    
    # Install frontend dependencies
    cd src/frontend
    npm install
    
    cd "$PROJECT_ROOT"
    print_success "Dependencies installed"
}

setup_dfx() {
    print_status "Setting up DFX environment..."
    
    cd "$PROJECT_ROOT"
    
    # Start DFX if not running
    if ! dfx ping &> /dev/null; then
        print_status "Starting DFX replica..."
        dfx start --background --clean
        sleep 5
    fi
    
    # Create canisters
    dfx canister create --all
    
    # Deploy logic canister first (smaller, faster)
    dfx deploy logic_canister
    
    print_success "DFX environment ready"
}

download_model() {
    print_status "Downloading AI model..."
    
    cd "$PROJECT_ROOT"
    
    # Create temp directory for model
    mkdir -p temp
    
    # Download model if not exists
    if [ ! -f "temp/verichain-model.onnx" ]; then
        print_status "Downloading model from $MODEL_URL"
        curl -L "$MODEL_URL" -o "temp/verichain-model.onnx"
        
        # Verify download
        if [ ! -f "temp/verichain-model.onnx" ]; then
            print_error "Failed to download model"
            exit 1
        fi
        
        MODEL_SIZE=$(stat -f%z "temp/verichain-model.onnx" 2>/dev/null || stat -c%s "temp/verichain-model.onnx")
        print_success "Model downloaded (${MODEL_SIZE} bytes)"
    else
        print_success "Model already exists"
    fi
}

chunk_model() {
    print_status "Chunking model for ICP deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Run model chunker
    python3 tools/model_chunker.py temp/verichain-model.onnx src/ai_canister/assets/ "$MODEL_CHUNK_SIZE"
    
    # Count chunks
    CHUNK_COUNT=$(find src/ai_canister/assets/ -name "model_chunk_*.bin" | wc -l)
    print_success "Model chunked into $CHUNK_COUNT pieces"
}

deploy_ai_canister() {
    print_status "Deploying AI canister..."
    
    cd "$PROJECT_ROOT"
    
    # Build and deploy AI canister
    dfx deploy ai_canister
    
    print_success "AI canister deployed"
}

upload_model_chunks() {
    print_status "Uploading model chunks to canister..."
    
    cd "$PROJECT_ROOT"
    
    # Get chunk count
    CHUNK_COUNT=$(find src/ai_canister/assets/ -name "model_chunk_*.bin" | wc -l)
    
    print_status "Uploading $CHUNK_COUNT chunks..."
    
    # Upload chunks
    for i in $(seq 0 $((CHUNK_COUNT - 1))); do
        CHUNK_FILE=$(printf "src/ai_canister/assets/model_chunk_%03d.bin" $i)
        if [ -f "$CHUNK_FILE" ]; then
            printf "Uploading chunk %03d/%03d\r" $((i + 1)) $CHUNK_COUNT
            dfx canister call ai_canister upload_model_chunk "($(cat "$CHUNK_FILE" | xxd -p | tr -d '\n' | sed 's/../\\&/g' | sed 's/^/"/;s/$/"/'), $i)" > /dev/null
        fi
    done
    
    echo ""
    print_success "All chunks uploaded"
}

initialize_model() {
    print_status "Initializing model in canister..."
    
    cd "$PROJECT_ROOT"
    
    # Initialize model
    dfx canister call ai_canister initialize_model_from_chunks
    
    print_success "Model initialized"
}

verify_setup() {
    print_status "Verifying setup..."
    
    cd "$PROJECT_ROOT"
    
    # Check health
    HEALTH=$(dfx canister call ai_canister health_check)
    echo "Health check: $HEALTH"
    
    # Check model status
    MODEL_INFO=$(dfx canister call ai_canister get_model_info)
    echo "Model info: $MODEL_INFO"
    
    print_success "Setup verification completed"
}

cleanup_temp() {
    print_status "Cleaning up temporary files..."
    
    cd "$PROJECT_ROOT"
    rm -rf temp/
    
    print_success "Cleanup completed"
}

main() {
    echo "🚀 VeriChain Complete Setup"
    echo "=========================="
    echo ""
    
    check_prerequisites
    setup_environment
    install_dependencies
    setup_dfx
    download_model
    chunk_model
    deploy_ai_canister
    upload_model_chunks
    initialize_model
    verify_setup
    cleanup_temp
    
    echo ""
    print_success "🎉 VeriChain setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Start frontend: cd src/frontend && npm start"
    echo "  2. Open browser: http://localhost:3000"
    echo "  3. Run tests: make test-health"
    echo ""
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
