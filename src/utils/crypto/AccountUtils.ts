/**
 * Account address generation and deployment utilities following POW patterns
 */

import { ec, hash, CallData, constants } from 'starknet';
import { validatePrivateKey, normalizePrivateKey } from '../../core/validation';
import { AegisError, AegisErrorCode, AegisErrorType } from '../../types/errors';

/**
 * Supported account types with their class hashes
 */
export const ACCOUNT_CLASS_HASHES = {
  // Argent X account class hash
  argentx: '0x01a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003',
  
  // DevNet account class hash (for local development)
  devnet: '0x02b31e19e45c06f29234e06e2ee98a9966479ba3067f8785ed972794fdb0065c',
} as const;

/**
 * Account type for deployment
 */
export type AccountType = keyof typeof ACCOUNT_CLASS_HASHES;

/**
 * Account deployment data
 */
export interface AccountDeploymentData {
  classHash: string;
  salt: string;
  constructorCalldata: string[];
  contractAddress: string;
}

/**
 * Generate deterministic account address from private key
 * Following the exact pattern used in POW implementation
 */
export function generateAccountAddress(
  privateKey: string,
  accountType: AccountType = 'argentx'
): string {
  try {
    // Validate and normalize private key
    if (!validatePrivateKey(privateKey)) {
      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.INVALID_PRIVATE_KEY,
        'Invalid private key format'
      );
    }

    const normalizedKey = normalizePrivateKey(privateKey);

    // Generate public key from private key
    const starkKeyPub = ec.starkCurve.getStarkKey(normalizedKey);

    // Get constructor calldata based on account type
    const constructorCalldata = getConstructorCalldata(normalizedKey, accountType);

    // Get class hash for account type
    const classHash = getAccountClassHash(accountType);

    // Calculate contract address using Starknet address calculation
    const contractAddress = hash.calculateContractAddressFromHash(
      starkKeyPub,
      classHash,
      constructorCalldata,
      0 // salt is 0 for default deployment
    );

    return contractAddress;
  } catch (error) {
    if (error instanceof AegisError) {
      throw error;
    }

    throw new AegisError(
      AegisErrorType.WALLET_ERROR,
      AegisErrorCode.INVALID_PRIVATE_KEY,
      `Failed to generate account address: ${error}`,
      false,
      error
    );
  }
}

/**
 * Get constructor calldata for account deployment
 */
export function getConstructorCalldata(
  privateKey: string,
  accountType: AccountType = 'argentx'
): string[] {
  const normalizedKey = normalizePrivateKey(privateKey);
  const starkKeyPub = ec.starkCurve.getStarkKey(normalizedKey);

  switch (accountType) {
    case 'argentx':
      // Argent X constructor: owner, guardian
      return CallData.compile({
        owner: starkKeyPub,
        guardian: '0x0', // No guardian by default
      });

    case 'devnet':
      // DevNet account constructor: public_key
      return CallData.compile({
        public_key: starkKeyPub,
      });

    default:
      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.INVALID_PRIVATE_KEY,
        `Unsupported account type: ${accountType}`
      );
  }
}

/**
 * Get class hash for account type
 */
export function getAccountClassHash(accountType: AccountType): string {
  const classHash = ACCOUNT_CLASS_HASHES[accountType];
  if (!classHash) {
    throw new AegisError(
      AegisErrorType.WALLET_ERROR,
      AegisErrorCode.INVALID_PRIVATE_KEY,
      `Unsupported account type: ${accountType}`
    );
  }
  return classHash;
}

/**
 * Prepare deployment data for account
 */
export function prepareDeploymentData(
  privateKey: string,
  accountType: AccountType = 'argentx'
): AccountDeploymentData {
  try {
    const normalizedKey = normalizePrivateKey(privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(normalizedKey);
    
    const classHash = getAccountClassHash(accountType);
    const constructorCalldata = getConstructorCalldata(normalizedKey, accountType);
    const contractAddress = generateAccountAddress(normalizedKey, accountType);

    return {
      classHash,
      salt: starkKeyPub, // Use public key as salt
      constructorCalldata,
      contractAddress,
    };
  } catch (error) {
    if (error instanceof AegisError) {
      throw error;
    }

    throw new AegisError(
      AegisErrorType.WALLET_ERROR,
      AegisErrorCode.INVALID_PRIVATE_KEY,
      `Failed to prepare deployment data: ${error}`,
      false,
      error
    );
  }
}

/**
 * Validate account class hash format
 */
export function validateAccountClassHash(classHash: string): boolean {
  // Starknet class hashes are 64-character hex strings with 0x prefix
  const classHashRegex = /^0x[0-9a-fA-F]{63,64}$/;
  return classHashRegex.test(classHash);
}

/**
 * Get supported account types
 */
export function getSupportedAccountTypes(): AccountType[] {
  return Object.keys(ACCOUNT_CLASS_HASHES) as AccountType[];
}

/**
 * Check if account type is supported
 */
export function isAccountTypeSupported(accountType: string): accountType is AccountType {
  return accountType in ACCOUNT_CLASS_HASHES;
}

/**
 * Generate multiple account addresses from different private keys
 */
export function generateMultipleAccountAddresses(
  privateKeys: string[],
  accountType: AccountType = 'argentx'
): Array<{ privateKey: string; address: string }> {
  return privateKeys.map(privateKey => ({
    privateKey,
    address: generateAccountAddress(privateKey, accountType),
  }));
}

/**
 * Derive account address from public key (without private key)
 */
export function deriveAddressFromPublicKey(
  publicKey: string,
  accountType: AccountType = 'argentx'
): string {
  try {
    const classHash = getAccountClassHash(accountType);
    
    let constructorCalldata: string[];
    
    switch (accountType) {
      case 'argentx':
        constructorCalldata = CallData.compile({
          owner: publicKey,
          guardian: '0x0',
        });
        break;
        
      case 'devnet':
        constructorCalldata = CallData.compile({
          public_key: publicKey,
        });
        break;
        
      default:
        throw new AegisError(
          AegisErrorType.WALLET_ERROR,
          AegisErrorCode.INVALID_PRIVATE_KEY,
          `Unsupported account type: ${accountType}`
        );
    }

    const contractAddress = hash.calculateContractAddressFromHash(
      publicKey,
      classHash,
      constructorCalldata,
      0
    );

    return contractAddress;
  } catch (error) {
    if (error instanceof AegisError) {
      throw error;
    }

    throw new AegisError(
      AegisErrorType.WALLET_ERROR,
      AegisErrorCode.INVALID_PRIVATE_KEY,
      `Failed to derive address from public key: ${error}`,
      false,
      error
    );
  }
}

/**
 * Extract public key from private key
 */
export function getPublicKeyFromPrivateKey(privateKey: string): string {
  try {
    const normalizedKey = normalizePrivateKey(privateKey);
    return ec.starkCurve.getStarkKey(normalizedKey);
  } catch (error) {
    throw new AegisError(
      AegisErrorType.WALLET_ERROR,
      AegisErrorCode.INVALID_PRIVATE_KEY,
      `Failed to extract public key: ${error}`,
      false,
      error
    );
  }
}

/**
 * Validate deployment data consistency
 */
export function validateDeploymentData(deploymentData: AccountDeploymentData): boolean {
  try {
    // Validate class hash format
    if (!validateAccountClassHash(deploymentData.classHash)) {
      return false;
    }

    // Validate contract address format
    if (!deploymentData.contractAddress.match(/^0x[0-9a-fA-F]{63,64}$/)) {
      return false;
    }

    // Validate constructor calldata is an array
    if (!Array.isArray(deploymentData.constructorCalldata)) {
      return false;
    }

    // Validate salt format
    if (!deploymentData.salt.match(/^0x[0-9a-fA-F]{63,64}$/)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate expected gas fee for account deployment
 */
export function estimateDeploymentFee(
  accountType: AccountType = 'argentx',
  network: string = 'sepolia'
): string {
  // These are rough estimates based on network conditions
  // In practice, you should query the network for current gas prices
  const estimates = {
    mainnet: {
      argentx: '50000000000000000', // ~0.05 ETH
      devnet: '10000000000000000',  // ~0.01 ETH
    },
    sepolia: {
      argentx: '10000000000000000',  // ~0.01 ETH
      devnet: '5000000000000000',   // ~0.005 ETH
    },
    devnet: {
      argentx: '1000000000000000',   // ~0.001 ETH
      devnet: '1000000000000000',   // ~0.001 ETH
    },
  };

  const networkEstimates = estimates[network as keyof typeof estimates];
  if (!networkEstimates) {
    return estimates.sepolia[accountType];
  }

  return networkEstimates[accountType] || networkEstimates.argentx;
}

/**
 * Check if an address matches expected format for account type
 */
export function isValidAccountAddress(address: string, privateKey?: string, accountType: AccountType = 'argentx'): boolean {
  try {
    // Basic address format validation
    if (!address.match(/^0x[0-9a-fA-F]{63,64}$/)) {
      return false;
    }

    // If private key is provided, verify the address matches
    // if (privateKey) {
    //   const expectedAddress = generateAccountAddress(privateKey, accountType);
    //   return address.toLowerCase() === expectedAddress.toLowerCase();
    // }

    return true;
  } catch {
    return false;
  }
}