/**
 * Centralized type definitions export
 */

// Configuration types
export type {
  AegisConfig,
  InternalAegisConfig,
} from './config';

// Wallet types
export type {
  ExecuteOptions,
  TransactionResult,
  TokenBalance,
  AegisWallet,
  WalletConnectionData,
  KeyMetadata,
} from './wallet';

// Error types
export {
  AegisErrorType,
  AegisErrorCode,
  AegisError,
  AegisErrorFactory,
} from './errors';

// Re-export commonly used Starknet types for convenience
export type { Call, CallData, Account, RpcProvider } from 'starknet';