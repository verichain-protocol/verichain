// VeriChain Authentication Types
// Purpose: Authentication, tokens, and API keys

import Principal "mo:base/Principal";

module {
    
    // Authentication token
    public type AuthToken = {
        token: Text;
        user_id: Principal;
        expires_at: Int;
        created_at: Int;
    };
    
    // API Key (Premium users only)
    public type APIKey = {
        key: Text;
        user_id: Principal;
        permissions: [Text];
        created_at: Int;
        expires_at: ?Int; // null = never expires
        is_active: Bool;
    };
    
    // Session information
    public type Session = {
        id: Text;
        user_id: Principal;
        created_at: Int;
        last_activity: Int;
        expires_at: Int;
        ip_address: ?Text;
    };
    
    // Login result
    public type LoginResult = {
        success: Bool;
        token: ?AuthToken;
        user_id: ?Principal;
        error: ?Text;
    };
    
}
