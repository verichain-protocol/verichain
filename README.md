# VeriChain

**Professional Deepfake Detection Platform on Internet Computer Protocol**

VeriChain is a production-ready blockchain-powered deepfake detection platform utilizing a fine-tuned Vision Transformer (ViT) model with 99.90% accuracy to identify real, AI-generated, and deepfake content across multiple media formats.

## ✨ Key Features

- **Advanced AI Detection**: Vision Transformer model with 99.90% accuracy
- **Multi-Format Support**: JPG, PNG, JPEG, MP4, MOV analysis
- **Social Media Integration**: Direct analysis of YouTube, Instagram, TikTok, Twitter, Facebook
- **Blockchain Verification**: Immutable detection records on ICP
- **Web3 Native**: Efficient cycles management and native canister calls
- **Real-Time Processing**: 200-500ms response times
- **Production Ready**: Optimized for public deployment

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 16.0.0
- Rust ≥ 1.70.0  
- DFX ≥ 0.15.0
- Python 3.7+

### Installation

```bash
# Clone and setup
git clone https://github.com/verichain-protocol/verichain.git
cd verichain

# Complete setup with model deployment
make setup

# Start development
make dev
```

### Usage

```bash
# Development
make dev                    # Start complete development environment
make test-health           # Quick health check

# Production  
make build                 # Production build
make deploy               # Deploy to network
```

## 🤖 AI Model - Vision Transformer (ViT)

### Model Specifications

VeriChain uses a fine-tuned Vision Transformer model for deepfake detection, trained to classify content into three categories: **Real**, **AI-Generated**, or **Deepfake**.

**Technical Details:**
- **Architecture**: Vision Transformer (ViT) optimized for deepfake detection
- **Model Size**: 327.56 MB (chunked for ICP deployment)
- **Input Resolution**: 224×224 pixels
- **Format**: ONNX optimized for production inference
- **Deployment**: 410 chunks of ~800KB each for ICP compatibility

### Performance Metrics

| Metric | Score |
|--------|-------|
| **Test Accuracy** | **99.90%** |
| **F1-Score (Macro)** | **99.90%** |
| Test Loss | 0.0202 |

### Classification Performance

| Class | Precision | Recall | F1-Score |
|-------|-----------|--------|----------|
| AI Generated | 100.00% | 99.70% | 99.85% |
| Deepfake | 99.70% | 100.00% | 99.85% |
| Real | 100.00% | 100.00% | 100.00% |

The model was evaluated on a held-out test set of 2,000 images, achieving near-perfect performance across all categories.

### Model Usage

```python
from transformers import pipeline
from PIL import Image

# Load the image classification pipeline
classifier = pipeline(
    "image-classification", 
    model="einrafh/verichain-deepfake-models", 
    subfolder="models/vit-deepfake-model"
)

# Analyze an image
image = Image.open('path/to/image.jpg')
results = classifier(image)
print(results)

# Example Output:
# [{'label': 'Deepfake', 'score': 0.9985}, 
#  {'label': 'AI Generated', 'score': 0.0010}, 
#  {'label': 'Real', 'score': 0.0005}]
```

## 🏗️ Architecture

```
verichain/
├── src/
│   ├── ai_canister/          # Rust AI processing engine
│   ├── logic_canister/       # Motoko business logic  
│   └── frontend/             # React TypeScript UI
├── scripts/                  # Automation scripts
├── tools/                    # Model processing utilities
└── docs/                     # Documentation
```

## 📚 Documentation

Comprehensive documentation is available:

- **[API Reference](docs/API.md)** - Complete API documentation
- **[Model Details](docs/MODEL.md)** - AI model specifications  
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup and contribution guidelines

## 🔧 Available Commands

```bash
# Setup
make install               # Install dependencies
make setup                # Complete project setup

# Development
make dev                  # Start development environment
make test-health         # Health checks
make test-model          # Model functionality tests

# Production
make build               # Production build
make deploy              # Deploy to network
make qa-suite           # Quality assurance tests
```

## 🌐 Web Interface

Access the VeriChain platform at:
- **Local**: `http://localhost:3001` (development)
- **Production**: Deploy to Internet Computer for public access

### Supported Formats

- **Images**: JPG, JPEG, PNG
- **Videos**: MP4, MOV  
- **Social Media**: YouTube, Instagram, TikTok, Twitter, Facebook URLs

## 🔒 Security & Privacy

- **Input Validation**: Comprehensive file and URL validation
- **Privacy-First**: No permanent storage of user content
- **Model Integrity**: SHA256 verification of model components
- **Blockchain Security**: Internet Computer Protocol consensus

## 🚀 Performance

- **Image Analysis**: 200-500ms per image
- **Video Analysis**: 2-5s per video
- **Concurrent Processing**: Up to 100 simultaneous requests
- **Cycle Efficiency**: Optimized for ICP cost-effectiveness

## 🤝 Contributing

We welcome contributions! See our [Development Guide](docs/DEVELOPMENT.md) for:

- Development environment setup
- Code style guidelines
- Testing procedures
- Submission process

## 📄 License

Copyright (c) 2025

- Muhammad Rafly Ash Shiddiqi
- Nickolas Quinn Budiyono  
- Christopher Robin Tanugroho

---

**Built with ❤️ on Internet Computer Protocol**

For technical support and questions, refer to our [Documentation](docs/) or create an issue in this repository.
