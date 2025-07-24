#!/bin/bash

# VeriChain Development Environment Script
# Starts complete development environment with hot reload

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_PORT="${FRONTEND_PORT:-3001}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[DEV]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

cleanup() {
    print_status "Cleaning up development processes..."
    jobs -p | xargs -r kill
    exit 0
}

# Handle cleanup on script exit
trap cleanup EXIT INT TERM

main() {
    cd "$PROJECT_ROOT"
    
    print_status "Starting VeriChain development environment..."
    
    # Check if DFX is running
    if ! dfx ping &> /dev/null; then
        print_status "Starting DFX replica..."
        dfx start --background --clean
        sleep 3
    fi
    
    # Deploy canisters if not deployed
    if ! dfx canister id ai_canister &> /dev/null; then
        print_status "Deploying canisters..."
        dfx deploy
    fi
    
    # Check model status
    MODEL_STATUS=$(dfx canister call ai_canister health_check 2>/dev/null || echo "not_ready")
    if [[ "$MODEL_STATUS" != *"healthy"* ]]; then
        print_warning "Model not initialized. Run 'make setup' first."
    fi
    
    # Start frontend development server
    print_status "Starting frontend development server on port $FRONTEND_PORT..."
    cd src/frontend
    npm start &
    FRONTEND_PID=$!
    
    cd "$PROJECT_ROOT"
    
    print_success "Development environment ready!"
    echo ""
    echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
    echo "🔗 DFX Replica: http://localhost:4943"
    echo "📊 Canister Status: dfx canister status --all"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for frontend process
    wait $FRONTEND_PID
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
