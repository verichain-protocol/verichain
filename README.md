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
git clone https://github.com/your-username/verichain.git
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

**Model Download Fails:**
```bash
# Check internet connection and retry
make model-setup
```

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

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- **Rust**: Use `cargo fmt` and `cargo clippy`
- **JavaScript**: Use Prettier and ESLint
- **Motoko**: Follow official style guide
- **Documentation**: Update README for new features

## License

Copyright (c) 2025

-   Muhammad Rafly Ash Shiddiqi
-   Nickolas Quinn Budiyono
-   Christopher Robin Tanugroho

---

**VeriChain** - Decentralized Deepfake Detection on Internet Computer Protocol
