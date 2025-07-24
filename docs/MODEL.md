# 🧠 VeriChain AI Model

## 🔗 Resources

- **🤗 Model**: [einrafh/verichain-deepfake-models](https://huggingface.co/einrafh/verichain-deepfake-models)
- **📊 Dataset**: [einrafh/verichain-deepfake-data](https://huggingface.co/datasets/einrafh/verichain-deepfake-data)
- **⚙️ Training Code**: [verichain-ai-model](https://github.com/verichain-protocol/verichain-ai-model)

## 🎯 Overview

Vision Transformer (ViT) model fine-tuned for deepfake detection with 99.90% accuracy. Classifies content as **Real**, **AI-Generated**, or **Deepfake**.

## 📋 Specifications

- **Architecture**: Vision Transformer (ViT)
- **Input Size**: 224×224 RGB images
- **Format**: ONNX (327.56 MB)
- **Classes**: 3 (Real, AI-Generated, Deepfake)
- **Inference Time**: 200-500ms per image

## 📊 Performance

**Test Accuracy: 99.90%**

| Class | Precision | Recall | F1-Score |
|-------|-----------|--------|----------|
| Real | 100.00% | 100.00% | 100.00% |
| AI-Generated | 100.00% | 99.70% | 99.85% |
| Deepfake | 99.70% | 100.00% | 99.85% |

## 📦 Dataset

**50,000+ curated samples**:
- **Real**: Natural photographs and portraits
- **AI-Generated**: Stable Diffusion, DALL-E, Midjourney outputs  
- **Deepfake**: FaceSwap, DeepFaceLab, modern synthesis methods
- **Quality**: Human-verified with balanced class distribution

## 💡 Usage

### 🤗 Hugging Face Integration
The model is available through the Hugging Face transformers library for direct use in Python environments.

### 🌐 VeriChain Platform Integration
The model is integrated into the VeriChain platform through the AI service interface for seamless web-based analysis.

## 🚀 ICP Deployment

- **💾 Storage**: Chunked for Internet Computer stable memory
- **⚙️ Format**: ONNX optimized for canister inference
- **🔧 Configuration**: Environment-based chunk size control (0.8MB default)

---

**📚 Complete training pipeline and datasets available at linked repositories.**
