/**
 * Unified storage manager with platform detection and key organization
 */

import type { InternalAegisConfig } from '../../types/config';
import type { KeyMetadata } from '../../types/wallet';
import { AegisError, AegisErrorCode, AegisErrorType } from '../../types/errors';

import type { SecureStorageAdapter, AsyncStorageAdapter, StorageCapabilities } from './interfaces';
import { WebSecureStorage, WebAsyncStorage } from './index';

/**
 * Storage key patterns for organization
 */
const STORAGE_KEYS = {
  // Private key storage: "network.appId.accountType.address"
  privateKey: (network: string, appId: string, accountType: string, address: string) => 
    `${network}.${appId}.${accountType}.${address}`,
    
  // Available keys metadata: "keys.appId"
  availableKeys: (appId: string) => `keys.${appId}`,
  
  // App configuration cache: "config.appId"
  appConfig: (appId: string) => `config.${appId}`,
  
  // Network preferences: "network.appId"
  networkSettings: (appId: string) => `network.${appId}`,
  
  // Wallet metadata: "wallet.appId.address"
  walletMetadata: (appId: string, address: string) => `wallet.${appId}.${address}`,
  
  // Biometric settings: "biometric.appId"
  biometricSettings: (appId: string) => `biometric.${appId}`,
} as const;

/**
 * Unified storage manager that handles both secure and async storage
 */
export class StorageManager {
  private secureStorage: SecureStorageAdapter;
  private asyncStorage: AsyncStorageAdapter;
  private config: InternalAegisConfig;
  private capabilities: StorageCapabilities | null = null;

  constructor(config: InternalAegisConfig) {
    this.config = config;
    
    // Initialize storage adapters based on platform
    if (this.isReactNative()) {
      // Dynamically import React Native modules
      const { ReactNativeSecureStorage } = require('./ReactNativeSecureStorage');
      const { ReactNativeAsyncStorage } = require('./ReactNativeAsyncStorage');
      this.secureStorage = new ReactNativeSecureStorage();
      this.asyncStorage = new ReactNativeAsyncStorage();
    } else {
      this.secureStorage = new WebSecureStorage();
      this.asyncStorage = new WebAsyncStorage();
    }
  }

  /**
   * Initialize storage manager and detect capabilities
   */
  async initialize(): Promise<void> {
    try {
      // Detect storage capabilities
      this.capabilities = await this.detectCapabilities();
      
      // Verify storage is working
      await this.testStorage();
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to initialize storage: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Store a private key securely
   */
  async storePrivateKey(
    privateKey: string,
    network: string,
    appId: string,
    accountType: string,
    address: string,
    withBiometrics: boolean = false
  ): Promise<void> {
    const key = STORAGE_KEYS.privateKey(network, appId, accountType, address);
    
    try {
      if (withBiometrics && this.capabilities?.supportsBiometrics) {
        // Use biometric storage if available and requested
        if (this.isReactNative() && 'setItemWithBiometrics' in this.secureStorage) {
          await (this.secureStorage as any).setItemWithBiometrics(key, privateKey);
        } else {
          await this.secureStorage.setItem(key, privateKey);
        }
      } else {
        await this.secureStorage.setItem(key, privateKey);
      }

      // Update available keys metadata
      await this.addToAvailableKeys(appId, {
        appId,
        network,
        accountType,
        address,
        createdAt: Date.now(),
      });
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.ENCRYPTION_FAILED,
        `Failed to store private key: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Retrieve a private key
   */
  async getPrivateKey(
    network: string,
    appId: string,
    accountType: string,
    address: string,
    withBiometrics: boolean = false
  ): Promise<string | null> {
    const key = STORAGE_KEYS.privateKey(network, appId, accountType, address);
    
    try {
      if (withBiometrics && this.capabilities?.supportsBiometrics) {
        // Use biometric retrieval if available and requested
        if (this.isReactNative() && 'getItemWithBiometrics' in this.secureStorage) {
          return await (this.secureStorage as any).getItemWithBiometrics(key);
        }
      }
      
      return await this.secureStorage.getItem(key);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.KEY_NOT_FOUND,
        `Failed to retrieve private key: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Remove a private key
   */
  async removePrivateKey(
    network: string,
    appId: string,
    accountType: string,
    address: string
  ): Promise<void> {
    const key = STORAGE_KEYS.privateKey(network, appId, accountType, address);
    
    try {
      await this.secureStorage.removeItem(key);
      
      // Remove from available keys metadata
      await this.removeFromAvailableKeys(appId, address);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to remove private key: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Get available keys for an app
   */
  async getAvailableKeys(appId: string): Promise<KeyMetadata[]> {
    try {
      const keysKey = STORAGE_KEYS.availableKeys(appId);
      const keysData = await this.asyncStorage.getItem(keysKey);
      
      if (!keysData) {
        return [];
      }
      
      const keys: KeyMetadata[] = JSON.parse(keysData);
      return keys;
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to get available keys: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Store app configuration
   */
  async storeAppConfig(appId: string, config: any): Promise<void> {
    try {
      const configKey = STORAGE_KEYS.appConfig(appId);
      await this.asyncStorage.setItem(configKey, JSON.stringify(config));
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to store app configuration: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Get app configuration
   */
  async getAppConfig(appId: string): Promise<any> {
    try {
      const configKey = STORAGE_KEYS.appConfig(appId);
      const configData = await this.asyncStorage.getItem(configKey);
      
      if (!configData) {
        return null;
      }
      
      return JSON.parse(configData);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to get app configuration: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Store wallet metadata
   */
  async storeWalletMetadata(appId: string, address: string, metadata: any): Promise<void> {
    try {
      const metadataKey = STORAGE_KEYS.walletMetadata(appId, address);
      await this.asyncStorage.setItem(metadataKey, JSON.stringify(metadata));
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to store wallet metadata: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Get wallet metadata
   */
  async getWalletMetadata(appId: string, address: string): Promise<any> {
    try {
      const metadataKey = STORAGE_KEYS.walletMetadata(appId, address);
      const metadataData = await this.asyncStorage.getItem(metadataKey);
      
      if (!metadataData) {
        return null;
      }
      
      return JSON.parse(metadataData);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to get wallet metadata: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Store biometric settings
   */
  async storeBiometricSettings(appId: string, settings: any): Promise<void> {
    try {
      const settingsKey = STORAGE_KEYS.biometricSettings(appId);
      await this.asyncStorage.setItem(settingsKey, JSON.stringify(settings));
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to store biometric settings: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Get biometric settings
   */
  async getBiometricSettings(appId: string): Promise<any> {
    try {
      const settingsKey = STORAGE_KEYS.biometricSettings(appId);
      const settingsData = await this.asyncStorage.getItem(settingsKey);
      
      if (!settingsData) {
        return { enabled: this.config.enableBiometrics };
      }
      
      return JSON.parse(settingsData);
    } catch (error) {
      return { enabled: this.config.enableBiometrics };
    }
  }

  /**
   * Clear all data for an app
   */
  async clearAppData(appId: string): Promise<void> {
    try {
      // Get all keys for this app
      const availableKeys = await this.getAvailableKeys(appId);
      
      // Remove all private keys
      await Promise.all(
        availableKeys.map(key => 
          this.removePrivateKey(key.network, key.appId, key.accountType, key.address)
        )
      );
      
      // Remove metadata
      const metadataKeysToRemove = [
        STORAGE_KEYS.availableKeys(appId),
        STORAGE_KEYS.appConfig(appId),
        STORAGE_KEYS.networkSettings(appId),
        STORAGE_KEYS.biometricSettings(appId),
      ];
      
      await Promise.all(
        metadataKeysToRemove.map(key => this.asyncStorage.removeItem(key))
      );
      
      // Remove wallet metadata
      await Promise.all(
        availableKeys.map(key => 
          this.asyncStorage.removeItem(STORAGE_KEYS.walletMetadata(appId, key.address))
        )
      );
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to clear app data: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Get storage capabilities
   */
  getCapabilities(): StorageCapabilities | null {
    return this.capabilities;
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    if (!this.capabilities?.supportsBiometrics) {
      return false;
    }
    
    if (this.isReactNative() && 'isBiometricAvailable' in this.secureStorage) {
      return await (this.secureStorage as any).isBiometricAvailable();
    }
    
    return false;
  }

  /**
   * Add key to available keys list
   */
  private async addToAvailableKeys(appId: string, keyMetadata: KeyMetadata): Promise<void> {
    const availableKeys = await this.getAvailableKeys(appId);
    
    // Remove existing entry if it exists
    const filteredKeys = availableKeys.filter(key => key.address !== keyMetadata.address);
    
    // Add new entry
    filteredKeys.push(keyMetadata);
    
    const keysKey = STORAGE_KEYS.availableKeys(appId);
    await this.asyncStorage.setItem(keysKey, JSON.stringify(filteredKeys));
  }

  /**
   * Remove key from available keys list
   */
  private async removeFromAvailableKeys(appId: string, address: string): Promise<void> {
    const availableKeys = await this.getAvailableKeys(appId);
    const filteredKeys = availableKeys.filter(key => key.address !== address);
    
    const keysKey = STORAGE_KEYS.availableKeys(appId);
    await this.asyncStorage.setItem(keysKey, JSON.stringify(filteredKeys));
  }

  /**
   * Detect platform and capabilities
   */
  private async detectCapabilities(): Promise<StorageCapabilities> {
    if (this.isReactNative()) {
      const { ReactNativeSecureStorage } = require('./ReactNativeSecureStorage');
      return await ReactNativeSecureStorage.getCapabilities();
    } else {
      return WebSecureStorage.getCapabilities();
    }
  }

  /**
   * Test storage functionality
   */
  private async testStorage(): Promise<void> {
    const testKey = 'aegis-test-key';
    const testValue = 'test-value';
    
    try {
      // Test async storage
      await this.asyncStorage.setItem(testKey, testValue);
      const retrievedValue = await this.asyncStorage.getItem(testKey);
      
      if (retrievedValue !== testValue) {
        throw new Error('Async storage test failed');
      }
      
      await this.asyncStorage.removeItem(testKey);
      
      // Test secure storage
      await this.secureStorage.setItem(testKey, testValue);
      const secureValue = await this.secureStorage.getItem(testKey);
      
      if (secureValue !== testValue) {
        throw new Error('Secure storage test failed');
      }
      
      await this.secureStorage.removeItem(testKey);
    } catch (error) {
      throw new Error(`Storage test failed: ${error}`);
    }
  }

  /**
   * Detect if running in React Native
   */
  private isReactNative(): boolean {
    return (
      typeof navigator !== 'undefined' && 
      navigator.product === 'ReactNative'
    ) || (
      typeof global !== 'undefined' && 
      // @ts-ignore
      global.__REACT_NATIVE__ === true
    );
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<{ secure: any; async: any }> {
    const stats = {
      secure: null,
      async: null,
    };

    try {
      // Get async storage usage if available
      if ('getStorageSize' in this.asyncStorage) {
        stats.async = await (this.asyncStorage as any).getStorageSize();
      }
    } catch (error) {
      console.warn('Failed to get storage usage:', error);
    }

    return stats;
  }
}