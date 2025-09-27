import Result "mo:base/Result";
// import Sha256 "mo:sha2/Sha256";

module {
  public type Hash32 = Blob;
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
  
  public type AIDetection = {
    facesDetected: Nat;
    deepfakeLikelihood: Float;
    modelUsed: Text;
  };

  public type DetectionHistory = {
    txHash: Hash32;         
    uploadedAt: Text;         
    uploadedBy: Principal;   
    fileName: ?Text;
    chainStatus: ?Text;
    storageCanister: Principal;
    accessPath: Text;        
    ai: AIDetection;
    createdAt: Int; // timestamp
  };
  
    public type SaveHistoryParams = {
    uploadedBy: Principal;
    uploadedAt: Text;   
    fileName: Text;
    chainStatus: Text;
    storageCanister: Principal;
    accessPath: Text;        
    facesDetected: Nat;
    deepfakeLikelihood: Float;
    modelUsed: Text;
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

  public type Response<T> = Result.Result<T, Text>;

  public type ValidationResult = {
    #valid;
    #invalid: Text;
  };

  public type AuditEntry = {
    timestamp: Int;
    performer: Principal;
    action: Text;
    target: ?Principal;
    details: Text;
  };
}
