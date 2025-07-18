// VeriChain Time Utilities
// Purpose: Time-related helper functions

import Time "mo:base/Time";

module {
    
    // Get current timestamp
    public func now() : Int {
        Time.now()
    };
    
    // Check if timestamp is in the past
    public func isPast(timestamp: Int) : Bool {
        timestamp < Time.now()
    };
    
    // Check if timestamp is in the future
    public func isFuture(timestamp: Int) : Bool {
        timestamp > Time.now()
    };
    
    // Add days to current time
    public func addDays(days: Int) : Int {
        let seconds_per_day = 24 * 60 * 60 * 1_000_000_000;
        Time.now() + (days * seconds_per_day)
    };
    
    // Add months to current time (approximate 30 days)
    public func addMonths(months: Int) : Int {
        let seconds_per_month = 30 * 24 * 60 * 60 * 1_000_000_000;
        Time.now() + (months * seconds_per_month)
    };
    
    // Check if it's the first day of the month (for quota reset)
    public func isFirstOfMonth() : Bool {
        // TODO for Robin: Implement proper date checking
        // This is a simplified version
        false
    };
    
}
