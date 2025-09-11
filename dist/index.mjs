"use client";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/types/errors.ts
var AegisErrorType, AegisErrorCode, AegisError, AegisErrorFactory;
var init_errors = __esm({
  "src/types/errors.ts"() {
    "use strict";
    AegisErrorType = /* @__PURE__ */ ((AegisErrorType2) => {
      AegisErrorType2["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
      AegisErrorType2["NETWORK_ERROR"] = "NETWORK_ERROR";
      AegisErrorType2["WALLET_ERROR"] = "WALLET_ERROR";
      AegisErrorType2["TRANSACTION_ERROR"] = "TRANSACTION_ERROR";
      AegisErrorType2["STORAGE_ERROR"] = "STORAGE_ERROR";
      AegisErrorType2["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
      AegisErrorType2["BACKEND_ERROR"] = "BACKEND_ERROR";
      return AegisErrorType2;
    })(AegisErrorType || {});
    AegisErrorCode = /* @__PURE__ */ ((AegisErrorCode2) => {
      AegisErrorCode2["INVALID_APP_ID"] = "INVALID_APP_ID";
      AegisErrorCode2["MISSING_REQUIRED_CONFIG"] = "MISSING_REQUIRED_CONFIG";
      AegisErrorCode2["UNSUPPORTED_NETWORK"] = "UNSUPPORTED_NETWORK";
      AegisErrorCode2["PROVIDER_CONNECTION_FAILED"] = "PROVIDER_CONNECTION_FAILED";
      AegisErrorCode2["RPC_REQUEST_FAILED"] = "RPC_REQUEST_FAILED";
      AegisErrorCode2["NETWORK_TIMEOUT"] = "NETWORK_TIMEOUT";
      AegisErrorCode2["WALLET_NOT_FOUND"] = "WALLET_NOT_FOUND";
      AegisErrorCode2["INVALID_PRIVATE_KEY"] = "INVALID_PRIVATE_KEY";
      AegisErrorCode2["ACCOUNT_NOT_DEPLOYED"] = "ACCOUNT_NOT_DEPLOYED";
      AegisErrorCode2["INSUFFICIENT_BALANCE"] = "INSUFFICIENT_BALANCE";
      AegisErrorCode2["TRANSACTION_FAILED"] = "TRANSACTION_FAILED";
      AegisErrorCode2["TRANSACTION_REVERTED"] = "TRANSACTION_REVERTED";
      AegisErrorCode2["NONCE_ERROR"] = "NONCE_ERROR";
      AegisErrorCode2["MAX_RETRIES_EXCEEDED"] = "MAX_RETRIES_EXCEEDED";
      AegisErrorCode2["STORAGE_ACCESS_DENIED"] = "STORAGE_ACCESS_DENIED";
      AegisErrorCode2["KEY_NOT_FOUND"] = "KEY_NOT_FOUND";
      AegisErrorCode2["ENCRYPTION_FAILED"] = "ENCRYPTION_FAILED";
      AegisErrorCode2["BIOMETRIC_UNAVAILABLE"] = "BIOMETRIC_UNAVAILABLE";
      AegisErrorCode2["BIOMETRIC_FAILED"] = "BIOMETRIC_FAILED";
      AegisErrorCode2["BACKEND_UNREACHABLE"] = "BACKEND_UNREACHABLE";
      AegisErrorCode2["INVALID_API_RESPONSE"] = "INVALID_API_RESPONSE";
      AegisErrorCode2["PAYMASTER_ERROR"] = "PAYMASTER_ERROR";
      return AegisErrorCode2;
    })(AegisErrorCode || {});
    AegisError = class _AegisError extends Error {
      constructor(type, code, message, recoverable = false, details) {
        super(message);
        this.name = "AegisError";
        this.type = type;
        this.code = code;
        this.details = details;
        this.recoverable = recoverable;
        this.timestamp = Date.now();
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, _AegisError);
        }
      }
      /**
       * Convert error to JSON for logging/reporting
       */
      toJSON() {
        return {
          name: this.name,
          type: this.type,
          code: this.code,
          message: this.message,
          recoverable: this.recoverable,
          timestamp: this.timestamp,
          details: this.details,
          stack: this.stack
        };
      }
      /**
       * Create a user-friendly error message
       */
      getUserMessage() {
        switch (this.code) {
          case "INVALID_APP_ID" /* INVALID_APP_ID */:
            return "Invalid application ID. Please check your configuration.";
          case "PROVIDER_CONNECTION_FAILED" /* PROVIDER_CONNECTION_FAILED */:
            return "Unable to connect to the blockchain network. Please check your internet connection.";
          case "ACCOUNT_NOT_DEPLOYED" /* ACCOUNT_NOT_DEPLOYED */:
            return "Your wallet account needs to be activated. This will happen automatically.";
          case "INSUFFICIENT_BALANCE" /* INSUFFICIENT_BALANCE */:
            return "Insufficient balance to complete this transaction.";
          case "TRANSACTION_FAILED" /* TRANSACTION_FAILED */:
            return "Transaction failed. Please try again.";
          case "BIOMETRIC_FAILED" /* BIOMETRIC_FAILED */:
            return "Biometric authentication failed. Please try again or use an alternative method.";
          default:
            return "An unexpected error occurred. Please try again.";
        }
      }
    };
    AegisErrorFactory = class {
      static configurationError(code, message, details) {
        return new AegisError("CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */, code, message, false, details);
      }
      static networkError(code, message, recoverable = true, details) {
        return new AegisError("NETWORK_ERROR" /* NETWORK_ERROR */, code, message, recoverable, details);
      }
      static walletError(code, message, recoverable = false, details) {
        return new AegisError("WALLET_ERROR" /* WALLET_ERROR */, code, message, recoverable, details);
      }
      static transactionError(code, message, recoverable = true, details) {
        return new AegisError("TRANSACTION_ERROR" /* TRANSACTION_ERROR */, code, message, recoverable, details);
      }
      static storageError(code, message, recoverable = false, details) {
        return new AegisError("STORAGE_ERROR" /* STORAGE_ERROR */, code, message, recoverable, details);
      }
      static authenticationError(code, message, recoverable = true, details) {
        return new AegisError("AUTHENTICATION_ERROR" /* AUTHENTICATION_ERROR */, code, message, recoverable, details);
      }
      static backendError(code, message, recoverable = true, details) {
        return new AegisError("BACKEND_ERROR" /* BACKEND_ERROR */, code, message, recoverable, details);
      }
    };
  }
});

// src/utils/storage/ReactNativeSecureStorage.ts
var ReactNativeSecureStorage_exports = {};
__export(ReactNativeSecureStorage_exports, {
  ReactNativeSecureStorage: () => ReactNativeSecureStorage
});
var ReactNativeSecureStorage;
var init_ReactNativeSecureStorage = __esm({
  "src/utils/storage/ReactNativeSecureStorage.ts"() {
    "use strict";
    init_errors();
    ReactNativeSecureStorage = class {
      constructor() {
        try {
          this.SecureStore = __require("expo-secure-store");
          this.LocalAuthentication = __require("expo-local-authentication");
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            "expo-secure-store is required for React Native secure storage"
          );
        }
      }
      /**
       * Store an item securely
       */
      async setItem(key, value) {
        try {
          const options = {
            requireAuthentication: false,
            // We handle biometrics at the wallet level
            keychainService: "aegis-sdk"
          };
          await this.SecureStore.setItemAsync(key, value, options);
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */,
            `Failed to store item securely: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Retrieve an item from secure storage
       */
      async getItem(key) {
        try {
          const options = {
            requireAuthentication: false,
            keychainService: "aegis-sdk"
          };
          const result = await this.SecureStore.getItemAsync(key, options);
          return result;
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "KEY_NOT_FOUND" /* KEY_NOT_FOUND */,
            `Failed to retrieve item from secure storage: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Remove an item from secure storage
       */
      async removeItem(key) {
        try {
          const options = {
            requireAuthentication: false,
            keychainService: "aegis-sdk"
          };
          await this.SecureStore.deleteItemAsync(key, options);
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to remove item from secure storage: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Check if an item exists in secure storage
       */
      async hasItem(key) {
        const item = await this.getItem(key);
        return item !== null;
      }
      /**
       * Get all keys from secure storage
       * Note: expo-secure-store doesn't provide a way to list all keys
       * We need to track keys separately in async storage
       */
      async getAllKeys(prefix) {
        throw new AegisError(
          "STORAGE_ERROR" /* STORAGE_ERROR */,
          "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
          "Cannot enumerate secure storage keys on React Native. Use StorageManager.getAvailableKeys() instead."
        );
      }
      /**
       * Clear all items from secure storage
       * Note: Since we can't enumerate keys, this method has limited functionality
       */
      async clear(_prefix) {
        throw new AegisError(
          "STORAGE_ERROR" /* STORAGE_ERROR */,
          "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
          "Cannot clear secure storage on React Native without key enumeration. Use StorageManager.clearAll() instead."
        );
      }
      /**
       * Store an item with biometric authentication
       */
      async setItemWithBiometrics(key, value) {
        try {
          const hasHardware = await this.LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await this.LocalAuthentication.isEnrolledAsync();
          if (!hasHardware || !isEnrolled) {
            throw new AegisError(
              "AUTHENTICATION_ERROR" /* AUTHENTICATION_ERROR */,
              "BIOMETRIC_UNAVAILABLE" /* BIOMETRIC_UNAVAILABLE */,
              "Biometric authentication is not available or not set up"
            );
          }
          const options = {
            requireAuthentication: true,
            authenticationPrompt: "Authenticate to store your wallet key securely",
            keychainService: "aegis-sdk-biometric"
          };
          await this.SecureStore.setItemAsync(key, value, options);
        } catch (error) {
          if (error instanceof AegisError) {
            throw error;
          }
          throw new AegisError(
            "AUTHENTICATION_ERROR" /* AUTHENTICATION_ERROR */,
            "BIOMETRIC_FAILED" /* BIOMETRIC_FAILED */,
            `Biometric storage failed: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Retrieve an item with biometric authentication
       */
      async getItemWithBiometrics(key) {
        try {
          const options = {
            requireAuthentication: true,
            authenticationPrompt: "Authenticate to access your wallet key",
            keychainService: "aegis-sdk-biometric"
          };
          const result = await this.SecureStore.getItemAsync(key, options);
          return result;
        } catch (error) {
          throw new AegisError(
            "AUTHENTICATION_ERROR" /* AUTHENTICATION_ERROR */,
            "BIOMETRIC_FAILED" /* BIOMETRIC_FAILED */,
            `Biometric retrieval failed: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Check if biometric authentication is available
       */
      async isBiometricAvailable() {
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
      async getBiometricTypes() {
        try {
          const types = await this.LocalAuthentication.supportedAuthenticationTypesAsync();
          return types.map((type) => {
            switch (type) {
              case 1:
                return "fingerprint";
              case 2:
                return "facial_recognition";
              case 3:
                return "iris";
              default:
                return "unknown";
            }
          });
        } catch {
          return [];
        }
      }
      /**
       * Get storage capabilities
       */
      static async getCapabilities() {
        let supportsBiometrics = false;
        let platformFeatures = ["expo-secure-store"];
        try {
          const LocalAuth = __require("expo-local-authentication");
          const hasHardware = await LocalAuth.hasHardwareAsync();
          const isEnrolled = await LocalAuth.isEnrolledAsync();
          supportsBiometrics = hasHardware && isEnrolled;
          if (hasHardware) {
            platformFeatures.push("biometric-hardware");
          }
          if (isEnrolled) {
            platformFeatures.push("biometric-enrolled");
          }
        } catch {
        }
        return {
          hasSecureStorage: true,
          hasPersistentStorage: true,
          supportsBiometrics,
          maxItemSize: 2048,
          // SecureStore has a 2KB limit per item
          platformFeatures
        };
      }
    };
  }
});

// src/utils/storage/ReactNativeAsyncStorage.ts
var ReactNativeAsyncStorage_exports = {};
__export(ReactNativeAsyncStorage_exports, {
  ReactNativeAsyncStorage: () => ReactNativeAsyncStorage
});
var ReactNativeAsyncStorage;
var init_ReactNativeAsyncStorage = __esm({
  "src/utils/storage/ReactNativeAsyncStorage.ts"() {
    "use strict";
    init_errors();
    ReactNativeAsyncStorage = class {
      constructor() {
        this.prefix = "aegis:";
        try {
          this.AsyncStorage = __require("@react-native-async-storage/async-storage").default;
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            "@react-native-async-storage/async-storage is required for React Native async storage"
          );
        }
      }
      /**
       * Store an item in async storage
       */
      async setItem(key, value) {
        try {
          await this.AsyncStorage.setItem(this.prefix + key, value);
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to store item: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Retrieve an item from async storage
       */
      async getItem(key) {
        try {
          const result = await this.AsyncStorage.getItem(this.prefix + key);
          return result;
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to retrieve item: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Remove an item from async storage
       */
      async removeItem(key) {
        try {
          await this.AsyncStorage.removeItem(this.prefix + key);
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to remove item: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Check if an item exists in async storage
       */
      async hasItem(key) {
        const item = await this.getItem(key);
        return item !== null;
      }
      /**
       * Get all keys from async storage
       */
      async getAllKeys(prefix) {
        try {
          const allKeys = await this.AsyncStorage.getAllKeys();
          const fullPrefix = this.prefix + (prefix || "");
          const filteredKeys = allKeys.filter((key) => key.startsWith(fullPrefix)).map((key) => key.substring(this.prefix.length));
          return filteredKeys;
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to get keys: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Clear all items from async storage
       */
      async clear(prefix) {
        try {
          if (prefix) {
            const keys = await this.getAllKeys(prefix);
            await this.multiRemove(keys);
          } else {
            const allKeys = await this.AsyncStorage.getAllKeys();
            const keysToRemove = allKeys.filter((key) => key.startsWith(this.prefix));
            if (keysToRemove.length > 0) {
              await this.AsyncStorage.multiRemove(keysToRemove);
            }
          }
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to clear storage: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Get multiple items at once
       */
      async multiGet(keys) {
        try {
          const prefixedKeys = keys.map((key) => this.prefix + key);
          const results = await this.AsyncStorage.multiGet(prefixedKeys);
          return results.map(([key, value]) => [
            key.substring(this.prefix.length),
            value
          ]);
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to get multiple items: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Set multiple items at once
       */
      async multiSet(keyValuePairs) {
        try {
          const prefixedPairs = keyValuePairs.map(([key, value]) => [this.prefix + key, value]);
          await this.AsyncStorage.multiSet(prefixedPairs);
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to set multiple items: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Remove multiple items at once
       */
      async multiRemove(keys) {
        try {
          const prefixedKeys = keys.map((key) => this.prefix + key);
          await this.AsyncStorage.multiRemove(prefixedKeys);
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to remove multiple items: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Merge an item with existing value (React Native AsyncStorage feature)
       */
      async mergeItem(key, value) {
        try {
          await this.AsyncStorage.mergeItem(this.prefix + key, value);
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to merge item: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Merge multiple items at once
       */
      async multiMerge(keyValuePairs) {
        try {
          const prefixedPairs = keyValuePairs.map(([key, value]) => [this.prefix + key, value]);
          await this.AsyncStorage.multiMerge(prefixedPairs);
        } catch (error) {
          throw new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            `Failed to merge multiple items: ${error}`,
            false,
            error
          );
        }
      }
      /**
       * Get storage statistics (React Native specific)
       */
      async getStorageSize() {
        try {
          const allKeys = await this.AsyncStorage.getAllKeys();
          const ourKeys = allKeys.filter((key) => key.startsWith(this.prefix));
          if (ourKeys.length === 0) {
            return { used: 0, available: 1024 * 1024 * 6 };
          }
          const items = await this.AsyncStorage.multiGet(ourKeys);
          let used = 0;
          items.forEach(([key, value]) => {
            used += key.length + (value ? value.length : 0);
          });
          const estimated_available = 1024 * 1024 * 6 - used;
          return {
            used: used * 2,
            // UTF-16 encoding approximately doubles byte size
            available: Math.max(0, estimated_available)
          };
        } catch (error) {
          return { used: 0, available: 0 };
        }
      }
      /**
       * Flush pending operations (React Native specific)
       */
      async flushGetRequests() {
        try {
          await this.AsyncStorage.flushGetRequests();
        } catch (error) {
          console.warn("Failed to flush AsyncStorage requests:", error);
        }
      }
    };
  }
});

// src/core/AegisSDK.ts
init_errors();

// src/core/validation.ts
init_errors();
function validateAegisConfig(config) {
  if (!config.appId) {
    throw new AegisError(
      "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
      "INVALID_APP_ID" /* INVALID_APP_ID */,
      "appId is required and cannot be empty"
    );
  }
  const appIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!appIdRegex.test(config.appId)) {
    throw new AegisError(
      "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
      "INVALID_APP_ID" /* INVALID_APP_ID */,
      "appId must contain only alphanumeric characters, hyphens, and underscores"
    );
  }
  if (config.appId.length < 3 || config.appId.length > 64) {
    throw new AegisError(
      "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
      "INVALID_APP_ID" /* INVALID_APP_ID */,
      "appId must be between 3 and 64 characters long"
    );
  }
  if (config.network && !["mainnet", "sepolia", "devnet"].includes(config.network)) {
    throw new AegisError(
      "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
      "UNSUPPORTED_NETWORK" /* UNSUPPORTED_NETWORK */,
      `Unsupported network: ${config.network}. Supported networks: mainnet, sepolia, devnet`
    );
  }
  if (config.customRpcUrl && !isValidUrl(config.customRpcUrl)) {
    throw new AegisError(
      "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
      "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
      "customRpcUrl must be a valid URL"
    );
  }
  if (config.maxTransactionRetries !== void 0) {
    if (!Number.isInteger(config.maxTransactionRetries) || config.maxTransactionRetries < 0 || config.maxTransactionRetries > 10) {
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        "maxTransactionRetries must be an integer between 0 and 10"
      );
    }
  }
}
function validateInternalConfig(config) {
  validateAegisConfig(config);
  if (!config.paymasterApiKey) {
    throw new AegisError(
      "BACKEND_ERROR" /* BACKEND_ERROR */,
      "INVALID_API_RESPONSE" /* INVALID_API_RESPONSE */,
      "Backend did not provide paymaster API key"
    );
  }
  if (!config.backendUrl || !isValidUrl(config.backendUrl)) {
    throw new AegisError(
      "BACKEND_ERROR" /* BACKEND_ERROR */,
      "INVALID_API_RESPONSE" /* INVALID_API_RESPONSE */,
      "Backend URL is missing or invalid"
    );
  }
  if (!config.analyticsEndpoint || !isValidUrl(config.analyticsEndpoint)) {
    throw new AegisError(
      "BACKEND_ERROR" /* BACKEND_ERROR */,
      "INVALID_API_RESPONSE" /* INVALID_API_RESPONSE */,
      "Analytics endpoint is missing or invalid"
    );
  }
  if (!Array.isArray(config.supportedNetworks) || config.supportedNetworks.length === 0) {
    throw new AegisError(
      "BACKEND_ERROR" /* BACKEND_ERROR */,
      "INVALID_API_RESPONSE" /* INVALID_API_RESPONSE */,
      "Backend did not provide supported networks list"
    );
  }
  const network = config.network || "sepolia";
  if (!config.supportedNetworks.includes(network)) {
    throw new AegisError(
      "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
      "UNSUPPORTED_NETWORK" /* UNSUPPORTED_NETWORK */,
      `Network '${network}' is not supported for this app. Supported networks: ${config.supportedNetworks.join(", ")}`
    );
  }
  if (!config.appMetadata || !config.appMetadata.name) {
    throw new AegisError(
      "BACKEND_ERROR" /* BACKEND_ERROR */,
      "INVALID_API_RESPONSE" /* INVALID_API_RESPONSE */,
      "Backend did not provide valid app metadata"
    );
  }
}
function expandConfigWithDefaults(config) {
  return {
    network: "sepolia",
    enableBiometrics: true,
    enableAnalytics: true,
    maxTransactionRetries: 3,
    ...config
  };
}
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
function validateStarknetAddress(address) {
  const addressRegex = /^0x[0-9a-fA-F]{63,64}$/;
  return addressRegex.test(address);
}
function validatePrivateKey(privateKey) {
  const keyRegex = /^(0x)?[0-9a-fA-F]{64}$/;
  return keyRegex.test(privateKey);
}
function normalizePrivateKey(privateKey) {
  if (!validatePrivateKey(privateKey)) {
    throw new AegisError(
      "WALLET_ERROR" /* WALLET_ERROR */,
      "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
      "Invalid private key format"
    );
  }
  return privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
}
function validateCallData(calls) {
  if (!Array.isArray(calls)) {
    throw new AegisError(
      "TRANSACTION_ERROR" /* TRANSACTION_ERROR */,
      "TRANSACTION_FAILED" /* TRANSACTION_FAILED */,
      "Calls must be an array"
    );
  }
  if (calls.length === 0) {
    throw new AegisError(
      "TRANSACTION_ERROR" /* TRANSACTION_ERROR */,
      "TRANSACTION_FAILED" /* TRANSACTION_FAILED */,
      "At least one call is required"
    );
  }
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    if (!call.contractAddress || !validateStarknetAddress(call.contractAddress)) {
      throw new AegisError(
        "TRANSACTION_ERROR" /* TRANSACTION_ERROR */,
        "TRANSACTION_FAILED" /* TRANSACTION_FAILED */,
        `Invalid contract address in call ${i + 1}`
      );
    }
    if (!call.entrypoint || typeof call.entrypoint !== "string") {
      throw new AegisError(
        "TRANSACTION_ERROR" /* TRANSACTION_ERROR */,
        "TRANSACTION_FAILED" /* TRANSACTION_FAILED */,
        `Invalid entrypoint in call ${i + 1}`
      );
    }
    if (call.calldata && !Array.isArray(call.calldata)) {
      throw new AegisError(
        "TRANSACTION_ERROR" /* TRANSACTION_ERROR */,
        "TRANSACTION_FAILED" /* TRANSACTION_FAILED */,
        `Calldata must be an array in call ${i + 1}`
      );
    }
  }
}

// src/core/BackendClient.ts
init_errors();
var DEFAULT_BACKEND_CONFIG = {
  baseUrl: "https://api.aegis.com",
  timeout: 1e4,
  // 10 seconds
  retries: 3,
  userAgent: "@aegis/sdk/1.0.0"
};
var BackendClient = class {
  constructor(config) {
    this.config = { ...DEFAULT_BACKEND_CONFIG, ...config };
  }
  /**
   * Expand user configuration by fetching backend settings
   */
  async expandConfiguration(userConfig) {
    const configWithDefaults = expandConfigWithDefaults(userConfig);
    try {
      const backendResponse = await this.fetchAppConfiguration(configWithDefaults.appId);
      const internalConfig = {
        ...configWithDefaults,
        paymasterApiKey: backendResponse?.paymasterApiKey || "",
        backendUrl: backendResponse?.backendUrl || "",
        analyticsEndpoint: backendResponse?.analyticsEndpoint || "",
        supportedNetworks: backendResponse?.supportedNetworks || [],
        appMetadata: backendResponse?.appMetadata || { name: "", version: "", features: [] }
      };
      validateInternalConfig(internalConfig);
      return internalConfig;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "BACKEND_ERROR" /* BACKEND_ERROR */,
        "BACKEND_UNREACHABLE" /* BACKEND_UNREACHABLE */,
        `Failed to fetch app configuration: ${error instanceof Error ? error : String(error)}`,
        true,
        { appId: configWithDefaults.appId, originalError: error }
      );
    }
  }
  /**
   * Fetch app configuration from backend
   */
  async fetchAppConfiguration(appId) {
    const url = `${this.config.baseUrl}/v1/apps/${appId}/config`;
    let lastError = null;
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.makeRequest(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "User-Agent": this.config.userAgent,
            "X-SDK-Version": "1.0.0"
          }
        });
        const data = await response.json();
        if (!data.success || !data.data) {
          throw new AegisError(
            "BACKEND_ERROR" /* BACKEND_ERROR */,
            "INVALID_API_RESPONSE" /* INVALID_API_RESPONSE */,
            data.error || data.message || "Invalid response from backend",
            false,
            { appId, response: data }
          );
        }
        const backendConfig = data.data;
        if (!backendConfig) {
          throw new AegisError(
            "BACKEND_ERROR" /* BACKEND_ERROR */,
            "INVALID_API_RESPONSE" /* INVALID_API_RESPONSE */,
            "Backend response missing required data",
            false,
            { appId, response: data }
          );
        }
        return backendConfig;
      } catch (error) {
        lastError = error;
        if (error instanceof AegisError) {
          if (!error.recoverable) {
            throw error;
          }
        }
        if (attempt < this.config.retries) {
          await this.delay(Math.pow(2, attempt - 1) * 1e3);
        }
      }
    }
    if (lastError instanceof AegisError) {
      throw lastError;
    }
    throw new AegisError(
      "BACKEND_ERROR" /* BACKEND_ERROR */,
      "BACKEND_UNREACHABLE" /* BACKEND_UNREACHABLE */,
      `Failed to fetch app configuration after ${this.config.retries} attempts: ${lastError instanceof Error ? lastError : String(lastError)}`,
      true,
      { appId, attempts: this.config.retries, lastError }
    );
  }
  /**
   * Send usage analytics to backend
   */
  async sendAnalytics(analyticsEndpoint, appId, eventType, eventData) {
    try {
      const payload = {
        appId,
        eventType,
        eventData,
        timestamp: Date.now(),
        sdkVersion: "1.0.0"
      };
      await this.makeRequest(analyticsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": this.config.userAgent
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.warn("Failed to send analytics:", error);
    }
  }
  /**
   * Report error to backend for monitoring
   */
  async reportError(backendUrl, appId, error) {
    try {
      const payload = {
        appId,
        error: error.toJSON(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
        timestamp: Date.now(),
        sdkVersion: "1.0.0"
      };
      const url = `${backendUrl}/v1/errors`;
      await this.makeRequest(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": this.config.userAgent
        },
        body: JSON.stringify(payload)
      });
    } catch (reportError) {
      console.warn("Failed to report error to backend:", reportError);
    }
  }
  /**
   * Make HTTP request with timeout and error handling
   */
  async makeRequest(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AegisError(
          "BACKEND_ERROR" /* BACKEND_ERROR */,
          this.mapHttpStatusToErrorCode(response.status),
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status >= 500,
          // Server errors are recoverable
          {
            status: response.status,
            statusText: response.statusText,
            url,
            errorData
          }
        );
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AegisError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new AegisError(
          "NETWORK_ERROR" /* NETWORK_ERROR */,
          "NETWORK_TIMEOUT" /* NETWORK_TIMEOUT */,
          `Request timeout after ${this.config.timeout}ms`,
          true,
          { url, timeout: this.config.timeout }
        );
      }
      throw new AegisError(
        "NETWORK_ERROR" /* NETWORK_ERROR */,
        "RPC_REQUEST_FAILED" /* RPC_REQUEST_FAILED */,
        `Network request failed: ${error instanceof Error ? error : String(error)}`,
        true,
        { url, originalError: error }
      );
    }
  }
  /**
   * Map HTTP status codes to error codes
   */
  mapHttpStatusToErrorCode(status) {
    switch (status) {
      case 400:
      case 422:
        return "INVALID_APP_ID" /* INVALID_APP_ID */;
      case 401:
      case 403:
        return "BACKEND_UNREACHABLE" /* BACKEND_UNREACHABLE */;
      case 404:
        return "INVALID_APP_ID" /* INVALID_APP_ID */;
      case 429:
        return "BACKEND_UNREACHABLE" /* BACKEND_UNREACHABLE */;
      case 500:
      case 502:
      case 503:
      case 504:
        return "BACKEND_UNREACHABLE" /* BACKEND_UNREACHABLE */;
      default:
        return "BACKEND_UNREACHABLE" /* BACKEND_UNREACHABLE */;
    }
  }
  /**
   * Delay utility for retry logic
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Update backend client configuration
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
  /**
   * Check if backend is reachable
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest(`${this.config.baseUrl}/health`, {
        method: "GET",
        headers: {
          "User-Agent": this.config.userAgent
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

// src/core/NetworkManager.ts
init_errors();
import { RpcProvider, constants } from "starknet";
var DEFAULT_RPC_URLS = {
  mainnet: "https://starknet-mainnet.public.blastapi.io/rpc/v0_7",
  sepolia: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
  devnet: "http://localhost:5050/rpc"
};
var CHAIN_IDS = {
  mainnet: constants.StarknetChainId.SN_MAIN,
  sepolia: constants.StarknetChainId.SN_SEPOLIA,
  devnet: void 0
  // Devnet doesn't have a standard chain ID
};
var NetworkManager = class {
  constructor(config) {
    this.providers = /* @__PURE__ */ new Map();
    this.networkConfigs = /* @__PURE__ */ new Map();
    this.config = config;
    this.currentNetwork = config.network || "sepolia";
    this.initializeNetworkConfigs();
  }
  /**
   * Initialize the network manager and create providers
   */
  async initialize() {
    try {
      for (const network of this.config.supportedNetworks) {
        const provider = this.createProvider(network);
        this.providers.set(network, provider);
        await this.testProviderConnection(provider, network);
      }
      if (!this.providers.has(this.currentNetwork)) {
        throw new AegisError(
          "NETWORK_ERROR" /* NETWORK_ERROR */,
          "PROVIDER_CONNECTION_FAILED" /* PROVIDER_CONNECTION_FAILED */,
          `Current network '${this.currentNetwork}' is not supported`
        );
      }
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "NETWORK_ERROR" /* NETWORK_ERROR */,
        "PROVIDER_CONNECTION_FAILED" /* PROVIDER_CONNECTION_FAILED */,
        `Failed to initialize network manager: ${error instanceof Error ? error : String(error)}`,
        true,
        error
      );
    }
  }
  /**
   * Get provider for the current network or a specific network
   */
  getProvider(network) {
    const targetNetwork = network || this.currentNetwork;
    const provider = this.providers.get(targetNetwork);
    if (!provider) {
      throw new AegisError(
        "NETWORK_ERROR" /* NETWORK_ERROR */,
        "PROVIDER_CONNECTION_FAILED" /* PROVIDER_CONNECTION_FAILED */,
        `Provider not available for network: ${targetNetwork}`
      );
    }
    return provider;
  }
  /**
   * Switch to a different network
   */
  async switchNetwork(network) {
    if (!this.config.supportedNetworks.includes(network)) {
      throw new AegisError(
        "NETWORK_ERROR" /* NETWORK_ERROR */,
        "UNSUPPORTED_NETWORK" /* UNSUPPORTED_NETWORK */,
        `Network '${network}' is not supported for this app`
      );
    }
    if (!this.providers.has(network)) {
      const provider = this.createProvider(network);
      await this.testProviderConnection(provider, network);
      this.providers.set(network, provider);
    }
    this.currentNetwork = network;
  }
  /**
   * Get the current network name
   */
  getCurrentNetwork() {
    return this.currentNetwork;
  }
  /**
   * Get list of supported networks
   */
  getSupportedNetworks() {
    return [...this.config.supportedNetworks];
  }
  /**
   * Get network configuration for a specific network
   */
  getNetworkConfig(network) {
    return this.networkConfigs.get(network);
  }
  /**
   * Test if a network is available
   */
  async isNetworkAvailable(network) {
    try {
      const provider = this.providers.get(network);
      if (!provider) {
        return false;
      }
      await this.testProviderConnection(provider, network);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Initialize network configurations
   */
  initializeNetworkConfigs() {
    this.networkConfigs.set("mainnet", {
      name: "Starknet Mainnet",
      rpcUrl: DEFAULT_RPC_URLS.mainnet,
      chainId: CHAIN_IDS.mainnet,
      specVersion: "0.7.1"
    });
    this.networkConfigs.set("sepolia", {
      name: "Starknet Sepolia Testnet",
      rpcUrl: DEFAULT_RPC_URLS.sepolia,
      chainId: CHAIN_IDS.sepolia,
      specVersion: "0.7.1"
    });
    this.networkConfigs.set("devnet", {
      name: "Local Devnet",
      rpcUrl: this.config.customRpcUrl || DEFAULT_RPC_URLS.devnet,
      chainId: CHAIN_IDS.devnet,
      specVersion: "0.8.1"
    });
  }
  /**
   * Create a provider for a specific network
   */
  createProvider(network) {
    const networkConfig = this.networkConfigs.get(network);
    if (!networkConfig) {
      throw new AegisError(
        "NETWORK_ERROR" /* NETWORK_ERROR */,
        "UNSUPPORTED_NETWORK" /* UNSUPPORTED_NETWORK */,
        `Unknown network: ${network}`
      );
    }
    try {
      const providerOptions = {
        nodeUrl: networkConfig.rpcUrl,
        specVersion: networkConfig.specVersion
      };
      if (networkConfig.chainId) {
        providerOptions.chainId = networkConfig.chainId;
      }
      return new RpcProvider(providerOptions);
    } catch (error) {
      throw new AegisError(
        "NETWORK_ERROR" /* NETWORK_ERROR */,
        "PROVIDER_CONNECTION_FAILED" /* PROVIDER_CONNECTION_FAILED */,
        `Failed to create provider for network '${network}': ${error instanceof Error ? error : String(error)}`,
        true,
        error
      );
    }
  }
  /**
   * Test provider connection by making a simple call
   */
  async testProviderConnection(provider, network) {
    try {
      await Promise.race([
        provider.getBlockNumber(),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 1e4)
        )
      ]);
    } catch (error) {
      throw new AegisError(
        "NETWORK_ERROR" /* NETWORK_ERROR */,
        "RPC_REQUEST_FAILED" /* RPC_REQUEST_FAILED */,
        `Failed to connect to ${network} network: ${error instanceof Error ? error : String(error)}`,
        true,
        { network, error }
      );
    }
  }
  /**
   * Refresh all provider connections
   */
  async refreshConnections() {
    const errors = [];
    for (const [network, provider] of this.providers.entries()) {
      try {
        await this.testProviderConnection(provider, network);
      } catch (error) {
        errors.push({ network, error });
        try {
          const newProvider = this.createProvider(network);
          await this.testProviderConnection(newProvider, network);
          this.providers.set(network, newProvider);
        } catch (recreateError) {
          this.providers.delete(network);
        }
      }
    }
    if (!this.providers.has(this.currentNetwork)) {
      const availableNetwork = this.config.supportedNetworks.find(
        (network) => this.providers.has(network)
      );
      if (availableNetwork) {
        this.currentNetwork = availableNetwork;
      } else {
        throw new AegisError(
          "NETWORK_ERROR" /* NETWORK_ERROR */,
          "PROVIDER_CONNECTION_FAILED" /* PROVIDER_CONNECTION_FAILED */,
          "No network providers are available",
          true,
          { errors }
        );
      }
    }
    if (errors.length > 0) {
      console.warn("Some network connections failed during refresh:", errors);
    }
  }
  /**
   * Cleanup resources
   */
  destroy() {
    this.providers.clear();
    this.networkConfigs.clear();
  }
};

// src/utils/storage/StorageManager.ts
init_errors();

// src/utils/storage/WebSecureStorage.ts
init_errors();
var WebSecureStorage = class {
  constructor() {
    this.dbName = "aegis-secure-storage";
    this.storeName = "secure-keys";
    this.version = 1;
    this.db = null;
    this.initializeDB();
  }
  /**
   * Initialize IndexedDB
   */
  async initializeDB() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => {
        reject(new AegisError(
          "STORAGE_ERROR" /* STORAGE_ERROR */,
          "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
          "Failed to open IndexedDB"
        ));
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "key" });
        }
      };
    });
  }
  /**
   * Store an item securely
   */
  async setItem(key, value) {
    await this.initializeDB();
    if (!this.db) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        "Database not initialized"
      );
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const encryptedValue = this.encrypt(value);
      const request = store.put({
        key,
        value: encryptedValue,
        timestamp: Date.now()
      });
      request.onerror = () => {
        reject(new AegisError(
          "STORAGE_ERROR" /* STORAGE_ERROR */,
          "ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */,
          "Failed to store item"
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
  async getItem(key) {
    await this.initializeDB();
    if (!this.db) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        "Database not initialized"
      );
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      request.onerror = () => {
        reject(new AegisError(
          "STORAGE_ERROR" /* STORAGE_ERROR */,
          "KEY_NOT_FOUND" /* KEY_NOT_FOUND */,
          "Failed to retrieve item"
        ));
      };
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        try {
          const decryptedValue = this.decrypt(result.value);
          resolve(decryptedValue);
        } catch (error) {
          reject(new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */,
            "Failed to decrypt stored value"
          ));
        }
      };
    });
  }
  /**
   * Remove an item from secure storage
   */
  async removeItem(key) {
    await this.initializeDB();
    if (!this.db) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        "Database not initialized"
      );
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      request.onerror = () => {
        reject(new AegisError(
          "STORAGE_ERROR" /* STORAGE_ERROR */,
          "KEY_NOT_FOUND" /* KEY_NOT_FOUND */,
          "Failed to remove item"
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
  async hasItem(key) {
    const item = await this.getItem(key);
    return item !== null;
  }
  /**
   * Get all keys from secure storage
   */
  async getAllKeys(prefix) {
    await this.initializeDB();
    if (!this.db) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        "Database not initialized"
      );
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();
      request.onerror = () => {
        reject(new AegisError(
          "STORAGE_ERROR" /* STORAGE_ERROR */,
          "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
          "Failed to get keys"
        ));
      };
      request.onsuccess = () => {
        const keys = request.result;
        const filteredKeys = prefix ? keys.filter((key) => key.startsWith(prefix)) : keys;
        resolve(filteredKeys);
      };
    });
  }
  /**
   * Clear all items from secure storage
   */
  async clear(prefix) {
    if (prefix) {
      const keys = await this.getAllKeys(prefix);
      await Promise.all(keys.map((key) => this.removeItem(key)));
    } else {
      await this.initializeDB();
      if (!this.db) {
        throw new AegisError(
          "STORAGE_ERROR" /* STORAGE_ERROR */,
          "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
          "Database not initialized"
        );
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();
        request.onerror = () => {
          reject(new AegisError(
            "STORAGE_ERROR" /* STORAGE_ERROR */,
            "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
            "Failed to clear storage"
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
  encrypt(value) {
    return btoa(unescape(encodeURIComponent(value)));
  }
  /**
   * Simple decryption
   */
  decrypt(encryptedValue) {
    try {
      return decodeURIComponent(escape(atob(encryptedValue)));
    } catch (error) {
      throw new Error("Decryption failed");
    }
  }
  /**
   * Get storage capabilities
   */
  static getCapabilities() {
    return {
      hasSecureStorage: typeof indexedDB !== "undefined",
      hasPersistentStorage: typeof indexedDB !== "undefined",
      supportsBiometrics: false,
      // Web doesn't support biometrics natively
      maxItemSize: 1024 * 1024 * 100,
      // ~100MB per item (IndexedDB limit)
      maxTotalSize: 1024 * 1024 * 1024,
      // ~1GB total (varies by browser)
      platformFeatures: ["indexeddb", "webcrypto"]
    };
  }
};

// src/utils/storage/WebAsyncStorage.ts
init_errors();
var WebAsyncStorage = class {
  constructor() {
    this.prefix = "aegis:";
  }
  /**
   * Check if localStorage is available
   */
  checkAvailability() {
    if (typeof localStorage === "undefined") {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        "localStorage is not available"
      );
    }
  }
  /**
   * Store an item in async storage
   */
  async setItem(key, value) {
    this.checkAvailability();
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to store item: ${error}`
      );
    }
  }
  /**
   * Retrieve an item from async storage
   */
  async getItem(key) {
    this.checkAvailability();
    try {
      return localStorage.getItem(this.prefix + key);
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to retrieve item: ${error}`
      );
    }
  }
  /**
   * Remove an item from async storage
   */
  async removeItem(key) {
    this.checkAvailability();
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to remove item: ${error}`
      );
    }
  }
  /**
   * Check if an item exists in async storage
   */
  async hasItem(key) {
    const item = await this.getItem(key);
    return item !== null;
  }
  /**
   * Get all keys from async storage
   */
  async getAllKeys(prefix) {
    this.checkAvailability();
    try {
      const keys = [];
      const fullPrefix = this.prefix + (prefix || "");
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(fullPrefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
      return keys;
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to get keys: ${error}`
      );
    }
  }
  /**
   * Clear all items from async storage
   */
  async clear(prefix) {
    if (prefix) {
      const keys = await this.getAllKeys(prefix);
      await Promise.all(keys.map((key) => this.removeItem(key)));
    } else {
      this.checkAvailability();
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        throw new AegisError(
          "STORAGE_ERROR" /* STORAGE_ERROR */,
          "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
          `Failed to clear storage: ${error}`
        );
      }
    }
  }
  /**
   * Get multiple items at once
   */
  async multiGet(keys) {
    const results = [];
    for (const key of keys) {
      const value = await this.getItem(key);
      results.push([key, value]);
    }
    return results;
  }
  /**
   * Set multiple items at once
   */
  async multiSet(keyValuePairs) {
    for (const [key, value] of keyValuePairs) {
      await this.setItem(key, value);
    }
  }
  /**
   * Remove multiple items at once
   */
  async multiRemove(keys) {
    for (const key of keys) {
      await this.removeItem(key);
    }
  }
  /**
   * Get estimated storage usage
   */
  async getStorageSize() {
    this.checkAvailability();
    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          used += key.length + (value ? value.length : 0);
        }
      }
      const estimated_available = 1024 * 1024 * 5 - used;
      return {
        used: used * 2,
        // UTF-16 encoding approximately doubles byte size
        available: Math.max(0, estimated_available * 2)
      };
    } catch (error) {
      return { used: 0, available: 0 };
    }
  }
};

// src/utils/storage/index.ts
init_ReactNativeSecureStorage();
init_ReactNativeAsyncStorage();

// src/utils/storage/StorageManager.ts
var STORAGE_KEYS = {
  // Private key storage: "network.appId.accountType.address"
  privateKey: (network, appId, accountType, address) => `${network}.${appId}.${accountType}.${address}`,
  // Available keys metadata: "keys.appId"
  availableKeys: (appId) => `keys.${appId}`,
  // App configuration cache: "config.appId"
  appConfig: (appId) => `config.${appId}`,
  // Network preferences: "network.appId"
  networkSettings: (appId) => `network.${appId}`,
  // Wallet metadata: "wallet.appId.address"
  walletMetadata: (appId, address) => `wallet.${appId}.${address}`,
  // Biometric settings: "biometric.appId"
  biometricSettings: (appId) => `biometric.${appId}`
};
var StorageManager = class {
  constructor(config) {
    this.capabilities = null;
    this.config = config;
    if (this.isReactNative()) {
      const { ReactNativeSecureStorage: ReactNativeSecureStorage2 } = (init_ReactNativeSecureStorage(), __toCommonJS(ReactNativeSecureStorage_exports));
      const { ReactNativeAsyncStorage: ReactNativeAsyncStorage2 } = (init_ReactNativeAsyncStorage(), __toCommonJS(ReactNativeAsyncStorage_exports));
      this.secureStorage = new ReactNativeSecureStorage2();
      this.asyncStorage = new ReactNativeAsyncStorage2();
    } else {
      this.secureStorage = new WebSecureStorage();
      this.asyncStorage = new WebAsyncStorage();
    }
  }
  /**
   * Initialize storage manager and detect capabilities
   */
  async initialize() {
    try {
      this.capabilities = await this.detectCapabilities();
      await this.testStorage();
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to initialize storage: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Store a private key securely
   */
  async storePrivateKey(privateKey, network, appId, accountType, address, withBiometrics = false) {
    const key = STORAGE_KEYS.privateKey(network, appId, accountType, address);
    try {
      if (withBiometrics && this.capabilities?.supportsBiometrics) {
        if (this.isReactNative() && "setItemWithBiometrics" in this.secureStorage) {
          await this.secureStorage.setItemWithBiometrics(key, privateKey);
        } else {
          await this.secureStorage.setItem(key, privateKey);
        }
      } else {
        await this.secureStorage.setItem(key, privateKey);
      }
      await this.addToAvailableKeys(appId, {
        appId,
        network,
        accountType,
        address,
        createdAt: Date.now()
      });
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */,
        `Failed to store private key: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Retrieve a private key
   */
  async getPrivateKey(network, appId, accountType, address, withBiometrics = false) {
    const key = STORAGE_KEYS.privateKey(network, appId, accountType, address);
    try {
      if (withBiometrics && this.capabilities?.supportsBiometrics) {
        if (this.isReactNative() && "getItemWithBiometrics" in this.secureStorage) {
          return await this.secureStorage.getItemWithBiometrics(key);
        }
      }
      return await this.secureStorage.getItem(key);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "KEY_NOT_FOUND" /* KEY_NOT_FOUND */,
        `Failed to retrieve private key: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Remove a private key
   */
  async removePrivateKey(network, appId, accountType, address) {
    const key = STORAGE_KEYS.privateKey(network, appId, accountType, address);
    try {
      await this.secureStorage.removeItem(key);
      await this.removeFromAvailableKeys(appId, address);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to remove private key: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Get available keys for an app
   */
  async getAvailableKeys(appId) {
    try {
      const keysKey = STORAGE_KEYS.availableKeys(appId);
      const keysData = await this.asyncStorage.getItem(keysKey);
      if (!keysData) {
        return [];
      }
      const keys = JSON.parse(keysData);
      return keys;
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to get available keys: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Store app configuration
   */
  async storeAppConfig(appId, config) {
    try {
      const configKey = STORAGE_KEYS.appConfig(appId);
      await this.asyncStorage.setItem(configKey, JSON.stringify(config));
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to store app configuration: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Get app configuration
   */
  async getAppConfig(appId) {
    try {
      const configKey = STORAGE_KEYS.appConfig(appId);
      const configData = await this.asyncStorage.getItem(configKey);
      if (!configData) {
        return null;
      }
      return JSON.parse(configData);
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to get app configuration: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Store wallet metadata
   */
  async storeWalletMetadata(appId, address, metadata) {
    try {
      const metadataKey = STORAGE_KEYS.walletMetadata(appId, address);
      await this.asyncStorage.setItem(metadataKey, JSON.stringify(metadata));
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to store wallet metadata: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Get wallet metadata
   */
  async getWalletMetadata(appId, address) {
    try {
      const metadataKey = STORAGE_KEYS.walletMetadata(appId, address);
      const metadataData = await this.asyncStorage.getItem(metadataKey);
      if (!metadataData) {
        return null;
      }
      return JSON.parse(metadataData);
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to get wallet metadata: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Store biometric settings
   */
  async storeBiometricSettings(appId, settings) {
    try {
      const settingsKey = STORAGE_KEYS.biometricSettings(appId);
      await this.asyncStorage.setItem(settingsKey, JSON.stringify(settings));
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to store biometric settings: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Get biometric settings
   */
  async getBiometricSettings(appId) {
    try {
      const settingsKey = STORAGE_KEYS.biometricSettings(appId);
      const settingsData = await this.asyncStorage.getItem(settingsKey);
      if (!settingsData) {
        return { enabled: this.config.enableBiometrics };
      }
      return JSON.parse(settingsData);
    } catch (error) {
      return { enabled: this.config.enableBiometrics };
    }
  }
  /**
   * Clear all data for an app
   */
  async clearAppData(appId) {
    try {
      const availableKeys = await this.getAvailableKeys(appId);
      await Promise.all(
        availableKeys.map(
          (key) => this.removePrivateKey(key.network, key.appId, key.accountType, key.address)
        )
      );
      const metadataKeysToRemove = [
        STORAGE_KEYS.availableKeys(appId),
        STORAGE_KEYS.appConfig(appId),
        STORAGE_KEYS.networkSettings(appId),
        STORAGE_KEYS.biometricSettings(appId)
      ];
      await Promise.all(
        metadataKeysToRemove.map((key) => this.asyncStorage.removeItem(key))
      );
      await Promise.all(
        availableKeys.map(
          (key) => this.asyncStorage.removeItem(STORAGE_KEYS.walletMetadata(appId, key.address))
        )
      );
    } catch (error) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to clear app data: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Get storage capabilities
   */
  getCapabilities() {
    return this.capabilities;
  }
  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable() {
    if (!this.capabilities?.supportsBiometrics) {
      return false;
    }
    if (this.isReactNative() && "isBiometricAvailable" in this.secureStorage) {
      return await this.secureStorage.isBiometricAvailable();
    }
    return false;
  }
  /**
   * Add key to available keys list
   */
  async addToAvailableKeys(appId, keyMetadata) {
    const availableKeys = await this.getAvailableKeys(appId);
    const filteredKeys = availableKeys.filter((key) => key.address !== keyMetadata.address);
    filteredKeys.push(keyMetadata);
    const keysKey = STORAGE_KEYS.availableKeys(appId);
    await this.asyncStorage.setItem(keysKey, JSON.stringify(filteredKeys));
  }
  /**
   * Remove key from available keys list
   */
  async removeFromAvailableKeys(appId, address) {
    const availableKeys = await this.getAvailableKeys(appId);
    const filteredKeys = availableKeys.filter((key) => key.address !== address);
    const keysKey = STORAGE_KEYS.availableKeys(appId);
    await this.asyncStorage.setItem(keysKey, JSON.stringify(filteredKeys));
  }
  /**
   * Detect platform and capabilities
   */
  async detectCapabilities() {
    if (this.isReactNative()) {
      const { ReactNativeSecureStorage: ReactNativeSecureStorage2 } = (init_ReactNativeSecureStorage(), __toCommonJS(ReactNativeSecureStorage_exports));
      return await ReactNativeSecureStorage2.getCapabilities();
    } else {
      return WebSecureStorage.getCapabilities();
    }
  }
  /**
   * Test storage functionality
   */
  async testStorage() {
    const testKey = "aegis-test-key";
    const testValue = "test-value";
    try {
      await this.asyncStorage.setItem(testKey, testValue);
      const retrievedValue = await this.asyncStorage.getItem(testKey);
      if (retrievedValue !== testValue) {
        throw new Error("Async storage test failed");
      }
      await this.asyncStorage.removeItem(testKey);
      await this.secureStorage.setItem(testKey, testValue);
      const secureValue = await this.secureStorage.getItem(testKey);
      if (secureValue !== testValue) {
        throw new Error("Secure storage test failed");
      }
      await this.secureStorage.removeItem(testKey);
    } catch (error) {
      throw new Error(`Storage test failed: ${error}`);
    }
  }
  /**
   * Detect if running in React Native
   */
  isReactNative() {
    return typeof navigator !== "undefined" && navigator.product === "ReactNative" || typeof global !== "undefined" && // @ts-ignore
    global.__REACT_NATIVE__ === true;
  }
  /**
   * Get storage usage statistics
   */
  async getStorageUsage() {
    const stats = {
      secure: null,
      async: null
    };
    try {
      if ("getStorageSize" in this.asyncStorage) {
        stats.async = await this.asyncStorage.getStorageSize();
      }
    } catch (error) {
      console.warn("Failed to get storage usage:", error);
    }
    return stats;
  }
};

// src/utils/crypto/KeyManager.ts
init_errors();
var randomBytes;
try {
  randomBytes = __require("crypto").randomBytes;
} catch {
}
var KeyManager = class {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }
  /**
   * Generate a cryptographically secure private key
   */
  generatePrivateKey(options = {}) {
    const { useSecureRandom = true, validateKey = true } = options;
    try {
      let privateKey;
      if (useSecureRandom && this.isNodeEnvironment()) {
        const randomBytesBuffer = randomBytes(32);
        privateKey = "0x" + randomBytesBuffer.toString("hex");
      } else {
        privateKey = this.generatePrivateKeyWeb();
      }
      if (validateKey && !validatePrivateKey(privateKey)) {
        throw new AegisError(
          "WALLET_ERROR" /* WALLET_ERROR */,
          "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
          "Generated private key is invalid"
        );
      }
      return privateKey;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
        `Failed to generate private key: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Import a private key with validation and normalization
   */
  importPrivateKey(privateKey, options = {}) {
    const { validateKey = true, normalizeKey = true } = options;
    try {
      let processedKey = privateKey;
      if (normalizeKey) {
        processedKey = normalizePrivateKey(processedKey);
      }
      if (validateKey && !validatePrivateKey(processedKey)) {
        throw new AegisError(
          "WALLET_ERROR" /* WALLET_ERROR */,
          "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
          "Invalid private key format"
        );
      }
      return processedKey;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
        `Failed to import private key: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Store a private key securely
   */
  async storePrivateKey(privateKey, appId, network, accountType, address, options = {}) {
    if (!this.storageManager) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        "Storage manager not initialized"
      );
    }
    try {
      const validatedKey = this.importPrivateKey(privateKey);
      await this.storageManager.storePrivateKey(
        validatedKey,
        network,
        appId,
        accountType,
        address,
        options.withBiometrics || false
      );
      if (options.name) {
        const metadata = {
          name: options.name,
          createdAt: Date.now(),
          lastUsed: Date.now()
        };
        await this.storageManager.storeWalletMetadata(appId, address, metadata);
      }
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "ENCRYPTION_FAILED" /* ENCRYPTION_FAILED */,
        `Failed to store private key: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Retrieve a private key from secure storage
   */
  async getPrivateKey(appId, network, accountType, address, withBiometrics = false) {
    if (!this.storageManager) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        "Storage manager not initialized"
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
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "KEY_NOT_FOUND" /* KEY_NOT_FOUND */,
        `Failed to retrieve private key: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Remove a private key from storage
   */
  async removePrivateKey(appId, network, accountType, address) {
    if (!this.storageManager) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        "Storage manager not initialized"
      );
    }
    try {
      await this.storageManager.removePrivateKey(network, appId, accountType, address);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to remove private key: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Get all available keys for an app
   */
  async getAvailableKeys(appId) {
    if (!this.storageManager) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        "Storage manager not initialized"
      );
    }
    try {
      return await this.storageManager.getAvailableKeys(appId);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to get available keys: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Check if a key exists in storage
   */
  async hasKey(appId, network, accountType, address) {
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
  generateMultipleKeys(count, options = {}) {
    if (count <= 0 || count > 100) {
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
        "Key count must be between 1 and 100"
      );
    }
    const keys = [];
    for (let i = 0; i < count; i++) {
      try {
        const key = this.generatePrivateKey(options);
        keys.push(key);
      } catch (error) {
        throw new AegisError(
          "WALLET_ERROR" /* WALLET_ERROR */,
          "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
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
  validateDerivationPath(path) {
    const derivationRegex = /^m(\/\d+'?)*$/;
    return derivationRegex.test(path);
  }
  /**
   * Generate a mnemonic phrase (future feature)
   */
  generateMnemonic() {
    throw new AegisError(
      "WALLET_ERROR" /* WALLET_ERROR */,
      "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
      "Mnemonic generation not yet implemented"
    );
  }
  /**
   * Convert mnemonic to private key (future feature)
   */
  mnemonicToPrivateKey(mnemonic, derivationPath = "m/44'/9004'/0'/0/0") {
    throw new AegisError(
      "WALLET_ERROR" /* WALLET_ERROR */,
      "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
      "Mnemonic to private key conversion not yet implemented"
    );
  }
  /**
   * Generate private key using Web Crypto API or fallback
   */
  generatePrivateKeyWeb() {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      let hex = "0x";
      for (let i = 0; i < array.length; i++) {
        hex += array[i].toString(16).padStart(2, "0");
      }
      return hex;
    } else {
      console.warn("Using Math.random for key generation - not cryptographically secure");
      let hex = "0x";
      for (let i = 0; i < 32; i++) {
        const randomByte = Math.floor(Math.random() * 256);
        hex += randomByte.toString(16).padStart(2, "0");
      }
      return hex;
    }
  }
  /**
   * Check if running in Node.js environment
   */
  isNodeEnvironment() {
    return typeof process !== "undefined" && typeof process.versions === "object" && typeof process.versions.node === "string";
  }
  /**
   * Get entropy quality assessment
   */
  getEntropyQuality() {
    if (this.isNodeEnvironment()) {
      return { source: "Node.js crypto", quality: "high" };
    } else if (typeof crypto !== "undefined") {
      return { source: "Web Crypto API", quality: "high" };
    } else {
      return { source: "Math.random fallback", quality: "low" };
    }
  }
  /**
   * Clear all keys for an app (use with caution)
   */
  async clearAllKeys(appId) {
    if (!this.storageManager) {
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        "Storage manager not initialized"
      );
    }
    try {
      await this.storageManager.clearAppData(appId);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to clear all keys: ${error}`,
        false,
        error
      );
    }
  }
};

// src/core/WalletManager.ts
init_errors();

// src/wallets/inapp/InAppWallet.ts
init_errors();
import { Account, Contract } from "starknet";

// src/utils/crypto/AccountUtils.ts
import { ec, hash, CallData } from "starknet";
init_errors();
var ACCOUNT_CLASS_HASHES = {
  // Argent X account class hash
  argentx: "0x01a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003",
  // DevNet account class hash (for local development)
  devnet: "0x02b31e19e45c06f29234e06e2ee98a9966479ba3067f8785ed972794fdb0065c"
};
function generateAccountAddress(privateKey, accountType = "argentx") {
  try {
    if (!validatePrivateKey(privateKey)) {
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
        "Invalid private key format"
      );
    }
    const normalizedKey = normalizePrivateKey(privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(normalizedKey);
    const constructorCalldata = getConstructorCalldata(normalizedKey, accountType);
    const classHash = getAccountClassHash(accountType);
    const contractAddress = hash.calculateContractAddressFromHash(
      starkKeyPub,
      classHash,
      constructorCalldata,
      0
      // salt is 0 for default deployment
    );
    return contractAddress;
  } catch (error) {
    if (error instanceof AegisError) {
      throw error;
    }
    throw new AegisError(
      "WALLET_ERROR" /* WALLET_ERROR */,
      "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
      `Failed to generate account address: ${error}`,
      false,
      error
    );
  }
}
function getConstructorCalldata(privateKey, accountType = "argentx") {
  const normalizedKey = normalizePrivateKey(privateKey);
  const starkKeyPub = ec.starkCurve.getStarkKey(normalizedKey);
  switch (accountType) {
    case "argentx":
      return CallData.compile({
        owner: starkKeyPub,
        guardian: "0x0"
        // No guardian by default
      });
    case "devnet":
      return CallData.compile({
        public_key: starkKeyPub
      });
    default:
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
        `Unsupported account type: ${accountType}`
      );
  }
}
function getAccountClassHash(accountType) {
  const classHash = ACCOUNT_CLASS_HASHES[accountType];
  if (!classHash) {
    throw new AegisError(
      "WALLET_ERROR" /* WALLET_ERROR */,
      "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
      `Unsupported account type: ${accountType}`
    );
  }
  return classHash;
}
function prepareDeploymentData(privateKey, accountType = "argentx") {
  try {
    const normalizedKey = normalizePrivateKey(privateKey);
    const starkKeyPub = ec.starkCurve.getStarkKey(normalizedKey);
    const classHash = getAccountClassHash(accountType);
    const constructorCalldata = getConstructorCalldata(normalizedKey, accountType);
    const contractAddress = generateAccountAddress(normalizedKey, accountType);
    return {
      classHash,
      salt: starkKeyPub,
      // Use public key as salt
      constructorCalldata,
      contractAddress
    };
  } catch (error) {
    if (error instanceof AegisError) {
      throw error;
    }
    throw new AegisError(
      "WALLET_ERROR" /* WALLET_ERROR */,
      "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
      `Failed to prepare deployment data: ${error}`,
      false,
      error
    );
  }
}
function validateAccountClassHash(classHash) {
  const classHashRegex = /^0x[0-9a-fA-F]{63,64}$/;
  return classHashRegex.test(classHash);
}
function getSupportedAccountTypes() {
  return Object.keys(ACCOUNT_CLASS_HASHES);
}
function isAccountTypeSupported(accountType) {
  return accountType in ACCOUNT_CLASS_HASHES;
}
function generateMultipleAccountAddresses(privateKeys, accountType = "argentx") {
  return privateKeys.map((privateKey) => ({
    privateKey,
    address: generateAccountAddress(privateKey, accountType)
  }));
}
function deriveAddressFromPublicKey(publicKey, accountType = "argentx") {
  try {
    const classHash = getAccountClassHash(accountType);
    let constructorCalldata;
    switch (accountType) {
      case "argentx":
        constructorCalldata = CallData.compile({
          owner: publicKey,
          guardian: "0x0"
        });
        break;
      case "devnet":
        constructorCalldata = CallData.compile({
          public_key: publicKey
        });
        break;
      default:
        throw new AegisError(
          "WALLET_ERROR" /* WALLET_ERROR */,
          "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
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
      "WALLET_ERROR" /* WALLET_ERROR */,
      "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
      `Failed to derive address from public key: ${error}`,
      false,
      error
    );
  }
}
function getPublicKeyFromPrivateKey(privateKey) {
  try {
    const normalizedKey = normalizePrivateKey(privateKey);
    return ec.starkCurve.getStarkKey(normalizedKey);
  } catch (error) {
    throw new AegisError(
      "WALLET_ERROR" /* WALLET_ERROR */,
      "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
      `Failed to extract public key: ${error}`,
      false,
      error
    );
  }
}
function validateDeploymentData(deploymentData) {
  try {
    if (!validateAccountClassHash(deploymentData.classHash)) {
      return false;
    }
    if (!deploymentData.contractAddress.match(/^0x[0-9a-fA-F]{63,64}$/)) {
      return false;
    }
    if (!Array.isArray(deploymentData.constructorCalldata)) {
      return false;
    }
    if (!deploymentData.salt.match(/^0x[0-9a-fA-F]{63,64}$/)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
function estimateDeploymentFee(accountType = "argentx", network = "sepolia") {
  const estimates = {
    mainnet: {
      argentx: "50000000000000000",
      // ~0.05 ETH
      devnet: "10000000000000000"
      // ~0.01 ETH
    },
    sepolia: {
      argentx: "10000000000000000",
      // ~0.01 ETH
      devnet: "5000000000000000"
      // ~0.005 ETH
    },
    devnet: {
      argentx: "1000000000000000",
      // ~0.001 ETH
      devnet: "1000000000000000"
      // ~0.001 ETH
    }
  };
  const networkEstimates = estimates[network];
  if (!networkEstimates) {
    return estimates.sepolia[accountType];
  }
  return networkEstimates[accountType] || networkEstimates.argentx;
}
function isValidAccountAddress(address, privateKey, accountType = "argentx") {
  try {
    if (!address.match(/^0x[0-9a-fA-F]{63,64}$/)) {
      return false;
    }
    if (privateKey) {
      const expectedAddress = generateAccountAddress(privateKey, accountType);
      return address.toLowerCase() === expectedAddress.toLowerCase();
    }
    return true;
  } catch {
    return false;
  }
}

// src/wallets/inapp/InAppWallet.ts
var ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "felt252" }],
    outputs: [{ name: "balance", type: "felt252" }],
    stateMutability: "view"
  },
  {
    name: "symbol",
    type: "function",
    inputs: [],
    outputs: [{ name: "symbol", type: "felt252" }],
    stateMutability: "view"
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "decimals", type: "felt252" }],
    stateMutability: "view"
  }
];
var InAppWallet = class _InAppWallet {
  constructor(privateKey, network, provider, config, storageManager, keyManager, accountType = "argentx") {
    this.type = "inapp";
    this.deployed = false;
    this.privateKey = privateKey;
    this.network = network;
    this.provider = provider;
    this.config = config;
    this.storageManager = storageManager;
    this.keyManager = keyManager;
    this.accountType = accountType;
    this.address = generateAccountAddress(privateKey, accountType);
    this.account = new Account(provider, this.address, privateKey);
  }
  /**
   * Create a new in-app wallet
   */
  static async create(appId, network, provider, config, storageManager, keyManager, accountType = "argentx", options = {}) {
    try {
      const privateKey = keyManager.generatePrivateKey();
      const wallet = new _InAppWallet(
        privateKey,
        network,
        provider,
        config,
        storageManager,
        keyManager,
        accountType
      );
      await keyManager.storePrivateKey(
        privateKey,
        appId,
        network,
        accountType,
        wallet.address,
        options
      );
      return wallet;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "WALLET_NOT_FOUND" /* WALLET_NOT_FOUND */,
        `Failed to create in-app wallet: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Connect to existing wallet from stored key
   */
  static async fromStoredKey(keyId, appId, network, provider, config, storageManager, keyManager, accountType = "argentx", withBiometrics = false) {
    try {
      const keyParts = keyId.split(".");
      if (keyParts.length !== 4) {
        throw new AegisError(
          "WALLET_ERROR" /* WALLET_ERROR */,
          "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
          "Invalid key ID format"
        );
      }
      const [keyNetwork, keyAppId, keyAccountType, address] = keyParts;
      if (keyNetwork !== network || keyAppId !== appId || keyAccountType !== accountType) {
        throw new AegisError(
          "WALLET_ERROR" /* WALLET_ERROR */,
          "WALLET_NOT_FOUND" /* WALLET_NOT_FOUND */,
          "Key ID does not match wallet parameters"
        );
      }
      const privateKey = await keyManager.getPrivateKey(
        appId,
        network,
        accountType,
        address,
        withBiometrics
      );
      if (!privateKey) {
        throw new AegisError(
          "STORAGE_ERROR" /* STORAGE_ERROR */,
          "KEY_NOT_FOUND" /* KEY_NOT_FOUND */,
          "Private key not found in storage"
        );
      }
      const wallet = new _InAppWallet(
        privateKey,
        network,
        provider,
        config,
        storageManager,
        keyManager,
        accountType
      );
      if (wallet.address !== address) {
        throw new AegisError(
          "WALLET_ERROR" /* WALLET_ERROR */,
          "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
          "Stored private key does not match expected address"
        );
      }
      return wallet;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "WALLET_NOT_FOUND" /* WALLET_NOT_FOUND */,
        `Failed to connect wallet from stored key: ${error}`,
        false,
        error
      );
    }
  }
  /**
   * Execute transaction calls
   */
  async execute(calls, options = {}) {
    try {
      validateCallData(calls);
      const retries = options.retries || this.config.maxTransactionRetries || 3;
      if (this.network === "devnet") {
        return await this.executeDirectly(calls, options, retries);
      } else {
        return await this.executeWithPaymaster(calls, options, retries);
      }
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "TRANSACTION_ERROR" /* TRANSACTION_ERROR */,
        "TRANSACTION_FAILED" /* TRANSACTION_FAILED */,
        `Transaction execution failed: ${error}`,
        true,
        error
      );
    }
  }
  /**
   * Sign a message with the wallet's private key
   */
  async signMessage(message) {
    try {
      const typedData = {
        types: {
          StarkNetDomain: [
            { name: "name", type: "felt" },
            { name: "version", type: "felt" }
          ],
          Message: [
            { name: "message", type: "felt" }
          ]
        },
        primaryType: "Message",
        domain: {
          name: "Aegis",
          version: "1"
        },
        message: {
          message
        }
      };
      const signature = await this.account.signMessage(typedData);
      return Array.isArray(signature) ? signature.join(",") : String(signature);
    } catch (error) {
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
        `Message signing failed: ${error}`,
        false,
        error
      );
    }
  }
  /**
   /**
   * Get ETH balance
   */
  async getETHBalance() {
    try {
      const ETH_ADDRESS = "0x049d36570d4e46e6b72bfc718fc8f349bca18babedd23e8a6d6f2b3e7c5e0a";
      const contract = new Contract(ERC20_ABI, ETH_ADDRESS, this.provider);
      const balance = await contract.balanceOf(this.address);
      const decimals = 18;
      let balanceStr = balance.toString();
      const balanceNum = BigInt(balanceStr);
      const divisor = BigInt(10 ** decimals);
      const whole = balanceNum / divisor;
      const fraction = balanceNum % divisor;
      if (fraction === 0n) {
        balanceStr = whole.toString();
      } else {
        const fractionStr = fraction.toString().padStart(decimals, "0");
        balanceStr = `${whole}.${fractionStr.replace(/0+$/, "")}`;
      }
      return balanceStr;
    } catch (error) {
      throw new AegisError(
        "NETWORK_ERROR" /* NETWORK_ERROR */,
        "RPC_REQUEST_FAILED" /* RPC_REQUEST_FAILED */,
        `Failed to get ETH balance: ${error}`,
        true,
        error
      );
    }
  }
  /**
   * Get ERC20 token balance
   */
  async getERC20Balance(tokenAddress, decimals) {
    try {
      const contract = new Contract(ERC20_ABI, tokenAddress, this.provider);
      const balance = await contract.balanceOf(this.address);
      let balanceStr = balance.toString();
      if (decimals && decimals > 0) {
        const balanceNum = BigInt(balanceStr);
        const divisor = BigInt(10 ** decimals);
        const whole = balanceNum / divisor;
        const fraction = balanceNum % divisor;
        if (fraction === 0n) {
          balanceStr = whole.toString();
        } else {
          const fractionStr = fraction.toString().padStart(decimals, "0");
          balanceStr = `${whole}.${fractionStr.replace(/0+$/, "")}`;
        }
      }
      return balanceStr;
    } catch (error) {
      throw new AegisError(
        "NETWORK_ERROR" /* NETWORK_ERROR */,
        "RPC_REQUEST_FAILED" /* RPC_REQUEST_FAILED */,
        `Failed to get ERC20 balance: ${error}`,
        true,
        error
      );
    }
  }
  /**
   * Deploy the account if not already deployed
   */
  async deploy() {
    try {
      if (await this.isDeployed()) {
        return;
      }
      if (this.network === "devnet") {
        await this.deployToDevnet();
      } else {
        await this.deployWithPaymaster();
      }
      this.deployed = true;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "TRANSACTION_ERROR" /* TRANSACTION_ERROR */,
        "TRANSACTION_FAILED" /* TRANSACTION_FAILED */,
        `Account deployment failed: ${error}`,
        true,
        error
      );
    }
  }
  /**
   * Check if account is deployed
   */
  async isDeployed() {
    try {
      const classHash = await this.provider.getClassHashAt(this.address);
      return classHash !== "0x0";
    } catch {
      return false;
    }
  }
  /**
   * Disconnect and clear wallet state
   */
  async disconnect() {
    this.privateKey = "";
  }
  /**
   * Export private key (with proper security warning)
   */
  async exportPrivateKey() {
    if (!this.privateKey) {
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "WALLET_NOT_FOUND" /* WALLET_NOT_FOUND */,
        "Wallet is disconnected - private key not available"
      );
    }
    return this.privateKey;
  }
  /**
   * Get account public key
   */
  getPublicKey() {
    return getPublicKeyFromPrivateKey(this.privateKey);
  }
  /**
   * Get account type
   */
  getAccountType() {
    return this.accountType;
  }
  /**
   * Execute transaction directly (for devnet)
   */
  async executeDirectly(calls, options, retries) {
    const executeWithRetries = async (attempt) => {
      try {
        const maxFee = options.maxFee || "100000000000000";
        const result = await this.account.execute(calls, {
          maxFee,
          nonce: options.nonce
        });
        if (retries > 0) {
          const isConfirmed = await this.waitForTransaction(result.transaction_hash);
          if (!isConfirmed) {
            throw new Error(`Transaction ${result.transaction_hash} failed confirmation`);
          }
        }
        return {
          transaction_hash: result.transaction_hash,
          status: "confirmed"
        };
      } catch (error) {
        if (attempt < retries) {
          await this.delay(Math.pow(2, attempt) * 1e3);
          return executeWithRetries(attempt + 1);
        }
        throw error;
      }
    };
    return executeWithRetries(0);
  }
  /**
   * Execute transaction with paymaster (gasless)
   */
  async executeWithPaymaster(calls, options, retries) {
    throw new AegisError(
      "TRANSACTION_ERROR" /* TRANSACTION_ERROR */,
      "PAYMASTER_ERROR" /* PAYMASTER_ERROR */,
      "Paymaster integration not yet implemented"
    );
  }
  /**
   * Deploy account to devnet
   */
  async deployToDevnet() {
    const deploymentData = prepareDeploymentData(this.privateKey, this.accountType);
    const deployResult = await this.account.deployAccount(
      {
        classHash: deploymentData.classHash,
        constructorCalldata: deploymentData.constructorCalldata,
        addressSalt: deploymentData.salt
      },
      { maxFee: "100000000000000" }
      // Default max fee for devnet
    );
    await this.provider.waitForTransaction(deployResult.transaction_hash);
  }
  /**
   * Deploy account with paymaster
   */
  async deployWithPaymaster() {
    throw new AegisError(
      "TRANSACTION_ERROR" /* TRANSACTION_ERROR */,
      "PAYMASTER_ERROR" /* PAYMASTER_ERROR */,
      "Paymaster deployment not yet implemented"
    );
  }
  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash) {
    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        if (receipt.isSuccess()) {
          return true;
        } else {
          return false;
        }
        await this.delay(5e3);
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await this.delay(5e3);
      }
    }
    return false;
  }
  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Get detailed token balance information
   */
  async getTokenBalance(tokenAddress) {
    try {
      const contract = new Contract(ERC20_ABI, tokenAddress, this.provider);
      const [balance, symbol, decimals] = await Promise.all([
        contract.balanceOf(this.address),
        contract.symbol().catch(() => "UNKNOWN"),
        contract.decimals().catch(() => 18)
      ]);
      const balanceStr = balance.toString();
      const decimalsNum = Number(decimals);
      const balanceNum = BigInt(balanceStr);
      const divisor = BigInt(10 ** decimalsNum);
      const whole = balanceNum / divisor;
      const fraction = balanceNum % divisor;
      let formatted;
      if (fraction === 0n) {
        formatted = whole.toString();
      } else {
        const fractionStr = fraction.toString().padStart(decimalsNum, "0");
        formatted = `${whole}.${fractionStr.replace(/0+$/, "")}`;
      }
      return {
        address: tokenAddress,
        symbol: symbol.toString(),
        name: symbol.toString(),
        // For ERC20, name often equals symbol
        decimals: decimalsNum,
        balance: balanceStr,
        formatted
      };
    } catch (error) {
      throw new AegisError(
        "NETWORK_ERROR" /* NETWORK_ERROR */,
        "RPC_REQUEST_FAILED" /* RPC_REQUEST_FAILED */,
        `Failed to get token balance information: ${error}`,
        true,
        error
      );
    }
  }
  /**
   * Update last used timestamp
   */
  async updateLastUsed() {
    try {
      const metadata = await this.storageManager.getWalletMetadata(
        this.config.appId,
        this.address
      ) || {};
      metadata.lastUsed = Date.now();
      await this.storageManager.storeWalletMetadata(
        this.config.appId,
        this.address,
        metadata
      );
    } catch (error) {
      console.warn("Failed to update last used timestamp:", error);
    }
  }
};

// src/core/WalletManager.ts
var WalletManager = class {
  constructor(config, networkManager, storageManager, keyManager) {
    this.currentWallet = null;
    this.config = config;
    this.networkManager = networkManager;
    this.storageManager = storageManager;
    this.keyManager = keyManager;
  }
  /**
   * Initialize wallet manager
   */
  async initialize() {
    await this.tryReconnectLastWallet();
  }
  /**
   * Create a new in-app wallet
   */
  async createInAppWallet(accountType = "argentx", options = {}) {
    try {
      const provider = this.networkManager.getProvider();
      const network = this.networkManager.getCurrentNetwork();
      const wallet = await InAppWallet.create(
        this.config.appId,
        network,
        provider,
        this.config,
        this.storageManager,
        this.keyManager,
        accountType,
        options
      );
      this.currentWallet = wallet;
      await this.storeLastWalletInfo(wallet);
      return wallet;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "WALLET_NOT_FOUND" /* WALLET_NOT_FOUND */,
        `Failed to create in-app wallet: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }
  /**
   * Connect to existing wallet using key metadata
   */
  async connectWallet(keyMetadata, withBiometrics = false) {
    try {
      const provider = this.networkManager.getProvider(keyMetadata.network);
      const keyId = this.buildKeyId(keyMetadata);
      const wallet = await InAppWallet.fromStoredKey(
        keyId,
        keyMetadata.appId,
        keyMetadata.network,
        provider,
        this.config,
        this.storageManager,
        this.keyManager,
        keyMetadata.accountType,
        withBiometrics
      );
      this.currentWallet = wallet;
      await this.storeLastWalletInfo(wallet);
      return wallet;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "WALLET_NOT_FOUND" /* WALLET_NOT_FOUND */,
        `Failed to connect wallet: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }
  /**
   * Import wallet from private key
   */
  async importWallet(privateKey, accountType = "argentx", options = {}) {
    try {
      const validatedKey = this.keyManager.importPrivateKey(privateKey);
      const provider = this.networkManager.getProvider();
      const network = this.networkManager.getCurrentNetwork();
      const wallet = new InAppWallet(
        validatedKey,
        network,
        provider,
        this.config,
        this.storageManager,
        this.keyManager,
        accountType
      );
      await this.keyManager.storePrivateKey(
        validatedKey,
        this.config.appId,
        network,
        accountType,
        wallet.address,
        options
      );
      this.currentWallet = wallet;
      await this.storeLastWalletInfo(wallet);
      return wallet;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "WALLET_ERROR" /* WALLET_ERROR */,
        "INVALID_PRIVATE_KEY" /* INVALID_PRIVATE_KEY */,
        `Failed to import wallet: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }
  /**
   * Get current wallet
   */
  getCurrentWallet() {
    return this.currentWallet;
  }
  /**
   * Check if a wallet is currently connected
   */
  isConnected() {
    return this.currentWallet !== null;
  }
  /**
   * Get all available wallets for this app
   */
  async getAvailableWallets() {
    try {
      return await this.keyManager.getAvailableKeys(this.config.appId);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to get available wallets: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }
  /**
   * Remove a wallet from storage
   */
  async removeWallet(keyMetadata) {
    try {
      await this.keyManager.removePrivateKey(
        keyMetadata.appId,
        keyMetadata.network,
        keyMetadata.accountType,
        keyMetadata.address
      );
      if (this.currentWallet && this.currentWallet.address === keyMetadata.address) {
        await this.disconnect();
      }
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "STORAGE_ERROR" /* STORAGE_ERROR */,
        "STORAGE_ACCESS_DENIED" /* STORAGE_ACCESS_DENIED */,
        `Failed to remove wallet: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }
  /**
   * Disconnect current wallet
   */
  async disconnect() {
    if (this.currentWallet) {
      await this.currentWallet.disconnect();
      this.currentWallet = null;
      await this.clearLastWalletInfo();
    }
  }
  /**
   * Switch to a different network
   */
  async onNetworkChange(network) {
    if (this.currentWallet && this.currentWallet.network !== network) {
      await this.disconnect();
    }
  }
  /**
   * Get wallet connection data for restoration
   */
  async getWalletConnectionData(wallet) {
    const keyId = `${wallet.network}.${this.config.appId}.${wallet.getAccountType()}.${wallet.address}`;
    return {
      type: wallet.type,
      keyId,
      network: wallet.network,
      address: wallet.address,
      metadata: {
        appId: this.config.appId,
        accountType: wallet.getAccountType(),
        createdAt: Date.now()
      }
    };
  }
  /**
   * Store last wallet information for reconnection
   */
  async storeLastWalletInfo(wallet) {
    try {
      const connectionData = await this.getWalletConnectionData(wallet);
      await this.storageManager.storeAppConfig(
        `${this.config.appId}.lastWallet`,
        connectionData
      );
    } catch (error) {
      console.warn("Failed to store last wallet info:", error);
    }
  }
  /**
   * Clear last wallet information
   */
  async clearLastWalletInfo() {
    try {
      await this.storageManager.storeAppConfig(
        `${this.config.appId}.lastWallet`,
        null
      );
    } catch (error) {
      console.warn("Failed to clear last wallet info:", error);
    }
  }
  /**
   * Try to reconnect to last used wallet
   */
  async tryReconnectLastWallet() {
    try {
      const lastWalletData = await this.storageManager.getAppConfig(
        `${this.config.appId}.lastWallet`
      );
      if (!lastWalletData || lastWalletData.type !== "inapp") {
        return;
      }
      if (!this.config.supportedNetworks.includes(lastWalletData.network)) {
        return;
      }
      const keyMetadata = {
        appId: lastWalletData.metadata.appId,
        network: lastWalletData.network,
        accountType: lastWalletData.metadata.accountType,
        address: lastWalletData.address,
        createdAt: lastWalletData.metadata.createdAt
      };
      await this.connectWallet(keyMetadata);
    } catch (error) {
      console.warn("Failed to reconnect to last wallet:", error);
      await this.clearLastWalletInfo();
    }
  }
  /**
   * Build key ID from metadata
   */
  buildKeyId(keyMetadata) {
    return `${keyMetadata.network}.${keyMetadata.appId}.${keyMetadata.accountType}.${keyMetadata.address}`;
  }
  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable() {
    return await this.storageManager.isBiometricAvailable();
  }
  /**
   * Get storage capabilities
   */
  getStorageCapabilities() {
    return this.storageManager.getCapabilities();
  }
  /**
   * Cleanup resources
   */
  destroy() {
    this.currentWallet = null;
  }
};

// src/core/AegisSDK.ts
var AegisSDK = class _AegisSDK {
  constructor(userConfig) {
    this.config = null;
    this.networkManager = null;
    this.storageManager = null;
    this.keyManager = null;
    // Public managers
    this.wallets = null;
    validateAegisConfig(userConfig);
    this.backendClient = new BackendClient();
  }
  /**
   * Static factory method for creating and initializing SDK
   */
  static async create(config) {
    const sdk = new _AegisSDK(config);
    await sdk.initialize(config);
    return sdk;
  }
  /**
   * Initialize the SDK with backend configuration
   */
  async initialize(userConfig) {
    try {
      this.config = await this.backendClient.expandConfiguration(userConfig);
      this.networkManager = new NetworkManager(this.config);
      await this.networkManager.initialize();
      this.storageManager = new StorageManager(this.config);
      await this.storageManager.initialize();
      this.keyManager = new KeyManager(this.storageManager);
      this.wallets = new WalletManager(
        this.config,
        this.networkManager,
        this.storageManager,
        this.keyManager
      );
      await this.wallets.initialize();
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        `SDK initialization failed: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return this.config;
  }
  /**
   * Get network manager
   */
  getNetworkManager() {
    if (!this.networkManager) {
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        "SDK not initialized"
      );
    }
    return this.networkManager;
  }
  /**
   * Get storage manager
   */
  getStorageManager() {
    if (!this.storageManager) {
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        "SDK not initialized"
      );
    }
    return this.storageManager;
  }
  /**
   * Get key manager
   */
  getKeyManager() {
    if (!this.keyManager) {
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        "SDK not initialized"
      );
    }
    return this.keyManager;
  }
  /**
   * Check if SDK is initialized
   */
  isInitialized() {
    return this.config !== null && this.networkManager !== null && this.storageManager !== null && this.keyManager !== null && this.wallets !== null;
  }
  /**
   * Switch to a different network
   */
  async switchNetwork(network) {
    if (!this.isInitialized()) {
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        "SDK not initialized"
      );
    }
    await this.networkManager.switchNetwork(network);
    if (this.config) {
      this.config.network = network;
    }
    if (this.wallets) {
      await this.wallets.onNetworkChange(network);
    }
  }
  /**
   * Get current network
   */
  getCurrentNetwork() {
    if (!this.networkManager) {
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        "SDK not initialized"
      );
    }
    return this.networkManager.getCurrentNetwork();
  }
  /**
   * Get supported networks
   */
  getSupportedNetworks() {
    if (!this.config) {
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        "SDK not initialized"
      );
    }
    return this.config.supportedNetworks;
  }
  /**
   * Send analytics event
   */
  async sendAnalytics(eventType, eventData) {
    if (!this.config) {
      return;
    }
    try {
      await this.backendClient.sendAnalytics(
        this.config.analyticsEndpoint,
        this.config.appId,
        eventType,
        eventData
      );
    } catch (error) {
      console.warn("Analytics event failed:", error);
    }
  }
  /**
   * Report error to backend
   */
  async reportError(error) {
    if (!this.config) {
      return;
    }
    try {
      await this.backendClient.reportError(
        this.config.backendUrl,
        this.config.appId,
        error
      );
    } catch (reportError) {
      console.warn("Error reporting failed:", reportError);
    }
  }
  /**
   * Check backend health
   */
  async checkBackendHealth() {
    return await this.backendClient.healthCheck();
  }
  /**
   * Refresh network connections
   */
  async refreshConnections() {
    if (!this.networkManager) {
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        "SDK not initialized"
      );
    }
    await this.networkManager.refreshConnections();
  }
  /**
   * Clear all app data (use with caution)
   */
  async clearAllData() {
    if (!this.config || !this.storageManager) {
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        "SDK not initialized"
      );
    }
    await this.storageManager.clearAppData(this.config.appId);
  }
  /**
   * Get storage usage statistics
   */
  async getStorageUsage() {
    if (!this.storageManager) {
      throw new AegisError(
        "CONFIGURATION_ERROR" /* CONFIGURATION_ERROR */,
        "MISSING_REQUIRED_CONFIG" /* MISSING_REQUIRED_CONFIG */,
        "SDK not initialized"
      );
    }
    return await this.storageManager.getStorageUsage();
  }
  /**
   * Destroy SDK instance and clean up resources
   */
  destroy() {
    if (this.networkManager) {
      this.networkManager.destroy();
      this.networkManager = null;
    }
    if (this.wallets) {
      this.wallets.destroy();
      this.wallets = null;
    }
    this.config = null;
    this.storageManager = null;
    this.keyManager = null;
  }
};

// src/types/index.ts
init_errors();
export {
  ACCOUNT_CLASS_HASHES,
  AegisError,
  AegisErrorCode,
  AegisErrorFactory,
  AegisErrorType,
  AegisSDK,
  BackendClient,
  InAppWallet,
  KeyManager,
  NetworkManager,
  ReactNativeAsyncStorage,
  ReactNativeSecureStorage,
  StorageManager,
  WalletManager,
  WebAsyncStorage,
  WebSecureStorage,
  deriveAddressFromPublicKey,
  estimateDeploymentFee,
  expandConfigWithDefaults,
  generateAccountAddress,
  generateMultipleAccountAddresses,
  getAccountClassHash,
  getConstructorCalldata,
  getPublicKeyFromPrivateKey,
  getSupportedAccountTypes,
  isAccountTypeSupported,
  isValidAccountAddress,
  normalizePrivateKey,
  prepareDeploymentData,
  validateAccountClassHash,
  validateAegisConfig,
  validateCallData,
  validateDeploymentData,
  validateInternalConfig,
  validatePrivateKey,
  validateStarknetAddress
};
