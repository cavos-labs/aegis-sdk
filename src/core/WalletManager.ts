/**
 * Wallet manager for coordinating wallet operations
 */

import type { InternalAegisConfig } from '../types/config';
import type { AegisWallet, KeyMetadata, WalletConnectionData } from '../types/wallet';
import { AegisError, AegisErrorCode, AegisErrorType } from '../types/errors';
import type { NetworkManager } from './NetworkManager';
import type { StorageManager } from '../utils/storage/StorageManager';
import type { KeyManager } from '../utils/crypto/KeyManager';
import { InAppWallet } from '../wallets/inapp/InAppWallet';
import type { AccountType } from '../utils/crypto/AccountUtils';

/**
 * Manages wallet creation, connection, and lifecycle
 */
export class WalletManager {
  private currentWallet: AegisWallet | null = null;
  private config: InternalAegisConfig;
  private networkManager: NetworkManager;
  private storageManager: StorageManager;
  private keyManager: KeyManager;

  constructor(
    config: InternalAegisConfig,
    networkManager: NetworkManager,
    storageManager: StorageManager,
    keyManager: KeyManager
  ) {
    this.config = config;
    this.networkManager = networkManager;
    this.storageManager = storageManager;
    this.keyManager = keyManager;
  }

  /**
   * Initialize wallet manager
   */
  async initialize(): Promise<void> {
    // Try to reconnect to last used wallet
    await this.tryReconnectLastWallet();
  }

  /**
   * Create a new in-app wallet
   */
  async createInAppWallet(
    accountType: AccountType = 'argentx',
    options: { withBiometrics?: boolean; name?: string } = {}
  ): Promise<InAppWallet> {
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

      // Set as current wallet
      this.currentWallet = wallet;

      // Store as last used wallet
      await this.storeLastWalletInfo(wallet);

      return wallet;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }

      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.WALLET_NOT_FOUND,
        `Failed to create in-app wallet: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }

  /**
   * Connect to existing wallet using key metadata
   */
  async connectWallet(
    keyMetadata: KeyMetadata,
    withBiometrics: boolean = false
  ): Promise<InAppWallet> {
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
        keyMetadata.accountType as AccountType,
        withBiometrics
      );

      // Set as current wallet
      this.currentWallet = wallet;

      // Store as last used wallet
      await this.storeLastWalletInfo(wallet);

      return wallet;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }

      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.WALLET_NOT_FOUND,
        `Failed to connect wallet: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }

  /**
   * Import wallet from private key
   */
  async importWallet(
    privateKey: string,
    accountType: AccountType = 'argentx',
    options: { withBiometrics?: boolean; name?: string } = {}
  ): Promise<InAppWallet> {
    try {
      // Validate and normalize private key
      const validatedKey = this.keyManager.importPrivateKey(privateKey);
      
      const provider = this.networkManager.getProvider();
      const network = this.networkManager.getCurrentNetwork();

      // Create wallet instance
      const wallet = new InAppWallet(
        validatedKey,
        network,
        provider,
        this.config,
        this.storageManager,
        this.keyManager,
        accountType
      );

      // Store the private key
      await this.keyManager.storePrivateKey(
        validatedKey,
        this.config.appId,
        network,
        accountType,
        wallet.address,
        options
      );

      // Set as current wallet
      this.currentWallet = wallet;

      // Store as last used wallet
      await this.storeLastWalletInfo(wallet);

      return wallet;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }

      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.INVALID_PRIVATE_KEY,
        `Failed to import wallet: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }

  /**
   * Get current wallet
   */
  getCurrentWallet(): AegisWallet | null {
    return this.currentWallet;
  }

  /**
   * Check if a wallet is currently connected
   */
  isConnected(): boolean {
    return this.currentWallet !== null;
  }

  /**
   * Get all available wallets for this app
   */
  async getAvailableWallets(): Promise<KeyMetadata[]> {
    try {
      return await this.keyManager.getAvailableKeys(this.config.appId);
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }

      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to get available wallets: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }

  /**
   * Remove a wallet from storage
   */
  async removeWallet(keyMetadata: KeyMetadata): Promise<void> {
    try {
      await this.keyManager.removePrivateKey(
        keyMetadata.appId,
        keyMetadata.network,
        keyMetadata.accountType,
        keyMetadata.address
      );

      // If this was the current wallet, disconnect
      if (this.currentWallet && this.currentWallet.address === keyMetadata.address) {
        await this.disconnect();
      }
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }

      throw new AegisError(
        AegisErrorType.STORAGE_ERROR,
        AegisErrorCode.STORAGE_ACCESS_DENIED,
        `Failed to remove wallet: ${error instanceof Error ? error : String(error)}`,
        false,
        error
      );
    }
  }

  /**
   * Disconnect current wallet
   */
  async disconnect(): Promise<void> {
    if (this.currentWallet) {
      await this.currentWallet.disconnect();
      this.currentWallet = null;

      // Clear last wallet info
      await this.clearLastWalletInfo();
    }
  }

  /**
   * Switch to a different network
   */
  async onNetworkChange(network: string): Promise<void> {
    // If there's a current wallet and it's not on the new network,
    // we need to disconnect it as cross-network wallets aren't supported
    if (this.currentWallet && this.currentWallet.network !== network) {
      await this.disconnect();
    }
  }

  /**
   * Get wallet connection data for restoration
   */
  private async getWalletConnectionData(wallet: AegisWallet): Promise<WalletConnectionData> {
    const keyId = `${wallet.network}.${this.config.appId}.${(wallet as InAppWallet).getAccountType()}.${wallet.address}`;
    
    return {
      type: wallet.type,
      keyId,
      network: wallet.network,
      address: wallet.address,
      metadata: {
        appId: this.config.appId,
        accountType: (wallet as InAppWallet).getAccountType(),
        createdAt: Date.now(),
      },
    };
  }

  /**
   * Store last wallet information for reconnection
   */
  private async storeLastWalletInfo(wallet: AegisWallet): Promise<void> {
    try {
      const connectionData = await this.getWalletConnectionData(wallet);
      await this.storageManager.storeAppConfig(
        `${this.config.appId}.lastWallet`,
        connectionData
      );
    } catch (error) {
      // Non-critical - don't throw
      console.warn('Failed to store last wallet info:', error);
    }
  }

  /**
   * Clear last wallet information
   */
  private async clearLastWalletInfo(): Promise<void> {
    try {
      await this.storageManager.storeAppConfig(
        `${this.config.appId}.lastWallet`,
        null
      );
    } catch (error) {
      // Non-critical - don't throw
      console.warn('Failed to clear last wallet info:', error);
    }
  }

  /**
   * Try to reconnect to last used wallet
   */
  private async tryReconnectLastWallet(): Promise<void> {
    try {
      const lastWalletData: WalletConnectionData | null = await this.storageManager.getAppConfig(
        `${this.config.appId}.lastWallet`
      );

      if (!lastWalletData || lastWalletData.type !== 'inapp') {
        return; // No last wallet or unsupported type
      }

      // Check if the network is still supported
      if (!this.config.supportedNetworks.includes(lastWalletData.network)) {
        return; // Network no longer supported
      }

      // Try to connect to the wallet
      const keyMetadata: KeyMetadata = {
        appId: lastWalletData.metadata.appId,
        network: lastWalletData.network,
        accountType: lastWalletData.metadata.accountType,
        address: lastWalletData.address,
        createdAt: lastWalletData.metadata.createdAt,
      };

      await this.connectWallet(keyMetadata);
    } catch (error) {
      // Reconnection failures are non-critical
      console.warn('Failed to reconnect to last wallet:', error);
      await this.clearLastWalletInfo();
    }
  }

  /**
   * Build key ID from metadata
   */
  private buildKeyId(keyMetadata: KeyMetadata): string {
    return `${keyMetadata.network}.${keyMetadata.appId}.${keyMetadata.accountType}.${keyMetadata.address}`;
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
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
  destroy(): void {
    this.currentWallet = null;
  }
}