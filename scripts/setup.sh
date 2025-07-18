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
TOTAL_STEPS=8
CURRENT_STEP=0

show_progress() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    echo -e "${PURPLE}[${CURRENT_STEP}/${TOTAL_STEPS}]${NC} $1"
}

# Check if DFX is running and handle gracefully
check_dfx_status() {
    if dfx ping --quiet >/dev/null 2>&1; then
        print_warning "DFX is already running. Stopping it to ensure clean setup..."
        dfx stop >/dev/null 2>&1 || true
        sleep 2
    fi
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
    
    # Stop any running DFX
    check_dfx_status
    
    # Start DFX in background
    print_info "Starting DFX local replica..."
    dfx start --background --clean >/dev/null 2>&1
    
    # Wait for DFX to be ready
    print_info "Waiting for DFX to be ready..."
    local retries=0
    while ! dfx ping >/dev/null 2>&1; do
        sleep 2
        retries=$((retries + 1))
        if [ $retries -gt 30 ]; then
            print_error "DFX failed to start after 60 seconds"
            exit 1
        fi
    done
    
    print_success "DFX local network is running!"
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
    
    # Use Python model chunker
    if [ -f "tools/model_chunker.py" ]; then
        print_info "Using model chunker to prepare model for ICP deployment..."
        cd tools
        python3 model_chunker.py --download --chunk --output ../src/ai_canister/assets/
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

# Run main function
main "$@"
