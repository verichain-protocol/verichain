# Logic Canister - TODO for Robin

## Overview
Logic canister handles ALL business logic for VeriChain platform using **Motoko**.

## Key Rules
- **API Access**: Premium users ONLY
- **Website Access**: All tiers (Guest, Registered, Premium)
- **Language**: Motoko (not Rust)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│ Logic Canister  │────│  AI Canister    │
│  (TypeScript)   │    │   (Motoko)      │    │   (Rust)        │
│                 │    │                 │    │                 │
│ • User UI       │    │ • Auth & Users  │    │ • AI Processing │
│ • verichain.app │    │ • Quota Management│  │ • Model Inference│
│ • All tiers     │    │ • API Gateway   │    │ • Pure AI only  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Responsibilities

### 1. User Management 🧑‍💼
- [ ] User registration (email/username/password)
- [ ] User authentication (login/logout)
- [ ] Password hashing & validation
- [ ] User profile management
- [ ] Account activation/deactivation

### 2. Tier System 🎯
- [ ] Implement 3-tier system:
  - **Guest**: 3 lifetime analyses, website only
  - **Registered**: 30 monthly analyses, website only
  - **Premium**: 1000 monthly analyses, API + website
- [ ] Tier upgrade/downgrade logic
- [ ] Subscription management

### 3. Quota Management 📊
- [ ] Track usage per user
- [ ] Monthly quota reset (1st of each month)
- [ ] Guest lifetime limit enforcement
- [ ] Usage analytics and reporting
- [ ] Quota validation before AI calls

### 4. API Gateway 🚪
- [ ] **CRITICAL**: API access for Premium users ONLY
- [ ] API key generation for Premium users
- [ ] Rate limiting (10 req/min for all tiers)
- [ ] Request validation and forwarding to AI canister
- [ ] API usage tracking

### 5. Authentication & Authorization 🔐
- [ ] JWT token generation and validation
- [ ] Session management
- [ ] Role-based access control
- [ ] API key management for Premium users
- [ ] Security middleware

### 6. Billing & Subscriptions 💳
- [ ] Premium subscription management
- [ ] Payment processing integration
- [ ] Subscription renewal logic
- [ ] Billing history
- [ ] Invoice generation

### 7. Analytics & Monitoring 📈
- [ ] Usage statistics per user
- [ ] Platform-wide analytics
- [ ] Performance monitoring
- [ ] Error logging and tracking
- [ ] Admin dashboard data

## Implementation Priority

### Phase 1: Core Foundation
1. **User Management** - Registration, login, basic auth
2. **Tier System** - 3-tier implementation with quotas
3. **Basic Quota Management** - Usage tracking and limits

### Phase 2: API Gateway
1. **Premium API Access** - API gateway for Premium users only
2. **API Key Management** - Generate and validate API keys
3. **Rate Limiting** - 10 req/min enforcement

### Phase 3: Additional Features
1. **Subscription Management** - Premium tier subscriptions
2. **Analytics** - Usage tracking and reporting
3. **Admin Features** - Platform management tools

## File Structure (Motoko)

```
src/logic_canister/
├── main.mo              # Main canister entry point
├── types/
│   ├── User.mo          # User types and structures
│   ├── Quota.mo         # Quota and usage types
│   ├── Auth.mo          # Authentication types
│   └── API.mo           # API response types
├── services/
│   ├── UserService.mo   # User CRUD operations
│   ├── AuthService.mo   # Authentication logic
│   ├── QuotaService.mo  # Quota management
│   ├── APIService.mo    # API gateway logic
│   └── BillingService.mo # Subscription management
├── utils/
│   ├── Hash.mo          # Password hashing utilities
│   ├── JWT.mo           # JWT token utilities
│   └── Time.mo          # Time utilities
└── storage/
    ├── UserStorage.mo   # User data storage
    ├── QuotaStorage.mo  # Usage tracking storage
    └── SessionStorage.mo # Session management
```

## Key Functions to Implement

### User Management
```motoko
// User registration
public func registerUser(email: Text, username: Text, password: Text) : async Result<User, Text>

// User login
public func loginUser(email: Text, password: Text) : async Result<AuthToken, Text>

// Get user profile
public func getUserProfile(userId: Text) : async Result<User, Text>
```

### Quota Management
```motoko
// Check if user can perform analysis
public func canPerformAnalysis(userId: ?Text, ipAddress: ?Text) : async Result<Bool, Text>

// Record analysis usage
public func recordAnalysisUsage(userId: ?Text, ipAddress: ?Text) : async Result<(), Text>

// Get quota status
public func getQuotaStatus(userId: ?Text) : async Result<QuotaStatus, Text>
```

### API Gateway (Premium Only)
```motoko
// Generate API key for Premium user
public func generateAPIKey(userId: Text) : async Result<Text, Text>

// Validate API request (Premium only)
public func validateAPIRequest(apiKey: Text) : async Result<User, Text>

// Forward to AI canister (Premium only)
public func forwardToAI(apiKey: Text, request: AIRequest) : async Result<AIResponse, Text>
```

## Integration Points

### With Frontend
- User authentication and session management
- Quota status checks before analysis
- User profile and settings management
- Premium upgrade flows

### With AI Canister
- Forward authenticated requests from Premium API users
- Pass user context for tracking and analytics
- Validate requests before AI processing

## Security Considerations

1. **API Access Control**: Strict Premium-only API access
2. **Password Security**: Proper hashing and salting
3. **Rate Limiting**: Prevent abuse across all tiers
4. **Input Validation**: Sanitize all user inputs
5. **Session Management**: Secure token handling

## Data Privacy & GDPR

1. **User Data Export**: Allow users to export their data
2. **Data Deletion**: Allow account deletion
3. **Usage Tracking**: Anonymous analytics where possible
4. **Consent Management**: Clear privacy policies

## Success Metrics

- [ ] User registration and authentication working
- [ ] 3-tier quota system enforced correctly
- [ ] API access restricted to Premium users only
- [ ] Rate limiting functioning (10 req/min)
- [ ] Monthly quota reset automation
- [ ] Integration with AI canister successful

## Testing Strategy

1. **Unit Tests**: Each service function
2. **Integration Tests**: Frontend ↔ Logic ↔ AI flow
3. **API Tests**: Premium API access validation
4. **Load Tests**: Rate limiting and quota enforcement
5. **Security Tests**: Authentication and authorization

---

**Next Steps for Robin:**
1. Review this TODO list
2. Set up Motoko development environment
3. Start with Phase 1: User Management
4. Implement basic authentication first
5. Add 3-tier quota system
6. Build API gateway for Premium users

**Questions for Discussion:**
- Payment integration preferences?
- Admin panel requirements?
- Specific analytics needs?
- Database/storage strategy?

## Architecture Responsibilities

### What Logic Canister Should Handle:
- ✅ User registration & authentication
- ✅ Session management & JWT tokens
- ✅ 3-tier user system (Guest, Registered, Premium)
- ✅ Quota management & credit tracking
- ✅ Subscription & billing logic
- ✅ Rate limiting & abuse prevention
- ✅ Usage analytics & reporting
- ✅ Audit logs & compliance

### What AI Canister Handles:
- ❌ Pure AI model operations
- ❌ Image/video processing
- ❌ ML inference only

## User Tier System Implementation

### 1. User Types & Quotas
```rust
#[derive(CandidType, Serialize, Deserialize, Clone)]
pub enum UserTier {
    Guest,      // 3 lifetime analyses
    Registered, // 30 monthly analyses  
    Premium,    // 1000 monthly analyses
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct UserQuota {
    pub tier: UserTier,
    pub used_this_month: u32,
    pub total_lifetime_usage: u32,
    pub last_reset: u64, // timestamp
    pub created_at: u64,
}
```

### 2. Authentication System
```rust
#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub email: String,
    pub username: String,
    pub tier: UserTier,
    pub quota: UserQuota,
    pub subscription_expires: Option<u64>,
    pub created_at: u64,
    pub last_login: u64,
}
```

## Core Functions to Implement

### 1. User Management
- [ ] `register_user(email: String, username: String, password: String) -> Result<User, String>`
- [ ] `login_user(email: String, password: String) -> Result<AuthToken, String>`
- [ ] `logout_user(token: String) -> Result<bool, String>`
- [ ] `get_user_profile(token: String) -> Result<User, String>`
- [ ] `update_user_profile(token: String, updates: UserUpdate) -> Result<User, String>`

### 2. Authentication & Sessions
- [ ] `generate_auth_token(user_id: String) -> String`
- [ ] `validate_auth_token(token: String) -> Result<String, String>` // returns user_id
- [ ] `refresh_auth_token(token: String) -> Result<String, String>`
- [ ] `revoke_auth_token(token: String) -> Result<bool, String>`

### 3. Quota Management
- [ ] `check_analysis_quota(user_id: Option<String>) -> Result<QuotaStatus, String>`
- [ ] `consume_analysis_quota(user_id: Option<String>) -> Result<bool, String>`
- [ ] `get_quota_status(user_id: Option<String>) -> Result<QuotaStatus, String>`
- [ ] `reset_monthly_quotas() -> Result<u32, String>` // admin function
- [ ] `upgrade_user_tier(user_id: String, new_tier: UserTier) -> Result<User, String>`

### 4. Guest User Handling
- [ ] `track_guest_usage(ip_address: String) -> Result<bool, String>`
- [ ] `check_guest_quota(ip_address: String) -> Result<QuotaStatus, String>`
- [ ] `get_guest_usage_count(ip_address: String) -> u32`

### 5. Subscription Management
- [ ] `create_subscription(user_id: String, tier: UserTier, duration_months: u32) -> Result<Subscription, String>`
- [ ] `cancel_subscription(user_id: String) -> Result<bool, String>`
- [ ] `renew_subscription(user_id: String) -> Result<Subscription, String>`
- [ ] `check_subscription_status(user_id: String) -> Result<SubscriptionStatus, String>`

### 6. Analytics & Reporting
- [ ] `record_analysis_request(user_id: Option<String>, media_type: String, file_size: u64) -> Result<bool, String>`
- [ ] `get_usage_analytics(user_id: String, period: TimePeriod) -> Result<UsageStats, String>`
- [ ] `get_platform_statistics() -> Result<PlatformStats, String>` // admin only
- [ ] `export_user_data(user_id: String) -> Result<UserDataExport, String>` // GDPR compliance

### 7. Rate Limiting
- [ ] `check_rate_limit(user_id: Option<String>) -> Result<bool, String>`
- [ ] `record_api_request(user_id: Option<String>, endpoint: String) -> Result<bool, String>`
- [ ] `get_rate_limit_status(user_id: Option<String>) -> Result<RateLimitStatus, String>`

### 8. Admin Functions
- [ ] `get_all_users(admin_token: String, page: u32) -> Result<Vec<User>, String>`
- [ ] `ban_user(admin_token: String, user_id: String) -> Result<bool, String>`
- [ ] `unban_user(admin_token: String, user_id: String) -> Result<bool, String>`
- [ ] `force_quota_reset(admin_token: String, user_id: String) -> Result<bool, String>`
- [ ] `get_system_health() -> Result<SystemHealth, String>`

## Integration with AI Canister

### Communication Flow:
1. **Frontend** → **Logic Canister**: Authenticate user, check quota
2. **Logic Canister** → **Frontend**: Return auth status + remaining quota
3. **Frontend** → **AI Canister**: Send analysis request with auth token
4. **AI Canister** → **Logic Canister**: Validate token, consume quota
5. **AI Canister** → **Frontend**: Return analysis result + updated quota

### Required Integration Functions:
- [ ] `validate_analysis_request(auth_token: Option<String>) -> Result<AnalysisPermission, String>`
- [ ] `post_analysis_callback(user_id: Option<String>, success: bool) -> Result<QuotaUpdate, String>`

## Data Structures

### QuotaStatus
```rust
#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct QuotaStatus {
    pub tier: UserTier,
    pub remaining: u32,
    pub total: u32,
    pub resets_at: Option<u64>, // null for guests
    pub can_analyze: bool,
}
```

### AuthToken
```rust
#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct AuthToken {
    pub token: String,
    pub expires_at: u64,
    pub user_id: String,
}
```

### UsageStats
```rust
#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct UsageStats {
    pub total_analyses: u32,
    pub images_analyzed: u32,
    pub videos_analyzed: u32,
    pub period_start: u64,
    pub period_end: u64,
    pub quota_usage_percentage: f32,
}
```

## Implementation Priority

### Phase 1 (Essential - Week 1):
1. ✅ Basic user registration/login
2. ✅ Authentication token system
3. ✅ 3-tier quota management
4. ✅ Guest user tracking

### Phase 2 (Core Features - Week 2):
1. ✅ Rate limiting implementation
2. ✅ Monthly quota reset system
3. ✅ Integration with AI canister
4. ✅ Basic analytics

### Phase 3 (Advanced - Week 3):
1. ✅ Subscription management
2. ✅ Advanced analytics & reporting
3. ✅ Admin panel functions
4. ✅ GDPR compliance features

## Testing Strategy

### Unit Tests:
- [ ] User registration/authentication flows
- [ ] Quota calculation and consumption
- [ ] Rate limiting logic
- [ ] Token validation and expiry

### Integration Tests:
- [ ] Communication with AI canister
- [ ] End-to-end user journey
- [ ] Quota enforcement across services
- [ ] Error handling and recovery

## Security Considerations

### Authentication:
- [ ] Implement secure password hashing (bcrypt/argon2)
- [ ] JWT token signing with proper secrets
- [ ] Session timeout and refresh mechanisms
- [ ] Brute force protection

### Authorization:
- [ ] Proper permission checks for all endpoints
- [ ] Admin role validation
- [ ] User data isolation
- [ ] API rate limiting per user/IP

### Data Protection:
- [ ] Encrypt sensitive user data
- [ ] Implement audit logging
- [ ] GDPR compliance (data export/deletion)
- [ ] Secure communication between canisters

## Environment Setup

### Prerequisites:
```bash
# Install Rust and DFX (already done)
# Set up candid interface definitions
# Configure environment variables
```

### Development Commands:
```bash
# Build logic canister
dfx build logic_canister

# Deploy locally
dfx deploy logic_canister

# Run tests
cargo test

# Generate candid interface
dfx generate logic_canister
```

## File Structure Recommendation

```
src/logic_canister/
├── Cargo.toml
├── src/
│   ├── lib.rs              # Main canister entry point
│   ├── auth/
│   │   ├── mod.rs
│   │   ├── user.rs         # User management
│   │   ├── session.rs      # Session handling
│   │   └── token.rs        # JWT token management
│   ├── quota/
│   │   ├── mod.rs
│   │   ├── manager.rs      # Quota management
│   │   ├── tier.rs         # User tier logic
│   │   └── guest.rs        # Guest user handling
│   ├── subscription/
│   │   ├── mod.rs
│   │   └── manager.rs      # Subscription logic
│   ├── analytics/
│   │   ├── mod.rs
│   │   ├── usage.rs        # Usage tracking
│   │   └── reporting.rs    # Analytics reports
│   ├── admin/
│   │   ├── mod.rs
│   │   └── functions.rs    # Admin operations
│   ├── types/
│   │   ├── mod.rs
│   │   ├── user.rs         # User types
│   │   ├── quota.rs        # Quota types
│   │   └── common.rs       # Common types
│   └── utils/
│       ├── mod.rs
│       ├── crypto.rs       # Cryptographic utilities
│       ├── validation.rs   # Input validation
│       └── time.rs         # Time utilities
├── tests/
│   ├── integration/
│   └── unit/
└── candid/
    └── logic_canister.did  # Interface definition
```

## Questions for Robin:

1. **Database Choice**: Should we use IC stable memory or external database for user data?
2. **Payment Integration**: Which payment provider for Premium subscriptions? (Stripe, crypto, etc.)
3. **Email Service**: Do we need email verification? Which service?
4. **Admin Panel**: Should logic canister expose admin APIs for a separate admin dashboard?
5. **Backup Strategy**: How should we handle data backup and recovery?

## Resources for Implementation:

### Documentation:
- [Internet Computer Documentation](https://internetcomputer.org/docs/)
- [Rust CDK Documentation](https://docs.rs/ic-cdk/)
- [Candid Guide](https://internetcomputer.org/docs/current/developer-docs/backend/candid/)

### Example Projects:
- [IC User Authentication Example](https://github.com/dfinity/examples/tree/master/rust/user-auth)
- [IC Subscription Service Example](https://github.com/dfinity/examples/tree/master/rust/subscription)

### Security Best Practices:
- [IC Security Best Practices](https://internetcomputer.org/docs/current/developer-docs/security/)
- [Rust Security Guidelines](https://anssi-fr.github.io/rust-guide/)

---

**Robin, start with Phase 1 functions first! Focus on user management and basic quota system. We can iterate and improve from there.**

**Need help? Ask me or coordinate with the frontend team for integration requirements.**
