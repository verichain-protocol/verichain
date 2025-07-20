import Result "mo:base/Result";

module {
  public type TierType = {
    #anonymous;
    #authenticated;
    #premium;
  };

  public type QuotaLimits = {
    dailyApiCalls : Nat;
    monthlyApiCalls : Nat;
  };

  public type UserQuota = {
    tier : TierType;
    dailyUsage : Nat;
    monthlyUsage : Nat;
    lastResetDaily : Int; // timestamp
    lastResetMonthly : Int; // timestamp
  };

  public type User = {
    fullName : ?Text;
    email : ?Text;
    createdAt : Int;
    isRegistered : Bool;
    quota : UserQuota;
  };

  public type RegisterParams = {
    fullName : Text;
    email : Text;
  };

  public type GetUserResponse = {
    fullName : ?Text;
    email : ?Text;
    tier : TierType;
  };

  public type QuotaStatusResponse = {
    tier : TierType;
    dailyUsage : Nat;
    monthlyUsage : Nat;
    dailyLimit : Nat;
    monthlyLimit : Nat;
  };

  public type SystemStatsResponse = {
    totalUsers: Nat;
    totalAdmins: Nat;
    anonymousUsers: Nat;
    authenticatedUsers: Nat;
    premiumUsers: Nat;
  };

  // Response type for consistent API responses
  public type Response<T> = Result.Result<T, Text>;

  // Enhanced response types for better error handling
  public type ValidationResult = {
    #valid;
    #invalid: Text;
  };

  // Audit log entry for admin actions
  public type AuditEntry = {
    timestamp: Int;
    performer: Principal;
    action: Text;
    target: ?Principal;
    details: Text;
  };
}
