import { RpcProvider, constants } from 'starknet';
import { NetworkType, NetworkConfig, NetworkError } from '../types';

export class NetworkManager {
  private provider: RpcProvider | null = null;
  private currentNetwork: NetworkType;
  private config: Record<NetworkType, NetworkConfig>;
  private enableLogging: boolean;

  constructor(network: NetworkType = 'SN_SEPOLIA', customRpcUrl?: string, enableLogging: boolean = false) {
    this.currentNetwork = network;
    this.config = this.getDefaultNetworkConfigs();
    this.enableLogging = enableLogging;

    // Override RPC URL if provided
    if (customRpcUrl) {
      this.config[network].rpcUrl = customRpcUrl;
    }

    this.initializeProvider();
  }

  private getDefaultNetworkConfigs(): Record<NetworkType, NetworkConfig> {
    return {
      SN_MAINNET: {
        rpcUrl: 'https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_8/dql5pMT88iueZWl7L0yzT56uVk0EBU4L',
        chainId: constants.StarknetChainId.SN_MAIN,
        specVersion: '0.8.1',
        blockExplorer: 'https://starkscan.co',
      },
      SN_SEPOLIA: {
        rpcUrl: 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/dql5pMT88iueZWl7L0yzT56uVk0EBU4L',
        chainId: constants.StarknetChainId.SN_SEPOLIA,
        specVersion: '0.8.1',
        blockExplorer: 'https://sepolia.starkscan.co',
        faucetUrl: 'https://starknet-faucet.vercel.app',
      },
      SN_DEVNET: {
        rpcUrl: 'http://localhost:5050/rpc',
        chainId: constants.StarknetChainId.SN_SEPOLIA, // Using Sepolia chain ID for devnet
        specVersion: '0.8.1',
        blockExplorer: 'http://localhost:4000',
        faucetUrl: 'http://localhost:5050/mint',
      },
    };
  }

  private initializeProvider(): void {
    try {
      const networkConfig = this.config[this.currentNetwork];
      this.provider = new RpcProvider({
        nodeUrl: networkConfig.rpcUrl,
        chainId: networkConfig.chainId as any,
        specVersion: networkConfig.specVersion,
      });
    } catch (error) {
      throw new NetworkError(`Failed to initialize provider for ${this.currentNetwork}: ${error}`);
    }
  }

  getProvider(): RpcProvider {
    if (!this.provider) {
      throw new NetworkError('Provider not initialized');
    }
    return this.provider;
  }

  getCurrentNetwork(): NetworkType {
    return this.currentNetwork;
  }

  getNetworkConfig(network?: NetworkType): NetworkConfig {
    const targetNetwork = network || this.currentNetwork;
    return this.config[targetNetwork];
  }

  async switchNetwork(network: NetworkType, customRpcUrl?: string): Promise<void> {
    try {
      this.currentNetwork = network;
      
      if (customRpcUrl) {
        this.config[network].rpcUrl = customRpcUrl;
      }
      
      this.initializeProvider();
      
      // Test the connection
      await this.testConnection();
    } catch (error) {
      throw new NetworkError(`Failed to switch to ${network}: ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.provider) {
        return false;
      }
      
      const chainId = await this.provider.getChainId();
      const expectedChainId = this.config[this.currentNetwork].chainId;
      
      return chainId === expectedChainId;
    } catch (error) {
      if (this.enableLogging) {
        console.error('Connection test failed:', error);
      }
      return false;
    }
  }

  async getBlockNumber(): Promise<number> {
    try {
      if (!this.provider) {
        throw new NetworkError('Provider not initialized');
      }
      
      return await this.provider.getBlockNumber();
    } catch (error) {
      throw new NetworkError(`Failed to get block number: ${error}`);
    }
  }

  async getChainId(): Promise<string> {
    try {
      if (!this.provider) {
        throw new NetworkError('Provider not initialized');
      }
      
      return await this.provider.getChainId();
    } catch (error) {
      throw new NetworkError(`Failed to get chain ID: ${error}`);
    }
  }

  supportsPaymaster(): boolean {
    // Paymaster is supported on mainnet and sepolia
    return this.currentNetwork === 'SN_MAINNET' || this.currentNetwork === 'SN_SEPOLIA';
  }

  getBlockExplorerUrl(txHash?: string, address?: string): string {
    const config = this.config[this.currentNetwork];
    const baseUrl = config.blockExplorer || '';
    
    if (txHash) {
      return `${baseUrl}/tx/${txHash}`;
    } else if (address) {
      return `${baseUrl}/contract/${address}`;
    }
    
    return baseUrl;
  }

  getFaucetUrl(): string | null {
    return this.config[this.currentNetwork].faucetUrl || null;
  }

  isTestnet(): boolean {
    return this.currentNetwork !== 'SN_MAINNET';
  }

  async waitForTransaction(txHash: string, timeout: number = 60000): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new NetworkError('Provider not initialized');
      }

      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        try {
          const receipt = await this.provider.getTransactionReceipt(txHash);
          
          if (receipt && (receipt as any).execution_status) {
            return (receipt as any).execution_status === 'SUCCEEDED';
          }
        } catch (error) {
          // Transaction might not be available yet, continue polling
        }
        
        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      throw new NetworkError(`Transaction ${txHash} timed out after ${timeout}ms`);
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError(`Failed to wait for transaction: ${error}`);
    }
  }

  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      if (!this.provider) {
        throw new NetworkError('Provider not initialized');
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return 'pending';
      }
      
      if (receipt.isSuccess()) {
        return 'confirmed';
      } else {
        return 'failed';
      }
      
      return 'pending';
    } catch (error) {
      if (this.enableLogging) {
        console.error('Failed to get transaction status:', error);
      }
      return 'pending';
    }
  }

  async estimateGas(calls: any[]): Promise<string> {
    try {
      if (!this.provider) {
        throw new NetworkError('Provider not initialized');
      }

      // This is a simplified gas estimation
      // In practice, you'd want to use the actual account to estimate
      const baseGas = BigInt(21000); // Base transaction cost
      const callGas = BigInt(calls.length * 30000); // Estimate per call
      
      return (baseGas + callGas).toString();
    } catch (error) {
      throw new NetworkError(`Failed to estimate gas: ${error}`);
    }
  }

  dispose(): void {
    this.provider = null;
  }
}