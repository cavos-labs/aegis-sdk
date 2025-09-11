/**
 * Web implementation of async storage using localStorage
 */

import { AsyncStorageAdapter } from './interfaces';
import { AegisError, AegisErrorCode, AegisErrorType } from '../../types/errors';

/**
 * Web-based async storage using localStorage
 */
export class WebAsyncStorage implements AsyncStorageAdapter {
  private prefix = 'aegis:';

  /**
   * Check if localStorage is available
   */
  private checkAvailability(): void {
    if (typeof localStorage === 'undefined') {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'localStorage is not available'
      );
    }
  }

  /**
   * Store an item in async storage
   */
  async setItem(key: string, value: string): Promise<void> {
    this.checkAvailability();
    
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to store item: ${error}`
      );
    }
  }

  /**
   * Retrieve an item from async storage
   */
  async getItem(key: string): Promise<string | null> {
    this.checkAvailability();
    
    try {
      return localStorage.getItem(this.prefix + key);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to retrieve item: ${error}`
      );
    }
  }

  /**
   * Remove an item from async storage
   */
  async removeItem(key: string): Promise<void> {
    this.checkAvailability();
    
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to remove item: ${error}`
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
    this.checkAvailability();
    
    try {
      const keys: string[] = [];
      const fullPrefix = this.prefix + (prefix || '');
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(fullPrefix)) {
          // Remove our internal prefix when returning
          keys.push(key.substring(this.prefix.length));
        }
      }
      
      return keys;
    } catch (error) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to get keys: ${error}`
      );
    }
  }

  /**
   * Clear all items from async storage
   */
  async clear(prefix?: string): Promise<void> {
    if (prefix) {
      const keys = await this.getAllKeys(prefix);
      await Promise.all(keys.map(key => this.removeItem(key)));
    } else {
      this.checkAvailability();
      
      try {
        // Remove all items with our prefix
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        throw new AegisError(
          AegisErrorType.STORAGE_ERROR,
          AegisErrorCode.STORAGE_ACCESS_DENIED,
          `Failed to clear storage: ${error}`
        );
      }
    }
  }

  /**
   * Get multiple items at once
   */
  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    const results: Array<[string, string | null]> = [];
    
    for (const key of keys) {
      const value = await this.getItem(key);
      results.push([key, value]);
    }
    
    return results;
  }

  /**
   * Set multiple items at once
   */
  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    for (const [key, value] of keyValuePairs) {
      await this.setItem(key, value);
    }
  }

  /**
   * Remove multiple items at once
   */
  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.removeItem(key);
    }
  }

  /**
   * Get estimated storage usage
   */
  async getStorageSize(): Promise<{ used: number; available: number }> {
    this.checkAvailability();
    
    try {
      let used = 0;
      
      // Calculate used space for our keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          used += key.length + (value ? value.length : 0);
        }
      }
      
      // localStorage typically has a 5-10MB limit
      // This is a rough estimate since browsers vary
      const estimated_available = (1024 * 1024 * 5) - used;
      
      return {
        used: used * 2, // UTF-16 encoding approximately doubles byte size
        available: Math.max(0, estimated_available * 2),
      };
    } catch (error) {
      return { used: 0, available: 0 };
    }
  }
}