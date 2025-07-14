import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Iter "mo:base/Iter";

actor VeriChainLogic {
    
    type User = {
        id: Principal;
        subscription_type: Text;
        usage_count: Nat;
        last_reset: Int;
        created_at: Int;
    };

    type ApiKey = {
        key: Text;
        user_id: Principal;
        permissions: [Text];
        created_at: Int;
        is_active: Bool;
    };

    private stable var users_entries : [(Principal, User)] = [];
    private stable var api_keys_entries : [(Text, ApiKey)] = [];
    
    private var users = HashMap.fromIter<Principal, User>(
        users_entries.vals(), 10, Principal.equal, Principal.hash
    );
    
    private var api_keys = HashMap.fromIter<Text, ApiKey>(
        api_keys_entries.vals(), 10, Text.equal, Text.hash
    );

    public func create_user(user_id: Principal) : async Result.Result<User, Text> {
        let new_user : User = {
            id = user_id;
            subscription_type = "free";
            usage_count = 0;
            last_reset = Time.now();
            created_at = Time.now();
        };
        
        users.put(user_id, new_user);
        #ok(new_user)
    };

    public query func get_user(user_id: Principal) : async ?User {
        users.get(user_id)
    };

    public func create_api_key(user_id: Principal) : async Result.Result<Text, Text> {
        let key = generate_api_key();
        let new_api_key : ApiKey = {
            key = key;
            user_id = user_id;
            permissions = ["deepfake_detection"];
            created_at = Time.now();
            is_active = true;
        };
        
        api_keys.put(key, new_api_key);
        #ok(key)
    };

    public query func validate_api_key(key: Text) : async Bool {
        switch (api_keys.get(key)) {
            case (?api_key) api_key.is_active;
            case null false;
        }
    };

    public func check_usage_limit(user_id: Principal) : async Bool {
        switch (users.get(user_id)) {
            case (?user) {
                let current_time = Time.now();
                let one_month = 30 * 24 * 60 * 60 * 1000_000_000;
                
                if (current_time - user.last_reset > one_month) {
                    let updated_user = {
                        user with 
                        usage_count = 0;
                        last_reset = current_time;
                    };
                    users.put(user_id, updated_user);
                    true
                } else {
                    let limit = if (user.subscription_type == "premium") 1000 else 30;
                    user.usage_count < limit
                }
            };
            case null true;
        }
    };

    private func generate_api_key() : Text {
        "vk_" # Int.toText(Time.now())
    };

    system func preupgrade() {
        users_entries := Iter.toArray(users.entries());
        api_keys_entries := Iter.toArray(api_keys.entries());
    };

    system func postupgrade() {
        users_entries := [];
        api_keys_entries := [];
    };
}