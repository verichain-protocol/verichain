# 🔌 VeriChain API Reference

## 👥 User Tiers & Access

| Tier | Monthly Limit | Website Access | API Access |
|------|---------------|----------------|------------|
| **Guest** | 3 analyses (lifetime) | ✅ Available | ❌ No API |
| **Registered** | 30 analyses/month | ✅ Available | ❌ No API |
| **Premium** | 1,000 analyses/month | ✅ Available | ✅ Full API |

**🔑 API Access**: Premium users only  
**🌐 Website Access**: All user tiers can use the web interface directly

## 🔗 Integration Options

### 💻 TypeScript Frontend
Direct canister integration through the CoreAIService for real-time analysis.

### 🌐 REST API  
Premium users can access the REST API with API key authentication.

### ⚙️ Direct Canister Calls
Advanced users can interact directly with Internet Computer canisters.

## 📡 Endpoints

### 🖼️ Image Analysis
- **Endpoint**: `/analyze`  
- **Method**: POST  
- **Content-Type**: `application/octet-stream`
- **Response**: Returns prediction (real/fake/ai_generated), confidence score, processing time, model version, and timestamp

### ✅ Health Check
- **Endpoint**: `/health_check`  
- **Method**: GET
- **Response**: System status, model loading state, and uptime information

### ℹ️ Model Information
- **Endpoint**: `/get_model_info`  
- **Method**: GET
- **Response**: Model version, accuracy metrics, and supported file formats

## ⚠️ Error Handling

The API uses structured error responses with specific error codes for different failure scenarios. All errors include descriptive messages and appropriate HTTP status codes.

## 🚨 Error Codes

- `QUOTA_EXCEEDED` - Monthly limit reached
- `INVALID_FORMAT` - Unsupported file format
- `FILE_TOO_LARGE` - File exceeds size limit (5MB images, 25MB videos)
- `API_KEY_REQUIRED` - Premium subscription needed
- `INVALID_API_KEY` - Invalid or expired API key
- `MODEL_NOT_READY` - AI model still loading

## 📁 Supported Formats

- **Images**: JPG, PNG, JPEG (max 5MB)
- **Videos**: MP4, MOV (max 25MB)

## ⏱️ Rate Limits

- **Website**: Quota-based (no rate limit)
- **API**: 10 requests/minute (Premium users)

---

**🔑 API access requires Premium subscription. Web interface available to all users.**
