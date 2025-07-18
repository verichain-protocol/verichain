# VeriChain Development Guide

## Prerequisites

Ensure you have the following installed:

- **Node.js** ≥ 16.0.0
- **Rust** ≥ 1.70.0 
- **DFX** ≥ 0.15.0
- **Python** 3.7+ (for model tools)
- **Git**

### System Requirements

- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 5GB free space
- **OS**: Linux, macOS, or Windows with WSL2

## Installation

### Quick Setup

```bash
# Clone repository
git clone https://github.com/verichain-protocol/verichain.git
cd verichain

# Complete setup
make full-setup

# Start development environment
make dev
```

### Manual Setup

```bash
# Install dependencies
make install

# Setup AI model
make model-setup

# Build project
make build

# Deploy locally
make deploy
```

## Development Workflow

### Daily Development

```bash
# Start development environment
make dev

# In another terminal, make changes and rebuild
make dev-build

# Test changes
make test-health
```

### Model Development

```bash
# Upload new model chunks
make upload-model

# Initialize model
make stream-init-demo

# Test model performance
make test-model
```

## Project Structure

### Core Directories

```
verichain/
├── src/
│   ├── ai_canister/          # Rust-based AI processing
│   ├── logic_canister/       # Motoko business logic
│   └── frontend/             # React TypeScript UI
├── scripts/                  # Automation scripts
├── tools/                    # Utility tools
└── docs/                     # Documentation
```

### AI Canister Structure

```
src/ai_canister/
├── src/
│   ├── lib.rs               # Main entry point
│   ├── handlers.rs          # API endpoints
│   ├── state.rs             # State management
│   ├── upload_chunks.rs     # Model handling
│   ├── models/              # AI logic
│   │   └── deepfake_detector.rs
│   ├── types/               # Type definitions
│   │   ├── api_types.rs
│   │   └── mod.rs
│   └── utils/               # Helper functions
│       └── validation.rs
└── assets/                  # Model chunks (generated)
```

### Frontend Structure

```
src/frontend/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom hooks
│   ├── services/           # API integration
│   ├── types/              # TypeScript types
│   └── utils/              # Helper functions
└── package.json
```

## Configuration

### Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Key configurations:

```bash
# Model settings
MODEL_CHUNK_SIZE_MB=0.8
MODEL_DOWNLOAD_URL='https://huggingface.co/einrafh/verichain-deepfake-models/resolve/main/models/onnx/verichain-model.onnx'

# Network selection
DEPLOY_NETWORK=local

# Build settings
NODE_ENV=development
RUST_BACKTRACE=1
```

### DFX Configuration

The `dfx.json` file controls Internet Computer settings:

```json
{
  "version": 1,
  "canisters": {
    "ai_canister": {
      "type": "rust",
      "package": "ai_canister"
    },
    "logic_canister": {
      "type": "motoko",
      "main": "src/logic_canister/src/main.mo"
    },
    "frontend": {
      "type": "assets",
      "source": ["src/frontend/dist/"]
    }
  }
}
```

## Testing

### Test Categories

```bash
# Quick health check
make test-health

# Model integrity
make test-model

# Performance testing
make test-performance

# Error recovery
make test-error-recovery

# Social media workflow
make test-social-media

# Full integration test
make integration-test

# Complete QA suite
make qa-suite
```

### Manual Testing

```bash
# Test image analysis
curl -X POST "http://localhost:4943/analyze_image" \
  --data-binary @sample.jpg \
  -H "Content-Type: application/octet-stream"

# Test health endpoint
curl "http://localhost:4943/health_check"

# Check model status
dfx canister call ai_canister get_model_info
```

## Debugging

### Common Issues

**Model Not Loading**:
```bash
# Check cycles
dfx canister status ai_canister

# Add cycles if needed
dfx ledger fabricate-cycles --amount 100000000 --canister ai_canister

# Retry model setup
make setup-model-complete
```

**Build Failures**:
```bash
# Clean rebuild
make clean && make build

# Check dependencies
make check
```

**Frontend Issues**:
```bash
# Check canister IDs
cat .env | grep CANISTER_ID

# Regenerate declarations
dfx generate

# Restart frontend
cd src/frontend && npm start
```

### Monitoring

```bash
# Monitor model initialization
watch -n 2 "dfx canister call ai_canister get_model_initialization_status"

# Monitor canister status
watch -n 5 "dfx canister status ai_canister"

# View logs
make logs
```

## Code Style

### Rust Guidelines

- Use `cargo fmt` for formatting
- Follow Rust naming conventions
- Document public APIs with doc comments
- Use `Result<T, String>` for error handling

Example:
```rust
/// Analyzes an image for deepfake detection
pub fn analyze_image(&mut self, image_data: &[u8]) -> Result<DetectionResult, String> {
    // Implementation
}
```

### TypeScript Guidelines

- Use TypeScript strict mode
- Define interfaces for all data structures
- Use meaningful variable names
- Implement proper error boundaries

Example:
```typescript
interface AnalysisResult {
  is_deepfake: boolean;
  confidence: number;
  processing_time_ms: number;
}
```

### Documentation

- Keep README.md concise and focused
- Use docs/ for detailed documentation
- Include code examples in API documentation
- Maintain changelog for significant updates

## Deployment

### Local Development

```bash
# Start local replica
make start

# Deploy all canisters
make deploy

# Verify deployment
make test-health
```

### IC Mainnet

```bash
# Build for production
make build

# Deploy to mainnet (requires cycles)
dfx deploy --network ic

# Verify deployment
dfx canister --network ic call ai_canister health_check
```

### Docker Deployment

```bash
# Build Docker image
make docker-build

# Run with Docker
make docker-dev

# Stop containers
make docker-stop
```

## Performance Optimization

### AI Canister

- Use efficient batch sizes for model initialization
- Optimize memory allocation for large files
- Implement proper error recovery
- Monitor cycle consumption

### Frontend

- Implement lazy loading for components
- Use proper state management
- Optimize bundle size
- Implement proper caching strategies

### Model Performance

- Monitor inference times
- Track memory usage
- Implement request queuing for high loads
- Use appropriate confidence thresholds

## Contributing

### Development Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation if needed
4. Submit pull request with description
5. Address review feedback
6. Merge after approval

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Performance considerations addressed
- [ ] Security implications reviewed
- [ ] Error handling implemented
- [ ] Backward compatibility maintained

### Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release tag
4. Deploy to staging
5. Run full test suite
6. Deploy to production
7. Monitor for issues
