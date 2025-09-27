import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Blob "mo:base/Blob";
import Types "../types/types";
import ErrorCodes "../types/errors";
import QuotaUtils "../utils/quota_utils";
import ValidationUtils "../utils/validation_utils";
import HistoryUtils "../utils/history_utils";
import StorageInterface "../storage/storage_interface";

module {
  public type Response<T> = Types.Response<T>;
  public type User = Types.User;
  public type History = Types.DetectionHistory;
  public type SaveHistoryParams = Types.SaveHistoryParams;
  public type Hash32 = Blob;

  public class ApiService(
    userStorage : StorageInterface.UserStorageInterface,
    apiHistoryStorage : StorageInterface.ApiHistoryInterface,
  ) {
    public func apiCallWithToken(caller : Principal, anonToken : Text, operation : Text) : Response<Text> {
      switch (ValidationUtils.isValidOperation(operation)) {
        case (#invalid(error)) { return #err(error) };
        case (#valid) {};
      };

      if (Principal.isAnonymous(caller)) {
        switch (ValidationUtils.isValidToken(anonToken)) {
          case (#invalid(error)) { return #err(error) };
          case (#valid) {};
        };

        let currentCount = userStorage.getAnonUsage(anonToken);

        if (currentCount >= 3) {
          return #err(ErrorCodes.formatError(ErrorCodes.QUOTA_EXCEEDED, "Anonymous user quota exceeded (3 calls per token)"));
        };

        userStorage.incrementAnonUsage(anonToken);

        return #ok("Anonymous API call successful. Usage: " # Nat.toText(currentCount + 1) # " of 3. Operation: " # operation);
      };

      switch (userStorage.getUser(caller)) {
        case (?user) {
          let currentTime = QuotaUtils.getCurrentTime();
          let updatedQuota = QuotaUtils.resetQuota(user.quota, currentTime);

          if (not QuotaUtils.canMakeApiCallWithQuota(updatedQuota)) {
            let tierName = switch (updatedQuota.tier) {
              case (#authenticated) "authenticated";
              case (#premium) "premium";
              case (#anonymous) "anonymous";
            };
            return #err(ErrorCodes.formatError(ErrorCodes.QUOTA_EXCEEDED, "Quota exceeded for " # tierName # " tier. Please upgrade your plan or wait for reset"));
          };

          let newQuota = {
            tier = updatedQuota.tier;
            dailyUsage = updatedQuota.dailyUsage + 1;
            monthlyUsage = updatedQuota.monthlyUsage + 1;
            lastResetDaily = updatedQuota.lastResetDaily;
            lastResetMonthly = updatedQuota.lastResetMonthly;
          };

          let updatedUser = {
            fullName = user.fullName;
            email = user.email;
            createdAt = user.createdAt;
            isRegistered = user.isRegistered;
            quota = newQuota;
          };

          userStorage.putUser(caller, updatedUser);

          let limits = QuotaUtils.getTierLimits(newQuota.tier);
          let remainingDaily = Int.abs(Int.max(0, limits.dailyApiCalls - newQuota.dailyUsage));
          let remainingMonthly = Int.abs(Int.max(0, limits.monthlyApiCalls - newQuota.monthlyUsage));

          return #ok("API call successful. Operation: " # operation # ". Remaining today: " # Nat.toText(remainingDaily) # ", this month: " # Nat.toText(remainingMonthly));
        };
        case null {
          return #err(ErrorCodes.formatError(ErrorCodes.USER_NOT_FOUND, "User not found. Please login or register first"));
        };
      };
    };

    // public shared ({ caller }) func addHistory(params : SaveHistoryParams) : async Response<Text> {
    //   if (Principal.isAnonymous(caller)) {
    //     return #err(ErrorCodes.formatError(ErrorCodes.ANONYMOUS_NOT_ALLOWED, "Anonymous users cannot register"));
    //   };

    //   let currentTime = QuotaUtils.getCurrentTime();
    //   // Await random hash
    //   let tx : Hash32 = await HistoryUtils.randomHash32();
    //   let newHistory : History = {
    //     txHash = tx;
    //     uploadedAt = params.uploadedAt;
    //     uploadedBy = params.uploadedBy;
    //     fileName = ?params.fileName;
    //     chainStatus = ?params.chainStatus;
    //     storageCanister = params.storageCanister;
    //     accessPath = params.accessPath;
    //     ai = {
    //       facesDetected = params.facesDetected;
    //       deepfakeLikelihood = params.deepfakeLikelihood;
    //       modelUsed = params.modelUsed;
    //     };
    //     createdAt = currentTime;
    //   };
    //   apiHistoryStorage.saveHistory(caller, newHistory);
    //   return #ok("User registered successfully");
    // };

  };
};
