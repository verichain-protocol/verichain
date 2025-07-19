#!/bin/bash

# VeriChain Setup Script
# Complete one-command setup for new users with comprehensive error handling

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging functions
print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_info() { echo -e "${PURPLE}[INFO]${NC} $1"; }

# Error handling
handle_error() {
    local exit_code=$?
    local line_number=$1
    print_error "Setup failed at line $line_number with exit code $exit_code"
    print_error "Please check the error messages above and try again."
    print_info "You can also try:"
    print_info "  - make reset-setup (to start completely fresh)"
    print_info "  - make clean-setup (to clean while keeping dependencies)"
    print_info "  - Check docs/DEVELOPMENT.md for manual setup"
    exit $exit_code
}

trap 'handle_error $LINENO' ERR

# Progress tracking
TOTAL_STEPS=10
CURRENT_STEP=0

show_progress() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    echo -e "${PURPLE}[${CURRENT_STEP}/${TOTAL_STEPS}]${NC} $1"
}

# Check if DFX is running and handle gracefully
check_dfx_status() {
    print_info "Checking DFX status..."
    
    if dfx ping --quiet >/dev/null 2>&1; then
        print_warning "DFX is already running. Stopping it to ensure clean setup..."
        dfx stop >/dev/null 2>&1 || true
        
        # Wait for DFX to fully stop
        local stop_retries=0
        while dfx ping --quiet >/dev/null 2>&1 && [ $stop_retries -lt 10 ]; do
            print_info "Waiting for DFX to stop... (${stop_retries}/10)"
            sleep 2
            stop_retries=$((stop_retries + 1))
        done
        
        if dfx ping --quiet >/dev/null 2>&1; then
            print_error "Failed to stop existing DFX instance. Please run 'dfx stop' manually."
            return 1
        fi
        
        print_success "DFX stopped successfully"
    else
        print_info "DFX is not currently running"
    fi
}

# Ensure DFX is ready for operations
ensure_dfx_ready() {
    if ! dfx ping >/dev/null 2>&1; then
        print_error "DFX is not running. Please run 'dfx start' first or run the full setup."
        return 1
    fi
    
    if ! dfx identity whoami >/dev/null 2>&1; then
        print_error "DFX identity not available. DFX may not be properly initialized."
        return 1
    fi
    
    return 0
}

# Check prerequisites
check_prerequisites() {
    show_progress "Checking system prerequisites..."
    
    local missing_deps=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js ≥18.0.0")
    else
        local node_version=$(node --version | sed 's/v//' | cut -d. -f1)
        if [ "$node_version" -lt 18 ]; then
            missing_deps+=("Node.js ≥18.0.0 (current: $(node --version))")
        fi
    fi
    
    # Check Rust
    if ! command -v rustc &> /dev/null; then
        missing_deps+=("Rust ≥1.70.0")
    fi
    
    # Check DFX
    if ! command -v dfx &> /dev/null; then
        missing_deps+=("DFX ≥0.28.0")
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("Python 3.8+")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            print_error "  - $dep"
        done
        print_info "Please install missing dependencies and try again."
        print_info "See docs/DEVELOPMENT.md for installation instructions."
        exit 1
    fi
    
    print_success "All prerequisites satisfied!"
}

# Setup environment
setup_environment() {
    show_progress "Setting up environment configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Create .env from template if it doesn't exist
    if [ ! -f ".env" ]; then
        print_info "Creating .env from template..."
        cp .env.example .env
        print_success ".env file created from template"
    else
        print_warning ".env file already exists, keeping current configuration"
    fi
    
    # Load environment variables
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
}

# Install dependencies
install_dependencies() {
    show_progress "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    print_info "Installing root dependencies..."
    npm install --silent
    
    print_info "Installing frontend dependencies..."
    cd src/frontend
    npm install --silent
    
    cd "$PROJECT_ROOT"
    print_success "Dependencies installed successfully!"
}

# Setup DFX
setup_dfx() {
    show_progress "Setting up DFX local network..."
    
    cd "$PROJECT_ROOT"
    
    # Stop any running DFX and verify it stopped
    if ! check_dfx_status; then
        print_error "Failed to prepare DFX environment"
        return 1
    fi
    
    # Start DFX in background with error handling
    print_info "Starting DFX local replica..."
    if ! dfx start --background --clean >/dev/null 2>&1; then
        print_error "Failed to start DFX. Trying without --clean flag..."
        if ! dfx start --background >/dev/null 2>&1; then
            print_error "Failed to start DFX completely. Please check your DFX installation."
            print_info "Try running: dfx --version"
            return 1
        fi
    fi
    
    # Wait for DFX to be ready with more robust checking
    print_info "Waiting for DFX to be ready..."
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if dfx ping >/dev/null 2>&1; then
            # Double check DFX is truly ready by trying to get identity
            if dfx identity whoami >/dev/null 2>&1; then
                print_success "DFX local network is running and ready!"
                return 0
            fi
        fi
        
        print_info "DFX starting... (${retries}/${max_retries})"
        sleep 2
        retries=$((retries + 1))
    done
    
    # If we get here, DFX failed to start properly
    print_error "DFX failed to start properly after $((max_retries * 2)) seconds"
    print_info "Checking DFX status for debugging..."
    
    # Try to get more information about why DFX failed
    if ! dfx ping >/dev/null 2>&1; then
        print_error "DFX ping failed - DFX is not responding"
    fi
    
    print_info "DFX version: $(dfx --version 2>/dev/null || echo 'unknown')"
    print_info "Try running 'dfx start --verbose' manually to see detailed error messages"
    
    return 1
}

# Download and setup AI model
setup_model() {
    show_progress "Setting up AI model..."
    
    cd "$PROJECT_ROOT"
    
    # Check if model is already setup
    if [ -d "src/ai_canister/assets" ] && [ "$(ls -A src/ai_canister/assets/*.bin 2>/dev/null | wc -l)" -gt 0 ]; then
        print_warning "AI model chunks already exist, skipping download"
        return
    fi
    
    print_info "Downloading and chunking AI model (this may take a few minutes)..."
    
    # Create assets directory
    mkdir -p src/ai_canister/assets
    
    # Download model if not exists (save to assets directory)
    MODEL_FILE="src/ai_canister/assets/verichain-model.onnx"
    if [ ! -f "$MODEL_FILE" ]; then
        print_info "Downloading AI model from HuggingFace..."
        if command -v wget >/dev/null 2>&1; then
            wget -O "$MODEL_FILE" "$MODEL_DOWNLOAD_URL"
        elif command -v curl >/dev/null 2>&1; then
            curl -L -o "$MODEL_FILE" "$MODEL_DOWNLOAD_URL"
        else
            print_error "Neither wget nor curl found. Please install one of them to download the model."
            return 1
        fi
    fi
    
    # Use Python model chunker with correct interface
    if [ -f "tools/model_chunker.py" ]; then
        print_info "Using model chunker to prepare model for ICP deployment..."
        cd tools
        python3 model_chunker.py chunk "../$MODEL_FILE" "../src/ai_canister/assets/"
        cd "$PROJECT_ROOT"
    else
        print_warning "Model chunker not found, model setup may be incomplete"
    fi
    
    print_success "AI model setup completed!"
}

# Deploy canisters
deploy_canisters() {
    show_progress "Deploying canisters..."
    
    cd "$PROJECT_ROOT"
    
    print_info "Deploying all canisters to local network..."
    dfx deploy --network local >/dev/null 2>&1
    
    # Update .env with generated canister IDs
    print_info "Updating .env with generated canister IDs..."
    dfx generate >/dev/null 2>&1 || true
    
    print_success "Canisters deployed successfully!"
}

# Build frontend
build_frontend() {
    show_progress "Building frontend..."
    
    cd "$PROJECT_ROOT/src/frontend"
    
    print_info "Building TypeScript frontend..."
    npm run build >/dev/null 2>&1
    
    cd "$PROJECT_ROOT"
    print_success "Frontend built successfully!"
}

# Final verification
verify_setup() {
    show_progress "Verifying setup..."
    
    cd "$PROJECT_ROOT"
    
    # Check DFX status
    if ! dfx ping >/dev/null 2>&1; then
        print_error "DFX is not running"
        return 1
    fi
    
    # Check canister status
    local canister_status=$(dfx canister status --all 2>&1)
    if echo "$canister_status" | grep -q "Status: Running"; then
        print_success "Canisters are running!"
    else
        print_warning "Some canisters may not be running properly"
    fi
    
    # Check frontend build
    if [ -d "src/frontend/dist" ]; then
        print_success "Frontend is built and ready!"
    else
        print_warning "Frontend build may have issues"
    fi
    
    print_success "Setup verification completed!"
}

# Main setup flow
# Upload model chunks to AI canister
upload_model_chunks() {
    show_progress "Uploading model chunks to AI canister..."
    
    cd "$PROJECT_ROOT"
    
    # Ensure DFX is ready
    if ! ensure_dfx_ready; then
        print_error "DFX is not ready for model upload operations"
        return 1
    fi
    
    # Check if chunks exist
    if [ ! -d "src/ai_canister/assets" ] || [ -z "$(ls -A src/ai_canister/assets/model_chunk_*.bin 2>/dev/null)" ]; then
        print_error "Model chunks not found. Please run model setup first."
        return 1
    fi
    
    # Load metadata
    if [ ! -f "src/ai_canister/assets/model_metadata.json" ]; then
        print_error "Model metadata not found. Please run model setup first."
        return 1
    fi
    
    print_info "Reading model metadata..."
    # Use Python for reliable JSON parsing
    TOTAL_CHUNKS=$(python3 -c "
import json
with open('src/ai_canister/assets/model_metadata.json', 'r') as f:
    data = json.load(f)
    print(data.get('total_chunks', 0))
" 2>/dev/null || echo "0")

    ORIGINAL_SIZE=$(python3 -c "
import json
with open('src/ai_canister/assets/model_metadata.json', 'r') as f:
    data = json.load(f)
    print(data.get('original_size', 0))
" 2>/dev/null || echo "0")

    CHUNK_SIZE_MB=$(python3 -c "
import json
with open('src/ai_canister/assets/model_metadata.json', 'r') as f:
    data = json.load(f)
    print(data.get('chunk_size_mb', 1.0))
" 2>/dev/null || echo "1.0")

    ORIGINAL_FILE=$(python3 -c "
import json
with open('src/ai_canister/assets/model_metadata.json', 'r') as f:
    data = json.load(f)
    print(data.get('original_file', ''))
" 2>/dev/null || echo "")

    if [ -z "$TOTAL_CHUNKS" ] || [ "$TOTAL_CHUNKS" -eq 0 ]; then
        print_error "Could not read total chunks from metadata"
        return 1
    fi
    
    print_info "Found $TOTAL_CHUNKS chunks to upload"
    print_info "Original file: $ORIGINAL_FILE"
    print_info "Original size: $(echo "scale=2; $ORIGINAL_SIZE / 1024 / 1024" | bc 2>/dev/null || echo $((ORIGINAL_SIZE / 1024 / 1024))) MB"
    
    # Round chunk size to nearest integer MB for upload
    CHUNK_SIZE_MB_INT=$(echo "$CHUNK_SIZE_MB + 0.5" | bc 2>/dev/null | cut -d'.' -f1 || echo "1")
    
    # Upload metadata first
    print_info "Uploading model metadata..."
    if dfx canister call ai_canister upload_model_metadata "(\"$ORIGINAL_FILE\", ${ORIGINAL_SIZE}:nat64, ${TOTAL_CHUNKS}:nat32, ${CHUNK_SIZE_MB_INT}:nat32)" >/dev/null 2>&1; then
        print_success "Metadata uploaded successfully"
    else
        print_error "Failed to upload metadata"
        return 1
    fi
    
    # Check current upload status first
    print_info "Checking current upload status..."
    UPLOAD_STATUS=$(dfx canister call ai_canister get_upload_status "()" 2>/dev/null || echo "error")
    
    if [[ "$UPLOAD_STATUS" == *"error"* ]]; then
        print_warning "Could not get upload status, continuing with upload..."
    else
        print_info "Current upload status: $UPLOAD_STATUS"
    fi
    
    # Upload chunks in batches for better performance
    BATCH_SIZE=10
    UPLOADED_COUNT=0
    FAILED_COUNT=0
    
    for ((batch_start=0; batch_start<$TOTAL_CHUNKS; batch_start+=$BATCH_SIZE)); do
        batch_end=$((batch_start + BATCH_SIZE - 1))
        if [ $batch_end -ge $TOTAL_CHUNKS ]; then
            batch_end=$((TOTAL_CHUNKS - 1))
        fi
        
        print_info "Processing batch: chunks $batch_start to $batch_end"
        BATCH_UPLOADED=0
        BATCH_FAILED=0
        
        for ((i=$batch_start; i<=$batch_end && i<$TOTAL_CHUNKS; i++)); do
            CHUNK_FILE="src/ai_canister/assets/model_chunk_$(printf "%03d" $i).bin"
            
            if [ -f "$CHUNK_FILE" ]; then
                # Get chunk hash from metadata using Python for better JSON parsing
                CHUNK_HASH=$(python3 -c "
import json
with open('src/ai_canister/assets/model_metadata.json', 'r') as f:
    data = json.load(f)
    chunks = data.get('chunks', [])
    if $i < len(chunks):
        print(chunks[$i]['hash'])
    else:
        print('')
" 2>/dev/null || echo "")
                
                if [ -z "$CHUNK_HASH" ]; then
                    print_warning "Could not get hash for chunk $i, skipping"
                    FAILED_COUNT=$((FAILED_COUNT + 1))
                    continue
                fi
                
                # Create Candid argument file using Python (more reliable)
                TEMP_ARG_FILE="/tmp/chunk_${i}_args.txt"
                
                python3 -c "
import sys
with open('$CHUNK_FILE', 'rb') as f:
    data = f.read()
bytes_str = '; '.join(str(b) for b in data)
print(f'(${i}:nat32, vec {{{bytes_str}}}, \"$CHUNK_HASH\")')
" > "$TEMP_ARG_FILE" 2>/dev/null
                
                # Upload chunk using argument file
                if dfx canister call ai_canister upload_model_chunk --argument-file "$TEMP_ARG_FILE" >/dev/null 2>&1; then
                    UPLOADED_COUNT=$((UPLOADED_COUNT + 1))
                    BATCH_UPLOADED=$((BATCH_UPLOADED + 1))
                    print_info "✅ Uploaded chunk $i ($(($i + 1))/$TOTAL_CHUNKS)"
                    rm -f "$TEMP_ARG_FILE"
                else
                    FAILED_COUNT=$((FAILED_COUNT + 1))
                    BATCH_FAILED=$((BATCH_FAILED + 1))
                    print_warning "❌ Failed to upload chunk $i"
                    rm -f "$TEMP_ARG_FILE"
                fi
            else
                print_warning "Chunk file not found: $CHUNK_FILE"
                FAILED_COUNT=$((FAILED_COUNT + 1))
                BATCH_FAILED=$((BATCH_FAILED + 1))
            fi
        done
        
        # Report batch progress
        print_info "Batch $((batch_start/BATCH_SIZE + 1)) completed: $BATCH_UPLOADED uploaded, $BATCH_FAILED failed"
        print_info "Total progress: $UPLOADED_COUNT/$TOTAL_CHUNKS uploaded, $FAILED_COUNT failed"
        
        # Small delay between batches to avoid overwhelming the canister
        sleep 1
    done
    
    print_success "Upload completed: $UPLOADED_COUNT chunks uploaded successfully, $FAILED_COUNT failed!"
    
    if [ $FAILED_COUNT -gt 0 ]; then
        print_warning "Some chunks failed to upload. You may need to retry or check canister status."
    fi
}

# Initialize model from uploaded chunks
initialize_model() {
    show_progress "Checking AI model status..."
    
    cd "$PROJECT_ROOT"
    
    # Ensure DFX is ready
    if ! ensure_dfx_ready; then
        print_error "DFX is not ready for model initialization operations"
        return 1
    fi
    
    print_info "Checking model upload status..."
    
    # Check if all chunks are uploaded
    STATUS_RESULT=$(dfx canister call ai_canister get_upload_status "()" 2>/dev/null || echo "error")
    
    if [[ "$STATUS_RESULT" == *"is_complete = true"* ]] && [[ "$STATUS_RESULT" == *"uploaded_chunks = 410"* ]]; then
        print_success "All 410 model chunks are uploaded successfully!"
        print_info "Model is ready for use (initialization will happen automatically on first use)"
        return 0
    else
        print_error "Model upload not complete. Status: $STATUS_RESULT"
        return 1
    fi
}
                # Upload all model chunks to the AI canister

main() {
    echo -e "${GREEN}🚀 VeriChain Instant Setup${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo "This script will set up everything you need to run VeriChain:"
    echo "✅ Check prerequisites"
    echo "✅ Setup environment"
    echo "✅ Install dependencies"
    echo "✅ Start DFX network"
    echo "✅ Download AI model"
    echo "✅ Deploy canisters"
    echo "✅ Build frontend"
    echo "✅ Upload model chunks"
    echo "✅ Verify AI model setup"
    echo "✅ Verify setup"
    echo ""
    
    # Run setup steps
    check_prerequisites
    setup_environment
    install_dependencies
    setup_dfx
    setup_model
    deploy_canisters
    build_frontend
    upload_model_chunks
    initialize_model
    verify_setup
    
    echo ""
    echo -e "${GREEN}🎉 VeriChain Setup Complete!${NC}"
    echo -e "${BLUE}==============================${NC}"
    echo ""
    echo "Next steps:"
    echo -e "  ${GREEN}1.${NC} Run ${BLUE}make dev${NC} to start development server"
    echo -e "  ${GREEN}2.${NC} Open ${BLUE}http://localhost:3000${NC} in your browser"
    echo -e "  ${GREEN}3.${NC} Check ${BLUE}make status${NC} to verify everything is running"
    echo ""
    echo "Documentation:"
    echo -e "  📖 ${BLUE}docs/DEVELOPMENT.md${NC} - Development guide"
    echo -e "  🤖 ${BLUE}docs/MODEL.md${NC} - AI model details"
    echo -e "  🔌 ${BLUE}docs/API.md${NC} - API reference"
    echo ""
    echo -e "${PURPLE}Happy coding! 🚀${NC}"
}

# Argument handling for individual functions
case "${1:-main}" in
    "download_model")
        setup_model
        ;;
    "chunk_model")
        setup_model
        ;;
    "upload_model_chunks")
        upload_model_chunks
        ;;
    "initialize_model")
        initialize_model
        ;;
    "check_prerequisites")
        check_prerequisites
        ;;
    "main"|"")
        main
        ;;
    *)
        echo "Usage: $0 [download_model|chunk_model|upload_model_chunks|initialize_model|check_prerequisites|main]"
        exit 1
        ;;
esac
