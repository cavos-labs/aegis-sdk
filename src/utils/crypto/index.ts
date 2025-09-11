/**
 * Crypto utilities export
 */

export { KeyManager } from './KeyManager';

// Account utilities
export {
  generateAccountAddress,
  getConstructorCalldata,
  getAccountClassHash,
  prepareDeploymentData,
  validateAccountClassHash,
  getSupportedAccountTypes,
  isAccountTypeSupported,
  generateMultipleAccountAddresses,
  deriveAddressFromPublicKey,
  getPublicKeyFromPrivateKey,
  validateDeploymentData,
  estimateDeploymentFee,
  isValidAccountAddress,
  ACCOUNT_CLASS_HASHES,
} from './AccountUtils';

export type { AccountType, AccountDeploymentData } from './AccountUtils';

// Re-export validation utilities for convenience
export {
  validatePrivateKey,
  normalizePrivateKey,
  validateStarknetAddress,
  validateCallData,
} from '../../core/validation';