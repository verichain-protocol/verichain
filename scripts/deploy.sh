#!/bin/bash

# VeriChain Deployment Script
# Professional deployment script for multiple networks

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_NETWORK="${DEPLOY_NETWORK:-local}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
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

check_network() {
    case $DEPLOY_NETWORK in
        local)
            print_status "Deploying to local network..."
            if ! dfx ping &> /dev/null; then
                print_status "Starting local DFX replica..."
                dfx start --background --clean
                sleep 5
            fi
            ;;
        ic)
            print_status "Deploying to Internet Computer mainnet..."
            print_warning "Make sure you have sufficient cycles!"
            ;;
        playground)
            print_status "Deploying to IC playground..."
            ;;
        *)
            print_error "Unknown network: $DEPLOY_NETWORK"
            exit 1
            ;;
    esac
}

build_project() {
    print_status "Building project for deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Build frontend
    cd src/frontend
    npm run build
    
    cd "$PROJECT_ROOT"
    
    # Build Rust canisters
    cargo build --release --target wasm32-unknown-unknown
    
    print_success "Build completed"
}

deploy_canisters() {
    print_status "Deploying canisters to $DEPLOY_NETWORK..."
    
    cd "$PROJECT_ROOT"
    
    # Deploy to specified network
    if [ "$DEPLOY_NETWORK" = "local" ]; then
        dfx deploy --network local
    else
        dfx deploy --network $DEPLOY_NETWORK --with-cycles 2000000000000
    fi
    
    print_success "Canisters deployed"
}

setup_model() {
    if [ "$DEPLOY_NETWORK" = "local" ]; then
        print_status "Setting up model for local deployment..."
        
        # Check if model chunks exist
        if [ ! -d "src/ai_canister/assets" ] || [ -z "$(ls -A src/ai_canister/assets/)" ]; then
            print_warning "Model chunks not found. Running model setup..."
            bash "$SCRIPT_DIR/setup.sh" download_model
            bash "$SCRIPT_DIR/setup.sh" chunk_model
        fi
        
        # Upload model chunks
        bash "$SCRIPT_DIR/setup.sh" upload_model_chunks
        bash "$SCRIPT_DIR/setup.sh" initialize_model
        
        print_success "Model setup completed"
    else
        print_warning "Model upload for $DEPLOY_NETWORK requires manual intervention"
        print_status "Please ensure model chunks are uploaded separately"
    fi
}

verify_deployment() {
    print_status "Verifying deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Check canister status
    dfx canister status --network $DEPLOY_NETWORK --all
    
    # Test health endpoint
    if [ "$DEPLOY_NETWORK" = "local" ]; then
        HEALTH=$(dfx canister call ai_canister health_check --network local)
        echo "Health check: $HEALTH"
    fi
    
    print_success "Deployment verification completed"
}

show_deployment_info() {
    print_success "Deployment completed successfully!"
    echo ""
    echo "Network: $DEPLOY_NETWORK"
    echo "Canisters deployed:"
    
    # Show canister IDs
    dfx canister id ai_canister --network $DEPLOY_NETWORK 2>/dev/null && echo "  ✅ AI Canister: $(dfx canister id ai_canister --network $DEPLOY_NETWORK)"
    dfx canister id logic_canister --network $DEPLOY_NETWORK 2>/dev/null && echo "  ✅ Logic Canister: $(dfx canister id logic_canister --network $DEPLOY_NETWORK)"
    dfx canister id frontend --network $DEPLOY_NETWORK 2>/dev/null && echo "  ✅ Frontend Canister: $(dfx canister id frontend --network $DEPLOY_NETWORK)"
    
    echo ""
    if [ "$DEPLOY_NETWORK" = "local" ]; then
        echo "🌐 Local URLs:"
        echo "  Frontend: http://localhost:4943"
        echo "  Candid UI: http://localhost:4943/_/candid"
    else
        echo "🌐 Live URLs:"
        FRONTEND_ID=$(dfx canister id frontend --network $DEPLOY_NETWORK 2>/dev/null || echo "not-deployed")
        if [ "$FRONTEND_ID" != "not-deployed" ]; then
            echo "  Frontend: https://$FRONTEND_ID.ic0.app"
        fi
    fi
    echo ""
}

main() {
    echo "🚀 VeriChain Deployment"
    echo "======================"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    check_network
    build_project
    deploy_canisters
    setup_model
    verify_deployment
    show_deployment_info
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
