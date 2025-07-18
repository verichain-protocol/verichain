#!/bin/bash

# VeriChain Reset Setup Script
# Complete reset to clean state with error handling

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() { echo -e "${BLUE}[RESET]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

main() {
    echo -e "${YELLOW}🔄 VeriChain Reset Setup${NC}"
    echo -e "${BLUE}========================${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    # Stop DFX
    print_step "Stopping DFX..."
    dfx stop >/dev/null 2>&1 || true
    print_success "DFX stopped"
    
    # Remove DFX data
    print_step "Removing DFX data..."
    rm -rf .dfx >/dev/null 2>&1 || true
    print_success "DFX data removed"
    
    # Remove build artifacts
    print_step "Removing build artifacts..."
    rm -rf target >/dev/null 2>&1 || true
    rm -rf src/frontend/dist >/dev/null 2>&1 || true
    rm -rf src/frontend/node_modules/.cache >/dev/null 2>&1 || true
    print_success "Build artifacts removed"
    
    # Remove dependencies
    print_step "Removing dependencies..."
    rm -rf node_modules >/dev/null 2>&1 || true
    rm -rf src/frontend/node_modules >/dev/null 2>&1 || true
    print_success "Dependencies removed"
    
    # Remove AI model chunks (but keep tools)
    print_step "Removing AI model chunks..."
    rm -rf src/ai_canister/assets/*.bin >/dev/null 2>&1 || true
    print_success "AI model chunks removed"
    
    # Reset environment (keep .env as backup)
    print_step "Backing up current .env..."
    if [ -f ".env" ]; then
        cp .env .env.backup
        print_success ".env backed up to .env.backup"
    fi
    
    # Remove logs
    print_step "Removing log files..."
    find . -name "*.log" -delete >/dev/null 2>&1 || true
    print_success "Log files removed"
    
    echo ""
    print_success "🎉 Reset completed successfully!"
    echo ""
    echo "What was reset:"
    echo "  ✅ DFX local network stopped and cleaned"
    echo "  ✅ All build artifacts removed"
    echo "  ✅ Dependencies removed"
    echo "  ✅ AI model chunks removed"
    echo "  ✅ Log files cleaned"
    echo "  ✅ Current .env backed up to .env.backup"
    echo ""
    echo "Next steps:"
    echo -e "  ${GREEN}1.${NC} Run ${BLUE}make setup${NC} to reinstall everything"
    echo -e "  ${GREEN}2.${NC} Or manually run individual setup steps"
    echo ""
}

main "$@"
