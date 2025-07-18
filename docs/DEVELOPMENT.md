# VeriChain Development Guide

## Quick Setup

```bash
git clone https://github.com/verichain-protocol/verichain.git
cd verichain
make setup  # One command - handles everything automatically
```

## Prerequisites

- **Node.js** ≥ 18.0.0
- **Rust** ≥ 1.70.0 
- **DFX** ≥ 0.28.0
- **Python** 3.8+ (for model tools)

## Development Commands

```bash
# Development
make dev          # Start development environment
make build        # Build all components
make deploy       # Deploy to local network
make test-health  # Quick health check

# Model operations
make model-setup  # Setup AI model
make upload-model # Upload new model chunks

# Troubleshooting
make reset-setup  # Complete reset
make clean-setup  # Clean reset (keeps dependencies)
make status       # Check what's running
```

## Project Structure

```
verichain/
├── src/
│   ├── ai_canister/        # Rust - AI processing engine
│   ├── logic_canister/     # Motoko - Business logic & user management
│   └── frontend/           # TypeScript React - User interface
├── scripts/                # Build automation
└── docs/                   # Documentation
```

## Frontend Development

Built with TypeScript + React + Vite:

```typescript
// Real canister integration
import { CoreAIService } from './services/coreAI.service';
const aiService = new CoreAIService();
const result = await aiService.analyzeImage(imageFile);
```

Structure:
```
src/frontend/src/
├── components/     # React components
├── services/       # Canister integration
├── types/          # TypeScript definitions
└── utils/          # Helper functions
```

## Configuration

```bash
# Environment setup
cp .env.example .env

# Key settings
MODEL_CHUNK_SIZE_MB=0.8
DEPLOY_NETWORK=local
NODE_ENV=development
```

## Testing

```bash
make test-health      # Quick health check
make test-model       # Model integrity
make test-performance # Performance testing
make integration-test # Full integration
```

## Common Issues

**Model not loading**: `make setup-model-complete`  
**Build failures**: `make clean && make build`  
**Frontend issues**: `dfx generate && cd src/frontend && npm start`

## Contributing

1. Create feature branch
2. Make changes with tests
3. Update docs if needed
4. Submit pull request
5. Address review feedback

---

**For API details see [API.md](API.md) | For model specs see [MODEL.md](MODEL.md)**
