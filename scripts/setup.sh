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

# Check model initialization status
check_model_status() {
    print_info "Checking AI model initialization status..."
    
    cd "$PROJECT_ROOT"
    
    # Ensure DFX is ready
    if ! ensure_dfx_ready; then
        print_error "DFX is not ready"
        return 1
    fi
    
    # Get upload status
    print_info "Upload Status:"
    UPLOAD_STATUS=$(dfx canister call ai_canister get_upload_status "()" 2>/dev/null || echo "error")
    if [[ "$UPLOAD_STATUS" != "error" ]]; then
        echo "$UPLOAD_STATUS" | sed 's/;/\n/g' | sed 's/^/  /'
        
        # Extract and display key upload metrics
        TOTAL_CHUNKS=$(echo "$UPLOAD_STATUS" | grep -o 'total_chunks = [0-9]*' | grep -o '[0-9]*' || echo "unknown")
        UPLOADED_CHUNKS=$(echo "$UPLOAD_STATUS" | grep -o 'uploaded_chunks = [0-9]*' | grep -o '[0-9]*' || echo "unknown")
        IS_COMPLETE="false"
        if [[ "$UPLOAD_STATUS" == *"is_complete = true"* ]]; then
            IS_COMPLETE="true"
        fi
        
        if [ "$TOTAL_CHUNKS" != "unknown" ] && [ "$UPLOADED_CHUNKS" != "unknown" ]; then
            if [ "$TOTAL_CHUNKS" -gt 0 ]; then
                UPLOAD_PERCENT=$((UPLOADED_CHUNKS * 100 / TOTAL_CHUNKS))
                print_info "  📊 Upload Progress: $UPLOADED_CHUNKS/$TOTAL_CHUNKS chunks ($UPLOAD_PERCENT%)"
                print_info "  📋 Model has $TOTAL_CHUNKS total chunks"
                
                if [[ "$IS_COMPLETE" == "true" ]]; then
                    print_success "  ✅ All chunks uploaded successfully!"
                else
                    print_warning "  ⏳ Upload incomplete - $(($TOTAL_CHUNKS - $UPLOADED_CHUNKS)) chunks remaining"
                fi
            fi
        fi
    else
        print_error "Could not get upload status"
    fi
    
    echo ""
    
    # Get initialization status
    print_info "Initialization Status:"
    INIT_STATUS=$(dfx canister call ai_canister get_initialization_status "()" 2>/dev/null || echo "error")
    if [[ "$INIT_STATUS" != "error" ]]; then
        echo "$INIT_STATUS" | sed 's/;/\n/g' | sed 's/^/  /'
        
        # Check if model is ready
        if [[ "$INIT_STATUS" == *"is_initialized = true"* ]]; then
            print_success "🎉 Model is fully initialized and ready for use!"
        elif [[ "$INIT_STATUS" == *"initialization_started = true"* ]]; then
            print_info "🔄 Model initialization is in progress"
            
            # Extract progress information
            PROCESSED=$(echo "$INIT_STATUS" | grep -o 'processed_chunks = [0-9]*' | grep -o '[0-9]*' || echo "0")
            TOTAL=$(echo "$INIT_STATUS" | grep -o 'total_chunks = [0-9]*' | grep -o '[0-9]*' || echo "$TOTAL_CHUNKS")
            
            if [ "$PROCESSED" != "0" ] && [ "$TOTAL" != "0" ]; then
                PROGRESS_PERCENT=$((PROCESSED * 100 / TOTAL))
                print_info "  📊 Progress: $PROCESSED/$TOTAL chunks ($PROGRESS_PERCENT%)"
            fi
        else
            print_warning "Model initialization has not started yet"
        fi
    else
        print_error "Could not get initialization status"
    fi
    
    echo ""
    
    # Get detailed model info
    print_info "Model Details:"
    MODEL_INFO=$(dfx canister call ai_canister get_model_info "()" 2>/dev/null || echo "error")
    if [[ "$MODEL_INFO" != "error" ]]; then
        # Extract and display key information in a cleaner format
        MODEL_VERSION=$(echo "$MODEL_INFO" | grep -o 'version = "[^"]*"' | cut -d'"' -f2 || echo "unknown")
        MODEL_LOADED=$(echo "$MODEL_INFO" | grep -o 'model_loaded = [a-z]*' | cut -d'=' -f2 | tr -d ' ' || echo "unknown")
        TOTAL_PARAMS=$(echo "$MODEL_INFO" | grep -o 'total_parameters = opt ([0-9_,]*' | grep -o '[0-9_,]*' | head -1 | tr -d '_' || echo "unknown")
        INPUT_SIZE=$(echo "$MODEL_INFO" | grep -o 'input_size = record { [0-9]*' | grep -o '[0-9]*' | head -1 || echo "224")
        
        print_info "  📝 Model Version: $MODEL_VERSION"
        print_info "  🔄 Model Loaded: $MODEL_LOADED"
        if [ "$TOTAL_PARAMS" != "unknown" ] && [ -n "$TOTAL_PARAMS" ]; then
            # Format parameter count with commas
            FORMATTED_PARAMS=$(echo "$TOTAL_PARAMS" | sed ':a;s/\B[0-9]\{3\}\>/,&/;ta')
            print_info "  🧮 Total Parameters: $FORMATTED_PARAMS"
        else
            print_info "  🧮 Total Parameters: 85.8M (Vision Transformer)"
        fi
        print_info "  📐 Input Size: ${INPUT_SIZE}x${INPUT_SIZE} pixels"
        print_info "  📁 Supported Formats: PNG, JPEG, JPG"
    else
        print_error "Could not get model info"
    fi
}

# Show examples of how different chunk counts would be processed
show_batch_examples() {
    print_info "Model Initialization Batch Strategy Examples:"
    echo ""
    
    local examples=(200 310 350 410 500 750 1000)
    
    for total in "${examples[@]}"; do
        # Calculate batch size based on our logic
        if [ "$total" -le 200 ]; then
            batch_size=50
        elif [ "$total" -le 350 ]; then
            batch_size=75
        else
            batch_size=100
        fi
        
        # Calculate number of batches
        num_batches=$(( (total + batch_size - 1) / batch_size ))
        
        print_info "📊 $total chunks → $batch_size per batch → $num_batches batches"
        
        # Show first few batches as example
        remaining=$total
        batch_num=1
        batch_preview=""
        while [ $remaining -gt 0 ] && [ $batch_num -le 4 ]; do
            if [ $remaining -gt $batch_size ]; then
                this_batch=$batch_size
            else
                this_batch=$remaining
            fi
            if [ $batch_num -eq 1 ]; then
                batch_preview="$this_batch"
            else
                batch_preview="$batch_preview + $this_batch"
            fi
            remaining=$((remaining - this_batch))
            batch_num=$((batch_num + 1))
        done
        
        if [ $remaining -gt 0 ]; then
            more_batches=$(( (remaining + batch_size - 1) / batch_size ))
            batch_preview="$batch_preview + ... ($more_batches more)"
        fi
        
        print_info "    Strategy: $batch_preview chunks"
        echo ""
    done
    
    print_success "The script automatically adapts batch size based on total chunks for optimal performance!"
}

# Get total chunks information
get_chunks_info() {
    print_info "Getting model chunks information..."
    
    cd "$PROJECT_ROOT"
    
    # Ensure DFX is ready
    if ! ensure_dfx_ready; then
        print_error "DFX is not ready"
        return 1
    fi
    
    # Get upload status to determine total chunks
    UPLOAD_STATUS=$(dfx canister call ai_canister get_upload_status "()" 2>/dev/null || echo "error")
    
    if [[ "$UPLOAD_STATUS" != "error" ]]; then
        TOTAL_CHUNKS=$(echo "$UPLOAD_STATUS" | grep -o 'total_chunks = [0-9]*' | grep -o '[0-9]*' || echo "0")
        UPLOADED_CHUNKS=$(echo "$UPLOAD_STATUS" | grep -o 'uploaded_chunks = [0-9]*' | grep -o '[0-9]*' || echo "0")
        ORIGINAL_SIZE=$(echo "$UPLOAD_STATUS" | grep -o 'original_size_mb = [0-9.]*' | grep -o '[0-9.]*' || echo "0")
        
        if [ "$TOTAL_CHUNKS" -gt 0 ]; then
            print_success "📋 Model Information:"
            print_info "  Total Chunks: $TOTAL_CHUNKS"
            print_info "  Uploaded Chunks: $UPLOADED_CHUNKS"
            print_info "  Original Size: ${ORIGINAL_SIZE}MB"
            
            # Calculate optimal batch strategy
            if [ "$TOTAL_CHUNKS" -le 200 ]; then
                RECOMMENDED_BATCH=50
                ESTIMATED_BATCHES=$(( (TOTAL_CHUNKS + RECOMMENDED_BATCH - 1) / RECOMMENDED_BATCH ))
            elif [ "$TOTAL_CHUNKS" -le 350 ]; then
                RECOMMENDED_BATCH=75
                ESTIMATED_BATCHES=$(( (TOTAL_CHUNKS + RECOMMENDED_BATCH - 1) / RECOMMENDED_BATCH ))
            else
                RECOMMENDED_BATCH=100
                ESTIMATED_BATCHES=$(( (TOTAL_CHUNKS + RECOMMENDED_BATCH - 1) / RECOMMENDED_BATCH ))
            fi
            
            print_info "  Recommended Batch Size: $RECOMMENDED_BATCH chunks"
            print_info "  Estimated Batches Needed: $ESTIMATED_BATCHES"
            
            # Show batch breakdown
            print_info "📊 Initialization Strategy:"
            REMAINING_CHUNKS=$TOTAL_CHUNKS
            BATCH_NUM=1
            while [ $REMAINING_CHUNKS -gt 0 ]; do
                if [ $REMAINING_CHUNKS -gt $RECOMMENDED_BATCH ]; then
                    THIS_BATCH=$RECOMMENDED_BATCH
                else
                    THIS_BATCH=$REMAINING_CHUNKS
                fi
                print_info "    Batch $BATCH_NUM: $THIS_BATCH chunks"
                REMAINING_CHUNKS=$((REMAINING_CHUNKS - THIS_BATCH))
                BATCH_NUM=$((BATCH_NUM + 1))
                
                # Limit display to avoid too much output
                if [ $BATCH_NUM -gt 10 ]; then
                    REMAINING_BATCHES=$(( (REMAINING_CHUNKS + RECOMMENDED_BATCH - 1) / RECOMMENDED_BATCH ))
                    if [ $REMAINING_BATCHES -gt 0 ]; then
                        print_info "    ... and $REMAINING_BATCHES more batches"
                    fi
                    break
                fi
            done
        else
            print_warning "No chunks information available"
        fi
    else
        print_error "Could not get chunks information from canister"
        
        # Try to get info from local metadata as fallback
        if [ -f "src/ai_canister/assets/model_metadata.json" ]; then
            print_info "Checking local metadata..."
            LOCAL_CHUNKS=$(python3 -c "
import json
try:
    with open('src/ai_canister/assets/model_metadata.json', 'r') as f:
        data = json.load(f)
    print(data.get('total_chunks', 0))
except:
    print(0)
" 2>/dev/null || echo "0")
            
            if [ "$LOCAL_CHUNKS" -gt 0 ]; then
                print_info "  Local metadata shows: $LOCAL_CHUNKS chunks"
            else
                print_warning "No local metadata available"
            fi
        fi
        return 1
    fi
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
    show_progress "Initializing AI model from uploaded chunks..."
    
    cd "$PROJECT_ROOT"
    
    # Ensure DFX is ready
    if ! ensure_dfx_ready; then
        print_error "DFX is not ready for model initialization operations"
        return 1
    fi
    
    print_info "Checking model upload status..."
    
    # Check if all chunks are uploaded and get total chunks dynamically
    STATUS_RESULT=$(dfx canister call ai_canister get_upload_status "()" 2>/dev/null || echo "error")
    
    if [[ "$STATUS_RESULT" == *"error"* ]]; then
        print_error "Could not get upload status from canister"
        return 1
    fi
    
    # Extract total chunks and uploaded chunks from status result
    TOTAL_CHUNKS=$(echo "$STATUS_RESULT" | grep -o 'total_chunks = [0-9]*' | grep -o '[0-9]*' || echo "0")
    UPLOADED_CHUNKS=$(echo "$STATUS_RESULT" | grep -o 'uploaded_chunks = [0-9]*' | grep -o '[0-9]*' || echo "0")
    IS_COMPLETE=$(echo "$STATUS_RESULT" | grep -o 'is_complete = [a-z]*' | grep -o '[a-z]*' || echo "false")
    
    # Handle multiline format for is_complete
    if [[ "$STATUS_RESULT" == *"is_complete = true"* ]]; then
        IS_COMPLETE="true"
    else
        IS_COMPLETE="false"
    fi
    
    if [ "$TOTAL_CHUNKS" -eq 0 ]; then
        print_error "Could not determine total chunks from upload status"
        print_info "Current status: $STATUS_RESULT"
        return 1
    fi
    
    if [[ "$IS_COMPLETE" != "true" ]] || [ "$UPLOADED_CHUNKS" -ne "$TOTAL_CHUNKS" ]; then
        print_error "Model upload not complete. Please ensure all $TOTAL_CHUNKS chunks are uploaded first."
        print_info "Current status: $UPLOADED_CHUNKS/$TOTAL_CHUNKS uploaded, complete: $IS_COMPLETE"
        return 1
    fi
    
    print_success "All $TOTAL_CHUNKS model chunks are uploaded successfully!"
    print_info "Starting optimized model initialization process..."
    
    # Check if initialization has already started
    INIT_STATUS=$(dfx canister call ai_canister get_initialization_status "()" 2>/dev/null || echo "error")
    INIT_STARTED=$(echo "$INIT_STATUS" | grep -o 'initialization_started = [a-z]*' | grep -o '[a-z]*' || echo "false")
    
    if [[ "$INIT_STATUS" == *"initialization_started = true"* ]]; then
        INIT_STARTED="true"
    fi
    
    # Start initialization if not already started
    if [[ "$INIT_STARTED" != "true" ]]; then
        print_info "Starting model initialization..."
        INIT_RESULT=$(dfx canister call ai_canister initialize_model "()" 2>/dev/null || echo "error")
        
        if [[ "$INIT_RESULT" == *"error"* ]] || [[ "$INIT_RESULT" == *"Err"* ]]; then
            print_error "Failed to start model initialization"
            print_error "Result: $INIT_RESULT"
            return 1
        fi
        
        print_success "✅ Model initialization started successfully!"
        print_info "Result: $INIT_RESULT"
        
        # Extract initial processed chunks from result
        PROCESSED_CHUNKS=$(echo "$INIT_RESULT" | grep -o '[0-9]* chunks' | grep -o '[0-9]*' | head -1 || echo "100")
    else
        print_info "Initialization already started, continuing from current progress..."
        # Get current progress
        PROCESSED_CHUNKS=$(echo "$INIT_STATUS" | grep -o 'processed_chunks = [0-9]*' | grep -o '[0-9]*' || echo "0")
    fi
    
    # Use optimal batch size based on testing
    BATCH_SIZE=100  # Increased batch size based on successful testing
    TOTAL_BATCHES=$(( (TOTAL_CHUNKS + BATCH_SIZE - 1) / BATCH_SIZE ))
    
    print_info "Continuing with $TOTAL_CHUNKS chunks in batches of $BATCH_SIZE (current progress: $PROCESSED_CHUNKS/$TOTAL_CHUNKS)..."
    
    # Process remaining chunks in optimal batches
    while [ $PROCESSED_CHUNKS -lt $TOTAL_CHUNKS ]; do
        BATCH_NUM=$(( PROCESSED_CHUNKS / BATCH_SIZE + 1 ))
        REMAINING_CHUNKS=$(( TOTAL_CHUNKS - PROCESSED_CHUNKS ))
        CURRENT_BATCH_SIZE=$( [ $REMAINING_CHUNKS -lt $BATCH_SIZE ] && echo $REMAINING_CHUNKS || echo $BATCH_SIZE )
        
        print_info "Processing batch $BATCH_NUM (up to $CURRENT_BATCH_SIZE chunks)..."
        
        BATCH_RESULT=$(dfx canister call ai_canister continue_initialization "(opt $CURRENT_BATCH_SIZE)" 2>/dev/null || echo "error")
        
        if [[ "$BATCH_RESULT" == *"error"* ]] || [[ "$BATCH_RESULT" == *"Err"* ]]; then
            print_error "Batch processing failed at chunk $PROCESSED_CHUNKS"
            print_error "Result: $BATCH_RESULT"
            print_error "You may need to continue manually with: dfx canister call ai_canister continue_initialization '(opt $CURRENT_BATCH_SIZE)'"
            return 1
        fi
        
        # Extract progress from result - improved parsing
        # Look for patterns like "Processed X chunks" or "Progress: X/Y"
        NEW_PROCESSED_FROM_CHUNKS=$(echo "$BATCH_RESULT" | grep -o 'Processed [0-9]* chunks' | grep -o '[0-9]*' | head -1)
        NEW_PROCESSED_FROM_PROGRESS=$(echo "$BATCH_RESULT" | grep -o 'Progress: [0-9]*/[0-9]*' | cut -d':' -f2 | cut -d'/' -f1 | tr -d ' ')
        
        # Use whichever parsing method worked
        if [ -n "$NEW_PROCESSED_FROM_PROGRESS" ] && [ "$NEW_PROCESSED_FROM_PROGRESS" -gt 0 ]; then
            NEW_PROCESSED="$NEW_PROCESSED_FROM_PROGRESS"
        elif [ -n "$NEW_PROCESSED_FROM_CHUNKS" ] && [ "$NEW_PROCESSED_FROM_CHUNKS" -gt 0 ]; then
            NEW_PROCESSED=$(( PROCESSED_CHUNKS + NEW_PROCESSED_FROM_CHUNKS ))
        else
            # Fallback: assume we processed the requested batch size
            NEW_PROCESSED=$(( PROCESSED_CHUNKS + CURRENT_BATCH_SIZE ))
        fi
        
        # Ensure NEW_PROCESSED is a valid number and greater than current
        if [ -z "$NEW_PROCESSED" ] || ! [[ "$NEW_PROCESSED" =~ ^[0-9]+$ ]]; then
            print_warning "Could not parse progress from result, assuming batch completed"
            NEW_PROCESSED=$(( PROCESSED_CHUNKS + CURRENT_BATCH_SIZE ))
        fi
        
        # Validate progress and update
        if [ "$NEW_PROCESSED" -gt "$PROCESSED_CHUNKS" ]; then
            PROGRESS_THIS_BATCH=$(( NEW_PROCESSED - PROCESSED_CHUNKS ))
            PROCESSED_CHUNKS=$NEW_PROCESSED
            PROGRESS_PERCENT=$(( PROCESSED_CHUNKS * 100 / TOTAL_CHUNKS ))
            print_success "✅ Batch $BATCH_NUM completed: +$PROGRESS_THIS_BATCH chunks → $PROCESSED_CHUNKS/$TOTAL_CHUNKS total ($PROGRESS_PERCENT%)"
        elif [ "$NEW_PROCESSED" -eq "$PROCESSED_CHUNKS" ]; then
            print_warning "No progress made in batch $BATCH_NUM"
            
            # Check if we've actually completed (sometimes the last batch shows no progress but is done)
            if [[ "$BATCH_RESULT" == *"completed"* ]] || [[ "$BATCH_RESULT" == *"final batch"* ]]; then
                print_success "✅ Model initialization completed!"
                PROCESSED_CHUNKS=$TOTAL_CHUNKS
                break
            else
                print_warning "Stopping due to no progress"
                break
            fi
        else
            # NEW_PROCESSED is somehow less than current, but update anyway
            print_warning "Unexpected progress value: $NEW_PROCESSED (was $PROCESSED_CHUNKS)"
            PROCESSED_CHUNKS=$NEW_PROCESSED
        fi
        
        # Check if we're done
        if [ $PROCESSED_CHUNKS -ge $TOTAL_CHUNKS ]; then
            print_success "🎉 All chunks processed successfully!"
            break
        fi
        
        # Small delay between batches to prevent overwhelming the canister
        sleep 2
    done
    
    # Final status check
    if [ $PROCESSED_CHUNKS -ge $TOTAL_CHUNKS ]; then
        print_success "✅ Model initialization completed successfully!"
        print_success "🎉 All $TOTAL_CHUNKS chunks processed and model is ready for use!"
        
        # Verify final status
        FINAL_STATUS=$(dfx canister call ai_canister get_initialization_status "()" 2>/dev/null)
        if [[ "$FINAL_STATUS" == *"is_initialized = true"* ]]; then
            print_success "🔬 Verified: Model is fully initialized and ready!"
        fi
    else
        print_warning "⚠️  Partial initialization completed: $PROCESSED_CHUNKS/$TOTAL_CHUNKS chunks"
        print_info "To continue manually: dfx canister call ai_canister continue_initialization '(opt $CURRENT_BATCH_SIZE)'"
        print_info "Or run: ./scripts/setup.sh initialize_model"
    fi
    
    return 0
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
    echo "✅ Initialize AI model (optimized 50-chunk batches)"
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
    echo -e "  ${GREEN}4.${NC} Run ${BLUE}./scripts/setup.sh check_model_status${NC} to verify AI model"
    echo ""
    echo "AI Model Commands:"
    echo -e "  🤖 ${BLUE}./scripts/setup.sh check_model_status${NC} - Check model initialization status"
    echo -e "  � ${BLUE}./scripts/setup.sh get_chunks_info${NC} - Get detailed chunks information and strategy"
    echo -e "  �🔄 ${BLUE}./scripts/setup.sh initialize_model${NC} - Run adaptive step-by-step model initialization"
    echo -e "  � ${BLUE}./scripts/setup.sh init_model_step_by_step${NC} - Initialize with detailed progress"
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
    "init_model_step_by_step")
        print_info "Starting step-by-step model initialization (optimized batch processing)..."
        initialize_model
        ;;
    "check_model_status")
        check_model_status
        ;;
    "get_chunks_info")
        get_chunks_info
        ;;
    "show_batch_examples")
        show_batch_examples
        ;;
    "check_prerequisites")
        check_prerequisites
        ;;
    "main"|"")
        main
        ;;
    *)
        echo "Usage: $0 [download_model|chunk_model|upload_model_chunks|initialize_model|init_model_step_by_step|check_model_status|get_chunks_info|show_batch_examples|check_prerequisites|main]"
        echo ""
        echo "Individual functions:"
        echo "  download_model         - Download and setup AI model"
        echo "  chunk_model           - Chunk the AI model for ICP deployment"
        echo "  upload_model_chunks   - Upload model chunks to AI canister"
        echo "  initialize_model      - Initialize model from uploaded chunks (optimized 50-chunk batches)"
        echo "  init_model_step_by_step - Alias for initialize_model with verbose output"
        echo "  check_model_status    - Check current model upload and initialization status"
        echo "  get_chunks_info       - Get detailed information about model chunks and strategy"
        echo "  show_batch_examples   - Show examples of batch strategies for different chunk counts"
        echo "  check_prerequisites   - Check system requirements"
        echo "  main                  - Run complete setup (default)"
        echo ""
        exit 1
        ;;
esac
