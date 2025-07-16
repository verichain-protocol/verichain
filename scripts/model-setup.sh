#!/bin/bash
# VeriChain Model Setup Script - Auto download and chunk AI model

set -e

# Configuration
HUGGINGFACE_URL="https://huggingface.co/einrafh/verichain-deepfake-models/resolve/main/models/onnx/verichain-model.onnx"
MODEL_FILE="verichain-model.onnx"
ASSETS_DIR="src/ai_canister/assets"
CHUNK_SIZE_MB=15

echo "🤖 VeriChain Model Setup"
echo "========================"

# Check if model already exists
if [ -f "$ASSETS_DIR/model_metadata.json" ]; then
    echo "✅ Model already exists. Skipping download."
    echo "💡 To re-download, delete $ASSETS_DIR/ and run again."
    exit 0
fi

# Create assets directory
mkdir -p "$ASSETS_DIR"

# Check for required tools
echo "🔍 Checking dependencies..."
if ! command -v curl &> /dev/null; then
    echo "❌ curl not found. Please install curl."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ python3 not found. Please install Python 3."
    exit 1
fi

# Check if model chunker exists
if [ ! -f "tools/model_chunker.py" ]; then
    echo "❌ Error: tools/model_chunker.py not found"
    echo "💡 This script requires the Python model chunker tool"
    exit 1
fi

# Download model from Hugging Face
echo "📥 Downloading model from Hugging Face..."
echo "   Source: $HUGGINGFACE_URL"
echo "   Target: $ASSETS_DIR/$MODEL_FILE"

if curl -L -f -o "$ASSETS_DIR/$MODEL_FILE" --progress-bar "$HUGGINGFACE_URL"; then
    echo "✅ Model downloaded successfully"
else
    echo "❌ Failed to download model. Check URL and connection."
    echo "💡 Alternative: Place model file manually at $ASSETS_DIR/$MODEL_FILE"
    
    # Create dummy chunks for development
    echo "🔧 Creating dummy model chunks for development..."
    mkdir -p "$ASSETS_DIR"
    
    # Create dummy chunks
    for i in {0..6}; do
        dd if=/dev/zero of="$ASSETS_DIR/model_chunk_$(printf "%03d" $i).bin" bs=1M count=10 2>/dev/null
    done
    
    # Create dummy metadata
    cat > "$ASSETS_DIR/model_metadata.json" << 'EOF'
{
  "original_file": "verichain-model.onnx",
  "original_size": 73400320,
  "total_chunks": 7,
  "chunk_size_mb": 15,
  "chunks": [
    {"chunk_id": 0, "filename": "model_chunk_000.bin", "size": 10485760, "hash": "dummy"},
    {"chunk_id": 1, "filename": "model_chunk_001.bin", "size": 10485760, "hash": "dummy"},
    {"chunk_id": 2, "filename": "model_chunk_002.bin", "size": 10485760, "hash": "dummy"},
    {"chunk_id": 3, "filename": "model_chunk_003.bin", "size": 10485760, "hash": "dummy"},
    {"chunk_id": 4, "filename": "model_chunk_004.bin", "size": 10485760, "hash": "dummy"},
    {"chunk_id": 5, "filename": "model_chunk_005.bin", "size": 10485760, "hash": "dummy"},
    {"chunk_id": 6, "filename": "model_chunk_006.bin", "size": 10485760, "hash": "dummy"}
  ]
}
EOF
    echo "✅ Dummy model chunks created for development"
    exit 0
fi

# Chunk model
echo "✂️  Chunking model for ICP deployment..."
python3 tools/model_chunker.py chunk "$ASSETS_DIR/$MODEL_FILE" "$ASSETS_DIR/"

# Clean up original file
rm "$ASSETS_DIR/$MODEL_FILE"

echo "✅ Model setup completed!"
echo "📁 Chunks saved to: $ASSETS_DIR/"
echo "📊 Model statistics:"
ls -lah "$ASSETS_DIR"/model_chunk_*.bin
echo "📄 Metadata: $ASSETS_DIR/model_metadata.json"
