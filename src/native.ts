/**
 * React Native-specific entry point for Aegis SDK
 * 
 * This entry point includes React Native-specific implementations and
 * optimizations for mobile platforms.
 */

// Core SDK (platform agnostic)
export { AegisSDK } from './core/AegisSDK';
export { NetworkManager } from './core/NetworkManager';
export { BackendClient } from './core/BackendClient';
export { WalletManager } from './core/WalletManager';
export * from './core/validation';

// Types
export * from './types';

// Wallet implementations
export { InAppWallet } from './wallets/inapp';

// React Native-specific storage
export { 
  ReactNativeSecureStorage, 
  ReactNativeAsyncStorage, 
  StorageManager 
} from './utils/storage';

// Crypto utilities
export * from './utils/crypto';

// Re-export Starknet types
export type { Call, CallData, Account, RpcProvider } from 'starknet';