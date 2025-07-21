import Principal "mo:base/Principal";
import Types "../types/Types";
import ErrorCodes "../types/Errors";
import QuotaUtils "../utils/QuotaUtils";
import ValidationUtils "../utils/ValidationUtils";
import StorageInterface "../storage/StorageInterface";

module {
  public type User = Types.User;
  public type RegisterParams = Types.RegisterParams;
  public type GetUserResponse = Types.GetUserResponse;
  public type QuotaStatusResponse = Types.QuotaStatusResponse;
  public type Response<T> = Types.Response<T>;
  public type TierType = Types.TierType;
  public type UserQuota = Types.UserQuota;

  public class UserService(storage : StorageInterface.StorageInterface) {

    public func login(caller : Principal) : Response<User> {
      if (Principal.isAnonymous(caller)) {
        return #err(ErrorCodes.formatError(ErrorCodes.ANONYMOUS_NOT_ALLOWED, "Anonymous users cannot login"));
      };

      switch (storage.getUser(caller)) {
        case (?user) { 
          return #ok(user);
        };
        case null {
          let currentTime = QuotaUtils.getCurrentTime();
          let newUser : User = {
            fullName = null;
            email = null;
            createdAt = currentTime;
            isRegistered = false;
            quota = {
              tier = #authenticated;
              dailyUsage = 0;
              monthlyUsage = 0;
              lastResetDaily = currentTime;
              lastResetMonthly = currentTime;
            };
          };
          storage.putUser(caller, newUser);
          return #ok(newUser);
        };
      };
    };

    public func register(caller : Principal, params : RegisterParams) : Response<Text> {
      if (Principal.isAnonymous(caller)) {
        return #err(ErrorCodes.formatError(ErrorCodes.ANONYMOUS_NOT_ALLOWED, "Anonymous users cannot register"));
      };

      // Validate input parameters
      switch (ValidationUtils.isValidName(params.fullName)) {
        case (#invalid(error)) { return #err(error) };
        case (#valid) {};
      };

      switch (ValidationUtils.isValidEmail(params.email)) {
        case (#invalid(error)) { return #err(error) };
        case (#valid) {};
      };

      switch (storage.getUser(caller)) {
        case (?existingUser) {
          let updatedProfile : User = {
            fullName = ?params.fullName;
            email = ?params.email;
            createdAt = existingUser.createdAt; // Keep original creation time
            isRegistered = true;
            quota = existingUser.quota; // Keep existing quota
          };

          storage.putUser(caller, updatedProfile);
          return #ok("User profile updated successfully");
        };
        case null {
          let currentTime = QuotaUtils.getCurrentTime();
          let newUser : User = {
            fullName = ?params.fullName;
            email = ?params.email;
            createdAt = currentTime;
            isRegistered = true;
            quota = {
              tier = #authenticated;
              dailyUsage = 0;
              monthlyUsage = 0;
              lastResetDaily = currentTime;
              lastResetMonthly = currentTime;
            };
          };
          storage.putUser(caller, newUser);
          return #ok("User registered successfully");
        };
      };
    };

    public func getUser(caller : Principal) : Response<GetUserResponse> {
      if (Principal.isAnonymous(caller)) {
        return #err(ErrorCodes.formatError(ErrorCodes.ANONYMOUS_NOT_ALLOWED, "Anonymous users cannot access user data"));
      };

      switch (storage.getUser(caller)) {
        case (?user) {
          return #ok({
            fullName = user.fullName;
            email = user.email;
            tier = user.quota.tier;
          });
        };
        case null { 
          return #err(ErrorCodes.formatError(ErrorCodes.USER_NOT_FOUND, "User profile not found. Please login first."));
        };
      };
    };

    public func deleteUser(caller : Principal) : Response<Text> {
      if (Principal.isAnonymous(caller)) {
        return #err(ErrorCodes.formatError(ErrorCodes.ANONYMOUS_NOT_ALLOWED, "Anonymous users cannot delete accounts"));
      };

      switch (storage.removeUser(caller)) {
        case (?_) { 
          return #ok("User account deleted successfully");
        };
        case null { 
          return #err(ErrorCodes.formatError(ErrorCodes.USER_NOT_FOUND, "User account not found"));
        };
      };
    };

    public func isAuthenticated(caller : Principal) : Response<Bool> {
      if (Principal.isAnonymous(caller)) {
        return #ok(false);
      };

      switch (storage.getUser(caller)) {
        case (?_) { #ok(true) };
        case null { #ok(false) };
      };
    };

    public func getQuotaStatus(caller : Principal) : Response<QuotaStatusResponse> {
      if (Principal.isAnonymous(caller)) {
        return #err(ErrorCodes.formatError(ErrorCodes.ANONYMOUS_NOT_ALLOWED, "Anonymous users cannot access quota information"));
      };

      switch (storage.getUser(caller)) {
        case (?user) {
          let currentTime = QuotaUtils.getCurrentTime();
          let updatedQuota = QuotaUtils.resetQuota(user.quota, currentTime);
          let limits = QuotaUtils.getTierLimits(updatedQuota.tier);

          if (not QuotaUtils.quotaEqual(updatedQuota, user.quota)) {
            let updatedUser = {
              fullName = user.fullName;
              email = user.email;
              createdAt = user.createdAt;
              isRegistered = user.isRegistered;
              quota = updatedQuota;
            };
            storage.putUser(caller, updatedUser);
          };

          return #ok({
            tier = updatedQuota.tier;
            dailyUsage = updatedQuota.dailyUsage;
            monthlyUsage = updatedQuota.monthlyUsage;
            dailyLimit = limits.dailyApiCalls;
            monthlyLimit = limits.monthlyApiCalls;
          });
        };
        case null {
          return #err(ErrorCodes.formatError(ErrorCodes.USER_NOT_FOUND, "User profile not found. Please login first."));
        };
      };
    };

    public func upgradeTier(caller : Principal, newTier : TierType) : Response<Text> {
      switch (newTier) {
        case (#anonymous) {
          return #err(ErrorCodes.formatError(ErrorCodes.INVALID_TIER, "Cannot downgrade to anonymous tier"));
        };
        case (#authenticated or #premium) {};
      };
      
      switch (storage.getUser(caller)) {
        case (?user) {
          switch (user.quota.tier, newTier) {
            case (#premium, #authenticated) {
              return #err(ErrorCodes.formatError(ErrorCodes.INVALID_TIER, "Cannot downgrade from premium to authenticated"));
            };
            case (currentTier, newTierCheck) if (currentTier == newTierCheck) {
              return #err(ErrorCodes.formatError(ErrorCodes.INVALID_TIER, "User is already on this tier"));
            };
          };

          let updatedQuota = {
            tier = newTier;
            dailyUsage = user.quota.dailyUsage;
            monthlyUsage = user.quota.monthlyUsage;
            lastResetDaily = user.quota.lastResetDaily;
            lastResetMonthly = user.quota.lastResetMonthly;
          };

          let updatedUser = {
            fullName = user.fullName;
            email = user.email;
            createdAt = user.createdAt;
            isRegistered = user.isRegistered;
            quota = updatedQuota;
          };

          storage.putUser(caller, updatedUser);
          
          let tierName = switch (newTier) {
            case (#authenticated) "Authenticated";
            case (#premium) "Premium";
            case (#anonymous) "Anonymous"; 
          };
          
          return #ok("Tier upgraded to " # tierName # " successfully");
        };
        case null {
          return #err(ErrorCodes.formatError(ErrorCodes.USER_NOT_FOUND, "User profile not found. Please login first."));
        };
      };
    };
  };
};
