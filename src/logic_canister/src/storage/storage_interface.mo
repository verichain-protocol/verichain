import Principal "mo:base/Principal";
import Types "../types/types";

module {
  public type User = Types.User;
  public type UserStorageInterface = {
    // User operations
    getUser: (Principal) -> ?User;
    putUser: (Principal, User) -> ();
    removeUser: (Principal) -> ?User;
    getAllUsers: () -> [(Principal, User)];
    getUserCount: () -> Nat;

    // Admin operations
    isAdmin: (Principal) -> Bool;
    addAdmin: (Principal) -> ();
    removeAdmin: (Principal) -> ();
    getAdminCount: () -> Nat;
    getAllAdmins: () -> [Principal];

    // Anonymous usage operations
    getAnonUsage: (Text) -> Nat;
    incrementAnonUsage: (Text) -> ();
    getAnonUsageCount: () -> Nat;

    // Persistence
    getUsersForStorage: () -> [(Principal, User)];
    getAdminsForStorage: () -> [Principal];
    getAnonUsageForStorage: () -> [(Text, Nat)];
  };  

  public type History = Types.DetectionHistory;
  public type ApiHistoryInterface = {
    saveHistory: (Principal, History) -> ();
    getHistoryByPrincipal: (Principal) -> ?[History];
  };

}