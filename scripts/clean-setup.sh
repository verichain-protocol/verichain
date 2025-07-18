#!/bin/bash

# VeriChain Clean Setup Script
# Clean setup while preserving dependencies

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() { echo -e "${BLUE}[CLEAN]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

main() {
    echo -e "${YELLOW}🧹 VeriChain Clean Setup${NC}"
    echo -e "${BLUE}========================${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Stop DFX
    print_step "Stopping DFX..."
    dfx stop >/dev/null 2>&1 || true
    print_success "DFX stopped"
    
    # Remove DFX data but keep network identity
    print_step "Cleaning DFX data..."
    rm -rf .dfx/local >/dev/null 2>&1 || true
    print_success "DFX local data cleaned"
    
    # Remove build artifacts
    print_step "Removing build artifacts..."
    rm -rf target >/dev/null 2>&1 || true
    rm -rf src/frontend/dist >/dev/null 2>&1 || true
    rm -rf src/frontend/node_modules/.cache >/dev/null 2>&1 || true
    print_success "Build artifacts removed"
    
    # Keep dependencies but clean caches
    print_step "Cleaning dependency caches..."
    rm -rf src/frontend/node_modules/.cache >/dev/null 2>&1 || true
    npm cache clean --force >/dev/null 2>&1 || true
    print_success "Dependency caches cleaned"
    
    # Remove logs
    print_step "Removing log files..."
    find . -name "*.log" -delete >/dev/null 2>&1 || true
    print_success "Log files removed"
    
    echo ""
    print_success "🎉 Clean setup completed!"
    echo ""
    echo "What was cleaned:"
    echo "  ✅ DFX local network data"
    echo "  ✅ Build artifacts"
    echo "  ✅ Dependency caches"
    echo "  ✅ Log files"
    echo ""
    echo "What was preserved:"
    echo "  📦 Node.js dependencies"
    echo "  ⚙️ .env configuration"
    echo "  🤖 AI model chunks"
    echo ""
    echo "Next steps:"
    echo -e "  ${GREEN}1.${NC} Run ${BLUE}dfx start --background${NC} to restart DFX"
    echo -e "  ${GREEN}2.${NC} Run ${BLUE}dfx deploy${NC} to redeploy canisters"
    echo -e "  ${GREEN}3.${NC} Run ${BLUE}make dev${NC} to start development"
    echo -e "  ${GREEN}Or:${NC} Run ${BLUE}make setup${NC} for complete setup"
    echo ""
}

main "$@"
