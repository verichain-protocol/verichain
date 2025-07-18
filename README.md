# VeriChain

**Deepfake Detection Platform on Internet Computer Protocol**

VeriChain is a blockchain-powered deepfake detection platform utilizing a fine-tuned Vision Transformer (ViT) model with 99.90% accuracy to identify real, AI-generated, and deepfake content across multiple media formats.

## 🔗 Resources & Links

### 🤖 AI Model & Dataset
- **Model Repository**: [https://huggingface.co/einrafh/verichain-deepfake-models](https://huggingface.co/einrafh/verichain-deepfake-models) - Pre-trained ViT models for deepfake detection
- **Dataset Repository**: [https://huggingface.co/datasets/einrafh/verichain-deepfake-data](https://huggingface.co/datasets/einrafh/verichain-deepfake-data) - Curated deepfake detection dataset
- **Model Training Code**: [https://github.com/verichain-protocol/verichain-ai-model](https://github.com/verichain-protocol/verichain-ai-model) - Model training and processing pipeline

### 🛠️ Technical Documentation
- **API Documentation**: [docs/API.md](docs/API.md)
- **Development Guide**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- **Model Architecture**: [docs/MODEL.md](docs/MODEL.md)

## ✨ Key Features

- **AI Detection**: Vision Transformer model with 99.90% accuracy
- **Multi-Format Support**: JPG, PNG, JPEG, MP4, MOV analysis
- **Social Media Integration**: Direct analysis of YouTube, Instagram, TikTok, Twitter, Facebook
- **Flexible User Tiers**: Guest (3 analyses), Registered (30/month), Premium (1000/month)
- **Blockchain Verification**: Immutable detection records on ICP
- **Web3 Native**: Efficient cycles management and native canister calls
- **Real-Time Processing**: 200-500ms response times
- **Production Ready**: Optimized for public deployment
- **TypeScript Frontend**: Modern React application with real-time AI integration

## 🚀 Quick Start

### One-Command Setup

```bash
# Clone and setup everything instantly
git clone https://github.com/verichain-protocol/verichain.git
cd verichain
make setup
```

**That's it!** The `make setup` command will:
- ✅ Check all prerequisites 
- ✅ Install dependencies
- ✅ Configure environment  
- ✅ Download AI model
- ✅ Setup DFX local network
- ✅ Deploy all canisters
- ✅ Start development server

### Manual Setup (if needed)

```bash
# Environment configuration
cp .env.example .env
# Edit .env with your settings

# Install dependencies only
make install

# Setup model only  
make model-setup

# Development server only
make dev
```

### Reset & Troubleshooting

```bash
# Reset everything and start fresh
make reset-setup

# Clean setup (keeps dependencies)
make clean-setup

# Check system status
make status
```

## 🤖 AI Model Overview

**Vision Transformer with 99.90% Accuracy**

- **🤗 Model**: [einrafh/verichain-deepfake-models](https://huggingface.co/einrafh/verichain-deepfake-models)
- **📊 Dataset**: [einrafh/verichain-deepfake-data](https://huggingface.co/datasets/einrafh/verichain-deepfake-data)  
- **⚙️ Training Code**: [verichain-ai-model](https://github.com/verichain-protocol/verichain-ai-model)

### Quick Usage

```python
# Direct Hugging Face usage
from transformers import pipeline
classifier = pipeline("image-classification", model="einrafh/verichain-deepfake-models")
result = classifier(image)
```

```typescript
// VeriChain platform integration
import { CoreAIService } from './services/coreAI.service';
const aiService = new CoreAIService();
const result = await aiService.analyzeImage(imageFile);
```

> **For detailed model architecture, training data, and technical specifications, see [docs/MODEL.md](docs/MODEL.md)**

## 📚 Documentation & Support

- **[API Reference](docs/API.md)** - Complete API and integration guide
- **[Model Details](docs/MODEL.md)** - AI architecture and performance metrics  
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, workflow, and contribution guidelines

## 🎯 Features & Performance

- **99.90% accuracy** on deepfake detection
- **200-500ms** analysis per image
- **Multi-format support**: Images (JPG/PNG) and Videos (MP4/MOV)
- **Social media integration**: Direct URL analysis
- **Real-time processing** with blockchain verification

## 🤝 Contributing

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for complete development setup and contribution guidelines.

## 📄 License

Copyright (c) 2025 - Muhammad Rafly Ash Shiddiqi, Nickolas Quinn Budiyono, Christopher Robin Tanugroho

---

**Built with ❤️ on Internet Computer Protocol**
