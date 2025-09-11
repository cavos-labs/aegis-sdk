/**
 * React Native implementation of secure storage using expo-secure-store
 */

import { SecureStorageAdapter, StorageCapabilities } from './interfaces';
import { AegisError, AegisErrorCode, AegisErrorType } from '../../types/errors';

/**
 * React Native secure storage implementation
 */
export class ReactNativeSecureStorage implements SecureStorageAdapter {
  private SecureStore: any;
  private LocalAuthentication: any;

  constructor() {
    try {
      // Dynamically import React Native modules
      this.SecureStore = require('expo-secure-store');
      this.LocalAuthentication = require('expo-local-authentication');
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'expo-secure-store is required for React Native secure storage'
      );
    }
  }

  /**
   * Store an item securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const options = {
        requireAuthentication: false, // We handle biometrics at the wallet level
        keychainService: 'aegis-sdk',
      };

      await this.SecureStore.setItemAsync(key, value, options);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.ENCRYPTION_FAILED,
        `Failed to store item securely: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Retrieve an item from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const options = {
        requireAuthentication: false,
        keychainService: 'aegis-sdk',
      };

      const result = await this.SecureStore.getItemAsync(key, options);
      return result;
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.KEY_NOT_FOUND,
        `Failed to retrieve item from secure storage: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Remove an item from secure storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      const options = {
        requireAuthentication: false,
        keychainService: 'aegis-sdk',
      };

      await this.SecureStore.deleteItemAsync(key, options);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to remove item from secure storage: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Check if an item exists in secure storage
   */
  async hasItem(key: string): Promise<boolean> {
    const item = await this.getItem(key);
    return item !== null;
  }

  /**
   * Get all keys from secure storage
   * Note: expo-secure-store doesn't provide a way to list all keys
   * We need to track keys separately in async storage
   */
  async getAllKeys(prefix?: string): Promise<string[]> {
    // This is a limitation of secure storage on mobile - we can't enumerate keys
    // In practice, we track keys in async storage metadata
    throw new AegisError(
      AegisErrorType.STORAGE_ERROR,
      AegisErrorCode.STORAGE_ACCESS_DENIED,
      'Cannot enumerate secure storage keys on React Native. Use StorageManager.getAvailableKeys() instead.'
    );
  }

  /**
   * Clear all items from secure storage
   * Note: Since we can't enumerate keys, this method has limited functionality
   */
  async clear(_prefix?: string): Promise<void> {
    throw new AegisError(
      AegisErrorType.STORAGE_ERROR,
      AegisErrorCode.STORAGE_ACCESS_DENIED,
      'Cannot clear secure storage on React Native without key enumeration. Use StorageManager.clearAll() instead.'
    );
  }

  /**
   * Store an item with biometric authentication
   */
  async setItemWithBiometrics(key: string, value: string): Promise<void> {
    try {
      // Check if biometrics are available
      const hasHardware = await this.LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await this.LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        throw new AegisError(
          AegisErrorType.AUTHENTICATION_ERROR,
          AegisErrorCode.BIOMETRIC_UNAVAILABLE,
          'Biometric authentication is not available or not set up'
        );
      }

      const options = {
        requireAuthentication: true,
        authenticationPrompt: 'Authenticate to store your wallet key securely',
        keychainService: 'aegis-sdk-biometric',
      };

      await this.SecureStore.setItemAsync(key, value, options);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      
      throw new AegisError(
        AegisErrorType.AUTHENTICATION_ERROR,
        AegisErrorCode.BIOMETRIC_FAILED,
        `Biometric storage failed: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Retrieve an item with biometric authentication
   */
  async getItemWithBiometrics(key: string): Promise<string | null> {
    try {
      const options = {
        requireAuthentication: true,
        authenticationPrompt: 'Authenticate to access your wallet key',
        keychainService: 'aegis-sdk-biometric',
      };

      const result = await this.SecureStore.getItemAsync(key, options);
      return result;
    } catch (error) {
      throw new AegisError(
        AegisErrorType.AUTHENTICATION_ERROR,
        AegisErrorCode.BIOMETRIC_FAILED,
        `Biometric retrieval failed: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await this.LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await this.LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  }

  /**
   * Get available biometric authentication types
   */
  async getBiometricTypes(): Promise<string[]> {
    try {
      const types = await this.LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map((type: number) => {
        switch (type) {
          case 1: return 'fingerprint';
          case 2: return 'facial_recognition';
          case 3: return 'iris';
          default: return 'unknown';
        }
      });
    } catch {
      return [];
    }
  }

  /**
   * Get storage capabilities
   */
  static async getCapabilities(): Promise<StorageCapabilities> {
    let supportsBiometrics = false;
    let platformFeatures = ['expo-secure-store'];

    try {
      const LocalAuth = require('expo-local-authentication');
      const hasHardware = await LocalAuth.hasHardwareAsync();
      const isEnrolled = await LocalAuth.isEnrolledAsync();
      supportsBiometrics = hasHardware && isEnrolled;
      
      if (hasHardware) {
        platformFeatures.push('biometric-hardware');
      }
      if (isEnrolled) {
        platformFeatures.push('biometric-enrolled');
      }
    } catch {
      // Biometric support not available
    }

    return {
      hasSecureStorage: true,
      hasPersistentStorage: true,
      supportsBiometrics,
      maxItemSize: 2048, // SecureStore has a 2KB limit per item
      platformFeatures,
    };
  }
}