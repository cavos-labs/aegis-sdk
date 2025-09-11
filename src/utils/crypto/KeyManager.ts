/**
 * Key management utilities for secure key generation and handling
 */

// Only import crypto in Node.js environment
let randomBytes: any;
try {
  randomBytes = require('crypto').randomBytes;
} catch {
  // Will fallback to Web Crypto API
}
import { validatePrivateKey, normalizePrivateKey } from '../../core/validation';
import { AegisError, AegisErrorCode, AegisErrorType } from '../../types/errors';
import type { KeyMetadata } from '../../types/wallet';
import type { StorageManager } from '../storage/StorageManager';

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
export class KeyManager {
  private storageManager?: StorageManager;

  constructor(storageManager?: StorageManager) {
    this.storageManager = storageManager;
  }

  /**
   * Generate a cryptographically secure private key
   */
  generatePrivateKey(options: KeyGenerationOptions = {}): string {
    const { useSecureRandom = true, validateKey = true } = options;

    try {
      let privateKey: string;

      if (useSecureRandom && this.isNodeEnvironment()) {
        // Use Node.js crypto for secure random bytes
        const randomBytesBuffer = randomBytes(32);
        privateKey = '0x' + randomBytesBuffer.toString('hex');
      } else {
        // Use Web Crypto API or fallback to Math.random
        privateKey = this.generatePrivateKeyWeb();
      }

      // Validate generated key
      if (validateKey && !validatePrivateKey(privateKey)) {
        throw new AegisError(
          AegisErrorType.WALLET_ERROR,
          AegisErrorCode.INVALID_PRIVATE_KEY,
          'Generated private key is invalid'
        );
      }

      return privateKey;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      
      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.INVALID_PRIVATE_KEY,
        `Failed to generate private key: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Import a private key with validation and normalization
   */
  importPrivateKey(privateKey: string, options: KeyImportOptions = {}): string {
    const { validateKey = true, normalizeKey = true } = options;

    try {
      let processedKey = privateKey;

      // Normalize key format if requested
      if (normalizeKey) {
        processedKey = normalizePrivateKey(processedKey);
      }

      // Validate key format if requested
      if (validateKey && !validatePrivateKey(processedKey)) {
        throw new AegisError(
          AegisErrorType.WALLET_ERROR,
          AegisErrorCode.INVALID_PRIVATE_KEY,
          'Invalid private key format'
        );
      }

      return processedKey;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      
      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.INVALID_PRIVATE_KEY,
        `Failed to import private key: ${error}`,
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
    appId: string,
    network: string,
    accountType: string,
    address: string,
    options: { withBiometrics?: boolean; name?: string } = {}
  ): Promise<void> {
    if (!this.storageManager) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'Storage manager not initialized'
      );
    }

    try {
      // Validate and normalize the private key
      const validatedKey = this.importPrivateKey(privateKey);

      // Store the private key
      await this.storageManager.storePrivateKey(
        validatedKey,
        network,
        appId,
        accountType,
        address,
        options.withBiometrics || false
      );

      // Store additional metadata if name is provided
      if (options.name) {
        const metadata = {
          name: options.name,
          createdAt: Date.now(),
          lastUsed: Date.now(),
        };

        await this.storageManager.storeWalletMetadata(appId, address, metadata);
      }
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
   * Retrieve a private key from secure storage
   */
  async getPrivateKey(
    appId: string,
    network: string,
    accountType: string,
    address: string,
    withBiometrics: boolean = false
  ): Promise<string | null> {
    if (!this.storageManager) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'Storage manager not initialized'
      );
    }

    try {
      const privateKey = await this.storageManager.getPrivateKey(
        network,
        appId,
        accountType,
        address,
        withBiometrics
      );

      if (privateKey) {
        // Update last used timestamp
        const metadata = await this.storageManager.getWalletMetadata(appId, address);
        if (metadata) {
          metadata.lastUsed = Date.now();
          await this.storageManager.storeWalletMetadata(appId, address, metadata);
        }
      }

      return privateKey;
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
   * Remove a private key from storage
   */
  async removePrivateKey(
    appId: string,
    network: string,
    accountType: string,
    address: string
  ): Promise<void> {
    if (!this.storageManager) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'Storage manager not initialized'
      );
    }

    try {
      await this.storageManager.removePrivateKey(network, appId, accountType, address);
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
   * Get all available keys for an app
   */
  async getAvailableKeys(appId: string): Promise<KeyMetadata[]> {
    if (!this.storageManager) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'Storage manager not initialized'
      );
    }

    try {
      return await this.storageManager.getAvailableKeys(appId);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      
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
   * Check if a key exists in storage
   */
  async hasKey(
    appId: string,
    network: string,
    accountType: string,
    address: string
  ): Promise<boolean> {
    try {
      const privateKey = await this.getPrivateKey(appId, network, accountType, address);
      return privateKey !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate multiple private keys at once
   */
  generateMultipleKeys(count: number, options: KeyGenerationOptions = {}): string[] {
    if (count <= 0 || count > 100) {
      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.INVALID_PRIVATE_KEY,
        'Key count must be between 1 and 100'
      );
    }

    const keys: string[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const key = this.generatePrivateKey(options);
        keys.push(key);
      } catch (error) {
        throw new AegisError(
          AegisErrorType.WALLET_ERROR,
          AegisErrorCode.INVALID_PRIVATE_KEY,
          `Failed to generate key ${i + 1}: ${error}`,
          false,
          error
        );
      }
    }

    return keys;
  }

  /**
   * Validate key derivation path for HD wallets (future feature)
   */
  validateDerivationPath(path: string): boolean {
    // HD wallet derivation path format: m/44'/9004'/0'/0/0
    // This is a placeholder for future HD wallet support
    const derivationRegex = /^m(\/\d+'?)*$/;
    return derivationRegex.test(path);
  }

  /**
   * Generate a mnemonic phrase (future feature)
   */
  generateMnemonic(): string {
    // Placeholder for BIP39 mnemonic generation
    // This would require a BIP39 library implementation
    throw new AegisError(
      AegisErrorType.WALLET_ERROR,
      AegisErrorCode.INVALID_PRIVATE_KEY,
      'Mnemonic generation not yet implemented'
    );
  }

  /**
   * Convert mnemonic to private key (future feature)
   */
  mnemonicToPrivateKey(mnemonic: string, derivationPath: string = "m/44'/9004'/0'/0/0"): string {
    // Placeholder for mnemonic to private key conversion
    // This would require a BIP39 + BIP32 implementation
    throw new AegisError(
      AegisErrorType.WALLET_ERROR,
      AegisErrorCode.INVALID_PRIVATE_KEY,
      'Mnemonic to private key conversion not yet implemented'
    );
  }

  /**
   * Generate private key using Web Crypto API or fallback
   */
  private generatePrivateKeyWeb(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Use Web Crypto API
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      
      let hex = '0x';
      for (let i = 0; i < array.length; i++) {
        hex += array[i].toString(16).padStart(2, '0');
      }
      
      return hex;
    } else {
      // Fallback to Math.random (less secure, but functional)
      console.warn('Using Math.random for key generation - not cryptographically secure');
      
      let hex = '0x';
      for (let i = 0; i < 32; i++) {
        const randomByte = Math.floor(Math.random() * 256);
        hex += randomByte.toString(16).padStart(2, '0');
      }
      
      return hex;
    }
  }

  /**
   * Check if running in Node.js environment
   */
  private isNodeEnvironment(): boolean {
    return (
      typeof process !== 'undefined' &&
      typeof process.versions === 'object' &&
      typeof process.versions.node === 'string'
    );
  }

  /**
   * Get entropy quality assessment
   */
  getEntropyQuality(): { source: string; quality: 'high' | 'medium' | 'low' } {
    if (this.isNodeEnvironment()) {
      return { source: 'Node.js crypto', quality: 'high' };
    } else if (typeof crypto !== 'undefined') {
      return { source: 'Web Crypto API', quality: 'high' };
    } else {
      return { source: 'Math.random fallback', quality: 'low' };
    }
  }

  /**
   * Clear all keys for an app (use with caution)
   */
  async clearAllKeys(appId: string): Promise<void> {
    if (!this.storageManager) {
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        'Storage manager not initialized'
      );
    }

    try {
      await this.storageManager.clearAppData(appId);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      
      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to clear all keys: ${error}`,
        false,
        error
      );
    }
  }
}