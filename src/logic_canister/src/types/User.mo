// VeriChain User Types
// Purpose: Define all user-related data structures

import Principal "mo:base/Principal";

module {
    
    // User tier enumeration
    public type UserTier = {
        #Guest;      // 3 lifetime analyses, website only
        #Registered; // 30 monthly analyses, website only  
        #Premium;    // 1000 monthly analyses, website + API access
    };
    
    // Helper functions for UserTier
    public func getTierQuota(tier: UserTier) : Nat {
        switch (tier) {
            case (#Guest) 3;        // lifetime limit
            case (#Registered) 30;  // per month
            case (#Premium) 1000;   // per month
        }
    };
    
    public func getTierName(tier: UserTier) : Text {
        switch (tier) {
            case (#Guest) "guest";
            case (#Registered) "registered";
            case (#Premium) "premium";
        }
    };
    
    public func hasAPIAccess(tier: UserTier) : Bool {
        switch (tier) {
            case (#Premium) true;
            case (_) false;
        }
    };
    
    // User account information
    public type User = {
        id: Principal;
        email: Text;
        username: Text;
        password_hash: Text;
        tier: UserTier;
        created_at: Int;
        last_login: Int;
        is_active: Bool;
        subscription_expires: ?Int; // null for non-premium
    };
    
    // User quota tracking
    public type UserQuota = {
        user_id: Principal;
        tier: UserTier;
        used_this_month: Nat;
        total_lifetime_usage: Nat;
        last_reset: Int;
        created_at: Int;
    };
    
    // User registration data
    public type UserRegistration = {
        email: Text;
        username: Text;
        password: Text;
    };
    
    // User login data  
    public type UserLogin = {
        email: Text;
        password: Text;
    };
    
    // User profile update
    public type UserUpdate = {
        username: ?Text;
        email: ?Text;
    };
    
}
