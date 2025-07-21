import Text "mo:base/Text";
import Types "../types/Types";
import ErrorCodes "../types/Errors";

module {
  public type ValidationResult = Types.ValidationResult;

  // Email validation - basic check
  public func isValidEmail(email: Text) : ValidationResult {
    if (Text.size(email) == 0) {
      return #invalid(ErrorCodes.formatError(ErrorCodes.EMPTY_FIELD, "Email cannot be empty"));
    };
    
    if (not Text.contains(email, #char '@')) {
      return #invalid(ErrorCodes.formatError(ErrorCodes.INVALID_EMAIL, "Email must contain @ symbol"));
    };
    
    if (Text.size(email) < 5) {
      return #invalid(ErrorCodes.formatError(ErrorCodes.INVALID_EMAIL, "Email is too short"));
    };
    
    #valid
  };

  // Name validation
  public func isValidName(name: Text) : ValidationResult {
    if (Text.size(name) == 0) {
      return #invalid(ErrorCodes.formatError(ErrorCodes.EMPTY_FIELD, "Name cannot be empty"));
    };
    
    if (Text.size(name) < 2) {
      return #invalid(ErrorCodes.formatError(ErrorCodes.INVALID_INPUT, "Name must be at least 2 characters"));
    };
    
    if (Text.size(name) > 100) {
      return #invalid(ErrorCodes.formatError(ErrorCodes.INVALID_INPUT, "Name cannot exceed 100 characters"));
    };
    
    #valid
  };

  // Token validation for anonymous users
  public func isValidToken(token: Text) : ValidationResult {
    if (Text.size(token) == 0) {
      return #invalid(ErrorCodes.formatError(ErrorCodes.EMPTY_FIELD, "Token cannot be empty"));
    };
    
    if (Text.size(token) < 8) {
      return #invalid(ErrorCodes.formatError(ErrorCodes.INVALID_INPUT, "Token must be at least 8 characters"));
    };
    
    #valid
  };

  // Operation name validation
  public func isValidOperation(operation: Text) : ValidationResult {
    if (Text.size(operation) == 0) {
      return #invalid(ErrorCodes.formatError(ErrorCodes.EMPTY_FIELD, "Operation cannot be empty"));
    };
    
    if (Text.size(operation) > 50) {
      return #invalid(ErrorCodes.formatError(ErrorCodes.INVALID_INPUT, "Operation name too long"));
    };
    
    #valid
  };
}
