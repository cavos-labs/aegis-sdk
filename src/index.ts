/**
 * Main Aegis SDK entry point
 * 
 * This is the primary entry point for the Aegis SDK, providing access to all
 * core functionality including in-app wallets, transaction management, and
 * cross-platform storage.
 */

// Core SDK
export { AegisSDK } from './core/AegisSDK';
export { NetworkManager } from './core/NetworkManager';
export { BackendClient } from './core/BackendClient';
export { WalletManager } from './core/WalletManager';

// Validation utilities
export * from './core/validation';

// Types
export * from './types';

// Wallet implementations
export { InAppWallet } from './wallets/inapp';

// Storage utilities
export * from './utils/storage';

// Crypto utilities  
export * from './utils/crypto';

// Re-export commonly used Starknet types for convenience
export type { Call, CallData, Account, RpcProvider } from 'starknet';