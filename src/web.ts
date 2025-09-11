/**
 * Web-specific entry point for Aegis SDK
 * 
 * This entry point includes web-specific implementations and excludes
 * React Native dependencies.
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

// Web-specific storage
export { 
  WebSecureStorage, 
  WebAsyncStorage, 
  StorageManager 
} from './utils/storage';

// Crypto utilities
export * from './utils/crypto';

// Re-export Starknet types
export type { Call, CallData, Account, RpcProvider } from 'starknet';