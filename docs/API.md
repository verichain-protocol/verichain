# VeriChain API Reference

## User Tiers & Access

| Tier | Monthly Limit | Website Access | API Access |
|------|---------------|----------------|------------|
| **Guest** | 3 analyses (lifetime) | ✅ verichain.app | ❌ No API |
| **Registered** | 30 analyses/month | ✅ verichain.app | ❌ No API |
| **Premium** | 1,000 analyses/month | ✅ verichain.app | ✅ Full API |

**🔒 API Access**: Premium users only  
**🌐 Website Access**: All user tiers can use verichain.app directly

## Quick Integration

### TypeScript Frontend (Recommended)

```typescript
import { CoreAIService } from './services/coreAI.service';

const aiService = new CoreAIService();
const result = await aiService.analyzeImage(imageFile);
console.log(`Prediction: ${result.prediction} (${result.confidence}%)`);
```

### Direct Canister Calls

```typescript
import { createActor } from 'declarations/ai_canister';

const actor = createActor('your-canister-id');
const result = await actor.analyze_image(imageData);
```

### REST API (Premium Only)

```bash
curl -X POST "https://api.verichain.app/analyze_image" \
  -H "X-API-Key: your-premium-api-key" \
  --data-binary @image.jpg
```

## Endpoints

### Image Analysis

**Endpoint**: `/analyze_image`  
**Method**: POST  
**Content-Type**: `application/octet-stream`  
**Access**: All tiers (website) | Premium only (API)

```typescript
// Request
const imageFile = new File([imageData], 'image.jpg');
const result = await aiService.analyzeImage(imageFile);

// Response
{
  "prediction": "real",              // "real" | "fake" | "ai_generated"
  "confidence": 98.5,                // 0-100
  "processing_time_ms": 245,
  "model_version": "v1.0",
  "timestamp": "2025-07-18T10:30:00Z"
}
```

### Health Check

**Endpoint**: `/health_check`  
**Method**: GET  
**Access**: Public

```typescript
const health = await aiService.healthCheck();
// Returns: { status: "healthy", model_loaded: true, uptime: 3600 }
```

### Model Status

**Endpoint**: `/get_model_info`  
**Method**: GET  
**Access**: All tiers

```typescript
const modelInfo = await aiService.getModelInfo();
// Returns: { version: "v1.0", accuracy: 99.9, supported_formats: ["jpg", "png"] }
```

## Error Handling

```typescript
try {
  const result = await aiService.analyzeImage(imageFile);
} catch (error) {
  if (error.code === 'QUOTA_EXCEEDED') {
    // Handle quota limit
  } else if (error.code === 'INVALID_FORMAT') {
    // Handle unsupported file format
  } else if (error.code === 'API_KEY_REQUIRED') {
    // Handle Premium API access requirement
  }
}
```

## Common Error Codes

- `QUOTA_EXCEEDED`: User has reached monthly limit
- `INVALID_FORMAT`: Unsupported file format
- `FILE_TOO_LARGE`: File exceeds 5MB (images) or 25MB (videos) limit
- `API_KEY_REQUIRED`: Premium subscription needed for API access
- `INVALID_API_KEY`: Invalid or expired API key
- `MODEL_NOT_READY`: AI model is still loading

## Supported Formats

- **Images**: JPG, PNG, JPEG (max 5MB)
- **Videos**: MP4, MOV (max 25MB)
- **Social URLs**: YouTube, Instagram, TikTok, Twitter, Facebook

## Rate Limits

- **Website**: No rate limit (quota-based)
- **API**: 10 requests/minute (Premium users)

---

**Premium API access required for external integration. All users can access verichain.app directly.**
