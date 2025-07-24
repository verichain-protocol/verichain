# VeriChain Development Guide

## Quick Setup

Clone the repository and run the setup command:
```bash
git clone https://github.com/verichain-protocol/verichain.git
cd verichain
make setup
```

## Prerequisites

- **Node.js** ≥ 18.0.0
- **Rust** ≥ 1.70.0 
- **DFX** ≥ 0.28.0
- **Python** 3.8+

## Commands

- `make dev` - Start development environment
- `make build` - Build all components
- `make deploy` - Deploy to configured network
- `make test` - Run test suite
- `make model-setup` - Download and setup AI model
- `make upload-model` - Upload model chunks to canister
- `make reset-setup` - Complete reset
- `make clean-setup` - Clean while preserving dependencies
- `make status` - Check system status

## Project Structure

```
verichain/
├── src/
│   ├── ai_canister/        # Rust - AI processing with ONNX model
│   ├── logic_canister/     # Motoko - User management and business logic
│   └── frontend/           # TypeScript React - Web interface
├── scripts/                # Build automation
│   ├── setup.sh           # Complete project setup
│   ├── build.sh           # Component build orchestration
│   ├── deploy.sh          # Multi-network deployment
│   ├── dev.sh             # Development server
│   └── test.sh            # Test execution
├── tools/                  # Utilities
│   └── model_chunker.py   # AI model chunking for ICP
├── docs/                   # Documentation
├── Makefile               # Command interface
├── dfx.json               # ICP configuration
└── Cargo.toml             # Rust workspace
```

## Components

### AI Canister (Rust)
- ONNX model inference engine
- Image preprocessing and analysis
- Chunked model storage for ICP deployment

### Logic Canister (Motoko)
- User authentication and management
- Quota tracking and tier enforcement
- API endpoints and business logic

### Frontend (TypeScript + React)
- Modern web interface built with Vite
- Real-time canister integration
- Responsive design with Tailwind CSS

## Development Workflow

### Environment Setup
Copy the environment template and configure settings as needed.

### Frontend Development
The frontend uses TypeScript with React and integrates directly with canisters through generated service interfaces.

Frontend structure includes components, services for canister integration, TypeScript type definitions, and utility functions.

### Testing
Multiple test types are available including complete test suite, quick health checks, and model functionality tests.

## Common Issues

**Model loading fails**: Run `make model-setup`  
**Build errors**: Try `make clean && make build`  
**Frontend issues**: Run `dfx generate` and restart frontend server  
**Canister deployment fails**: Check `make status` and verify DFX is running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation if needed
5. Submit pull request

### Code Standards
- Follow existing code style
- Add tests for new features
- Update documentation
- Use meaningful commit messages

---

**For API details see [API.md](API.md) | For model specs see [MODEL.md](MODEL.md)**
