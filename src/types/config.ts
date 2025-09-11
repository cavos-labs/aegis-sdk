/**
 * Core configuration types for the Aegis SDK
 */

/**
 * Developer-provided configuration - only appId is required
 */
export interface AegisConfig {
  /** Unique application identifier provided by Aegis */
  appId: string;
  
  /** Target network - defaults to 'sepolia' */
  network?: 'mainnet' | 'sepolia' | 'devnet';
  
  /** Enable biometric authentication on mobile - defaults to true */
  enableBiometrics?: boolean;
  
  /** Enable usage analytics - defaults to true */
  enableAnalytics?: boolean;
  
  /** Custom RPC URL for devnet or private networks */
  customRpcUrl?: string;
  
  /** Maximum transaction retry attempts - defaults to 3 */
  maxTransactionRetries?: number;
}

/**
 * Internal configuration populated by SDK after backend communication
 */
export interface InternalAegisConfig extends AegisConfig {
  /** AVNU paymaster API key retrieved from Aegis backend */
  paymasterApiKey: string;
  
  /** Aegis backend service URL */
  backendUrl: string;
  
  /** Analytics endpoint for usage tracking */
  analyticsEndpoint: string;
  
  /** Networks supported by this app */
  supportedNetworks: string[];
  
  /** App metadata from backend */
  appMetadata: {
    name: string;
    version: string;
    features: string[];
  };
}