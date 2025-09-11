import { RpcProvider, Call } from 'starknet';
export { Account, Call, CallData, RpcProvider } from 'starknet';

/**
 * Core configuration types for the Aegis SDK
 */
/**
 * Developer-provided configuration - only appId is required
 */
interface AegisConfig {
    /** Unique application identifier provided by Aegis */
    appId: string;
    /** Target network - defaults to 'sepolia' */
    network?: 'mainnet' | 'sepolia' | 'devnet';
    /** Enable biometric authentication on mobile - defaults to true */
    enableBiometrics?: boolean;
    /** Enable usage analytics - defaults to true */
    enableAnalytics?: boolean;
    /** Custom RPC URL for devnet or private networks */
    customRpcUrl?: string;
    /** Maximum transaction retry attempts - defaults to 3 */
    maxTransactionRetries?: number;
}
/**
 * Internal configuration populated by SDK after backend communication
 */
interface InternalAegisConfig extends AegisConfig {
    /** AVNU paymaster API key retrieved from Aegis backend */
    paymasterApiKey: string;
    /** Aegis backend service URL */
    backendUrl: string;
    /** Analytics endpoint for usage tracking */
    analyticsEndpoint: string;
    /** Networks supported by this app */
    supportedNetworks: string[];
    /** App metadata from backend */
    appMetadata: {
        name: string;
        version: string;
        features: string[];
    };
}

/**
 * Error handling types and classes
 */
/**
 * Error type classification for proper handling
 */
declare enum AegisErrorType {
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    WALLET_ERROR = "WALLET_ERROR",
    TRANSACTION_ERROR = "TRANSACTION_ERROR",
    STORAGE_ERROR = "STORAGE_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    BACKEND_ERROR = "BACKEND_ERROR"
}
/**
 * Specific error codes for detailed error handling
 */
declare enum AegisErrorCode {
    INVALID_APP_ID = "INVALID_APP_ID",
    MISSING_REQUIRED_CONFIG = "MISSING_REQUIRED_CONFIG",
    UNSUPPORTED_NETWORK = "UNSUPPORTED_NETWORK",
    PROVIDER_CONNECTION_FAILED = "PROVIDER_CONNECTION_FAILED",
    RPC_REQUEST_FAILED = "RPC_REQUEST_FAILED",
    NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
    WALLET_NOT_FOUND = "WALLET_NOT_FOUND",
    INVALID_PRIVATE_KEY = "INVALID_PRIVATE_KEY",
    ACCOUNT_NOT_DEPLOYED = "ACCOUNT_NOT_DEPLOYED",
    INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
    TRANSACTION_FAILED = "TRANSACTION_FAILED",
    TRANSACTION_REVERTED = "TRANSACTION_REVERTED",
    NONCE_ERROR = "NONCE_ERROR",
    MAX_RETRIES_EXCEEDED = "MAX_RETRIES_EXCEEDED",
    STORAGE_ACCESS_DENIED = "STORAGE_ACCESS_DENIED",
    KEY_NOT_FOUND = "KEY_NOT_FOUND",
    ENCRYPTION_FAILED = "ENCRYPTION_FAILED",
    BIOMETRIC_UNAVAILABLE = "BIOMETRIC_UNAVAILABLE",
    BIOMETRIC_FAILED = "BIOMETRIC_FAILED",
    BACKEND_UNREACHABLE = "BACKEND_UNREACHABLE",
    INVALID_API_RESPONSE = "INVALID_API_RESPONSE",
    PAYMASTER_ERROR = "PAYMASTER_ERROR"
}
/**
 * Custom error class with enhanced error information
 */
declare class AegisError extends Error {
    readonly type: AegisErrorType;
    readonly code: AegisErrorCode;
    readonly details?: any;
    readonly recoverable: boolean;
    readonly timestamp: number;
    constructor(type: AegisErrorType, code: AegisErrorCode, message: string, recoverable?: boolean, details?: any);
    /**
     * Convert error to JSON for logging/reporting
     */
    toJSON(): {
        name: string;
        type: AegisErrorType;
        code: AegisErrorCode;
        message: string;
        recoverable: boolean;
        timestamp: number;
        details: any;
        stack: string | undefined;
    };
    /**
     * Create a user-friendly error message
     */
    getUserMessage(): string;
}
/**
 * Factory functions for creating specific errors
 */
declare class AegisErrorFactory {
    static configurationError(code: AegisErrorCode, message: string, details?: any): AegisError;
    static networkError(code: AegisErrorCode, message: string, recoverable?: boolean, details?: any): AegisError;
    static walletError(code: AegisErrorCode, message: string, recoverable?: boolean, details?: any): AegisError;
    static transactionError(code: AegisErrorCode, message: string, recoverable?: boolean, details?: any): AegisError;
    static storageError(code: AegisErrorCode, message: string, recoverable?: boolean, details?: any): AegisError;
    static authenticationError(code: AegisErrorCode, message: string, recoverable?: boolean, details?: any): AegisError;
    static backendError(code: AegisErrorCode, message: string, recoverable?: boolean, details?: any): AegisError;
}

/**
 * Network and provider management for Starknet connections
 */

/**
 * Network configuration for different Starknet networks
 */
interface NetworkConfig {
    name: string;
    rpcUrl: string;
    chainId?: string;
    specVersion: string;
}
/**
 * Manages network connections and Starknet providers
 */
declare class NetworkManager {
    private providers;
    private currentNetwork;
    private config;
    private networkConfigs;
    constructor(config: InternalAegisConfig);
    /**
     * Initialize the network manager and create providers
     */
    initialize(): Promise<void>;
    /**
     * Get provider for the current network or a specific network
     */
    getProvider(network?: string): RpcProvider;
    /**
     * Switch to a different network
     */
    switchNetwork(network: string): Promise<void>;
    /**
     * Get the current network name
     */
    getCurrentNetwork(): string;
    /**
     * Get list of supported networks
     */
    getSupportedNetworks(): string[];
    /**
     * Get network configuration for a specific network
     */
    getNetworkConfig(network: string): NetworkConfig | undefined;
    /**
     * Test if a network is available
     */
    isNetworkAvailable(network: string): Promise<boolean>;
    /**
     * Initialize network configurations
     */
    private initializeNetworkConfigs;
    /**
     * Create a provider for a specific network
     */
    private createProvider;
    /**
     * Test provider connection by making a simple call
     */
    private testProviderConnection;
    /**
     * Refresh all provider connections
     */
    refreshConnections(): Promise<void>;
    /**
     * Cleanup resources
     */
    destroy(): void;
}

/**
 * Core wallet types and interfaces
 */

/**
 * Transaction execution options
 */
interface ExecuteOptions {
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
interface TransactionResult {
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
interface TokenBalance {
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
interface AegisWallet {
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
interface WalletConnectionData {
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
interface KeyMetadata {
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

/**
 * Storage adapter interfaces for cross-platform compatibility
 */
/**
 * Interface for secure storage (private keys, sensitive data)
 */
interface SecureStorageAdapter {
    /**
     * Store an item securely
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Retrieve an item from secure storage
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Remove an item from secure storage
     */
    removeItem(key: string): Promise<void>;
    /**
     * Check if an item exists in secure storage
     */
    hasItem(key: string): Promise<boolean>;
    /**
     * Get all keys from secure storage (filtered by prefix if provided)
     */
    getAllKeys(prefix?: string): Promise<string[]>;
    /**
     * Clear all items from secure storage (optionally filtered by prefix)
     */
    clear(prefix?: string): Promise<void>;
}
/**
 * Interface for async storage (metadata, cache, non-sensitive data)
 */
interface AsyncStorageAdapter {
    /**
     * Store an item in async storage
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Retrieve an item from async storage
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Remove an item from async storage
     */
    removeItem(key: string): Promise<void>;
    /**
     * Check if an item exists in async storage
     */
    hasItem(key: string): Promise<boolean>;
    /**
     * Get all keys from async storage (filtered by prefix if provided)
     */
    getAllKeys(prefix?: string): Promise<string[]>;
    /**
     * Clear all items from async storage (optionally filtered by prefix)
     */
    clear(prefix?: string): Promise<void>;
    /**
     * Get multiple items at once
     */
    multiGet(keys: string[]): Promise<Array<[string, string | null]>>;
    /**
     * Set multiple items at once
     */
    multiSet(keyValuePairs: Array<[string, string]>): Promise<void>;
    /**
     * Remove multiple items at once
     */
    multiRemove(keys: string[]): Promise<void>;
}
/**
 * Storage capabilities detection
 */
interface StorageCapabilities {
    /** Can store data securely (encrypted) */
    hasSecureStorage: boolean;
    /** Can store data persistently */
    hasPersistentStorage: boolean;
    /** Supports biometric authentication */
    supportsBiometrics: boolean;
    /** Maximum item size in bytes */
    maxItemSize?: number;
    /** Maximum total storage size in bytes */
    maxTotalSize?: number;
    /** Platform-specific features */
    platformFeatures: string[];
}

/**
 * Unified storage manager with platform detection and key organization
 */

/**
 * Unified storage manager that handles both secure and async storage
 */
declare class StorageManager {
    private secureStorage;
    private asyncStorage;
    private config;
    private capabilities;
    constructor(config: InternalAegisConfig);
    /**
     * Initialize storage manager and detect capabilities
     */
    initialize(): Promise<void>;
    /**
     * Store a private key securely
     */
    storePrivateKey(privateKey: string, network: string, appId: string, accountType: string, address: string, withBiometrics?: boolean): Promise<void>;
    /**
     * Retrieve a private key
     */
    getPrivateKey(network: string, appId: string, accountType: string, address: string, withBiometrics?: boolean): Promise<string | null>;
    /**
     * Remove a private key
     */
    removePrivateKey(network: string, appId: string, accountType: string, address: string): Promise<void>;
    /**
     * Get available keys for an app
     */
    getAvailableKeys(appId: string): Promise<KeyMetadata[]>;
    /**
     * Store app configuration
     */
    storeAppConfig(appId: string, config: any): Promise<void>;
    /**
     * Get app configuration
     */
    getAppConfig(appId: string): Promise<any>;
    /**
     * Store wallet metadata
     */
    storeWalletMetadata(appId: string, address: string, metadata: any): Promise<void>;
    /**
     * Get wallet metadata
     */
    getWalletMetadata(appId: string, address: string): Promise<any>;
    /**
     * Store biometric settings
     */
    storeBiometricSettings(appId: string, settings: any): Promise<void>;
    /**
     * Get biometric settings
     */
    getBiometricSettings(appId: string): Promise<any>;
    /**
     * Clear all data for an app
     */
    clearAppData(appId: string): Promise<void>;
    /**
     * Get storage capabilities
     */
    getCapabilities(): StorageCapabilities | null;
    /**
     * Check if biometric authentication is available
     */
    isBiometricAvailable(): Promise<boolean>;
    /**
     * Add key to available keys list
     */
    private addToAvailableKeys;
    /**
     * Remove key from available keys list
     */
    private removeFromAvailableKeys;
    /**
     * Detect platform and capabilities
     */
    private detectCapabilities;
    /**
     * Test storage functionality
     */
    private testStorage;
    /**
     * Detect if running in React Native
     */
    private isReactNative;
    /**
     * Get storage usage statistics
     */
    getStorageUsage(): Promise<{
        secure: any;
        async: any;
    }>;
}

/**
 * Key management utilities for secure key generation and handling
 */

/**
 * Key generation options
 */
interface KeyGenerationOptions {
    /** Use secure random number generation (default: true) */
    useSecureRandom?: boolean;
    /** Validate generated key (default: true) */
    validateKey?: boolean;
}
/**
 * Key import options
 */
interface KeyImportOptions {
    /** Validate imported key format (default: true) */
    validateKey?: boolean;
    /** Normalize key format (default: true) */
    normalizeKey?: boolean;
}
/**
 * Manages cryptographic keys for wallet operations
 */
declare class KeyManager {
    private storageManager?;
    constructor(storageManager?: StorageManager);
    /**
     * Generate a cryptographically secure private key
     */
    generatePrivateKey(options?: KeyGenerationOptions): string;
    /**
     * Import a private key with validation and normalization
     */
    importPrivateKey(privateKey: string, options?: KeyImportOptions): string;
    /**
     * Store a private key securely
     */
    storePrivateKey(privateKey: string, appId: string, network: string, accountType: string, address: string, options?: {
        withBiometrics?: boolean;
        name?: string;
    }): Promise<void>;
    /**
     * Retrieve a private key from secure storage
     */
    getPrivateKey(appId: string, network: string, accountType: string, address: string, withBiometrics?: boolean): Promise<string | null>;
    /**
     * Remove a private key from storage
     */
    removePrivateKey(appId: string, network: string, accountType: string, address: string): Promise<void>;
    /**
     * Get all available keys for an app
     */
    getAvailableKeys(appId: string): Promise<KeyMetadata[]>;
    /**
     * Check if a key exists in storage
     */
    hasKey(appId: string, network: string, accountType: string, address: string): Promise<boolean>;
    /**
     * Generate multiple private keys at once
     */
    generateMultipleKeys(count: number, options?: KeyGenerationOptions): string[];
    /**
     * Validate key derivation path for HD wallets (future feature)
     */
    validateDerivationPath(path: string): boolean;
    /**
     * Generate a mnemonic phrase (future feature)
     */
    generateMnemonic(): string;
    /**
     * Convert mnemonic to private key (future feature)
     */
    mnemonicToPrivateKey(mnemonic: string, derivationPath?: string): string;
    /**
     * Generate private key using Web Crypto API or fallback
     */
    private generatePrivateKeyWeb;
    /**
     * Check if running in Node.js environment
     */
    private isNodeEnvironment;
    /**
     * Get entropy quality assessment
     */
    getEntropyQuality(): {
        source: string;
        quality: 'high' | 'medium' | 'low';
    };
    /**
     * Clear all keys for an app (use with caution)
     */
    clearAllKeys(appId: string): Promise<void>;
}

/**
 * React Native implementation of secure storage using expo-secure-store
 */

/**
 * React Native secure storage implementation
 */
declare class ReactNativeSecureStorage implements SecureStorageAdapter {
    private SecureStore;
    private LocalAuthentication;
    constructor();
    /**
     * Store an item securely
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Retrieve an item from secure storage
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Remove an item from secure storage
     */
    removeItem(key: string): Promise<void>;
    /**
     * Check if an item exists in secure storage
     */
    hasItem(key: string): Promise<boolean>;
    /**
     * Get all keys from secure storage
     * Note: expo-secure-store doesn't provide a way to list all keys
     * We need to track keys separately in async storage
     */
    getAllKeys(prefix?: string): Promise<string[]>;
    /**
     * Clear all items from secure storage
     * Note: Since we can't enumerate keys, this method has limited functionality
     */
    clear(_prefix?: string): Promise<void>;
    /**
     * Store an item with biometric authentication
     */
    setItemWithBiometrics(key: string, value: string): Promise<void>;
    /**
     * Retrieve an item with biometric authentication
     */
    getItemWithBiometrics(key: string): Promise<string | null>;
    /**
     * Check if biometric authentication is available
     */
    isBiometricAvailable(): Promise<boolean>;
    /**
     * Get available biometric authentication types
     */
    getBiometricTypes(): Promise<string[]>;
    /**
     * Get storage capabilities
     */
    static getCapabilities(): Promise<StorageCapabilities>;
}

/**
 * React Native implementation of async storage
 */

/**
 * React Native async storage implementation using @react-native-async-storage/async-storage
 */
declare class ReactNativeAsyncStorage implements AsyncStorageAdapter {
    private AsyncStorage;
    private prefix;
    constructor();
    /**
     * Store an item in async storage
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Retrieve an item from async storage
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Remove an item from async storage
     */
    removeItem(key: string): Promise<void>;
    /**
     * Check if an item exists in async storage
     */
    hasItem(key: string): Promise<boolean>;
    /**
     * Get all keys from async storage
     */
    getAllKeys(prefix?: string): Promise<string[]>;
    /**
     * Clear all items from async storage
     */
    clear(prefix?: string): Promise<void>;
    /**
     * Get multiple items at once
     */
    multiGet(keys: string[]): Promise<Array<[string, string | null]>>;
    /**
     * Set multiple items at once
     */
    multiSet(keyValuePairs: Array<[string, string]>): Promise<void>;
    /**
     * Remove multiple items at once
     */
    multiRemove(keys: string[]): Promise<void>;
    /**
     * Merge an item with existing value (React Native AsyncStorage feature)
     */
    mergeItem(key: string, value: string): Promise<void>;
    /**
     * Merge multiple items at once
     */
    multiMerge(keyValuePairs: Array<[string, string]>): Promise<void>;
    /**
     * Get storage statistics (React Native specific)
     */
    getStorageSize(): Promise<{
        used: number;
        available: number;
    }>;
    /**
     * Flush pending operations (React Native specific)
     */
    flushGetRequests(): Promise<void>;
}

/**
 * Account address generation and deployment utilities following POW patterns
 */
/**
 * Supported account types with their class hashes
 */
declare const ACCOUNT_CLASS_HASHES: {
    readonly argentx: "0x01a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";
    readonly devnet: "0x02b31e19e45c06f29234e06e2ee98a9966479ba3067f8785ed972794fdb0065c";
};
/**
 * Account type for deployment
 */
type AccountType = keyof typeof ACCOUNT_CLASS_HASHES;
/**
 * Account deployment data
 */
interface AccountDeploymentData {
    classHash: string;
    salt: string;
    constructorCalldata: string[];
    contractAddress: string;
}
/**
 * Generate deterministic account address from private key
 * Following the exact pattern used in POW implementation
 */
declare function generateAccountAddress(privateKey: string, accountType?: AccountType): string;
/**
 * Get constructor calldata for account deployment
 */
declare function getConstructorCalldata(privateKey: string, accountType?: AccountType): string[];
/**
 * Get class hash for account type
 */
declare function getAccountClassHash(accountType: AccountType): string;
/**
 * Prepare deployment data for account
 */
declare function prepareDeploymentData(privateKey: string, accountType?: AccountType): AccountDeploymentData;
/**
 * Validate account class hash format
 */
declare function validateAccountClassHash(classHash: string): boolean;
/**
 * Get supported account types
 */
declare function getSupportedAccountTypes(): AccountType[];
/**
 * Check if account type is supported
 */
declare function isAccountTypeSupported(accountType: string): accountType is AccountType;
/**
 * Generate multiple account addresses from different private keys
 */
declare function generateMultipleAccountAddresses(privateKeys: string[], accountType?: AccountType): Array<{
    privateKey: string;
    address: string;
}>;
/**
 * Derive account address from public key (without private key)
 */
declare function deriveAddressFromPublicKey(publicKey: string, accountType?: AccountType): string;
/**
 * Extract public key from private key
 */
declare function getPublicKeyFromPrivateKey(privateKey: string): string;
/**
 * Validate deployment data consistency
 */
declare function validateDeploymentData(deploymentData: AccountDeploymentData): boolean;
/**
 * Calculate expected gas fee for account deployment
 */
declare function estimateDeploymentFee(accountType?: AccountType, network?: string): string;
/**
 * Check if an address matches expected format for account type
 */
declare function isValidAccountAddress(address: string, privateKey?: string, accountType?: AccountType): boolean;

/**
 * Configuration validation utilities
 */

/**
 * Validates the developer-provided configuration
 */
declare function validateAegisConfig(config: AegisConfig): void;
/**
 * Validates the internal configuration after backend expansion
 */
declare function validateInternalConfig(config: InternalAegisConfig): void;
/**
 * Expands user configuration with sensible defaults
 */
declare function expandConfigWithDefaults(config: AegisConfig): AegisConfig;
/**
 * Validates Starknet address format
 */
declare function validateStarknetAddress(address: string): boolean;
/**
 * Validates private key format
 */
declare function validatePrivateKey(privateKey: string): boolean;
/**
 * Normalizes private key format (ensures 0x prefix)
 */
declare function normalizePrivateKey(privateKey: string): string;
/**
 * Validates transaction call data
 */
declare function validateCallData(calls: any[]): void;

/**
 * In-app wallet implementation with client-side key management
 */

/**
 * In-app wallet implementation for client-side key management
 */
declare class InAppWallet implements AegisWallet {
    readonly type: "inapp";
    address: string;
    network: string;
    private privateKey;
    private account;
    private provider;
    private config;
    private storageManager;
    private keyManager;
    private accountType;
    private deployed;
    constructor(privateKey: string, network: string, provider: RpcProvider, config: InternalAegisConfig, storageManager: StorageManager, keyManager: KeyManager, accountType?: AccountType);
    /**
     * Create a new in-app wallet
     */
    static create(appId: string, network: string, provider: RpcProvider, config: InternalAegisConfig, storageManager: StorageManager, keyManager: KeyManager, accountType?: AccountType, options?: {
        withBiometrics?: boolean;
        name?: string;
    }): Promise<InAppWallet>;
    /**
     * Connect to existing wallet from stored key
     */
    static fromStoredKey(keyId: string, appId: string, network: string, provider: RpcProvider, config: InternalAegisConfig, storageManager: StorageManager, keyManager: KeyManager, accountType?: AccountType, withBiometrics?: boolean): Promise<InAppWallet>;
    /**
     * Execute transaction calls
     */
    execute(calls: Call[], options?: ExecuteOptions): Promise<TransactionResult>;
    /**
     * Sign a message with the wallet's private key
     */
    signMessage(message: string): Promise<string>;
    /**
     /**
     * Get ETH balance
     */
    getETHBalance(): Promise<string>;
    /**
     * Get ERC20 token balance
     */
    getERC20Balance(tokenAddress: string, decimals?: number): Promise<string>;
    /**
     * Deploy the account if not already deployed
     */
    deploy(): Promise<void>;
    /**
     * Check if account is deployed
     */
    isDeployed(): Promise<boolean>;
    /**
     * Disconnect and clear wallet state
     */
    disconnect(): Promise<void>;
    /**
     * Export private key (with proper security warning)
     */
    exportPrivateKey(): Promise<string>;
    /**
     * Get account public key
     */
    getPublicKey(): string;
    /**
     * Get account type
     */
    getAccountType(): AccountType;
    /**
     * Execute transaction directly (for devnet)
     */
    private executeDirectly;
    /**
     * Execute transaction with paymaster (gasless)
     */
    private executeWithPaymaster;
    /**
     * Deploy account to devnet
     */
    private deployToDevnet;
    /**
     * Deploy account with paymaster
     */
    private deployWithPaymaster;
    /**
     * Wait for transaction confirmation
     */
    private waitForTransaction;
    /**
     * Delay utility
     */
    private delay;
    /**
     * Get detailed token balance information
     */
    getTokenBalance(tokenAddress: string): Promise<TokenBalance>;
    /**
     * Update last used timestamp
     */
    private updateLastUsed;
}

/**
 * Manages wallet creation, connection, and lifecycle
 */
declare class WalletManager {
    private currentWallet;
    private config;
    private networkManager;
    private storageManager;
    private keyManager;
    constructor(config: InternalAegisConfig, networkManager: NetworkManager, storageManager: StorageManager, keyManager: KeyManager);
    /**
     * Initialize wallet manager
     */
    initialize(): Promise<void>;
    /**
     * Create a new in-app wallet
     */
    createInAppWallet(accountType?: AccountType, options?: {
        withBiometrics?: boolean;
        name?: string;
    }): Promise<InAppWallet>;
    /**
     * Connect to existing wallet using key metadata
     */
    connectWallet(keyMetadata: KeyMetadata, withBiometrics?: boolean): Promise<InAppWallet>;
    /**
     * Import wallet from private key
     */
    importWallet(privateKey: string, accountType?: AccountType, options?: {
        withBiometrics?: boolean;
        name?: string;
    }): Promise<InAppWallet>;
    /**
     * Get current wallet
     */
    getCurrentWallet(): AegisWallet | null;
    /**
     * Check if a wallet is currently connected
     */
    isConnected(): boolean;
    /**
     * Get all available wallets for this app
     */
    getAvailableWallets(): Promise<KeyMetadata[]>;
    /**
     * Remove a wallet from storage
     */
    removeWallet(keyMetadata: KeyMetadata): Promise<void>;
    /**
     * Disconnect current wallet
     */
    disconnect(): Promise<void>;
    /**
     * Switch to a different network
     */
    onNetworkChange(network: string): Promise<void>;
    /**
     * Get wallet connection data for restoration
     */
    private getWalletConnectionData;
    /**
     * Store last wallet information for reconnection
     */
    private storeLastWalletInfo;
    /**
     * Clear last wallet information
     */
    private clearLastWalletInfo;
    /**
     * Try to reconnect to last used wallet
     */
    private tryReconnectLastWallet;
    /**
     * Build key ID from metadata
     */
    private buildKeyId;
    /**
     * Check if biometric authentication is available
     */
    isBiometricAvailable(): Promise<boolean>;
    /**
     * Get storage capabilities
     */
    getStorageCapabilities(): StorageCapabilities | null;
    /**
     * Cleanup resources
     */
    destroy(): void;
}

/**
 * Main Aegis SDK class - unified entry point for all wallet functionality
 */

/**
 * Main SDK class providing unified access to all Aegis functionality
 */
declare class AegisSDK {
    private config;
    private backendClient;
    private networkManager;
    private storageManager;
    private keyManager;
    wallets: WalletManager | null;
    constructor(userConfig: AegisConfig);
    /**
     * Static factory method for creating and initializing SDK
     */
    static create(config: AegisConfig): Promise<AegisSDK>;
    /**
     * Initialize the SDK with backend configuration
     */
    initialize(userConfig: AegisConfig): Promise<void>;
    /**
     * Get current configuration
     */
    getConfig(): InternalAegisConfig | null;
    /**
     * Get network manager
     */
    getNetworkManager(): NetworkManager;
    /**
     * Get storage manager
     */
    getStorageManager(): StorageManager;
    /**
     * Get key manager
     */
    getKeyManager(): KeyManager;
    /**
     * Check if SDK is initialized
     */
    isInitialized(): boolean;
    /**
     * Switch to a different network
     */
    switchNetwork(network: string): Promise<void>;
    /**
     * Get current network
     */
    getCurrentNetwork(): string;
    /**
     * Get supported networks
     */
    getSupportedNetworks(): string[];
    /**
     * Send analytics event
     */
    sendAnalytics(eventType: string, eventData: Record<string, any>): Promise<void>;
    /**
     * Report error to backend
     */
    reportError(error: AegisError): Promise<void>;
    /**
     * Check backend health
     */
    checkBackendHealth(): Promise<boolean>;
    /**
     * Refresh network connections
     */
    refreshConnections(): Promise<void>;
    /**
     * Clear all app data (use with caution)
     */
    clearAllData(): Promise<void>;
    /**
     * Get storage usage statistics
     */
    getStorageUsage(): Promise<any>;
    /**
     * Destroy SDK instance and clean up resources
     */
    destroy(): void;
}

/**
 * Backend client for communicating with Aegis services
 */

/**
 * Configuration for backend client
 */
interface BackendClientConfig {
    baseUrl: string;
    timeout: number;
    retries: number;
    userAgent: string;
}
/**
 * Client for communicating with Aegis backend services
 */
declare class BackendClient {
    private config;
    constructor(config?: Partial<BackendClientConfig>);
    /**
     * Expand user configuration by fetching backend settings
     */
    expandConfiguration(userConfig: AegisConfig): Promise<InternalAegisConfig>;
    /**
     * Fetch app configuration from backend
     */
    private fetchAppConfiguration;
    /**
     * Send usage analytics to backend
     */
    sendAnalytics(analyticsEndpoint: string, appId: string, eventType: string, eventData: Record<string, any>): Promise<void>;
    /**
     * Report error to backend for monitoring
     */
    reportError(backendUrl: string, appId: string, error: AegisError): Promise<void>;
    /**
     * Make HTTP request with timeout and error handling
     */
    private makeRequest;
    /**
     * Map HTTP status codes to error codes
     */
    private mapHttpStatusToErrorCode;
    /**
     * Delay utility for retry logic
     */
    private delay;
    /**
     * Update backend client configuration
     */
    updateConfig(config: Partial<BackendClientConfig>): void;
    /**
     * Check if backend is reachable
     */
    healthCheck(): Promise<boolean>;
}

export { ACCOUNT_CLASS_HASHES, type AccountDeploymentData, type AccountType, type AegisConfig, AegisError, AegisErrorCode, AegisErrorFactory, AegisErrorType, AegisSDK, type AegisWallet, BackendClient, type ExecuteOptions, InAppWallet, type InternalAegisConfig, KeyManager, type KeyMetadata, NetworkManager, ReactNativeAsyncStorage, ReactNativeSecureStorage, StorageManager, type TokenBalance, type TransactionResult, type WalletConnectionData, WalletManager, deriveAddressFromPublicKey, estimateDeploymentFee, expandConfigWithDefaults, generateAccountAddress, generateMultipleAccountAddresses, getAccountClassHash, getConstructorCalldata, getPublicKeyFromPrivateKey, getSupportedAccountTypes, isAccountTypeSupported, isValidAccountAddress, normalizePrivateKey, prepareDeploymentData, validateAccountClassHash, validateAegisConfig, validateCallData, validateDeploymentData, validateInternalConfig, validatePrivateKey, validateStarknetAddress };
