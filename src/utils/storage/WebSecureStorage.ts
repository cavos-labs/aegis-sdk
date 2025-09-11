/**
 * Web implementation of secure storage using browser APIs
 */

import { SecureStorageAdapter, StorageCapabilities } from './interfaces';
import { AegisError, AegisErrorCode, AegisErrorType } from '../../types/errors';

/**
 * Web-based secure storage using IndexedDB with encryption
 */
export class WebSecureStorage implements SecureStorageAdapter {
  private dbName = 'aegis-secure-storage';
  private storeName = 'secure-keys';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new AegisError(
          AegisErrorType.STORAGE_ERROR,
          AegisErrorCode.STORAGE_ACCESS_DENIED,
          'Failed to open IndexedDB'
        ));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Store an item securely
   */
  async setItem(key: string, value: string): Promise<void> {
    await this.initializeDB();
    
    if (!this.db) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'Database not initialized'
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Encrypt the value before storing
      const encryptedValue = this.encrypt(value);
      
      const request = store.put({
        key,
        value: encryptedValue,
        timestamp: Date.now(),
      });

      request.onerror = () => {
        reject(new AegisError(
          AegisErrorType.STORAGE_ERROR,
          AegisErrorCode.ENCRYPTION_FAILED,
          'Failed to store item'
        ));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Retrieve an item from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    await this.initializeDB();
    
    if (!this.db) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'Database not initialized'
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => {
        reject(new AegisError(
          AegisErrorType.STORAGE_ERROR,
          AegisErrorCode.KEY_NOT_FOUND,
          'Failed to retrieve item'
        ));
      };

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        try {
          // Decrypt the value before returning
          const decryptedValue = this.decrypt(result.value);
          resolve(decryptedValue);
        } catch (error) {
          reject(new AegisError(
            AegisErrorType.STORAGE_ERROR,
            AegisErrorCode.ENCRYPTION_FAILED,
            'Failed to decrypt stored value'
          ));
        }
      };
    });
  }

  /**
   * Remove an item from secure storage
   */
  async removeItem(key: string): Promise<void> {
    await this.initializeDB();
    
    if (!this.db) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'Database not initialized'
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => {
        reject(new AegisError(
          AegisErrorType.STORAGE_ERROR,
          AegisErrorCode.KEY_NOT_FOUND,
          'Failed to remove item'
        ));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
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
   */
  async getAllKeys(prefix?: string): Promise<string[]> {
    await this.initializeDB();
    
    if (!this.db) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'Database not initialized'
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => {
        reject(new AegisError(
          AegisErrorType.STORAGE_ERROR,
          AegisErrorCode.STORAGE_ACCESS_DENIED,
          'Failed to get keys'
        ));
      };

      request.onsuccess = () => {
        const keys = request.result as string[];
        const filteredKeys = prefix 
          ? keys.filter(key => key.startsWith(prefix))
          : keys;
        resolve(filteredKeys);
      };
    });
  }

  /**
   * Clear all items from secure storage
   */
  async clear(prefix?: string): Promise<void> {
    if (prefix) {
      const keys = await this.getAllKeys(prefix);
      await Promise.all(keys.map(key => this.removeItem(key)));
    } else {
      await this.initializeDB();
      
      if (!this.db) {
        throw new AegisError(
          AegisErrorType.STORAGE_ERROR,
          AegisErrorCode.STORAGE_ACCESS_DENIED,
          'Database not initialized'
        );
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => {
          reject(new AegisError(
            AegisErrorType.STORAGE_ERROR,
            AegisErrorCode.STORAGE_ACCESS_DENIED,
            'Failed to clear storage'
          ));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    }
  }

  /**
   * Simple encryption using Web Crypto API
   * In production, this should use more robust encryption
   */
  private encrypt(value: string): string {
    // For now, use base64 encoding as placeholder
    // In production, implement proper AES encryption with Web Crypto API
    return btoa(unescape(encodeURIComponent(value)));
  }

  /**
   * Simple decryption
   */
  private decrypt(encryptedValue: string): string {
    try {
      return decodeURIComponent(escape(atob(encryptedValue)));
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Get storage capabilities
   */
  static getCapabilities(): StorageCapabilities {
    return {
      hasSecureStorage: typeof indexedDB !== 'undefined',
      hasPersistentStorage: typeof indexedDB !== 'undefined',
      supportsBiometrics: false, // Web doesn't support biometrics natively
      maxItemSize: 1024 * 1024 * 100, // ~100MB per item (IndexedDB limit)
      maxTotalSize: 1024 * 1024 * 1024, // ~1GB total (varies by browser)
      platformFeatures: ['indexeddb', 'webcrypto'],
    };
  }
}