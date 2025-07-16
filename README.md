# VeriChain

Blockchain-powered deepfake detection platform on Internet Computer Protocol (ICP).

## Overview

VeriChain is a decentralized platform that leverages AI for deepfake detection in images and videos. Built on Internet Computer blockchain for transparency and immutability of detection results.

## Features

- **Real-time Deepfake Detection**: Advanced AI model for image and video analysis
- **Social Media URL Analysis**: Direct analysis of YouTube, Instagram, TikTok, Twitter, and Facebook content
- **Blockchain Verification**: Immutable detection records on ICP
- **Multiple Media Formats**: Support for JPG, PNG, MP4, WebM, and more
- **Batch Processing**: Premium users can analyze multiple files simultaneously
- **API Access**: RESTful API for developers and integrations
- **Smart Contract Logic**: Decentralized business logic with usage tracking

## Quick Start

### Prerequisites

- Node.js ≥ 16.0.0
- Rust ≥ 1.70.0
- DFX ≥ 0.15.0
- Git
- Python 3.7+ (for model chunking tools)

### Installation

```bash
# Clone repository
git clone https://github.com/verichain-protocol/verichain.git
cd verichain

# Complete setup (installs dependencies, downloads model, builds project)
make setup

# Start development environment
make dev

# Full setup with model upload and initialization (recommended for production)
make full-setup
```

### Quick Setup Options

```bash
# Minimal setup (dependencies only)
make install

# Download and setup AI model chunks locally
make model-setup

# Build project only
make build

# Deploy to local network
make deploy
```

## Model Deployment

VeriChain uses an advanced chunked upload and streaming initialization system for efficient large AI model deployment on Internet Computer Protocol.

### Quick Model Setup

```bash
# Complete model upload and initialization (recommended)
make setup-model-complete

# Or step-by-step approach:
make upload-model           # Upload chunks only
make stream-init-demo       # Interactive streaming initialization demo
```

### Manual Model Operations

```bash
# Upload model chunks to AI canister
./scripts/upload-model.sh

# Start streaming initialization
dfx canister call ai_canister initialize_model_from_chunks

# Continue in batches (repeat until complete)
dfx canister call ai_canister continue_model_initialization '(opt 10)'

# Check progress
dfx canister call ai_canister get_model_initialization_status

# Verify model integrity
dfx canister call ai_canister verify_model_integrity
```

### Process Overview

1. **Model Chunking**: 327MB AI model → 410 chunks of ~0.8MB each
2. **Chunked Upload**: Individual upload with hash verification
3. **Stable Storage**: Persistent storage across canister upgrades  
4. **Streaming Initialization**: Configurable batch processing to avoid instruction limits

### Performance Testing

```bash
# Run comprehensive performance analysis
make test-performance

# Test error recovery scenarios
make test-error-recovery

# Complete integration test suite
make integration-test

# Run all QA tests
make qa-suite
```

## Architecture

```
verichain/
├── .env.example             # Environment configuration template
├── .dockerignore            # Docker build exclusions
├── Dockerfile               # Container configuration
├── docker-compose.yml       # Multi-container setup
├── Makefile                 # Build and development tools
├── src/
│   ├── ai_canister/          # AI processing canister (Rust)
│   │   ├── src/
│   │   │   ├── lib.rs        # Main entry point
│   │   │   ├── handlers.rs   # API endpoints
│   │   │   ├── state.rs      # State management
│   │   │   ├── upload_chunks.rs # Model chunk handling
│   │   │   ├── models/       # AI model logic
│   │   │   ├── types/        # Type definitions
│   │   │   └── utils/        # Helper functions
│   │   └── assets/           # Model chunks (auto-generated)
│   ├── logic_canister/       # Business logic canister (Motoko)
│   │   └── src/main.mo       # Smart contract logic
│   └── frontend/             # React frontend (TypeScript)
│       └── src/
├── scripts/
│   ├── build.sh             # Build automation
│   └── model-setup.sh       # Model download/chunking
├── tools/
│   └── model_chunker.py     # Python utility for model processing
└── dfx.json                 # Internet Computer configuration
```

## API Reference

### Endpoints

#### Image Analysis
```bash
POST /analyze_image
Content-Type: application/octet-stream
Body: [image binary data]

Response:
{
  "is_deepfake": boolean,
  "confidence": number,
  "processing_time_ms": number,
  "metadata": object
}
```

#### Video Analysis
```bash
POST /analyze_video
Content-Type: application/octet-stream
Body: [video binary data]

Response:
{
  "is_deepfake": boolean,
  "confidence": number,
  "frames_analyzed": number,
  "processing_time_ms": number,
  "metadata": object
}
```

#### Health Check
```bash
GET /health_check

Response:
{
  "status": "healthy",
  "model_loaded": true,
  "uptime_seconds": number,
  "version": "1.0.0"
}
```

### Usage Limits

- **Free Users**: 3 analyses per month
- **Premium Users**: 1000 analyses per month + batch processing
- **API Access**: Premium subscription required

## Social Media Analysis

VeriChain supports direct analysis of social media content by URL. Simply paste a URL from supported platforms:

### Supported Platforms

- **YouTube**: Videos, Shorts, Live streams
- **Instagram**: Posts, Reels, IGTV
- **TikTok**: Short videos, Live streams
- **Twitter/X**: Video posts
- **Facebook**: Video posts
- **Vimeo**: All video content
- **Dailymotion**: All video content

### How It Works

1. **URL Input**: Paste a social media URL in the frontend
2. **Video Processing**: Platform-specific video extraction and frame sampling
3. **AI Analysis**: Each frame is analyzed for deepfake patterns
4. **Results**: Confidence scores and detailed analysis per frame
5. **Blockchain Recording**: Results are immutably stored on ICP

### Usage Examples

```bash
# Frontend Interface
1. Open http://localhost:3000
2. Click "Social Media URL" tab
3. Paste URL (e.g., https://www.youtube.com/watch?v=example)
4. Click "Analyze Video"

# API Usage (Backend)
dfx canister call ai_canister analyze_social_media '(
  record {
    url = "https://www.youtube.com/watch?v=example";
    platform = variant { YouTube };
    frames = vec { vec {255:nat8; 216:nat8; 255:nat8; 224:nat8} };
    metadata = opt "Sample analysis"
  }
)'
```

### Testing Social Media Workflow

```bash
# Run comprehensive social media tests
make test-social-media

# Test individual components
dfx canister call ai_canister get_model_info  # Check supported platforms
dfx canister call ai_canister health_check    # Verify backend status
```

### Production Considerations

- **Video Download Service**: Production deployments require a backend service with `yt-dlp` for video extraction
- **Rate Limiting**: Implement appropriate rate limits for social media API calls
- **Privacy**: Frame extraction happens locally when possible; only frames are sent to analysis
- **Caching**: Consider implementing video caching for repeated analyses

## Development

### Available Commands

**Main Commands:**
```bash
make help                    # Show available commands
make setup                   # Complete project setup
make install                 # Install dependencies only
make model-setup             # Download/chunk AI model
make build                   # Build for production
make dev-build               # Build for development (faster)
make start                   # Start DFX replica
make stop                    # Stop DFX replica
make deploy                  # Deploy to local network
make dev                     # Start complete development environment
```

**Model Operations:**
```bash
make upload-model            # Upload model chunks to canister
make setup-model-complete    # Complete model upload and initialization
make stream-init-demo        # Interactive streaming initialization demo
```

**Testing and QA:**
```bash
make test                    # Run all tests
make test-health             # Quick health check
make test-model              # Test model integrity
make test-performance        # Performance testing
make test-error-recovery     # Error recovery testing
make test-social-media       # Social media workflow testing
make integration-test        # Full integration test
make qa-suite                # Complete QA test suite
```

**Maintenance:**
```bash
make clean                   # Clean build artifacts
make reset                   # Reset and rebuild everything
make status                  # Show project status
make check                   # Check system requirements
make logs                    # Show canister logs
make update                  # Update all dependencies
```

**Combined Workflows:**
```bash
make full-setup              # Complete setup with model deployment
make all                     # Setup, deployment, and testing
```

### Docker Support

```bash
# Build Docker image
make docker-build

# Start with Docker
make docker-dev

# Stop Docker containers
make docker-stop

# Clean Docker resources
make docker-clean
```

### Testing

```bash
# Run all tests
make test

# Quick health check
make test-health

# Test model integrity
make test-model

# Test with sample image
curl -X POST "http://localhost:4943/analyze_image" \
  --data-binary @sample.jpg \
  -H "Content-Type: application/octet-stream"
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Example configuration:
```bash
# DFX & Internet Computer
DFX_VERSION=0.27.0
DFX_NETWORK=local

# Build Environment  
RUST_BACKTRACE=1
NODE_ENV=development

# Canister IDs (auto-generated by dfx deploy)
# CANISTER_ID_LOGIC_CANISTER=
# CANISTER_ID_INTERNET_IDENTITY=
# CANISTER_ID_FRONTEND=
# CANISTER_ID_AI_CANISTER=
```

### Model Configuration

AI model settings are defined in the Rust codebase at `src/ai_canister/src/types/api_types.rs`:

```rust
pub const MODEL_INPUT_SIZE: u32 = 224;
pub const MODEL_CONFIDENCE_THRESHOLD: f32 = 0.5;
pub const MAX_FILE_SIZE_IMAGE_MB: u32 = 10;
pub const MAX_FILE_SIZE_VIDEO_MB: u32 = 50;
```

Build configuration is handled automatically by `scripts/build.sh`:
- **Development**: Fast builds with debug symbols  
- **Production**: Release builds with compression

## Performance

### Benchmark Results

- **Image Analysis**: ~200-500ms per image
- **Video Analysis**: ~2-5s per video (length dependent)
- **Memory Usage**: <512MB per canister instance
- **Concurrent Requests**: 100 per canister
- **Storage**: Unlimited (blockchain-based)

### Resource Limits

- **Max Image Size**: 10MB
- **Max Video Size**: 50MB  
- **Model Size**: 327MB (chunked for deployment)
- **Streaming Batch Size**: 5-30 chunks (configurable)

## Security

- **Input Validation**: Comprehensive file type and size validation
- **Rate Limiting**: Per-user usage tracking and limits
- **Access Control**: Premium features require subscription
- **Model Integrity**: SHA256 verification of AI model chunks
- **Blockchain Security**: Leverages ICP's consensus mechanism

## Troubleshooting

### Quick Diagnostics

```bash
make status                  # Check overall project status
make check                   # Verify system requirements
make test-health             # Quick canister health check
dfx canister status ai_canister  # Detailed canister status
```

### Common Issues

**Model Upload/Initialization:**
```bash
# Check canister cycles before operations
dfx canister status ai_canister

# Add cycles if needed
dfx ledger fabricate-cycles --amount 100000000 --canister ai_canister

# Resume operations
make setup-model-complete

# Check current status
dfx canister call ai_canister get_model_initialization_status
```

**Build and Deployment:**
```bash
# Clean rebuild
make clean && make setup

# Reset DFX environment  
make stop && make start && make deploy
```

**Performance Issues:**
```bash
# Test optimal batch sizes
make test-performance

# Run error recovery tests
make test-error-recovery

# Full integration verification
make integration-test
```

**Frontend Issues:**
- Model Status Panel not updating: Check browser console and verify canister IDs
- Buttons not working: Verify canister deployment and cycles
- Progress stuck: Check canister memory and cycles usage

### Monitoring and Logs

```bash
# Real-time upload monitoring
watch -n 2 "dfx canister call ai_canister get_upload_status"

# Real-time initialization monitoring  
watch -n 2 "dfx canister call ai_canister get_model_initialization_status"

# Show canister logs
make logs

# Monitor cycles and memory
watch -n 5 "dfx canister status ai_canister | grep -E 'Balance:|Memory'"
```
