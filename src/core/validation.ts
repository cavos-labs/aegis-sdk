/**
 * Configuration validation utilities
 */

import { AegisConfig, InternalAegisConfig } from '../types/config';
import { AegisError, AegisErrorCode, AegisErrorType } from '../types/errors';

/**
 * Validates the developer-provided configuration
 */
export function validateAegisConfig(config: AegisConfig): void {
  // Validate required fields
  if (!config.appId) {
    throw new AegisError(
      AegisErrorType.CONFIGURATION_ERROR,
      AegisErrorCode.INVALID_APP_ID,
      'appId is required and cannot be empty'
    );
  }

  // Validate appId format (alphanumeric, hyphens, underscores only)
  const appIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!appIdRegex.test(config.appId)) {
    throw new AegisError(
      AegisErrorType.CONFIGURATION_ERROR,
      AegisErrorCode.INVALID_APP_ID,
      'appId must contain only alphanumeric characters, hyphens, and underscores'
    );
  }

  // Validate appId length
  if (config.appId.length < 3 || config.appId.length > 64) {
    throw new AegisError(
      AegisErrorType.CONFIGURATION_ERROR,
      AegisErrorCode.INVALID_APP_ID,
      'appId must be between 3 and 64 characters long'
    );
  }

  // Validate network if provided
  if (config.network && !['mainnet', 'sepolia', 'devnet'].includes(config.network)) {
    throw new AegisError(
      AegisErrorType.CONFIGURATION_ERROR,
      AegisErrorCode.UNSUPPORTED_NETWORK,
      `Unsupported network: ${config.network}. Supported networks: mainnet, sepolia, devnet`
    );
  }

  // Validate customRpcUrl if provided
  if (config.customRpcUrl && !isValidUrl(config.customRpcUrl)) {
    throw new AegisError(
      AegisErrorType.CONFIGURATION_ERROR,
      AegisErrorCode.MISSING_REQUIRED_CONFIG,
      'customRpcUrl must be a valid URL'
    );
  }

  // Validate maxTransactionRetries if provided
  if (config.maxTransactionRetries !== undefined) {
    if (!Number.isInteger(config.maxTransactionRetries) || config.maxTransactionRetries < 0 || config.maxTransactionRetries > 10) {
      throw new AegisError(
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        'maxTransactionRetries must be an integer between 0 and 10'
      );
    }
  }
}

/**
 * Validates the internal configuration after backend expansion
 */
export function validateInternalConfig(config: InternalAegisConfig): void {
  // First validate the base configuration
  validateAegisConfig(config);

  // Validate backend-provided fields
  if (!config.paymasterApiKey) {
    throw new AegisError(
      AegisErrorType.BACKEND_ERROR,
      AegisErrorCode.INVALID_API_RESPONSE,
      'Backend did not provide paymaster API key'
    );
  }

  if (!config.backendUrl || !isValidUrl(config.backendUrl)) {
    throw new AegisError(
      AegisErrorType.BACKEND_ERROR,
      AegisErrorCode.INVALID_API_RESPONSE,
      'Backend URL is missing or invalid'
    );
  }

  // if (!config.analyticsEndpoint || !isValidUrl(config.analyticsEndpoint)) {
  //   throw new AegisError(
  //     AegisErrorType.BACKEND_ERROR,
  //     AegisErrorCode.INVALID_API_RESPONSE,
  //     'Analytics endpoint is missing or invalid'
  //   );
  // }

  if (!Array.isArray(config.supportedNetworks) || config.supportedNetworks.length === 0) {
    throw new AegisError(
      AegisErrorType.BACKEND_ERROR,
      AegisErrorCode.INVALID_API_RESPONSE,
      'Backend did not provide supported networks list'
    );
  }

  // Validate that the requested network is supported
  const network = config.network || 'sepolia';
  if (!config.supportedNetworks.includes(network)) {
    throw new AegisError(
      AegisErrorType.CONFIGURATION_ERROR,
      AegisErrorCode.UNSUPPORTED_NETWORK,
      `Network '${network}' is not supported for this app. Supported networks: ${config.supportedNetworks.join(', ')}`
    );
  }

  // Validate app metadata
  // if (!config.appMetadata || !config.appMetadata.name) {
  //   throw new AegisError(
  //     AegisErrorType.BACKEND_ERROR,
  //     AegisErrorCode.INVALID_API_RESPONSE,
  //     'Backend did not provide valid app metadata'
  //   );
  // }
}

/**
 * Expands user configuration with sensible defaults
 */
export function expandConfigWithDefaults(config: AegisConfig): AegisConfig {
  return {
    network: 'sepolia',
    enableBiometrics: true,
    enableAnalytics: true,
    maxTransactionRetries: 3,
    ...config,
  };
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates Starknet address format
 */
export function validateStarknetAddress(address: string): boolean {
  // Starknet addresses are hex strings starting with 0x and 64 characters long (including 0x)
  const addressRegex = /^0x[0-9a-fA-F]{63,64}$/;
  return addressRegex.test(address);
}

/**
 * Validates private key format
 */
export function validatePrivateKey(privateKey: string): boolean {
  // Private keys are hex strings, typically 64 characters without 0x or 66 with 0x
  const keyRegex = /^(0x)?[0-9a-fA-F]{64}$/;
  return keyRegex.test(privateKey);
}

/**
 * Normalizes private key format (ensures 0x prefix)
 */
export function normalizePrivateKey(privateKey: string): string {
  if (!validatePrivateKey(privateKey)) {
    throw new AegisError(
      AegisErrorType.WALLET_ERROR,
      AegisErrorCode.INVALID_PRIVATE_KEY,
      'Invalid private key format'
    );
  }

  return privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
}

/**
 * Validates transaction call data
 */
export function validateCallData(calls: any[]): void {
  if (!Array.isArray(calls)) {
    throw new AegisError(
      AegisErrorType.TRANSACTION_ERROR,
      AegisErrorCode.TRANSACTION_FAILED,
      'Calls must be an array'
    );
  }

  if (calls.length === 0) {
    throw new AegisError(
      AegisErrorType.TRANSACTION_ERROR,
      AegisErrorCode.TRANSACTION_FAILED,
      'At least one call is required'
    );
  }

  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    
    if (!call.contractAddress || !validateStarknetAddress(call.contractAddress)) {
      throw new AegisError(
        AegisErrorType.TRANSACTION_ERROR,
        AegisErrorCode.TRANSACTION_FAILED,
        `Invalid contract address in call ${i + 1}`
      );
    }

    if (!call.entrypoint || typeof call.entrypoint !== 'string') {
      throw new AegisError(
        AegisErrorType.TRANSACTION_ERROR,
        AegisErrorCode.TRANSACTION_FAILED,
        `Invalid entrypoint in call ${i + 1}`
      );
    }

    if (call.calldata && !Array.isArray(call.calldata)) {
      throw new AegisError(
        AegisErrorType.TRANSACTION_ERROR,
        AegisErrorCode.TRANSACTION_FAILED,
        `Calldata must be an array in call ${i + 1}`
      );
    }
  }
}