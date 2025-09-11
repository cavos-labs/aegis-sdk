import { NetworkError, ValidationError } from '../types';

interface StorageAdapter {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class ExpoSecureStoreAdapter implements StorageAdapter {
  private secureStore: any;

  constructor() {
    try {
      this.secureStore = require('expo-secure-store');
    } catch (error) {
      throw new Error('expo-secure-store not available');
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.secureStore.setItemAsync(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await this.secureStore.getItemAsync(key);
  }

  async removeItem(key: string): Promise<void> {
    await this.secureStore.deleteItemAsync(key);
  }

  async clear(): Promise<void> {
    // Note: expo-secure-store doesn't have a clear method
    // Would need to track keys separately for full implementation
    throw new Error('Clear operation not supported by expo-secure-store');
  }
}

class AsyncStorageAdapter implements StorageAdapter {
  private asyncStorage: any;

  constructor() {
    try {
      this.asyncStorage = require('@react-native-async-storage/async-storage');
    } catch (error) {
      throw new Error('@react-native-async-storage/async-storage not available');
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    // Basic encryption for fallback storage
    const encrypted = this.encrypt(value);
    await this.asyncStorage.setItem(key, encrypted);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await this.asyncStorage.getItem(key);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await this.asyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    await this.asyncStorage.clear();
  }

  private encrypt(value: string): string {
    // Simple XOR encryption for demo - use proper encryption in production
    const key = 'aegis-fallback-key';
    let result = '';
    for (let i = 0; i < value.length; i++) {
      result += String.fromCharCode(
        value.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  }

  private decrypt(encrypted: string): string {
    try {
      const value = atob(encrypted);
      const key = 'aegis-fallback-key';
      let result = '';
      for (let i = 0; i < value.length; i++) {
        result += String.fromCharCode(
          value.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch (error) {
      throw new ValidationError('Failed to decrypt stored value');
    }
  }
}

class WebStorageAdapter implements StorageAdapter {
  async setItem(key: string, value: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      throw new Error('localStorage not available');
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }

  async removeItem(key: string): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  async clear(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  }
}

export class SecureStorage {
  private adapter: StorageAdapter;
  private keyPrefix: string;

  constructor(keyPrefix: string = 'aegis-wallet') {
    this.keyPrefix = keyPrefix;
    this.adapter = this.initializeAdapter();
  }

  private initializeAdapter(): StorageAdapter {
    // Try Expo SecureStore first (most secure for React Native)
    try {
      return new ExpoSecureStoreAdapter();
    } catch (error) {
      console.warn('Expo SecureStore not available, trying AsyncStorage...');
    }

    // Try React Native AsyncStorage with encryption
    try {
      console.warn('Using AsyncStorage with basic encryption - not as secure as SecureStore');
      return new AsyncStorageAdapter();
    } catch (error) {
      console.warn('AsyncStorage not available, using localStorage...');
    }

    // Fallback to web localStorage
    try {
      console.warn('Using localStorage - not recommended for sensitive data');
      return new WebStorageAdapter();
    } catch (error) {
      throw new NetworkError('No storage adapter available');
    }
  }

  private getFullKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async storePrivateKey(key: string, privateKey: string): Promise<void> {
    if (!privateKey || typeof privateKey !== 'string') {
      throw new ValidationError('Invalid private key provided');
    }

    try {
      const fullKey = this.getFullKey(key);
      await this.adapter.setItem(fullKey, privateKey);
    } catch (error) {
      throw new NetworkError(`Failed to store private key: ${error}`);
    }
  }

  async getPrivateKey(key: string): Promise<string | null> {
    try {
      const fullKey = this.getFullKey(key);
      return await this.adapter.getItem(fullKey);
    } catch (error) {
      console.error('Failed to retrieve private key:', error);
      return null;
    }
  }

  async removePrivateKey(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.adapter.removeItem(fullKey);
    } catch (error) {
      throw new NetworkError(`Failed to remove private key: ${error}`);
    }
  }

  async storeValue(key: string, value: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.adapter.setItem(fullKey, value);
    } catch (error) {
      throw new NetworkError(`Failed to store value: ${error}`);
    }
  }

  async getValue(key: string): Promise<string | null> {
    try {
      const fullKey = this.getFullKey(key);
      return await this.adapter.getItem(fullKey);
    } catch (error) {
      console.error('Failed to retrieve value:', error);
      return null;
    }
  }

  async removeValue(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.adapter.removeItem(fullKey);
    } catch (error) {
      throw new NetworkError(`Failed to remove value: ${error}`);
    }
  }

  async getAllKeys(): Promise<string[]> {
    // This is a simplified implementation
    // In a full implementation, you'd need to track keys separately
    try {
      // For web localStorage
      if (typeof localStorage !== 'undefined') {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.keyPrefix)) {
            keys.push(key.substring(this.keyPrefix.length + 1));
          }
        }
        return keys;
      }
      
      // For other adapters, would need separate key tracking
      return [];
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      await this.adapter.clear();
    } catch (error) {
      throw new NetworkError(`Failed to clear storage: ${error}`);
    }
  }

  isSecureStoreAvailable(): boolean {
    try {
      require('expo-secure-store');
      return true;
    } catch {
      return false;
    }
  }

  getStorageType(): 'secure' | 'encrypted' | 'plain' {
    if (this.adapter instanceof ExpoSecureStoreAdapter) {
      return 'secure';
    } else if (this.adapter instanceof AsyncStorageAdapter) {
      return 'encrypted';
    } else {
      return 'plain';
    }
  }
}