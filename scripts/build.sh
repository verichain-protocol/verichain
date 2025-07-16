#!/bin/bash
# VeriChain Build Script

set -e

echo "🔨 VeriChain Build System"
echo "========================="

# Build modes
MODE="development"
ENHANCE=false
CLEAN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --production|--prod)
            MODE="production"
            shift
            ;;
        --enhance|-E)
            ENHANCE=true
            shift
            ;;
        --clean|-c)
            CLEAN=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --production, --prod  Build for production"
            echo "  --enhance, -E         Enable build enhancements"
            echo "  --clean, -c           Clean before building"
            echo "  --help, -h            Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "Build mode: $MODE"
if [ "$ENHANCE" = true ]; then
    echo "Build enhancements: enabled"
fi

# Clean function
clean_build() {
    echo "Cleaning build artifacts..."
    dfx stop 2>/dev/null || true
    rm -rf .dfx target/ src/frontend/dist/
    echo "Clean completed"
}

# Build canisters
build_canisters() {
    echo "Building canisters..."
    dfx build
    echo "Canisters built"
}

# Build frontend
build_frontend() {
    echo "Building frontend..."
    cd src/frontend
    npm run build
    cd ../..
    echo "Frontend built"
}

# Enhance WASM files
enhance_wasm() {
    if [ "$ENHANCE" != true ]; then
        return
    fi
    
    echo "Enhancing WASM files..."
    if command -v wasm-opt &> /dev/null; then
        find .dfx -name "*.wasm" -type f | while read -r wasm_file; do
            echo "Enhancing $(basename "$wasm_file")..."
            wasm-opt --enable-bulk-memory -Oz "$wasm_file" -o "$wasm_file.tmp"
            mv "$wasm_file.tmp" "$wasm_file"
        done
        echo "WASM enhancement completed"
    else
        echo "wasm-opt not found. Skipping enhancement."
    fi
}

# Main execution
main() {
    if [ "$CLEAN" = true ]; then
        clean_build
    fi
    
    build_canisters
    build_frontend
    enhance_wasm
    
    echo "✅ Build completed successfully!"
}

main "$@"
