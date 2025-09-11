/**
 * Network and provider management for Starknet connections
 */

import { RpcProvider, constants } from 'starknet';
import type { InternalAegisConfig } from '../types/config';
import { AegisError, AegisErrorCode, AegisErrorType } from '../types/errors';

/**
 * Network configuration for different Starknet networks
 */
interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId?: string;
  specVersion: string;
}

/**
 * Default RPC URLs for supported networks
 */
const DEFAULT_RPC_URLS = {
  mainnet: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
  sepolia: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
  devnet: 'http://localhost:5050/rpc',
} as const;

/**
 * Chain IDs for different networks
 */
const CHAIN_IDS = {
  mainnet: constants.StarknetChainId.SN_MAIN,
  sepolia: constants.StarknetChainId.SN_SEPOLIA,
  devnet: undefined, // Devnet doesn't have a standard chain ID
} as const;

/**
 * Manages network connections and Starknet providers
 */
export class NetworkManager {
  private providers: Map<string, RpcProvider> = new Map();
  private currentNetwork: string;
  private config: InternalAegisConfig;
  private networkConfigs: Map<string, NetworkConfig> = new Map();

  constructor(config: InternalAegisConfig) {
    this.config = config;
    this.currentNetwork = config.network || 'sepolia';
    this.initializeNetworkConfigs();
  }

  /**
   * Initialize the network manager and create providers
   */
  async initialize(): Promise<void> {
    try {
      // Create providers for all supported networks
      for (const network of this.config.supportedNetworks) {
        const provider = this.createProvider(network);
        this.providers.set(network, provider);

        // Test the provider connection
        await this.testProviderConnection(provider, network);
      }

      // Ensure current network has a provider
      if (!this.providers.has(this.currentNetwork)) {
        throw new AegisError(
          AegisErrorType.NETWORK_ERROR,
          AegisErrorCode.PROVIDER_CONNECTION_FAILED,
          `Current network '${this.currentNetwork}' is not supported`
        );
      }
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      throw new AegisError(
        AegisErrorType.NETWORK_ERROR,
        AegisErrorCode.PROVIDER_CONNECTION_FAILED,
        `Failed to initialize network manager: ${error instanceof Error ? error : String(error)}`,
        true,
        error
      );
    }
  }

  /**
   * Get provider for the current network or a specific network
   */
  getProvider(network?: string): RpcProvider {
    const targetNetwork = network || this.currentNetwork;
    const provider = this.providers.get(targetNetwork);
    
    if (!provider) {
      throw new AegisError(
        AegisErrorType.NETWORK_ERROR,
        AegisErrorCode.PROVIDER_CONNECTION_FAILED,
        `Provider not available for network: ${targetNetwork}`
      );
    }

    return provider;
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(network: string): Promise<void> {
    if (!this.config.supportedNetworks.includes(network)) {
      throw new AegisError(
        AegisErrorType.NETWORK_ERROR,
        AegisErrorCode.UNSUPPORTED_NETWORK,
        `Network '${network}' is not supported for this app`
      );
    }

    // Ensure provider exists for target network
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
  getCurrentNetwork(): string {
    return this.currentNetwork;
  }

  /**
   * Get list of supported networks
   */
  getSupportedNetworks(): string[] {
    return [...this.config.supportedNetworks];
  }

  /**
   * Get network configuration for a specific network
   */
  getNetworkConfig(network: string): NetworkConfig | undefined {
    return this.networkConfigs.get(network);
  }

  /**
   * Test if a network is available
   */
  async isNetworkAvailable(network: string): Promise<boolean> {
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
  private initializeNetworkConfigs(): void {
    // Mainnet configuration
    this.networkConfigs.set('mainnet', {
      name: 'Starknet Mainnet',
      rpcUrl: DEFAULT_RPC_URLS.mainnet,
      chainId: CHAIN_IDS.mainnet,
      specVersion: '0.7.1',
    });

    // Sepolia testnet configuration
    this.networkConfigs.set('sepolia', {
      name: 'Starknet Sepolia Testnet',
      rpcUrl: DEFAULT_RPC_URLS.sepolia,
      chainId: CHAIN_IDS.sepolia,
      specVersion: '0.7.1',
    });

    // Devnet configuration
    this.networkConfigs.set('devnet', {
      name: 'Local Devnet',
      rpcUrl: this.config.customRpcUrl || DEFAULT_RPC_URLS.devnet,
      chainId: CHAIN_IDS.devnet,
      specVersion: '0.8.1',
    });
  }

  /**
   * Create a provider for a specific network
   */
  private createProvider(network: string): RpcProvider {
    const networkConfig = this.networkConfigs.get(network);
    if (!networkConfig) {
      throw new AegisError(
        AegisErrorType.NETWORK_ERROR,
        AegisErrorCode.UNSUPPORTED_NETWORK,
        `Unknown network: ${network}`
      );
    }

    try {
      const providerOptions: any = {
        nodeUrl: networkConfig.rpcUrl,
        specVersion: networkConfig.specVersion,
      };

      // Add chain ID if available
      if (networkConfig.chainId) {
        providerOptions.chainId = networkConfig.chainId;
      }

      return new RpcProvider(providerOptions);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.NETWORK_ERROR,
        AegisErrorCode.PROVIDER_CONNECTION_FAILED,
        `Failed to create provider for network '${network}': ${error instanceof Error ? error : String(error)}`,
        true,
        error
      );
    }
  }

  /**
   * Test provider connection by making a simple call
   */
  private async testProviderConnection(provider: RpcProvider, network: string): Promise<void> {
    try {
      // Test with a simple call - get the latest block number
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        ),
      ]);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.NETWORK_ERROR,
        AegisErrorCode.RPC_REQUEST_FAILED,
        `Failed to connect to ${network} network: ${error instanceof Error ? error : String(error)}`,
        true,
        { network, error }
      );
    }
  }

  /**
   * Refresh all provider connections
   */
  async refreshConnections(): Promise<void> {
    const errors: Array<{ network: string; error: Error }> = [];

    // Test all existing providers
    for (const [network, provider] of this.providers.entries()) {
      try {
        await this.testProviderConnection(provider, network);
      } catch (error) {
        errors.push({ network, error: error as Error });
        
        // Try to recreate the provider
        try {
          const newProvider = this.createProvider(network);
          await this.testProviderConnection(newProvider, network);
          this.providers.set(network, newProvider);
        } catch (recreateError) {
          // If we can't recreate, remove the provider
          this.providers.delete(network);
        }
      }
    }

    // If current network is not available, try to switch to an available one
    if (!this.providers.has(this.currentNetwork)) {
      const availableNetwork = this.config.supportedNetworks.find(network => 
        this.providers.has(network)
      );

      if (availableNetwork) {
        this.currentNetwork = availableNetwork;
      } else {
        throw new AegisError(
          AegisErrorType.NETWORK_ERROR,
          AegisErrorCode.PROVIDER_CONNECTION_FAILED,
          'No network providers are available',
          true,
          { errors }
        );
      }
    }

    if (errors.length > 0) {
      console.warn('Some network connections failed during refresh:', errors);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.providers.clear();
    this.networkConfigs.clear();
  }
}