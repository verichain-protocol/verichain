import Map "mo:base/HashMap";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Trie "mo:base/Trie";
import Text "mo:base/Text";
import Types "../types/Types";
import StorageInterface "StorageInterface";

module {
  public type User = Types.User;

  public class UserStorage(
    usersStorage: [(Principal, User)],
    adminStorage: [Principal], 
    anonUsageStorage: [(Text, Nat)]
  ) : StorageInterface.StorageInterface {
    // In-memory storage (HashMap for fast lookups)
    private var userStore = Map.HashMap<Principal, User>(0, Principal.equal, Principal.hash);
    private var adminStore = Map.HashMap<Principal, Bool>(0, Principal.equal, Principal.hash);
    private var anonUsage : Trie.Trie<Text, Nat> = Trie.empty<Text, Nat>();

    // Initialize from stable storage
    do {
      for ((key, value) in usersStorage.vals()) {
        userStore.put(key, value);
      };
      for (admin in adminStorage.vals()) {
        adminStore.put(admin, true);
      };
      for ((token, count) in anonUsageStorage.vals()) {
        let key : Trie.Key<Text> = { key = token; hash = Text.hash(token) };
        anonUsage := Trie.replace(anonUsage, key, Text.equal, ?count).0;
      };
    };

    // User operations
    public func getUser(principal: Principal) : ?User {
      userStore.get(principal)
    };

    public func putUser(principal: Principal, user: User) : () {
      userStore.put(principal, user)
    };

    public func removeUser(principal: Principal) : ?User {
      userStore.remove(principal)
    };

    public func getAllUsers() : [(Principal, User)] {
      Iter.toArray(userStore.entries())
    };

    public func getUserCount() : Nat {
      userStore.size()
    };

    // Admin operations
    public func isAdmin(principal: Principal) : Bool {
      switch (adminStore.get(principal)) {
        case (?_) { true };
        case null { false };
      }
    };

    public func addAdmin(principal: Principal) : () {
      adminStore.put(principal, true)
    };

    public func removeAdmin(principal: Principal) : () {
      adminStore.delete(principal)
    };

    public func getAdminCount() : Nat {
      adminStore.size()
    };

    public func getAllAdmins() : [Principal] {
      Iter.toArray(adminStore.keys())
    };

    // Anonymous usage operations
    public func getAnonUsage(token: Text) : Nat {
      let key : Trie.Key<Text> = { key = token; hash = Text.hash(token) };
      switch (Trie.find(anonUsage, key, Text.equal)) {
        case (?count) { count };
        case null { 0 };
      }
    };

    public func incrementAnonUsage(token: Text) : () {
      let key : Trie.Key<Text> = { key = token; hash = Text.hash(token) };
      let currentCount = getAnonUsage(token);
      anonUsage := Trie.replace(anonUsage, key, Text.equal, ?(currentCount + 1)).0;
    };

    public func getAnonUsageCount() : Nat {
      var count = 0;
      for ((_, _) in Trie.iter(anonUsage)) {
        count += 1;
      };
      count
    };

    // Persistence functions - return data for stable storage
    public func getUsersForStorage() : [(Principal, User)] {
      Iter.toArray(userStore.entries())
    };

    public func getAdminsForStorage() : [Principal] {
      Iter.toArray(adminStore.keys())
    };

    public func getAnonUsageForStorage() : [(Text, Nat)] {
      Iter.toArray(Trie.iter(anonUsage))
    };
  };
}
