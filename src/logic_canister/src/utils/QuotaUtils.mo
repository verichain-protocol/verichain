import Time "mo:base/Time";
import Types "../types/Types";

module {
  public type TierType = Types.TierType;
  public type QuotaLimits = Types.QuotaLimits;
  public type UserQuota = Types.UserQuota;

  public func getTierLimits(tier : TierType) : QuotaLimits {
    switch (tier) {
      case (#anonymous) {
        {
          dailyApiCalls = 3;
          monthlyApiCalls = 3;
        };
      };
      case (#authenticated) {
        {
          dailyApiCalls = 30;
          monthlyApiCalls = 30;
        };
      };
      case (#premium) {
        {
          dailyApiCalls = 9999;
          monthlyApiCalls = 9999;
        };
      };
    };
  };

  public func needsQuotaReset(quota : UserQuota, currentTime : Int) : (Bool, Bool) {
    let dayInNanoseconds = 24 * 60 * 60 * 1_000_000_000;
    let monthInNanoseconds = 30 * dayInNanoseconds;

    let needsDailyReset = currentTime - quota.lastResetDaily >= dayInNanoseconds;
    let needsMonthlyReset = currentTime - quota.lastResetMonthly >= monthInNanoseconds;

    (needsDailyReset, needsMonthlyReset);
  };

  public func resetQuota(quota : UserQuota, currentTime : Int) : UserQuota {
    let (needsDailyReset, needsMonthlyReset) = needsQuotaReset(quota, currentTime);

    {
      tier = quota.tier;
      dailyUsage = if (needsDailyReset) 0 else quota.dailyUsage;
      monthlyUsage = if (needsMonthlyReset) 0 else quota.monthlyUsage;
      lastResetDaily = if (needsDailyReset) currentTime else quota.lastResetDaily;
      lastResetMonthly = if (needsMonthlyReset) currentTime else quota.lastResetMonthly;
    };
  };

  public func quotaEqual(q1 : UserQuota, q2 : UserQuota) : Bool {
    q1.tier == q2.tier and
    q1.dailyUsage == q2.dailyUsage and
    q1.monthlyUsage == q2.monthlyUsage and
    q1.lastResetDaily == q2.lastResetDaily and
    q1.lastResetMonthly == q2.lastResetMonthly
  };

  public func canMakeApiCallWithQuota(quota : UserQuota) : Bool {
    let limits = getTierLimits(quota.tier);
    quota.dailyUsage < limits.dailyApiCalls and quota.monthlyUsage < limits.monthlyApiCalls
  };

  public func getCurrentTime() : Int {
    Time.now()
  };
}
