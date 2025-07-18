# VeriChain AI Model Documentation

## 🔗 Model Resources

- **🤗 Model Repository**: [einrafh/verichain-deepfake-models](https://huggingface.co/einrafh/verichain-deepfake-models)
- **📊 Training Dataset**: [einrafh/verichain-deepfake-data](https://huggingface.co/datasets/einrafh/verichain-deepfake-data)
- **⚙️ Training Pipeline**: [verichain-ai-model](https://github.com/verichain-protocol/verichain-ai-model)

## Overview

VeriChain utilizes a fine-tuned Vision Transformer (ViT) model specifically trained for deepfake detection. The model classifies content into three categories: **Real**, **AI-Generated**, or **Deepfake**.

## Model Architecture

### Vision Transformer (ViT)

The VeriChain model is based on the Vision Transformer architecture, optimized for deepfake detection with state-of-the-art performance.

**Key Specifications**:
- **Input Size**: 224×224 pixels
- **Color Channels**: RGB (3 channels)
- **Patch Size**: 16×16 pixels
- **Embedding Dimension**: 768
- **Attention Heads**: 12
- **Transformer Layers**: 12
- **Output Classes**: 3 (Real, AI-Generated, Deepfake)
- **Model Format**: ONNX for optimized inference
- **Model Size**: 327.56 MB (chunked for ICP deployment)

### Performance Metrics

Evaluated on a held-out test set of 2,000 images:

| Metric | Score |
|--------|-------|
| **Test Accuracy** | **99.90%** |
| **F1-Score (Macro)** | **99.90%** |
| Test Loss | 0.0202 |
| **Inference Time** | 200-500ms per image |

#### Classification Report

| Class | Precision | Recall | F1-Score |
|-------|-----------|--------|----------|
| AI Generated | 100.00% | 99.70% | 99.85% |
| Deepfake | 99.70% | 100.00% | 99.85% |
| Real | 100.00% | 100.00% | 100.00% |

## Model Deployment

## Dataset Information

### VeriChain Deepfake Dataset

The model is trained on a comprehensive dataset available at [einrafh/verichain-deepfake-data](https://huggingface.co/datasets/einrafh/verichain-deepfake-data).

**Dataset Composition**:
- **Total Images**: 50,000+ curated samples
- **Real Images**: Natural photographs and portraits
- **AI-Generated**: Stable Diffusion, DALL-E, Midjourney outputs
- **Deepfake**: FaceSwap, DeepFaceLab, and modern synthesis

**Data Quality**:
- **Manual Verification**: Human-verified labels
- **Resolution**: Minimum 224×224 pixels
- **Format**: JPEG/PNG with quality control
- **Balanced Distribution**: Equal representation across classes
- **Ethical Sourcing**: Publicly available content with proper attribution

### Training Pipeline

The complete training pipeline is available at [verichain-ai-model](https://github.com/verichain-protocol/verichain-ai-model).

**Training Process**:
1. **Data Preprocessing**: Resize, normalize, augmentation
2. **Model Fine-tuning**: ViT base model adaptation
3. **Hyperparameter Optimization**: Learning rate, batch size tuning
4. **Validation**: Cross-validation and holdout testing
5. **ONNX Conversion**: Optimized inference format
6. **ICP Preparation**: Model chunking for canister deployment

**Training Configuration**:
- **Base Model**: `google/vit-base-patch16-224`
- **Learning Rate**: 2e-5 with cosine scheduler
- **Batch Size**: 32 (effective batch size 128)
- **Epochs**: 10 with early stopping
- **Optimizer**: AdamW with weight decay
- **Loss Function**: Cross-entropy with label smoothing

## ICP Deployment Architecture

### File Structure

- **Original Model**: `verichain-model.onnx` (327.56 MB)
- **Chunked Format**: Auto-chunked based on `MODEL_CHUNK_SIZE_MB`
- **Storage**: Internet Computer stable memory
- **Format**: ONNX for optimized inference
- **Environment**: Configurable via `.env` variables

### Chunk Management

The model is automatically chunked for efficient deployment on Internet Computer Protocol:

```
Total Size: 327.56 MB
Chunk Count: 410
Chunk Size: ~800KB each
Hash Verification: SHA256 per chunk
Upload Method: Streaming with verification
```

### Initialization Process

1. **Upload Phase**: Sequential chunk upload with hash verification
2. **Assembly Phase**: Chunks reconstructed in stable memory
3. **Parsing Phase**: ONNX model parsing and weight extraction
4. **Validation Phase**: Model integrity verification
5. **Ready State**: Model available for inference

## Technical Implementation

### Input Processing

Images undergo the following preprocessing pipeline:

1. **Resize**: Scale to 224×224 pixels using Lanczos3 interpolation
2. **Format**: Convert to RGB if needed
3. **Normalize**: Pixel values normalized to [-1, 1] range
4. **Layout**: Convert to CHW (Channel-Height-Width) format

### Inference Pipeline

1. **Patch Embedding**: Image divided into 16×16 patches
2. **Positional Encoding**: Spatial position information added
3. **Transformer Processing**: 12-layer attention mechanism
4. **Classification Head**: Final linear layer for 3-class output
5. **Softmax**: Probability distribution over classes

### Output Processing

The model outputs probabilities for each class:

```json
{
  "real_probability": 0.8524,
  "ai_generated_probability": 0.0231,
  "deepfake_probability": 0.1245
}
```

Final classification uses the highest probability with a minimum confidence threshold of 0.5.

## Performance Characteristics

### Resource Usage

- **Memory**: ~327MB model + ~200MB runtime overhead
- **Processing Time**: 200-500ms per image
- **Batch Processing**: Single image per inference call
- **Concurrent Requests**: Up to 100 simultaneous analyses

### Optimization Features

- **Efficient ONNX Runtime**: Optimized for production inference
- **Streaming Initialization**: Avoids memory spikes during deployment
- **Cycle Optimization**: Efficient instruction usage on Internet Computer
- **Cache-Friendly**: Model weights stored in stable memory

## Confidence Interpretation

### Confidence Levels

- **High Confidence** (>0.9): Very reliable detection
- **Medium Confidence** (0.7-0.9): Reliable detection
- **Low Confidence** (0.5-0.7): Uncertain, manual review recommended
- **Below Threshold** (<0.5): Classification uncertain

### Recommendation Guidelines

- **>0.95**: Accept result with high confidence
- **0.8-0.95**: Accept result, consider context
- **0.6-0.8**: Flag for review, provide context to user
- **<0.6**: Recommend manual verification

## Model Limitations

### Known Edge Cases

1. **Low Resolution**: Images below 100×100 pixels may have reduced accuracy
2. **Heavily Compressed**: High compression artifacts can affect detection
3. **Artistic Content**: Stylized or artistic images may trigger false positives
4. **Partial Faces**: Extreme close-ups or partial face visibility
5. **Poor Lighting**: Very dark or overexposed images

### Mitigation Strategies

- **Pre-filtering**: Quality checks before analysis
- **Confidence Thresholds**: Adaptive thresholds based on image quality
- **User Guidance**: Clear instructions for optimal image quality
- **Fallback Options**: Manual review workflow for edge cases

## Future Improvements

### Planned Enhancements

- **Multi-Scale Analysis**: Support for various input resolutions
- **Temporal Consistency**: Video-specific deepfake detection improvements
- **Adversarial Robustness**: Enhanced resistance to adversarial attacks
- **Real-Time Processing**: Further optimization for live video streams

### Model Updates

Model updates are deployed through the chunk system:

1. New model chunks uploaded
2. Gradual migration to new model
3. A/B testing for validation
4. Full deployment after verification

Updates maintain backward compatibility and preserve user data integrity.
