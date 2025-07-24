import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Types "../types/Types";
import ErrorCodes "../types/Errors";
import StorageInterface "../storage/StorageInterface";

module {
  public type Response<T> = Types.Response<T>;
  public type SystemStatsResponse = Types.SystemStatsResponse;
  public type User = Types.User;

  public class AdminService(storage: StorageInterface.StorageInterface) {

    public func addAdmin(caller: Principal, newAdmin: Principal) : Response<Text> {
      if (storage.getAdminCount() == 0 and caller != newAdmin) {
        return #err(ErrorCodes.formatError(ErrorCodes.UNAUTHORIZED, "First admin must be self-appointed"));
      };

      switch (storage.getUser(newAdmin)) {
        case null { 
          return #err(ErrorCodes.formatError(ErrorCodes.USER_NOT_FOUND, "Target user is not registered. User must register before becoming admin"));
        };
        case (?user) {
          if (not user.isRegistered) {
            return #err(ErrorCodes.formatError(ErrorCodes.INVALID_INPUT, "Target user must complete registration before becoming admin"));
          };
        };
      };
      
      if (storage.getAdminCount() > 0 and not storage.isAdmin(caller)) {
        return #err(ErrorCodes.formatError(ErrorCodes.ADMIN_REQUIRED, "Only administrators can add new admins"));
      };

      if (storage.isAdmin(newAdmin)) {
        return #err(ErrorCodes.formatError(ErrorCodes.INVALID_INPUT, "User is already an administrator"));
      };

      storage.addAdmin(newAdmin);
      return #ok("Administrator privileges granted successfully");
    };

    public func removeAdmin(caller: Principal, adminToRemove: Principal) : Response<Text> {
      if (not storage.isAdmin(caller)) {
        return #err(ErrorCodes.formatError(ErrorCodes.ADMIN_REQUIRED, "Only administrators can remove admin privileges"));
      };

      if (storage.getAdminCount() <= 1) {
        return #err(ErrorCodes.formatError(ErrorCodes.LAST_ADMIN, "Cannot remove the last administrator. At least one admin must remain"));
      };

      if (caller == adminToRemove) {
        return #err(ErrorCodes.formatError(ErrorCodes.SELF_REMOVAL, "Administrators cannot remove their own admin privileges"));
      };

      if (not storage.isAdmin(adminToRemove)) {
        return #err(ErrorCodes.formatError(ErrorCodes.INVALID_INPUT, "Target user is not an administrator"));
      };

      storage.removeAdmin(adminToRemove);
      return #ok("Administrator privileges revoked successfully");
    };

    public func isUserAdmin(caller: Principal) : Response<Bool> {
      #ok(storage.isAdmin(caller))
    };

    public func listAdmins(caller: Principal) : Response<[Principal]> {
      if (not storage.isAdmin(caller)) {
        return #err(ErrorCodes.formatError(ErrorCodes.ADMIN_REQUIRED, "Only administrators can view the admin list"));
      };

      let admins = storage.getAllAdmins();
      return #ok(admins);
    };

    public func getSystemStats(caller: Principal) : Response<SystemStatsResponse> {
      if (not storage.isAdmin(caller)) {
        return #err(ErrorCodes.formatError(ErrorCodes.ADMIN_REQUIRED, "Only administrators can view system statistics"));
      };

      var authenticatedCount = 0;
      var premiumCount = 0;

      for ((_, user) in storage.getAllUsers().vals()) {
        switch (user.quota.tier) {
          case (#anonymous) { };
          case (#authenticated) { authenticatedCount += 1; };
          case (#premium) { premiumCount += 1; };
        };
      };

      return #ok({
        totalUsers = storage.getUserCount();
        totalAdmins = storage.getAdminCount();
        anonymousUsers = storage.getAnonUsageCount();
        authenticatedUsers = authenticatedCount;
        premiumUsers = premiumCount;
      });
    };

    public func resetUserQuota(caller: Principal, userPrincipal: Principal) : Response<Text> {
      if (not storage.isAdmin(caller)) {
        return #err(ErrorCodes.formatError(ErrorCodes.ADMIN_REQUIRED, "Only administrators can reset user quotas"));
      };

      switch (storage.getUser(userPrincipal)) {
        case (?user) {
          let currentTime = Time.now();
          let resetQuota = {
            tier = user.quota.tier;
            dailyUsage = 0;
            monthlyUsage = 0;
            lastResetDaily = currentTime;
            lastResetMonthly = currentTime;
          };

          let updatedUser = {
            fullName = user.fullName;
            email = user.email;
            createdAt = user.createdAt;
            isRegistered = user.isRegistered;
            quota = resetQuota;
          };

          storage.putUser(userPrincipal, updatedUser);
          return #ok("User quota reset successfully");
        };
        case null {
          return #err(ErrorCodes.formatError(ErrorCodes.USER_NOT_FOUND, "Target user not found"));
        };
      };
    };
  };
}
