#!/bin/bash
# VeriChain Complete Model Setup Script
# Handles model upload and streaming initialization in one go

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 VeriChain Complete Model Setup${NC}"
echo "================================="

# Default batch size for streaming initialization
BATCH_SIZE=${1:-10}

echo -e "${BLUE}Configuration:${NC}"
echo "  Batch size: $BATCH_SIZE chunks per call"
echo ""

# Step 1: Upload model chunks
echo -e "${BLUE}📤 Step 1: Uploading model chunks...${NC}"
./scripts/upload-model.sh

# Step 2: Start streaming initialization
echo -e "\n${BLUE}🔄 Step 2: Starting streaming initialization...${NC}"
INIT_RESULT=$(dfx canister call ai_canister initialize_model_from_chunks 2>&1)

if [[ $INIT_RESULT == *"Err"* ]]; then
    echo -e "${RED}❌ Failed to start initialization: $INIT_RESULT${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Streaming initialization started${NC}"

# Step 3: Continue initialization in batches
echo -e "\n${BLUE}🔄 Step 3: Processing chunks in batches...${NC}"

while true; do
    STATUS=$(dfx canister call ai_canister get_model_initialization_status 2>/dev/null)
    
    if [[ $STATUS == *'"Complete"'* ]]; then
        echo -e "${GREEN}✅ Model initialization completed!${NC}"
        break
    fi
    
    # Extract progress information
    PROCESSED=$(echo "$STATUS" | grep -o 'processed_chunks = [0-9]*' | grep -o '[0-9]*' || echo "0")
    TOTAL=$(echo "$STATUS" | grep -o 'total_chunks = [0-9]*' | grep -o '[0-9]*' || echo "410")
    PERCENT=$((PROCESSED * 100 / TOTAL))
    
    echo "  Progress: $PROCESSED/$TOTAL chunks ($PERCENT%)"
    
    # Continue with next batch
    CONTINUE_RESULT=$(dfx canister call ai_canister continue_model_initialization "(opt ${BATCH_SIZE}:nat32)" 2>&1)
    
    if [[ $CONTINUE_RESULT == *"Err"* ]]; then
        echo -e "${RED}❌ Failed to continue initialization: $CONTINUE_RESULT${NC}"
        exit 1
    fi
    
    # Brief pause to avoid overwhelming the canister
    sleep 1
done

# Step 4: Verify model integrity
echo -e "\n${BLUE}🔍 Step 4: Verifying model integrity...${NC}"
INTEGRITY_CHECK=$(dfx canister call ai_canister verify_model_integrity 2>/dev/null)

if echo "$INTEGRITY_CHECK" | grep -q "true"; then
    echo -e "${GREEN}✅ Model integrity verified${NC}"
else
    echo -e "${YELLOW}⚠️  Model integrity check failed${NC}"
fi

# Step 5: Health check
echo -e "\n${BLUE}🩺 Step 5: Final health check...${NC}"
HEALTH_RESULT=$(dfx canister call ai_canister health_check 2>/dev/null)
echo "$HEALTH_RESULT"

echo -e "\n${GREEN}🎉 Model setup completed successfully!${NC}"
echo -e "${BLUE}💡 VeriChain is now ready for deepfake detection${NC}"
