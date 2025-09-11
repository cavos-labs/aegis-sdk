/**
 * Core wallet types and interfaces
 */

import type { Call } from 'starknet';

/**
 * Transaction execution options
 */
export interface ExecuteOptions {
  /** Number of retry attempts - defaults to SDK configuration */
  retries?: number;
  
  /** Maximum fee for transaction - defaults to calculated value */
  maxFee?: string;
  
  /** Specific nonce to use - defaults to next available */
  nonce?: number;
  
  /** Require biometric authentication before execution */
  requireBiometric?: boolean;
}

/**
 * Transaction execution result
 */
export interface TransactionResult {
  /** Transaction hash on Starknet */
  transaction_hash: string;
  
  /** Transaction status if available */
  status?: 'pending' | 'confirmed' | 'failed';
  
  /** Block number if transaction is confirmed */
  block_number?: number;
  
  /** Gas fees consumed */
  actual_fee?: string;
}

/**
 * Token balance information
 */
export interface TokenBalance {
  /** Token contract address */
  address: string;
  
  /** Token symbol (e.g., 'ETH', 'USDC') */
  symbol: string;
  
  /** Token name */
  name: string;
  
  /** Number of decimal places */
  decimals: number;
  
  /** Raw balance amount */
  balance: string;
  
  /** Formatted balance for display */
  formatted: string;
}

/**
 * Unified wallet interface for all wallet types
 */
export interface AegisWallet {
  /** Wallet type identifier */
  readonly type: 'inapp';
  
  /** Starknet account address */
  address: string;
  
  /** Network this wallet is connected to */
  network: string;
  
  /** Execute transaction calls */
  execute(calls: Call[], options?: ExecuteOptions): Promise<TransactionResult>;
  
  /** Sign a message with the wallet's private key */
  signMessage(message: string): Promise<string>;
  
  /** Get ETH balance */
  getETHBalance(): Promise<string>;
  
  /** Get ERC20 token balance */
  getERC20Balance(tokenAddress: string, decimals?: number): Promise<string>;
  
  /** Deploy the account if not already deployed */
  deploy(): Promise<void>;
  
  /** Check if account is deployed */
  isDeployed(): Promise<boolean>;
  
  /** Disconnect and clear wallet state */
  disconnect(): Promise<void>;
  
  /** Export private key (in-app wallets only) */
  exportPrivateKey(): Promise<string>;
}

/**
 * Wallet connection data for restoration
 */
export interface WalletConnectionData {
  /** Wallet type */
  type: 'inapp';
  
  /** Storage key identifier */
  keyId: string;
  
  /** Network */
  network: string;
  
  /** Account address */
  address: string;
  
  /** Metadata */
  metadata: {
    appId: string;
    accountType: string;
    createdAt: number;
  };
}

/**
 * Key metadata for organization and management
 */
export interface KeyMetadata {
  /** Application that owns this key */
  appId: string;
  
  /** Network this key is for */
  network: string;
  
  /** Account type (e.g., 'argentx') */
  accountType: string;
  
  /** Generated account address */
  address: string;
  
  /** Timestamp when key was created */
  createdAt: number;
  
  /** Optional display name */
  name?: string;
}