/**
 * Error handling types and classes
 */

/**
 * Error type classification for proper handling
 */
export enum AegisErrorType {
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  BACKEND_ERROR = 'BACKEND_ERROR',
}

/**
 * Specific error codes for detailed error handling
 */
export enum AegisErrorCode {
  // Configuration errors
  INVALID_APP_ID = 'INVALID_APP_ID',
  MISSING_REQUIRED_CONFIG = 'MISSING_REQUIRED_CONFIG',
  UNSUPPORTED_NETWORK = 'UNSUPPORTED_NETWORK',
  
  // Network errors
  PROVIDER_CONNECTION_FAILED = 'PROVIDER_CONNECTION_FAILED',
  RPC_REQUEST_FAILED = 'RPC_REQUEST_FAILED',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  
  // Wallet errors
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  INVALID_PRIVATE_KEY = 'INVALID_PRIVATE_KEY',
  ACCOUNT_NOT_DEPLOYED = 'ACCOUNT_NOT_DEPLOYED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  
  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_REVERTED = 'TRANSACTION_REVERTED',
  NONCE_ERROR = 'NONCE_ERROR',
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',
  
  // Storage errors
  STORAGE_ACCESS_DENIED = 'STORAGE_ACCESS_DENIED',
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  
  // Authentication errors
  BIOMETRIC_UNAVAILABLE = 'BIOMETRIC_UNAVAILABLE',
  BIOMETRIC_FAILED = 'BIOMETRIC_FAILED',
  
  // Backend errors
  BACKEND_UNREACHABLE = 'BACKEND_UNREACHABLE',
  INVALID_API_RESPONSE = 'INVALID_API_RESPONSE',
  PAYMASTER_ERROR = 'PAYMASTER_ERROR',
}

/**
 * Custom error class with enhanced error information
 */
export class AegisError extends Error {
  public readonly type: AegisErrorType;
  public readonly code: AegisErrorCode;
  public readonly details?: any;
  public readonly recoverable: boolean;
  public readonly timestamp: number;

  constructor(
    type: AegisErrorType,
    code: AegisErrorCode,
    message: string,
    recoverable: boolean = false,
    details?: any
  ) {
    super(message);
    this.name = 'AegisError';
    this.type = type;
    this.code = code;
    this.details = details;
    this.recoverable = recoverable;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AegisError);
    }
  }

  /**
   * Convert error to JSON for logging/reporting
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      details: this.details,
      stack: this.stack,
    };
  }

  /**
   * Create a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case AegisErrorCode.INVALID_APP_ID:
        return 'Invalid application ID. Please check your configuration.';
      case AegisErrorCode.PROVIDER_CONNECTION_FAILED:
        return 'Unable to connect to the blockchain network. Please check your internet connection.';
      case AegisErrorCode.ACCOUNT_NOT_DEPLOYED:
        return 'Your wallet account needs to be activated. This will happen automatically.';
      case AegisErrorCode.INSUFFICIENT_BALANCE:
        return 'Insufficient balance to complete this transaction.';
      case AegisErrorCode.TRANSACTION_FAILED:
        return 'Transaction failed. Please try again.';
      case AegisErrorCode.BIOMETRIC_FAILED:
        return 'Biometric authentication failed. Please try again or use an alternative method.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

/**
 * Factory functions for creating specific errors
 */
export class AegisErrorFactory {
  static configurationError(code: AegisErrorCode, message: string, details?: any): AegisError {
    return new AegisError(AegisErrorType.CONFIGURATION_ERROR, code, message, false, details);
  }

  static networkError(code: AegisErrorCode, message: string, recoverable: boolean = true, details?: any): AegisError {
    return new AegisError(AegisErrorType.NETWORK_ERROR, code, message, recoverable, details);
  }

  static walletError(code: AegisErrorCode, message: string, recoverable: boolean = false, details?: any): AegisError {
    return new AegisError(AegisErrorType.WALLET_ERROR, code, message, recoverable, details);
  }

  static transactionError(code: AegisErrorCode, message: string, recoverable: boolean = true, details?: any): AegisError {
    return new AegisError(AegisErrorType.TRANSACTION_ERROR, code, message, recoverable, details);
  }

  static storageError(code: AegisErrorCode, message: string, recoverable: boolean = false, details?: any): AegisError {
    return new AegisError(AegisErrorType.STORAGE_ERROR, code, message, recoverable, details);
  }

  static authenticationError(code: AegisErrorCode, message: string, recoverable: boolean = true, details?: any): AegisError {
    return new AegisError(AegisErrorType.AUTHENTICATION_ERROR, code, message, recoverable, details);
  }

  static backendError(code: AegisErrorCode, message: string, recoverable: boolean = true, details?: any): AegisError {
    return new AegisError(AegisErrorType.BACKEND_ERROR, code, message, recoverable, details);
  }
}