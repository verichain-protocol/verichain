// VeriChain API Types
// Purpose: API requests, responses, and system status

module {
    
    // Generic API Response wrapper
    public type APIResponse<T> = {
        success: Bool;
        data: ?T;
        error: ?Text;
        timestamp: Int;
    };
    
    // System health status
    public type SystemHealth = {
        status: Text; // "healthy" | "degraded" | "unhealthy"
        active_users: Nat;
        total_users: Nat;
        analyses_today: Nat;
        uptime_seconds: Nat;
    };
    
    // Platform statistics (admin only)
    public type PlatformStats = {
        total_users: Nat;
        guest_users: Nat;
        registered_users: Nat;
        premium_users: Nat;
        total_analyses: Nat;
        analyses_today: Nat;
        analyses_this_month: Nat;
        revenue_this_month: Float;
    };
    
    // Error types
    public type ErrorCode = {
        #InvalidFormat;
        #FileTooLarge;
        #ModelNotLoaded;
        #ProcessingError;
        #RateLimitExceeded;
        #QuotaExceeded;
        #GuestLimitReached;
        #APIAccessDenied;
        #InvalidAPIKey;
        #PremiumRequired;
        #AuthRequired;
        #InvalidToken;
    };
    
    // Helper function to convert error to text
    public func errorToText(error: ErrorCode) : Text {
        switch (error) {
            case (#InvalidFormat) "Unsupported file format";
            case (#FileTooLarge) "File exceeds size limits";
            case (#ModelNotLoaded) "AI model not initialized";
            case (#ProcessingError) "Internal processing failure";
            case (#RateLimitExceeded) "API rate limit exceeded (10 req/min)";
            case (#QuotaExceeded) "Monthly quota limit reached";
            case (#GuestLimitReached) "Guest user reached 3-analysis limit";
            case (#APIAccessDenied) "API access requires Premium subscription";
            case (#InvalidAPIKey) "API key invalid, expired, or not Premium";
            case (#PremiumRequired) "Feature requires Premium subscription";
            case (#AuthRequired) "Authentication required";
            case (#InvalidToken) "Authentication token invalid or expired";
        }
    };
    
}
