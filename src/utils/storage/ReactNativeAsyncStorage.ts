/**
 * React Native implementation of async storage
 */

import { AsyncStorageAdapter } from './interfaces';
import { AegisError, AegisErrorCode, AegisErrorType } from '../../types/errors';

/**
 * React Native async storage implementation using @react-native-async-storage/async-storage
 */
export class ReactNativeAsyncStorage implements AsyncStorageAdapter {
  private AsyncStorage: any;
  private prefix = 'aegis:';

  constructor() {
    try {
      // Dynamically import React Native AsyncStorage
      this.AsyncStorage = require('@react-native-async-storage/async-storage').default;
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        '@react-native-async-storage/async-storage is required for React Native async storage'
      );
    }
  }

  /**
   * Store an item in async storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.AsyncStorage.setItem(this.prefix + key, value);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to store item: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Retrieve an item from async storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const result = await this.AsyncStorage.getItem(this.prefix + key);
      return result;
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to retrieve item: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Remove an item from async storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await this.AsyncStorage.removeItem(this.prefix + key);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to remove item: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Check if an item exists in async storage
   */
  async hasItem(key: string): Promise<boolean> {
    const item = await this.getItem(key);
    return item !== null;
  }

  /**
   * Get all keys from async storage
   */
  async getAllKeys(prefix?: string): Promise<string[]> {
    try {
      const allKeys = await this.AsyncStorage.getAllKeys();
      const fullPrefix = this.prefix + (prefix || '');
      
      const filteredKeys = allKeys
        .filter((key: string) => key.startsWith(fullPrefix))
        .map((key: string) => key.substring(this.prefix.length)); // Remove our internal prefix
      
      return filteredKeys;
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to get keys: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Clear all items from async storage
   */
  async clear(prefix?: string): Promise<void> {
    try {
      if (prefix) {
        const keys = await this.getAllKeys(prefix);
        await this.multiRemove(keys);
      } else {
        // Remove all items with our prefix
        const allKeys = await this.AsyncStorage.getAllKeys();
        const keysToRemove = allKeys.filter((key: string) => key.startsWith(this.prefix));
        
        if (keysToRemove.length > 0) {
          await this.AsyncStorage.multiRemove(keysToRemove);
        }
      }
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to clear storage: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Get multiple items at once
   */
  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    try {
      const prefixedKeys = keys.map(key => this.prefix + key);
      const results = await this.AsyncStorage.multiGet(prefixedKeys);
      
      // Remove prefix from returned keys
      return results.map(([key, value]: [string, string | null]) => [
        key.substring(this.prefix.length),
        value
      ]);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to get multiple items: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Set multiple items at once
   */
  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      const prefixedPairs = keyValuePairs.map(([key, value]) => [this.prefix + key, value]);
      await this.AsyncStorage.multiSet(prefixedPairs);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to set multiple items: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Remove multiple items at once
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      const prefixedKeys = keys.map(key => this.prefix + key);
      await this.AsyncStorage.multiRemove(prefixedKeys);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to remove multiple items: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Merge an item with existing value (React Native AsyncStorage feature)
   */
  async mergeItem(key: string, value: string): Promise<void> {
    try {
      await this.AsyncStorage.mergeItem(this.prefix + key, value);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to merge item: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Merge multiple items at once
   */
  async multiMerge(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      const prefixedPairs = keyValuePairs.map(([key, value]) => [this.prefix + key, value]);
      await this.AsyncStorage.multiMerge(prefixedPairs);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to merge multiple items: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Get storage statistics (React Native specific)
   */
  async getStorageSize(): Promise<{ used: number; available: number }> {
    try {
      // Get all keys for size calculation
      const allKeys = await this.AsyncStorage.getAllKeys();
      const ourKeys = allKeys.filter((key: string) => key.startsWith(this.prefix));
      
      if (ourKeys.length === 0) {
        return { used: 0, available: 1024 * 1024 * 6 }; // Assume ~6MB available
      }

      // Get all our items to calculate size
      const items = await this.AsyncStorage.multiGet(ourKeys);
      
      let used = 0;
      items.forEach(([key, value]: [string, string | null]) => {
        used += key.length + (value ? value.length : 0);
      });

      // React Native AsyncStorage typically has ~6MB limit
      const estimated_available = (1024 * 1024 * 6) - used;
      
      return {
        used: used * 2, // UTF-16 encoding approximately doubles byte size
        available: Math.max(0, estimated_available),
      };
    } catch (error) {
      return { used: 0, available: 0 };
    }
  }

  /**
   * Flush pending operations (React Native specific)
   */
  async flushGetRequests(): Promise<void> {
    try {
      await this.AsyncStorage.flushGetRequests();
    } catch (error) {
      // Flush failures are not critical
      console.warn('Failed to flush AsyncStorage requests:', error);
    }
  }
}