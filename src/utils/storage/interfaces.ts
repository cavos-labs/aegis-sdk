/**
 * Storage adapter interfaces for cross-platform compatibility
 */

/**
 * Interface for secure storage (private keys, sensitive data)
 */
export interface SecureStorageAdapter {
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
export interface AsyncStorageAdapter {
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
export interface StorageCapabilities {
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