module {
  // Centralized error codes for consistency
  public let ANONYMOUS_NOT_ALLOWED = "ANONYMOUS_NOT_ALLOWED";
  public let USER_NOT_FOUND = "USER_NOT_FOUND";
  public let USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS";
  public let INVALID_INPUT = "INVALID_INPUT";
  public let QUOTA_EXCEEDED = "QUOTA_EXCEEDED";
  public let UNAUTHORIZED = "UNAUTHORIZED";
  public let ADMIN_REQUIRED = "ADMIN_REQUIRED";
  public let LAST_ADMIN = "LAST_ADMIN";
  public let SELF_REMOVAL = "SELF_REMOVAL";
  public let STORAGE_ERROR = "STORAGE_ERROR";
  public let INVALID_TIER = "INVALID_TIER";
  public let INVALID_EMAIL = "INVALID_EMAIL";
  public let EMPTY_FIELD = "EMPTY_FIELD";

  // Error message formatter
  public func formatError(code: Text, message: Text) : Text {
    "[" # code # "] " # message
  };
}
