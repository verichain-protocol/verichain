import Principal "mo:base/Principal";

import Types "types/Types";
import UserStorage "storage/UserStorage";
import UserService "services/UserService";
import AdminService "services/AdminService";
import ApiService "services/ApiService";

actor Verichain {
    public type User = Types.User;
    public type RegisterParams = Types.RegisterParams;
    public type GetUserResponse = Types.GetUserResponse;
    public type QuotaStatusResponse = Types.QuotaStatusResponse;
    public type SystemStatsResponse = Types.SystemStatsResponse;
    public type Response<T> = Types.Response<T>;
    public type TierType = Types.TierType;

    stable var usersStorage : [(Principal, User)] = [];
    stable var adminStorage : [Principal] = [];
    stable var anonUsageStorage : [(Text, Nat)] = [];

    private var storage = UserStorage.UserStorage(usersStorage, adminStorage, anonUsageStorage);

    // Initialize services
    private let userService = UserService.UserService(storage);
    private let adminService = AdminService.AdminService(storage);
    private let apiService = ApiService.ApiService(storage);

    // === USER ENDPOINTS ===

    public shared (msg) func register(params : RegisterParams) : async Response<Text> {
        userService.register(msg.caller, params);
    };

    public shared (msg) func login() : async Response<User> {
        userService.login(msg.caller);
    };


    public shared query (msg) func getUser() : async Response<GetUserResponse> {
        userService.getUser(msg.caller);
    };

    public shared (msg) func deleteUser() : async Response<Text> {
        userService.deleteUser(msg.caller);
    };

    public shared query (msg) func isAuthenticated() : async Response<Bool> {
        userService.isAuthenticated(msg.caller);
    };

    public shared (msg) func getQuotaStatus() : async Response<QuotaStatusResponse> {
        userService.getQuotaStatus(msg.caller);
    };

    public shared (msg) func upgradeTier(newTier : TierType) : async Response<Text> {
        userService.upgradeTier(msg.caller, newTier);
    };

    // === API ENDPOINTS ===

    public shared (msg) func apiCallWithToken(anonToken : Text, operation : Text) : async Response<Text> {
        apiService.apiCallWithToken(msg.caller, anonToken, operation);
    };

    // === ADMIN ENDPOINTS ===

    public shared (msg) func addAdmin(newAdmin : Principal) : async Response<Text> {
        adminService.addAdmin(msg.caller, newAdmin);
    };

    public shared (msg) func removeAdmin(adminToRemove : Principal) : async Response<Text> {
        adminService.removeAdmin(msg.caller, adminToRemove);
    };

    public shared query (msg) func isUserAdmin() : async Response<Bool> {
        adminService.isUserAdmin(msg.caller);
    };

    public shared query (msg) func listAdmins() : async Response<[Principal]> {
        adminService.listAdmins(msg.caller);
    };

    public shared query (msg) func getSystemStats() : async Response<SystemStatsResponse> {
        adminService.getSystemStats(msg.caller);
    };

    public shared (msg) func resetUserQuota(userPrincipal : Principal) : async Response<Text> {
        adminService.resetUserQuota(msg.caller, userPrincipal);
    };

    // === DEBUG/TESTING ENDPOINTS ===

    public query func ping() : async Text {
        "pong";
    };

    public shared query (msg) func whoAmI() : async Principal {
        msg.caller;
    };

    public shared query (msg) func whoAmIText() : async Text {
        Principal.toText(msg.caller);
    };

    public shared (msg) func makeMeAdmin() : async Response<Text> {
        adminService.addAdmin(msg.caller, msg.caller);
    };

    public shared (msg) func quickSetupAdmin(fullName : Text, email : Text) : async Response<Text> {
        if (Principal.isAnonymous(msg.caller)) {
            return #err("Anonymous users cannot become admin.");
        };

        // Login (create user if not exists)
        ignore userService.login(msg.caller);

        // Register
        let registerResult = userService.register(msg.caller, { fullName = fullName; email = email });
        switch (registerResult) {
            case (#err(e)) { return #err("Registration failed: " # e) };
            case (#ok(_)) {
                // Make admin
                let adminResult = adminService.addAdmin(msg.caller, msg.caller);
                switch (adminResult) {
                    case (#err(e)) { return #err("Admin setup failed: " # e) };
                    case (#ok(msg)) {
                        return #ok("Complete setup successful! " # msg);
                    };
                };
            };
        };
    };

    // === PERSISTENCE ===

    system func preupgrade() {
        usersStorage := storage.getUsersForStorage();
        adminStorage := storage.getAdminsForStorage();
        anonUsageStorage := storage.getAnonUsageForStorage();
    };

    system func postupgrade() {
        storage := UserStorage.UserStorage(usersStorage, adminStorage, anonUsageStorage);
    };
};
