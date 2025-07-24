# VeriChain

**Deepfake Detection Platform on Internet Computer Protocol**

VeriChain is a blockchain-powered deepfake detection platform utilizing a fine-tuned Vision Transformer (ViT) model with 99.90% accuracy to identify real, AI-generated, and deepfake content.

## 🔗 Resources

### AI Model & Dataset
- **Model**: [einrafh/verichain-deepfake-models](https://huggingface.co/einrafh/verichain-deepfake-models) - Pre-trained ViT models
- **Dataset**: [einrafh/verichain-deepfake-data](https://huggingface.co/datasets/einrafh/verichain-deepfake-data) - Curated detection dataset
- **Training Code**: [verichain-ai-model](https://github.com/verichain-protocol/verichain-ai-model) - Model training pipeline

### Documentation
- **[API Reference](docs/API.md)** - Integration guide and endpoints
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup and contribution guide
- **[Model Details](docs/MODEL.md)** - Architecture and performance metrics

## Key Features

- **99.90% Accuracy**: Vision Transformer model for deepfake detection
- **Multi-Format Support**: Images (JPG, PNG) and videos (MP4, MOV)
- **Tiered Access**: Guest (3 analyses), Registered (30/month), Premium (1000/month)
- **Blockchain Verification**: Immutable detection records on ICP
- **Real-Time Processing**: 200-500ms analysis time
- **Modern Frontend**: React TypeScript with real-time AI integration

## Quick Start

### One-Command Setup

Clone the repository and run the setup command:
```bash
git clone https://github.com/verichain-protocol/verichain.git
cd verichain
make setup
```

The setup command handles all prerequisites, dependencies, environment configuration, AI model download, network setup, and deployment.

### Alternative Commands

- `make install` - Install dependencies only
- `make model-setup` - Setup AI model separately  
- `make dev` - Start development server
- `make build` - Build for production
- `make deploy` - Deploy to Internet Computer

### Troubleshooting

- `make reset-setup` - Reset everything and start fresh
- `make clean-setup` - Clean setup (preserves dependencies)
- `make status` - Check system status

## Project Architecture

### Canisters

**AI Canister** (Rust)
- ONNX model inference engine
- Image preprocessing and analysis
- Chunked model storage for ICP compatibility

**Logic Canister** (Motoko)
- User management and authentication
- Quota tracking and tier management
- API endpoints and business logic

**Frontend** (TypeScript + React)
- Modern web interface with Vite
- Real-time canister integration
- Responsive design with Tailwind CSS

### Build System

**Makefile** - Central command interface
- `make setup` - Complete project initialization
- `make dev` - Development environment
- `make build` - Production build
- `make deploy` - Network deployment
- `make test` - Test suite execution

**Scripts Directory**  
- `setup.sh` - Automated project setup with error handling
- `build.sh` - Build orchestration for all components
- `deploy.sh` - Multi-network deployment (local/IC)
- `dev.sh` - Development server with hot reload
- `test.sh` - Test execution and health checks

**Tools Directory**
- `model_chunker.py` - AI model chunking for ICP deployment

## AI Model

**Vision Transformer with 99.90% Accuracy**

- **Model**: [einrafh/verichain-deepfake-models](https://huggingface.co/einrafh/verichain-deepfake-models)
- **Dataset**: [einrafh/verichain-deepfake-data](https://huggingface.co/datasets/einrafh/verichain-deepfake-data)  
- **Training**: [verichain-ai-model](https://github.com/verichain-protocol/verichain-ai-model)

The model is available for direct use via Hugging Face transformers library or integrated through the VeriChain platform's AI service interface.

## Development

### Prerequisites
- Node.js ≥ 18.0.0
- Rust ≥ 1.70.0
- DFX ≥ 0.28.0
- Python 3.8+

### Commands
- `make dev` - Start development environment
- `make build` - Build all components  
- `make test` - Run test suite
- `make deploy` - Deploy to configured network

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed setup and contribution guidelines.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate tests
4. Update documentation if needed
5. Submit a pull request

## License

Copyright (c) 2025 - Muhammad Rafly Ash Shiddiqi, Nickolas Quinn Budiyono, Christopher Robin Tanugroho

---

**Built on Internet Computer Protocol**
