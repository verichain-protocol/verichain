#!/bin/bash

# VeriChain Build Script
# Professional build script for production deployment

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

check_environment() {
    print_status "Checking build environment..."
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please copy .env.example to .env and configure."
        exit 1
    fi
    
    source .env
    
    print_status "Build Configuration:"
    print_status "  Network: ${DEPLOY_NETWORK:-local}"
    print_status "  Model chunk size: ${MODEL_CHUNK_SIZE_MB:-0.8} MB"
}

clean_previous_builds() {
    print_status "Cleaning previous builds..."
    
    cd "$PROJECT_ROOT"
    
    # Stop any running DFX
    dfx stop 2>/dev/null || true
    
    # Clean build artifacts
    rm -rf .dfx/local
    rm -rf src/frontend/dist
    rm -rf target/
    
    print_success "Previous builds cleaned"
}

start_replica() {
    print_status "Starting fresh replica..."
    
    cd "$PROJECT_ROOT"
    dfx start --background --clean
    sleep 3
    
    print_success "Replica started"
}

build_logic_canister() {
    print_status "Building logic canister..."
    
    cd "$PROJECT_ROOT"
    dfx deploy logic_canister
    
    print_success "Logic canister built and deployed"
}

build_ai_canister() {
    print_status "Building AI canister..."
    
    cd "$PROJECT_ROOT"
    
    # Build Rust components
    cargo build --target wasm32-unknown-unknown --release --package ai_canister
    
    # Deploy canister
    dfx deploy ai_canister
    
    print_success "AI canister built and deployed"
}

build_frontend() {
    print_status "Building frontend..."
    
    cd "$PROJECT_ROOT/src/frontend"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Build for production
    npm run build
    
    cd "$PROJECT_ROOT"
    print_success "Frontend built successfully"
}

verify_build() {
    print_status "Verifying build..."
    
    cd "$PROJECT_ROOT"
    
    # Check canister status
    AI_STATUS=$(dfx canister status ai_canister 2>/dev/null || echo "ERROR")
    LOGIC_STATUS=$(dfx canister status logic_canister 2>/dev/null || echo "ERROR")
    
    if [[ "$AI_STATUS" == *"Running"* ]] && [[ "$LOGIC_STATUS" == *"Running"* ]]; then
        print_success "All canisters are running"
    else
        print_error "Some canisters failed to deploy properly"
        return 1
    fi
    
    # Check frontend build
    if [ -d "src/frontend/dist" ]; then
        print_success "Frontend build artifacts created"
    else
        print_error "Frontend build failed"
        return 1
    fi
}

main() {
    echo "🏗️  VeriChain Production Build"
    echo "============================="
    echo ""
    
    check_environment
    clean_previous_builds
    start_replica
    build_logic_canister
    build_ai_canister
    build_frontend
    verify_build
    
    echo ""
    print_success "🎉 Build completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Setup model: ./scripts/setup.sh (if model not uploaded)"
    echo "  2. Test system: ./scripts/test.sh"
    echo "  3. Start frontend: cd src/frontend && npm start"
    echo ""
}

# Run main function
main "$@"
