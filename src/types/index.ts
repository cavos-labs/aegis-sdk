import { Account, Call } from 'starknet';

export type NetworkType = 'SN_MAINNET' | 'SN_SEPOLIA' | 'SN_DEVNET';
export type AccountType = 'argentX' | 'braavos' | 'devnet';
export type WalletMode = 'in-app' | 'social-login';

export interface WalletConfig {
  network: NetworkType;
  appName: string;
  rpcUrl?: string;
  paymasterApiKey?: string;
  paymasterBackendUrl?: string;
  maxRetries?: number;
  batchSize?: number;
  enableLogging?: boolean;

  // Wallet mode configuration (deprecated - both modes now available simultaneously)
  walletMode?: WalletMode;

  // Tracking configuration (also used for social login in social-login mode)
  appId: string;                            // Developer's app identifier (required) - used for both tracking and social login
  trackingApiUrl?: string;                  // Custom base URL (default: https://services.cavos.xyz) - used for both tracking and social login
  trackingTimeout?: number;                 // Request timeout in ms (default: 5000)
}

export interface WalletAccount {
  address: string;
  privateKey: string;
  accountType: AccountType;
  isDeployed: boolean;
  network: string;
}

export interface SocialWalletData {
  user_id: string;
  email: string;
  organization: {
    org_id: string;
    org_name: string;
  };
  wallet: {
    address: string;
    network: string;
  };
  authData: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  walletStatus?: {
    deploymentFailed?: boolean;
    message?: string;
  };
}

export interface TransactionResult {
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  effectiveGasPrice?: string;
  blockNumber?: number;
  blockHash?: string;
}

export interface ExecutionOptions {
  maxFee?: string;
  usePaymaster?: boolean;
  retries?: number;
  timeout?: number;
  nonce?: string;
}

export interface NFTToken {
  tokenId: string;
  contractAddress: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymasterConfig {
  apiKey?: string;
  backendUrl?: string;
  supportedNetworks: NetworkType[];
  maxGasPrice?: string;
}

export interface NetworkConfig {
  rpcUrl: string;
  chainId: string;
  specVersion: "0.8.1" | "0.7.1" | undefined;
  blockExplorer?: string;
  faucetUrl?: string;
}

export interface WalletContextValue {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: Account | null;
  address: string | null;
  network: string;
  
  // Account management
  generateAccount: () => Promise<string>;
  connectAccount: (privateKey: string) => Promise<void>;
  deployAccount: (privateKey?: string) => Promise<void>;
  disconnectAccount: () => void;
  exportPrivateKey: () => Promise<string | null>;
  
  // Transaction execution
  executeTransaction: (calls: Call[], options?: ExecutionOptions) => Promise<TransactionResult>;
  executeBatch: (calls: Call[], options?: ExecutionOptions) => Promise<TransactionResult>;
  addToQueue: (calls: Call[]) => void;
  
  // Contract interactions
  callContract: (address: string, method: string, args: any[]) => Promise<any>;
  estimateGas: (calls: Call[]) => Promise<string>;
  
  // Balance queries
  getETHBalance: (address?: string) => Promise<string>;
  getERC20Balance: (tokenAddress: string, decimals?: number, userAddress?: string) => Promise<string>;
  getERC721Tokens: (contractAddress: string, userAddress?: string) => Promise<NFTToken[]>;
  
  // Utilities
  waitForTransaction: (txHash: string) => Promise<boolean>;
  getTransactionStatus: (txHash: string) => Promise<'pending' | 'confirmed' | 'failed'>;
}

export abstract class WalletError extends Error {
  abstract code: string;
  abstract recoverable: boolean;
  
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NetworkError extends WalletError {
  code = 'NETWORK_ERROR';
  recoverable = true;
}

export class ValidationError extends WalletError {
  code = 'VALIDATION_ERROR';
  recoverable = false;
}

export class ExecutionError extends WalletError {
  code = 'EXECUTION_ERROR';
  recoverable = true;
}

export class UserRejectionError extends WalletError {
  code = 'USER_REJECTION';
  recoverable = false;
}

export class DeploymentError extends WalletError {
  code = 'DEPLOYMENT_ERROR';
  recoverable = true;
}

export class AuthenticationError extends WalletError {
  code = 'AUTHENTICATION_ERROR';
  recoverable = false;
}

export class TokenExpiredError extends WalletError {
  code = 'TOKEN_EXPIRED';
  recoverable = true;
}

export class SocialLoginError extends WalletError {
  code = 'SOCIAL_LOGIN_ERROR';
  recoverable = true;
}

// Tracking interfaces
export interface WalletTrackingData {
  app_id: string;
  address: string;
  network: "mainnet" | "sepolia";
  public_key?: string;
  user_id?: string;
}

export interface TransactionTrackingData {
  app_id: string;
  transaction_hash: string;
  network: "mainnet" | "sepolia";
}

export interface TrackingConfig {
  appId: string;
  baseUrl: string;                          // https://services.cavos.xyz
  enabled: boolean;
  timeout: number;
  endpoints: {
    wallet: string;                         // /api/v2/aegis/wallet
    transaction: string;                    // /api/v2/aegis/transaction
  };
}