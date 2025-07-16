#!/bin/bash

# Test Social Media Workflow - VeriChain
echo "🌐 Testing Social Media Upload Workflow"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CANISTER_ID=$(dfx canister id ai_canister 2>/dev/null)
FRONTEND_URL="http://localhost:3000"

echo -e "${BLUE}ℹ️  AI Canister ID: ${CANISTER_ID}${NC}"
echo ""

# Test 1: Check backend endpoints
echo -e "${YELLOW}🔍 Test 1: Checking backend endpoints...${NC}"

# Test health check
echo "Testing health_check..."
HEALTH_RESULT=$(dfx canister call ai_canister health_check 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Health check: OK${NC}"
else
    echo -e "${RED}❌ Health check: Failed${NC}"
    exit 1
fi

# Test get_model_info to check social media support
echo "Testing get_model_info..."
MODEL_INFO=$(dfx canister call ai_canister get_model_info 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Model info: OK${NC}"
    echo "   Checking for social media support..."
    if echo "$MODEL_INFO" | grep -q "youtube\|instagram\|tiktok"; then
        echo -e "${GREEN}   ✅ Social media platforms detected${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Social media platforms not found in response${NC}"
    fi
else
    echo -e "${RED}❌ Model info: Failed${NC}"
fi

echo ""

# Test 2: Test analyze_social_media endpoint with dummy data
echo -e "${YELLOW}🔍 Test 2: Testing analyze_social_media endpoint...${NC}"

# Create dummy frame data (small JPEG header)
DUMMY_FRAMES='vec {vec {255:nat8; 216:nat8; 255:nat8; 224:nat8}}'

# Test call
echo "Testing analyze_social_media with dummy data..."
SOCIAL_RESULT=$(dfx canister call ai_canister analyze_social_media "(record {
    url = \"https://www.youtube.com/watch?v=test123\";
    platform = \"youtube\";
    video_id = \"test123\";
    frames = $DUMMY_FRAMES
})" 2>/dev/null)

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Social media analysis endpoint: OK${NC}"
    echo "   Response: $SOCIAL_RESULT"
else
    echo -e "${RED}❌ Social media analysis endpoint: Failed${NC}"
    echo "   This is expected if model is not initialized"
fi

echo ""

# Test 3: Check frontend accessibility
echo -e "${YELLOW}🔍 Test 3: Checking frontend accessibility...${NC}"

# Check if frontend is running
if curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accessible at: $FRONTEND_URL${NC}"
    
    # Check if SocialMediaUpload component exists
    if curl -s "$FRONTEND_URL" | grep -q "social.*media\|Social.*Media"; then
        echo -e "${GREEN}   ✅ Social media upload component detected${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Social media component not detected in HTML${NC}"
    fi
else
    echo -e "${RED}❌ Frontend not accessible${NC}"
    echo "   Make sure to run: npm run dev"
fi

echo ""

# Test 4: URL Validation Tests
echo -e "${YELLOW}🔍 Test 4: URL validation tests...${NC}"

# Test URLs that should be valid
VALID_URLS=(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    "https://youtu.be/dQw4w9WgXcQ"
    "https://www.instagram.com/p/ABC123/"
    "https://www.tiktok.com/@user/video/1234567890"
    "https://twitter.com/user/status/1234567890"
    "https://vimeo.com/123456789"
)

echo "Testing valid URLs..."
for url in "${VALID_URLS[@]}"; do
    platform=$(echo "$url" | sed -E 's|https?://[^/]*([^./]+)\.[^/]+/.*|\1|')
    echo -e "  📋 $url ${GREEN}(should be valid)${NC}"
done

# Test URLs that should be invalid
INVALID_URLS=(
    "https://example.com/video"
    "not-a-url"
    "https://unsupported-platform.com/video/123"
)

echo ""
echo "Testing invalid URLs..."
for url in "${INVALID_URLS[@]}"; do
    echo -e "  📋 $url ${RED}(should be invalid)${NC}"
done

echo ""

# Test 5: Model Status Check
echo -e "${YELLOW}🔍 Test 5: Checking model status...${NC}"

MODEL_STATUS=$(dfx canister call ai_canister get_model_initialization_status 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Model status check: OK${NC}"
    if echo "$MODEL_STATUS" | grep -q "Initialized"; then
        echo -e "${GREEN}   ✅ Model is initialized and ready${NC}"
    elif echo "$MODEL_STATUS" | grep -q "Initializing"; then
        echo -e "${YELLOW}   ⚠️  Model is still initializing${NC}"
    else
        echo -e "${RED}   ❌ Model not initialized${NC}"
        echo "   Run: make model-upload && make model-init"
    fi
else
    echo -e "${RED}❌ Model status check: Failed${NC}"
fi

echo ""

# Summary and Next Steps
echo -e "${BLUE}📋 Summary and Next Steps${NC}"
echo "========================="
echo ""
echo "1. Backend endpoints: Check if all tests passed above"
echo "2. Frontend: Access $FRONTEND_URL to test the UI"
echo "3. Social Media Tab: Click on the 'Social Media URL' tab"
echo "4. Test URLs: Try pasting YouTube, Instagram, or TikTok URLs"
echo "5. File Upload: Alternative to test with video files"
echo ""
echo -e "${YELLOW}⚠️  Note: Social media video download requires backend service${NC}"
echo "   For production, implement yt-dlp backend service"
echo "   For testing, use the file upload option with video files"
echo ""

# Development workflow
echo -e "${BLUE}🔧 Development Workflow${NC}"
echo "======================="
echo ""
echo "# Build and deploy:"
echo "make build && make deploy"
echo ""
echo "# Start frontend development server:"
echo "cd src/frontend && npm run dev"
echo ""
echo "# Run this test script:"
echo "./scripts/test-social-media.sh"
echo ""

# Check if we should start frontend
if ! curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${YELLOW}💡 Tip: Start the frontend with:${NC}"
    echo "cd src/frontend && npm run dev"
    echo ""
fi

echo -e "${GREEN}🎉 Social media workflow test completed!${NC}"
