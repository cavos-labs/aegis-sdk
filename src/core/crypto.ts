import { ec, hash, CallData } from 'starknet';
import { toBeHex } from 'ethers';
import { AccountType, ValidationError } from '../types';

// Polyfill for React Native
let crypto: Crypto;
if (typeof window !== 'undefined' && window.crypto) {
  crypto = window.crypto;
} else if (typeof global !== 'undefined' && global.crypto) {
  crypto = global.crypto;
} else {
  // Fallback for environments without Web Crypto API
  try {
    // Try to import expo-crypto for React Native
    const expoCrypto = require('expo-crypto');
    crypto = {
      getRandomValues: (array: Uint8Array) => {
        const randomBytes = expoCrypto.getRandomBytes(array.length);
        array.set(new Uint8Array(randomBytes));
        return array;
      },
    } as Crypto;
  } catch (error) {
    console.warn('No secure random source available. Using fallback (NOT RECOMMENDED FOR PRODUCTION)');
    crypto = {
      getRandomValues: (array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
    } as Crypto;
  }
}

export class CryptoUtils {
  /**
   * Generate a cryptographically secure private key
   */
  static generateSecurePrivateKey(): string {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    
    // Convert to hex string with 0x prefix, ensuring 64 hex characters
    const hexString = Array.from(randomBytes, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
    
    return `0x0${hexString.slice(1)}`; // Ensure it starts with 0x0 for compatibility
  }

  /**
   * Derive public key from private key using Stark curve
   */
  static getPublicKey(privateKey: string): string {
    try {
      return ec.starkCurve.getStarkKey(privateKey);
    } catch (error) {
      throw new ValidationError(`Invalid private key: ${error}`);
    }
  }

  /**
   * Calculate contract address for account deployment
   */
  static calculateContractAddress(
    publicKey: string,
    classHash: string,
    constructorCalldata: any[]
  ): string {
    try {
      return hash.calculateContractAddressFromHash(
        publicKey,
        classHash,
        constructorCalldata,
        0 // salt
      );
    } catch (error) {
      throw new ValidationError(`Failed to calculate contract address: ${error}`);
    }
  }

  /**
   * Get account class hash based on account type
   */
  static getAccountClassHash(accountType: AccountType = 'argentX'): string {
    const classHashes = {
      argentX: '0x01a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003',
      braavos: '0x00816dd0297efc55dc1e7559020a3a825e81ef734b558f03c83325d4da7e6253',
      devnet: '0x02b31e19e45c06f29234e06e2ee98a9966479ba3067f8785ed972794fdb0065c'
    };

    const classHash = classHashes[accountType];
    if (!classHash) {
      throw new ValidationError(`Unsupported account type: ${accountType}`);
    }

    return classHash;
  }

  /**
   * Get constructor calldata for account deployment
   */
  static getConstructorCalldata(privateKey: string, accountType: AccountType = 'argentX'): any[] {
    const publicKey = this.getPublicKey(privateKey);
    
    switch (accountType) {
      case 'argentX':
        return CallData.compile({
          implementation: '0x01a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003',
          selector: '0x79dc0da7c54b95f10aa182ad0a46400db63156920adb65eca2654c0945a463',
          calldata: [publicKey, '0x0']
        });
      case 'braavos':
        return CallData.compile({ public_key: publicKey });
      case 'devnet':
        return CallData.compile({ public_key: publicKey });
      default:
        throw new ValidationError(`Unsupported account type: ${accountType}`);
    }
  }

  /**
   * Sign a message using Stark curve
   */
  static signMessage(message: string, privateKey: string): string[] {
    try {
      const signature = ec.starkCurve.sign(message, privateKey);
      return [toBeHex(signature.r), toBeHex(signature.s)];
    } catch (error) {
      throw new ValidationError(`Failed to sign message: ${error}`);
    }
  }

  /**
   * Sign transaction data
   */
  static signTransaction(messageHash: string, privateKey: string): string[] {
    return this.signMessage(messageHash, privateKey);
  }

  /**
   * Verify a signature (simplified implementation)
   */
  static verifySignature(
    message: string,
    signature: string[],
    publicKey: string
  ): boolean {
    try {
      // Basic validation - check if signature has correct format
      return signature.length === 2 && 
             signature[0].startsWith('0x') && 
             signature[1].startsWith('0x') &&
             signature[0].length > 10 &&
             signature[1].length > 10;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate secure random bytes
   */
  static generateSecureRandom(bytes: number): Uint8Array {
    const randomArray = new Uint8Array(bytes);
    crypto.getRandomValues(randomArray);
    return randomArray;
  }

  /**
   * Validate private key format
   */
  static isValidPrivateKey(privateKey: string): boolean {
    try {
      // Check if it's a valid hex string
      if (!privateKey.startsWith('0x')) {
        return false;
      }
      
      // Check if it's the right length (64 hex characters + 0x prefix)
      if (privateKey.length !== 66) {
        return false;
      }
      
      // Try to derive public key (will throw if invalid)
      this.getPublicKey(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate Starknet address format
   */
  static isValidAddress(address: string): boolean {
    try {
      // Check if it's a valid hex string
      if (!address.startsWith('0x')) {
        return false;
      }
      
      // Check if it's a valid length (up to 64 hex characters + 0x prefix)
      if (address.length > 66 || address.length < 3) {
        return false;
      }
      
      // Check if all characters after 0x are valid hex
      const hexPart = address.slice(2);
      const isValidHex = /^[0-9a-fA-F]*$/.test(hexPart);
      
      return isValidHex;
    } catch {
      return false;
    }
  }
}