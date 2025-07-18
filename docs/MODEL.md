# VeriChain AI Model

## Model Resources

- **🤗 Model**: [einrafh/verichain-deepfake-models](https://huggingface.co/einrafh/verichain-deepfake-models)
- **📊 Dataset**: [einrafh/verichain-deepfake-data](https://huggingface.co/datasets/einrafh/verichain-deepfake-data)
- **⚙️ Training Code**: [verichain-ai-model](https://github.com/verichain-protocol/verichain-ai-model)

## Overview

Vision Transformer (ViT) model fine-tuned for deepfake detection. Classifies content as **Real**, **AI-Generated**, or **Deepfake**.

## Model Specifications

- **Architecture**: Vision Transformer (ViT)
- **Input Size**: 224×224 RGB
- **Format**: ONNX (327.56 MB)
- **Classes**: Real, AI-Generated, Deepfake
- **Inference Time**: 200-500ms per image

## Performance

**Test Accuracy: 99.90%**

| Class | Precision | Recall | F1-Score |
|-------|-----------|--------|----------|
| Real | 100.00% | 100.00% | 100.00% |
| AI-Generated | 100.00% | 99.70% | 99.85% |
| Deepfake | 99.70% | 100.00% | 99.85% |

## Dataset

**50,000+ curated samples**:
- **Real**: Natural photographs and portraits
- **AI-Generated**: Stable Diffusion, DALL-E, Midjourney outputs  
- **Deepfake**: FaceSwap, DeepFaceLab, modern synthesis
- **Quality**: Human-verified, balanced distribution

## Usage

### Direct Hugging Face

```python
from transformers import pipeline
classifier = pipeline("image-classification", model="einrafh/verichain-deepfake-models")
result = classifier(image)
```

### VeriChain Platform

```typescript
import { CoreAIService } from './services/coreAI.service';
const aiService = new CoreAIService();
const result = await aiService.analyzeImage(imageFile);
```

## ICP Deployment

- **Storage**: Chunked for Internet Computer stable memory
- **Format**: ONNX optimized for canister inference
- **Configuration**: Environment-based chunk size control

---

**Complete training pipeline and datasets available at linked repositories.**
