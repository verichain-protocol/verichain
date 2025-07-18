# VeriChain Logic Canister Structure

## Overview
Complete Motoko-based business logic canister for VeriChain platform.

## Key Architecture Decisions
- **Language**: Motoko (not Rust)
- **API Access**: Premium users ONLY  
- **Website Access**: All tiers (Guest, Registered, Premium)
- **User Tiers**: Guest (3 lifetime), Registered (30/month), Premium (1000/month + API)

## File Structure

```
src/logic_canister/
├── TODO.md                    # Complete roadmap for Robin
├── STRUCTURE.md               # This file
└── src/
    ├── main.mo               # Main canister with TODO templates
    ├── types/                # Data type definitions
    │   ├── User.mo          # User types, tiers, registration
    │   ├── Auth.mo          # Authentication, tokens, API keys
    │   ├── Quota.mo         # Quota tracking, usage stats
    │   └── API.mo           # API responses, errors, system status
    ├── services/             # Business logic modules  
    │   ├── UserService.mo   # User CRUD operations
    │   ├── QuotaService.mo  # Quota management & tracking
    │   └── APIService.mo    # API gateway (Premium only)
    ├── utils/               # Helper utilities
    │   ├── Hash.mo          # Password hashing & security
    │   └── Time.mo          # Time utilities & calculations
    └── storage/             # Data persistence
        └── UserStorage.mo   # User data storage operations
```

## Implementation Status

### ✅ Completed
- File structure created
- Type definitions implemented
- Template functions with TODO comments
- Stable variable setup for upgrades
- Basic health check and info functions

### 🔄 TODO for Robin
- User registration/authentication system
- 3-tier quota management implementation  
- API gateway for Premium users only
- Password hashing and security
- Monthly quota reset automation
- Rate limiting (10 req/min)
- Subscription management
- Analytics and reporting

## Key Features to Implement

### 1. User Management
```motoko
registerUser(registration: UserRegistration) -> Result<User, Text>
loginUser(login: UserLogin) -> Result<LoginResult, Text>
getUserProfile(user_id: Principal) -> ?User
```

### 2. Quota System
```motoko
canPerformAnalysis(user_id: ?Principal, ip: ?Text) -> Result<AnalysisPermission, Text>
recordAnalysisUsage(user_id: ?Principal, ip: ?Text) -> Result<(), Text>
getQuotaStatus(user_id: ?Principal) -> Result<QuotaStatus, Text>
```

### 3. API Gateway (Premium Only)
```motoko
generateAPIKey(user_id: Principal) -> Result<Text, Text>
validateAPIRequest(api_key: Text) -> Result<User, ErrorCode>
revokeAPIKey(api_key: Text, user_id: Principal) -> Result<(), Text>
```

## Integration Points

### With Frontend
- User authentication and session management
- Quota checks before AI analysis requests
- User profile and subscription management
- Premium upgrade workflows

### With AI Canister
- Forward Premium API requests only
- Pass user context for analytics
- Validate quotas before processing

## Development Workflow

1. **Phase 1**: Start with `main.mo` basic functions
2. **Phase 2**: Implement User and Auth types
3. **Phase 3**: Build UserService for registration/login
4. **Phase 4**: Create quota management system
5. **Phase 5**: Build API gateway for Premium users
6. **Phase 6**: Add analytics and admin functions

## Testing Strategy

- Unit tests for each service module
- Integration tests with AI canister
- API access validation tests
- Quota enforcement tests
- Rate limiting tests

## Security Considerations

- Password hashing with proper salting
- API key generation and validation
- Rate limiting enforcement
- Input validation and sanitization
- Session management security

---

**Ready for Robin's implementation!** 🚀

All templates are in place with clear TODO comments and implementation guidance.
