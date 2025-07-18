#!/bin/bash
# VeriChain Model Upload Script
# Upload model chunks to the AI canister for real deepfake detection

set -e

# Load configuration from .env file
if [ -f ".env" ]; then
    source .env
fi

# Configuration
CHUNK_DIR="src/ai_canister/assets"
METADATA_FILE="${CHUNK_DIR}/model_metadata.json"
CANISTER_NAME="ai_canister"
EXPECTED_CHUNK_SIZE_MB="${MODEL_CHUNK_SIZE_MB:-0.8}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 VeriChain Model Upload Script${NC}"
echo "=================================="

# Check if DFX is running
if ! dfx ping > /dev/null 2>&1; then
    echo -e "${RED}❌ DFX is not running. Please start it with 'dfx start --background'${NC}"
    exit 1
fi

# Check if metadata file exists
if [ ! -f "$METADATA_FILE" ]; then
    echo -e "${RED}❌ Model metadata not found at $METADATA_FILE${NC}"
    echo -e "${YELLOW}📝 Please run 'make model-setup' first to prepare the model chunks${NC}"
    exit 1
fi

# Parse metadata
echo -e "${BLUE}📊 Reading model metadata...${NC}"
TOTAL_CHUNKS=$(jq -r '.total_chunks' "$METADATA_FILE")
ORIGINAL_SIZE=$(jq -r '.original_size' "$METADATA_FILE")
CHUNK_SIZE_MB=$(jq -r '.chunk_size_mb' "$METADATA_FILE")
ORIGINAL_FILE=$(jq -r '.original_file' "$METADATA_FILE")

# Validate chunk size matches expected configuration
if [ "$CHUNK_SIZE_MB" != "$EXPECTED_CHUNK_SIZE_MB" ]; then
    echo -e "${YELLOW}⚠️  Warning: Model chunk size ($CHUNK_SIZE_MB MB) doesn't match expected size ($EXPECTED_CHUNK_SIZE_MB MB)${NC}"
    echo -e "${YELLOW}💡 This might indicate the model was generated with different settings${NC}"
fi

# Round chunk size to nearest integer MB for upload
CHUNK_SIZE_MB_INT=$(echo "$CHUNK_SIZE_MB + 0.5" | bc | cut -d'.' -f1)

# Handle empty CHUNK_SIZE_MB_INT (fallback to 1)
if [ -z "$CHUNK_SIZE_MB_INT" ] || [ "$CHUNK_SIZE_MB_INT" = "" ]; then
    CHUNK_SIZE_MB_INT=1
fi

echo "  Model file: $ORIGINAL_FILE"
echo "  Original size: $(echo "scale=2; $ORIGINAL_SIZE / 1024 / 1024" | bc) MB"
echo "  Total chunks: $TOTAL_CHUNKS"
echo "  Chunk size: ${CHUNK_SIZE_MB} MB (using ${CHUNK_SIZE_MB_INT} MB for upload)"

# Upload metadata first
echo -e "\n${BLUE}📤 Uploading model metadata...${NC}"
dfx canister call $CANISTER_NAME upload_model_metadata \
    "(\"$ORIGINAL_FILE\", ${ORIGINAL_SIZE}:nat64, ${TOTAL_CHUNKS}:nat32, ${CHUNK_SIZE_MB_INT}:nat32)" > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Metadata uploaded successfully${NC}"
else
    echo -e "${RED}❌ Failed to upload metadata${NC}"
    exit 1
fi

# Upload chunks
echo -e "\n${BLUE}📤 Uploading model chunks...${NC}"
for ((i=0; i<$TOTAL_CHUNKS; i++)); do
    CHUNK_FILE="${CHUNK_DIR}/model_chunk_$(printf "%03d" $i).bin"
    
    if [ ! -f "$CHUNK_FILE" ]; then
        echo -e "${RED}❌ Chunk file not found: $CHUNK_FILE${NC}"
        exit 1
    fi
    
    # Get chunk hash from metadata
    CHUNK_HASH=$(jq -r ".chunks[$i].hash" "$METADATA_FILE")
    
    echo -n "  Uploading chunk $((i+1))/$TOTAL_CHUNKS... "
    
    # Create Candid argument file for the chunk using Python
    TEMP_ARG_FILE="/tmp/chunk_${i}_args.txt"
    
    # Use Python to create proper Candid vector format
    python3 -c "
import sys
with open('$CHUNK_FILE', 'rb') as f:
    data = f.read()
bytes_str = '; '.join(str(b) for b in data)
print(f'(${i}:nat32, vec {{{bytes_str}}}, \"$CHUNK_HASH\")')
" > "$TEMP_ARG_FILE"
    
    # Upload chunk using argument file
    if dfx canister call $CANISTER_NAME upload_model_chunk --argument-file "$TEMP_ARG_FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        rm -f "$TEMP_ARG_FILE"
    else
        echo -e "${RED}❌${NC}"
        echo -e "${RED}Failed to upload chunk $i${NC}"
        rm -f "$TEMP_ARG_FILE"
        exit 1
    fi
done

# Check upload status
echo -e "\n${BLUE}📊 Checking upload status...${NC}"
STATUS=$(dfx canister call $CANISTER_NAME get_upload_status | grep -o '{.*}')
echo "$STATUS" | jq .

echo -e "\n${GREEN}🎉 Model chunks uploaded successfully!${NC}"
echo -e "${BLUE}� Next steps:${NC}"
echo -e "  1. Start streaming initialization: ${YELLOW}dfx canister call ai_canister initialize_model_from_chunks${NC}"
echo -e "  2. Continue in batches: ${YELLOW}dfx canister call ai_canister continue_model_initialization '(opt 10)'${NC}"
echo -e "  3. Check progress: ${YELLOW}dfx canister call ai_canister get_model_initialization_status${NC}"
echo -e "  4. Repeat step 2 until complete"
echo -e "\n${BLUE}� Or run the demo: ${YELLOW}./scripts/demo-streaming-init.sh${NC}"
