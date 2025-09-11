/**
 * Main Aegis SDK class - unified entry point for all wallet functionality
 */

import type { AegisConfig, InternalAegisConfig } from '../types/config';
import { AegisError, AegisErrorCode, AegisErrorType } from '../types/errors';
import { validateAegisConfig } from './validation';
import { BackendClient } from './BackendClient';
import { NetworkManager } from './NetworkManager';
import { StorageManager } from '../utils/storage/StorageManager';
import { KeyManager } from '../utils/crypto/KeyManager';
import { WalletManager } from './WalletManager';

/**
 * Main SDK class providing unified access to all Aegis functionality
 */
export class AegisSDK {
  private config: InternalAegisConfig | null = null;
  private backendClient: BackendClient;
  private networkManager: NetworkManager | null = null;
  private storageManager: StorageManager | null = null;
  private keyManager: KeyManager | null = null;
  
  // Public managers
  public wallets: WalletManager | null = null;

  constructor(userConfig: AegisConfig) {
    // Validate user configuration
    validateAegisConfig(userConfig);
    
    // Initialize backend client
    this.backendClient = new BackendClient();
  }

  /**
   * Static factory method for creating and initializing SDK
   */
  static async create(config: AegisConfig): Promise<AegisSDK> {
    const sdk = new AegisSDK(config);
    await sdk.initialize(config);
    return sdk;
  }

  /**
   * Initialize the SDK with backend configuration
   */
  async initialize(userConfig: AegisConfig): Promise<void> {
    try {
      // Expand configuration with backend data
      this.config = await this.backendClient.expandConfiguration(userConfig);

      // Initialize core managers
      this.networkManager = new NetworkManager(this.config);
      await this.networkManager.initialize();

      this.storageManager = new StorageManager(this.config);
      await this.storageManager.initialize();

      this.keyManager = new KeyManager(this.storageManager);

      // Initialize public managers
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
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        `SDK initialization failed: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): InternalAegisConfig | null {
    return this.config;
  }

  /**
   * Get network manager
   */
  getNetworkManager(): NetworkManager {
    if (!this.networkManager) {
      throw new AegisError(
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        'SDK not initialized'
      );
    }
    return this.networkManager;
  }

  /**
   * Get storage manager
   */
  getStorageManager(): StorageManager {
    if (!this.storageManager) {
      throw new AegisError(
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        'SDK not initialized'
      );
    }
    return this.storageManager;
  }

  /**
   * Get key manager
   */
  getKeyManager(): KeyManager {
    if (!this.keyManager) {
      throw new AegisError(
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        'SDK not initialized'
      );
    }
    return this.keyManager;
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.config !== null && 
           this.networkManager !== null && 
           this.storageManager !== null && 
           this.keyManager !== null && 
           this.wallets !== null;
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(network: string): Promise<void> {
    if (!this.isInitialized()) {
      throw new AegisError(
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        'SDK not initialized'
      );
    }

    await this.networkManager!.switchNetwork(network);
    
    // Update configuration
    if (this.config) {
      this.config.network = network as any;
    }

    // Reinitialize wallet manager with new network
    if (this.wallets) {
      await this.wallets.onNetworkChange(network);
    }
  }

  /**
   * Get current network
   */
  getCurrentNetwork(): string {
    if (!this.networkManager) {
      throw new AegisError(
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        'SDK not initialized'
      );
    }
    return this.networkManager.getCurrentNetwork();
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks(): string[] {
    if (!this.config) {
      throw new AegisError(
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        'SDK not initialized'
      );
    }
    return this.config.supportedNetworks;
  }

  /**
   * Send analytics event
   */
  async sendAnalytics(eventType: string, eventData: Record<string, any>): Promise<void> {
    if (!this.config) {
      return; // Skip analytics if not initialized
    }

    try {
      await this.backendClient.sendAnalytics(
        this.config.analyticsEndpoint,
        this.config.appId,
        eventType,
        eventData
      );
    } catch (error) {
      // Analytics failures are non-critical
      console.warn('Analytics event failed:', error);
    }
  }

  /**
   * Report error to backend
   */
  async reportError(error: AegisError): Promise<void> {
    if (!this.config) {
      return; // Skip error reporting if not initialized
    }

    try {
      await this.backendClient.reportError(
        this.config.backendUrl,
        this.config.appId,
        error
      );
    } catch (reportError) {
      // Error reporting failures are non-critical
      console.warn('Error reporting failed:', reportError);
    }
  }

  /**
   * Check backend health
   */
  async checkBackendHealth(): Promise<boolean> {
    return await this.backendClient.healthCheck();
  }

  /**
   * Refresh network connections
   */
  async refreshConnections(): Promise<void> {
    if (!this.networkManager) {
      throw new AegisError(
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        'SDK not initialized'
      );
    }

    await this.networkManager.refreshConnections();
  }

  /**
   * Clear all app data (use with caution)
   */
  async clearAllData(): Promise<void> {
    if (!this.config || !this.storageManager) {
      throw new AegisError(
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        'SDK not initialized'
      );
    }

    await this.storageManager.clearAppData(this.config.appId);
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<any> {
    if (!this.storageManager) {
      throw new AegisError(
        AegisErrorType.CONFIGURATION_ERROR,
        AegisErrorCode.MISSING_REQUIRED_CONFIG,
        'SDK not initialized'
      );
    }

    return await this.storageManager.getStorageUsage();
  }

  /**
   * Destroy SDK instance and clean up resources
   */
  destroy(): void {
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
}