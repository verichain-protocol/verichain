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

# Create simple chunker if tools/model_chunker.py doesn't exist
if [ ! -f "tools/model_chunker.py" ]; then
    echo "📝 Creating model chunker..."
    mkdir -p tools
    cat > tools/model_chunker.py << 'EOF'
#!/usr/bin/env python3
import sys
import os
import json
import hashlib

def chunk_file(input_file, output_dir, chunk_size_mb=15):
    chunk_size = chunk_size_mb * 1024 * 1024  # Convert to bytes
    
    file_size = os.path.getsize(input_file)
    filename = os.path.basename(input_file)
    
    chunks = []
    chunk_id = 0
    
    with open(input_file, 'rb') as f:
        while True:
            chunk_data = f.read(chunk_size)
            if not chunk_data:
                break
                
            chunk_filename = f"model_chunk_{chunk_id:03d}.bin"
            chunk_path = os.path.join(output_dir, chunk_filename)
            
            # Write chunk
            with open(chunk_path, 'wb') as chunk_file:
                chunk_file.write(chunk_data)
            
            # Calculate hash
            chunk_hash = hashlib.sha256(chunk_data).hexdigest()
            
            chunks.append({
                "chunk_id": chunk_id,
                "filename": chunk_filename,
                "size": len(chunk_data),
                "hash": chunk_hash
            })
            
            print(f"Created chunk {chunk_id}: {chunk_filename} ({len(chunk_data)} bytes)")
            chunk_id += 1
    
    # Create metadata
    metadata = {
        "original_file": filename,
        "original_size": file_size,
        "total_chunks": len(chunks),
        "chunk_size_mb": chunk_size_mb,
        "chunks": chunks
    }
    
    # Save metadata
    metadata_path = os.path.join(output_dir, "model_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Created metadata: {metadata_path}")
    return len(chunks)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 model_chunker.py <input_file> <output_dir>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found")
        sys.exit(1)
    
    os.makedirs(output_dir, exist_ok=True)
    
    total_chunks = chunk_file(input_file, output_dir)
    print(f"✅ Successfully created {total_chunks} chunks")
EOF
    chmod +x tools/model_chunker.py
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
python3 tools/model_chunker.py "$ASSETS_DIR/$MODEL_FILE" "$ASSETS_DIR/"

# Clean up original file
rm "$ASSETS_DIR/$MODEL_FILE"

echo "✅ Model setup completed!"
echo "📁 Chunks saved to: $ASSETS_DIR/"
echo "📊 Model statistics:"
ls -lah "$ASSETS_DIR"/model_chunk_*.bin
echo "📄 Metadata: $ASSETS_DIR/model_metadata.json"
