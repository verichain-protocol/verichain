// VeriChain Quota Types
// Purpose: Usage tracking and quota management

import Principal "mo:base/Principal";
import User "../types/User";

module {
    
    // Quota status response
    public type QuotaStatus = {
        tier: User.UserTier;
        remaining: Nat;
        total: Nat;
        used: Nat;
        resets_at: ?Int; // null for guests
        can_analyze: Bool;
    };
    
    // Analysis permission result
    public type AnalysisPermission = {
        allowed: Bool;
        reason: ?Text;
        user_id: ?Principal;
        quota_remaining: Nat;
    };
    
    // Guest user tracking (by IP)
    public type GuestUsage = {
        ip_address: Text;
        usage_count: Nat;
        first_usage: Int;
        last_usage: Int;
    };
    
    // Usage statistics
    public type UsageStats = {
        user_id: Principal;
        total_analyses: Nat;
        images_analyzed: Nat;
        videos_analyzed: Nat;
        period_start: Int;
        period_end: Int;
        quota_usage_percentage: Float;
    };
    
    // Rate limiting status
    public type RateLimitStatus = {
        requests_made: Nat;
        requests_remaining: Nat;
        reset_time: Int;
        is_limited: Bool;
    };
    
}
