/// Common result type for VeriChain operations
pub type VeriChainResult<T> = std::result::Result<T, String>;

/// Helper macro for creating VeriChain errors
#[macro_export]
macro_rules! verichain_error {
    ($msg:expr) => {
        Err($msg.to_string())
    };
    ($fmt:expr, $($arg:tt)*) => {
        Err(format!($fmt, $($arg)*))
    };
}

/// Helper macro for creating VeriChain results
#[macro_export]
macro_rules! verichain_ok {
    ($value:expr) => {
        Ok($value)
    };
}
