# VeriChain API Reference

## Overview

VeriChain provides a comprehensive API for deepfake detection accessible through direct canister calls (ICP) and REST endpoints. The frontend uses real-time TypeScript integration with `@dfinity/agent`.

## Integration Methods

### 1. TypeScript Frontend Integration (Recommended)

Use the VeriChain TypeScript services for real-time integration:

```typescript
import { CoreAIService } from './services/coreAI.service';
import { ModelManagementService } from './services/modelManagement.service';

// Initialize services
const aiService = new CoreAIService();
const modelService = new ModelManagementService();

// Analyze image
const analysisResult = await aiService.analyzeImage(imageFile);
console.log(`Prediction: ${analysisResult.prediction} (${analysisResult.confidence}%)`);

// Check model status
const modelStatus = await modelService.getModelStatus();
console.log(`Model ready: ${modelStatus.isReady}`);
```

### 2. Direct Canister Calls (ICP Native)

```typescript
import { createActor } from 'declarations/ai_canister';

const actor = createActor('your-canister-id', {
  agentOptions: {
    host: process.env.DFX_NETWORK === 'local' 
      ? 'http://127.0.0.1:4943' 
      : 'https://icp-api.io'
  }
});

const result = await actor.analyze_image(imageData);
```

### 3. REST API (HTTP Interface)

For non-ICP applications, use standard HTTP endpoints.

## Base URL

- **Local Development**: `http://localhost:4943`
- **Production**: `https://your-canister-id.icp0.io`
- **TypeScript Environment**: Configured via `process.env.CANISTER_ID_AI_CANISTER`

## Authentication & User Tiers

VeriChain operates with a three-tier user system:

### User Tiers

| Tier | Authentication | Monthly Limit | Features |
|------|----------------|---------------|----------|
| **Guest (Non-login)** | None required | 3 analyses | Basic detection only |
| **Registered User** | Login required | 30 analyses | Full API access, history |
| **Premium User** | Login + subscription | 1,000 analyses | Priority processing, advanced features |

### Authentication Methods

#### Guest Usage (No Authentication)
```typescript
// Direct API calls without authentication
const response = await fetch('/analyze_image', {
  method: 'POST',
  body: imageFile,
  headers: { 'Content-Type': 'application/octet-stream' }
});
```

#### Registered/Premium Users
```typescript
// With authentication token
const response = await fetch('/analyze_image', {
  method: 'POST',
  body: imageFile,
  headers: {
    'Content-Type': 'application/octet-stream',
    'Authorization': 'Bearer your-auth-token'
  }
});
```

### Rate Limits & Quotas

- **Guest Users**: 3 analyses total (lifetime limit)
- **Registered Users**: 30 analyses per month (resets monthly)
- **Premium Users**: 1,000 analyses per month (resets monthly)
- **API Rate Limit**: 10 requests per minute (all tiers)

## Core Endpoints

### Image Analysis

Analyze a single image for deepfake detection.

**Endpoint**: `POST /analyze_image`

**Request**:
```
Content-Type: application/octet-stream
Body: [image binary data]
```

**Response**:
```json
{
  "is_deepfake": boolean,
  "confidence": number,
  "media_type": "Image",
  "processing_time_ms": number,
  "frames_analyzed": 1,
  "user_info": {
    "tier": "guest|registered|premium",
    "remaining_quota": number,
    "quota_resets_at": "ISO 8601 date (null for guest)"
  },
  "metadata": {
    "model_version": "1.0.0",
    "threshold": 0.5,
    "input_size": [224, 224],
    "file_size_mb": number,
    "classification": "Real|AI-Generated|Deepfake",
    "class_confidence": number,
    "detection_method": "ViT-inspired patch analysis",
    "classes": {
      "real_probability": number,
      "ai_generated_probability": number,
      "deepfake_probability": number
    }
  }
}
```

### Video Analysis

Analyze video content with frame-by-frame deepfake detection.

**Endpoint**: `POST /analyze_video`

**Request**:
```
Content-Type: application/octet-stream
Body: [video binary data]
```

**Response**:
```json
{
  "is_deepfake": boolean,
  "confidence": number,
  "media_type": "Video",
  "processing_time_ms": number,
  "frames_analyzed": number,
  "metadata": {
    "model_version": "1.0.0",
    "threshold": 0.5,
    "deepfake_frames": number,
    "deepfake_percentage": number,
    "frame_results": [
      {
        "frame_index": number,
        "confidence": number,
        "is_deepfake": boolean,
        "timestamp_ms": number
      }
    ],
    "file_size_mb": number
  }
}
```

### Social Media Analysis

Analyze content from social media URLs.

**Endpoint**: `POST /analyze_social_media`

**Request**:
```json
{
  "url": "string",
  "platform": "YouTube|Instagram|TikTok|Twitter|Facebook",
  "frames": [[number]],
  "metadata": "string (optional)"
}
```

**Response**:
```json
{
  "is_deepfake": boolean,
  "confidence": number,
  "platform": "string",
  "processing_time_ms": number,
  "frames_analyzed": number,
  "metadata": {
    "url": "string",
    "platform_specific_data": object,
    "frame_results": [object]
  }
}
```

### Health Check

Verify system status and model availability.

**Endpoint**: `GET /health_check`

**Response**:
```json
{
  "status": "healthy|degraded|unhealthy",
  "model_loaded": boolean,
  "uptime_seconds": number,
  "version": "1.0.0"
}
```

### Model Information

Get details about the loaded AI model.

**Endpoint**: `GET /get_model_info`

**Response**:
```json
{
  "version": "1.0.0",
  "input_size": [224, 224],
  "supported_formats": ["jpg", "jpeg", "png", "webp", "mp4", "avi", "mov", "webm"],
  "max_file_size_mb": 100,
  "confidence_threshold": 0.5
}
```

## Error Responses

All endpoints return consistent error formats:

```json
{
  "error": "string",
  "code": "string",
  "details": "string (optional)"
}
```

### Common Error Codes

- `INVALID_FORMAT`: Unsupported file format
- `FILE_TOO_LARGE`: File exceeds size limits
- `MODEL_NOT_LOADED`: AI model not initialized
- `PROCESSING_ERROR`: Internal processing failure
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded (10 req/min)
- `QUOTA_EXCEEDED`: Monthly quota limit reached
- `GUEST_LIMIT_REACHED`: Guest user reached 3-analysis limit
- `AUTH_REQUIRED`: Authentication needed for this tier
- `INVALID_TOKEN`: Authentication token invalid or expired

## Rate Limits

### Monthly Quotas
- **Guest Users**: 3 analyses (lifetime)
- **Registered Users**: 30 analyses per month 
- **Premium Users**: 1,000 analyses per month

### Rate Limiting
- **API Requests**: 10 requests per minute (all user tiers)
- **Concurrent Processing**: 1 file at a time per user
- **File Size Limits**: 100MB max (all tiers)

### Quota Reset
- **Registered Users**: Every 1st of the month at 00:00 UTC
- **Premium Users**: Every 1st of the month at 00:00 UTC
- **Guest Users**: No reset (lifetime limit)

## Usage Examples

### cURL Examples

```bash
# Analyze an image
curl -X POST "http://localhost:4943/analyze_image" \
  --data-binary @image.jpg \
  -H "Content-Type: application/octet-stream"

# Check health
curl "http://localhost:4943/health_check"

# Get model info
curl "http://localhost:4943/get_model_info"
```

### JavaScript Example

```javascript
// Analyze image file
async function analyzeImage(file) {
  const response = await fetch('/analyze_image', {
    method: 'POST',
    body: file,
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  });
  
  return await response.json();
}

// Usage
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];
const result = await analyzeImage(file);
console.log(result);
```

### Python Example

```python
import requests

def analyze_image(file_path):
    with open(file_path, 'rb') as file:
        response = requests.post(
            'http://localhost:4943/analyze_image',
            data=file.read(),
            headers={'Content-Type': 'application/octet-stream'}
        )
    return response.json()

# Usage
result = analyze_image('path/to/image.jpg')
print(result)
```

## Response Time Guidelines

- **Images**: 200-500ms typical
- **Short Videos** (<30s): 2-5s typical
- **Long Videos** (>30s): 5-15s typical
- **Social Media URLs**: 3-10s typical (including download time)

## Best Practices

1. **File Size**: Keep files under recommended limits for optimal performance
2. **Format**: Use standard formats (JPEG, PNG for images; MP4 for videos)
3. **Error Handling**: Always check response status and handle errors gracefully
4. **Rate Limiting**: Implement client-side rate limiting for better UX
5. **Caching**: Cache results when appropriate to reduce API calls
