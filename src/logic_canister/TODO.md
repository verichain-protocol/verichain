# VeriChain Logic Canister - Development Guide for Robin

## Overview
- **Language**: Motoko (Internet Computer)
- **Purpose**: User management with 3-tier system, quota controls, and Premium API gateway
- **Authentication**: Internet Identity only (simple MVP approach)
- **User Tiers**: Guest (3 lifetime), Registered (30/month), Premium (1000/month + API access)

## Authentication Strategy

### Internet Identity Integration
```
User ──→ Internet Identity ──→ Principal ID ──→ Logic Canister
  ↓            ↓                    ↓              ↓
1. Login    1. Generate         1. Get Principal  1. Create/Get User
2. Approve  2. Return Principal 2. Send to Logic  2. Check Tier & Quota
```

### Why Internet Identity for MVP
- **Simplicity**: No password hashing or session management needed
- **Security**: Internet Identity handles all authentication concerns  
- **Development Speed**: Robin can focus on business logic instead of auth
- **IC Native**: Built specifically for Internet Computer platform
- **Reliability**: Fewer potential security vulnerabilities

## Project Structure

```
src/logic_canister/
├── src/
│   ├── main.mo               # Main canister - Robin implements all functions here
│   ├── types/                # Data type definitions (already created)
│   │   ├── User.mo          # User types, tiers, registration
│   │   ├── Auth.mo          # Authentication, tokens, API keys
│   │   ├── Quota.mo         # Quota tracking, usage stats
│   │   └── API.mo           # API responses, errors, system status
│   ├── services/             # Business logic modules (templates created)
│   │   ├── UserService.mo   # User CRUD operations
│   │   ├── QuotaService.mo  # Quota management & tracking
│   │   └── APIService.mo    # API gateway (Premium only)
│   ├── utils/               # Helper utilities (templates created)
│   │   ├── Hash.mo          # Password hashing & security
│   │   └── Time.mo          # Time utilities & calculations
│   └── storage/             # Data persistence (templates created)
│       └── UserStorage.mo   # User data storage operations
└── TODO.md                # This file
```

## Core Functions for Robin to Implement

### 1. User Management (Internet Identity)
```motoko
// Internet Identity login - primary authentication method
public func getOrCreateUser(caller: Principal) : async User

// Upgrade user to Premium tier
public func upgradeUserTier(caller: Principal, newTier: UserTier) : async Result<User, Text>
```

### 2. Quota System (Priority 1 - Core Functionality)
```motoko
// Check if user can perform analysis (Guest: 3 lifetime, Registered: 30/month, Premium: 1000/month)
public func canPerformAnalysis(caller: ?Principal, ipAddress: ?Text) : async Bool

// Record usage after analysis completed
public func recordAnalysisUsage(caller: ?Principal, ipAddress: ?Text) : async Result<(), Text>

// Get remaining quota for user
public func getQuotaStatus(caller: ?Principal) : async { remaining: Nat; total: Nat }
```

### 3. Premium API Gateway (Priority 3 - Implement Last)
```motoko
// Generate API key for Premium users
public func generateAPIKey(caller: Principal) : async Result<Text, Text>

// Validate API requests (Premium only)
public func validateAPIRequest(apiKey: Text) : async Result<Principal, Text>
```

## Data Types

```motoko
// Main user types
public type UserTier = { #Guest; #Registered; #Premium };

public type User = {
    id: Principal;           // Internet Identity Principal
    tier: UserTier;
    used_this_month: Nat;    // Monthly usage counter
    total_used: Nat;         // Lifetime usage (for Guests)
    created_at: Int;         // Registration timestamp
    api_key: ?Text;          // Only Premium users get API keys
};

// Guest tracking (anonymous users by IP)
public type GuestUsage = {
    ip_address: Text;
    usage_count: Nat;        // Max 3 analyses
    first_used: Int;         // Timestamp
};
```

## Integration Flow

### Main Flow: Internet Identity Authentication
```
Frontend ──→ Internet Identity ──→ Logic Canister ──→ AI Canister
    ↓              ↓                   ↓                 ↓
1. II Login    1. Return Principal  1. getOrCreateUser    1. Process image
2. Get quota   2. Pass Principal    2. Check quota       2. Return analysis  
3. Send image  3. Validate user     3. Record usage      3. Update metrics
4. Show result 4. Forward request   4. Forward to AI     4. Return to user
```

### API Flow (Premium Only - Implement Last)
```
External API ──→ Logic Canister ──→ AI Canister
     ↓               ↓                 ↓
1. API Key      1. validateAPIRequest  1. Process image
2. Send image   2. Check Premium tier  2. Return analysis
3. Get result   3. Record usage       3. Update metrics
                4. Forward to AI       4. Return to API
```

## Implementation Steps for Robin

### Phase 1: Basic Setup + Authentication (Start Here)
1. Copy data types from `types/` folder to `main.mo`
2. Set up stable variables for user storage and guest tracking
3. Implement `getOrCreateUser()` - Internet Identity login
4. Implement health check function

### Phase 2: Quota System (Priority 1 - Most Important)
5. Implement `canPerformAnalysis()` - Check quota limits
6. Implement `recordAnalysisUsage()` - Track usage
7. Implement `getQuotaStatus()` - Return remaining quota
8. Test with frontend - Login and quota check

### Phase 3: Premium API Gateway (Priority 3 - Do Last)
9. Implement `generateAPIKey()` - Create API keys for Premium users
10. Implement `validateAPIRequest()` - Validate API access
11. Test API endpoints - Premium tier validation

## Success Criteria

- **Guest Users**: Maximum 3 lifetime analyses (tracked by IP)
- **Registered Users**: 30 analyses per month (resets monthly)
- **Premium Users**: 1000 analyses per month + API access
- **API Access**: Premium tier only, validated by API key
- **Authentication**: Internet Identity Principal-based
- **Monthly Reset**: Quotas automatically reset each month

## Development Workflow

1. Start with `main.mo` - All functions go here initially
2. Test with dfx - `dfx build` and `dfx deploy --local`
3. Integrate with frontend - Test login and quota flows
4. Add API testing - Test Premium API key generation
5. Deploy to mainnet - Production deployment

## Quick Reference for Robin

### Priority 1: Authentication + Quota System
1. `getOrCreateUser()` - Internet Identity login (start here)
2. `canPerformAnalysis()` - Quota checking (core feature)
3. `recordAnalysisUsage()` - Usage tracking (core feature)
4. `getQuotaStatus()` - Show remaining quota

### Priority 2: User Management  
5. `upgradeUserTier()` - Premium upgrades

### Priority 3: Premium API Gateway (Implement Last)
6. `generateAPIKey()` - API key for Premium users
7. `validateAPIRequest()` - API validation

### Robin's Implementation Order
1. **Priority 1**: Internet Identity + Quota system (Core MVP)
2. **Priority 2**: User tier management  
3. **Priority 3**: Premium API gateway (Nice to have)

### Technical Constraints
- **File Limits**: Images 5MB max, Videos 25MB max (ICP optimized)
- **Quota Limits**: Guest 3 lifetime, Registered 30/month, Premium 1000/month
- **API Access**: Premium tier only
