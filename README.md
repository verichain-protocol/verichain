# VeriChain

Blockchain-powered deepfake detection platform on Internet Computer Protocol (ICP).

## Overview

VeriChain is a decentralized platform that leverages AI for deepfake detection in images and videos. Built on Internet Computer blockchain for transparency and immutability of detection results.

## Features

- **Real-time Deepfake Detection**: Advanced AI model for image and video analysis
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
```

### Manual Setup (Alternative)

```bash
# Install dependencies
make install

# Download and setup AI model
make model-setup

# Build project
make build

# Deploy locally
make deploy
```

## Model Upload and Streaming Initialization

VeriChain uses an advanced chunked upload and streaming initialization system to handle large AI models efficiently on Internet Computer Protocol.

### Process Overview

1. **Model Chunking**: The 327MB AI model is split into 410 chunks of ~0.8MB each
2. **Chunked Upload**: Each chunk is uploaded individually with hash verification
3. **Stable Storage**: Chunks are stored in stable memory for persistence across canister upgrades
4. **Streaming Initialization**: Model is initialized in configurable batches to avoid instruction limits

### Model Upload to Canister

After deployment, the AI model needs to be uploaded to the canister in chunks:

```bash
# Upload model chunks to AI canister
./scripts/upload-model.sh

# Check upload progress
dfx canister call ai_canister get_upload_status

# Monitor upload in real-time (shows progress percentage)
watch -n 2 "dfx canister call ai_canister get_upload_status"
```

### Streaming Model Initialization

Once upload is complete, use the streaming initialization for optimal performance:

```bash
# Start streaming model initialization (optimized for large models)
dfx canister call ai_canister start_streaming_initialization

# Continue model initialization in batches (process 10 chunks at a time)
dfx canister call ai_canister continue_model_initialization '(opt 10)'

# Check initialization progress
dfx canister call ai_canister get_model_initialization_status

# Repeat the continue command until initialization is complete
# The process will automatically finalize when all chunks are processed

# Verify model is ready
dfx canister call ai_canister health_check
```

### Automated Streaming Demo

For automated streaming initialization testing:

```bash
# Run demo with default batch size (10)
./scripts/demo-streaming-init.sh

# Custom batch size
./scripts/demo-streaming-init.sh 15
```

### Performance Optimization

Test different batch sizes to find optimal performance:

```bash
# Run comprehensive performance tests
./scripts/test-performance-advanced.sh

# Analyze existing results only
./scripts/test-performance-advanced.sh --analyze-only results_file.csv
```

### Frontend Integration

The frontend includes a real-time **Model Status Panel** that shows:
- Upload progress with visual progress bars
- Initialization status and progress
- Activity logs with timestamps
- Control buttons for manual operations
- Automatic refresh with configurable intervals

**Note**: The model upload and initialization process:
- Splits the 327MB model into 410 chunks of ~0.8MB each
- Uploads chunks individually with hash verification
- Stores chunks in stable memory for persistence across upgrades
- Uses streaming initialization to avoid instruction limit errors
- Processes chunks in configurable batches (default: 10 chunks per call)
- Requires successful upload of all chunks before model initialization
- Provides real-time monitoring through both CLI and web interface

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

## Development

### Available Commands

```bash
make help          # Show available commands
make setup         # Complete project setup
make install       # Install dependencies only
make model-setup   # Download/chunk AI model
make build         # Build for production
make dev-build     # Build for development (faster)
make start         # Start DFX replica
make stop          # Stop DFX replica
make deploy        # Deploy to local network
make dev           # Start complete development environment
make test          # Run all tests
make test-health   # Quick health check
make test-model    # Test model integrity
make clean         # Clean build artifacts
make reset         # Reset and rebuild everything
make status        # Show project status
make check         # Check system requirements
make logs          # Show canister logs
make update        # Update all dependencies
make package       # Package for distribution
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

# AI Model Configuration
AI_MODEL_CHUNK_SIZE_MB=15
MAX_MODEL_SIZE_MB=100
```

### Model Configuration

The AI model is automatically downloaded and chunked during setup. Configuration in `src/ai_canister/src/types/api_types.rs`:

```rust
pub const MODEL_INPUT_SIZE: u32 = 224;
pub const MODEL_CONFIDENCE_THRESHOLD: f32 = 0.5;
pub const MAX_FILE_SIZE_IMAGE_MB: u32 = 10;
pub const MAX_FILE_SIZE_VIDEO_MB: u32 = 50;
```

### Advanced Model Tools

For manual model processing, use the Python chunker:

```bash
# Chunk a large model file
python3 tools/model_chunker.py chunk model.onnx src/ai_canister/assets/

# Verify chunk integrity
python3 tools/model_chunker.py verify src/ai_canister/assets/

# Reconstruct model from chunks
python3 tools/model_chunker.py reconstruct src/ai_canister/assets/ reconstructed.onnx
```

### Build Configuration

Environment-specific builds in `scripts/build.sh`:

- **Development**: Fast builds with debug symbols
- **Production**: Release builds with compression

## Performance

### Benchmark Results

- **Image Analysis**: ~200-500ms per image
- **Video Analysis**: ~2-5s per video (depending on length)
- **Batch Processing**: Parallel processing for premium users
- **Memory Usage**: <512MB per canister instance

### Resource Limits

- **Max Image Size**: 10MB
- **Max Video Size**: 50MB
- **Concurrent Requests**: 100 per canister
- **Storage**: Unlimited (blockchain-based)

## Security

- **Input Validation**: Comprehensive file type and size validation
- **Rate Limiting**: Per-user usage tracking and limits
- **Access Control**: Premium features require subscription
- **Model Integrity**: SHA256 verification of AI model chunks
- **Blockchain Security**: Leverages ICP's consensus mechanism

## Troubleshooting

### Common Issues

**Model Upload Issues:**
```bash
# Check canister cycles before upload
dfx canister status ai_canister

# Add cycles if needed
dfx ledger fabricate-cycles --amount 100000000 --canister ai_canister

# Resume incomplete upload
./scripts/upload-model.sh
```

**Streaming Initialization Issues:**
```bash
# Check current initialization status
dfx canister call ai_canister get_model_initialization_status

# Restart streaming if needed
dfx canister call ai_canister start_streaming_initialization

# Continue with smaller batch size if hitting limits
dfx canister call ai_canister continue_model_initialization '(opt 5)'

# Test performance with different batch sizes
./scripts/test-performance-advanced.sh
```

**Frontend Model Status Panel:**
- If status not updating: Check browser console for errors
- If buttons not working: Verify canister IDs in declarations
- If progress seems stuck: Check canister cycles and memory usage

**Build Errors:**
```bash
# Clean and rebuild
make clean
make setup
```

**DFX Connection Issues:**
```bash
# Reset local replica
make stop
make start
```

**Check System Status:**
```bash
make status
make check
```

**Docker Issues:**
```bash
# Reset Docker environment
make docker-clean
make docker-dev
```

### Performance Troubleshooting

**Upload Too Slow:**
- Check internet connection
- Verify canister has sufficient cycles
- Monitor with: `watch -n 2 "dfx canister call ai_canister get_upload_status"`

**Initialization Failing:**
- Try smaller batch sizes (5-10 chunks)
- Check canister memory limits
- Verify all chunks uploaded successfully

**Out of Cycles Errors:**
```bash
# Add more cycles
dfx ledger fabricate-cycles --amount 200000000 --canister ai_canister

# Check cycle usage patterns
dfx canister status ai_canister
```

**Memory Issues:**
```bash
# Check memory usage
dfx canister status ai_canister

# Monitor during operations
watch -n 2 "dfx canister status ai_canister | grep Memory"
```
