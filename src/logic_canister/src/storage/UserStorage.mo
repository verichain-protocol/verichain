// VeriChain User Storage
// Purpose: User data persistence and retrieval

import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import User "../types/User";

module {
    
    // Initialize user storage
    public func initStorage() : HashMap.HashMap<Principal, User.User> {
        HashMap.HashMap<Principal, User.User>(10, Principal.equal, Principal.hash)
    };
    
    // Save user data
    public func saveUser(
        storage: HashMap.HashMap<Principal, User.User>,
        user: User.User
    ) : () {
        storage.put(user.id, user)
    };
    
    // Get user by ID
    public func getUser(
        storage: HashMap.HashMap<Principal, User.User>,
        user_id: Principal
    ) : ?User.User {
        storage.get(user_id)
    };
    
    // Get user by email
    public func getUserByEmail(
        _storage: HashMap.HashMap<Principal, User.User>,
        _email: Text
    ) : ?User.User {
        // TODO for Robin: Implement email lookup
        // 1. Iterate through all users
        // 2. Find user with matching email
        // 3. Return user or null
        null
    };
    
    // Delete user
    public func deleteUser(
        storage: HashMap.HashMap<Principal, User.User>,
        user_id: Principal
    ) : ?User.User {
        storage.remove(user_id)
    };
    
    // Get all users (admin function)
    public func getAllUsers(
        storage: HashMap.HashMap<Principal, User.User>
    ) : [User.User] {
        Iter.toArray(storage.vals())
    };
    
    // Count users by tier
    public func countUsersByTier(
        _storage: HashMap.HashMap<Principal, User.User>,
        _tier: User.UserTier
    ) : Nat {
        // TODO for Robin: Implement tier counting
        // 1. Iterate through users
        // 2. Count users with matching tier
        // 3. Return count
        0
    };
    
}
