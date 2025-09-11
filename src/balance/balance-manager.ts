import { NetworkManager } from '../network/network-manager';
import { ContractManager } from '../contract/contract-manager';
import { NFTToken, NetworkError, ValidationError } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  blockNumber: number;
}

export class BalanceManager {
  private network: NetworkManager;
  private contractManager: ContractManager;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheTimeout: number = 30000; // 30 seconds

  constructor(network: NetworkManager, contractManager: ContractManager) {
    this.network = network;
    this.contractManager = contractManager;
  }

  private getCacheKey(type: string, ...params: string[]): string {
    return `${type}:${params.join(':')}`;
  }

  private async getCurrentBlockNumber(): Promise<number> {
    try {
      return await this.network.getBlockNumber();
    } catch (error) {
      console.warn('Failed to get current block number:', error);
      return 0;
    }
  }

  private async getCachedData<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    forceRefresh: boolean = false
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp < this.cacheTimeout)) {
      return cached.data;
    }

    try {
      const data = await fetchFunction();
      const blockNumber = await this.getCurrentBlockNumber();
      
      this.cache.set(key, {
        data,
        timestamp: now,
        blockNumber,
      });
      
      return data;
    } catch (error) {
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('Using cached data due to fetch error:', error);
        return cached.data;
      }
      throw error;
    }
  }

  async getETHBalance(address: string): Promise<string> {
    if (!address) {
      throw new ValidationError('Address is required');
    }

    const cacheKey = this.getCacheKey('eth_balance', address);
    
    return this.getCachedData(cacheKey, async () => {
      try {
        const provider = this.network.getProvider();
        // Use ETH contract address for Starknet
        const ETH_CONTRACT = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
        const balance = await provider.callContract({
          contractAddress: ETH_CONTRACT,
          entrypoint: 'balanceOf',
          calldata: [address]
        });
        
        // Convert from wei to ETH (18 decimals)
        const balanceBigInt = BigInt(balance[0]);
        const ethBalance = balanceBigInt / BigInt(10 ** 18);
        
        return ethBalance.toString();
      } catch (error) {
        console.error('Failed to get ETH balance:', error);
        return '0';
      }
    });
  }

  async getERC20Balance(
    tokenAddress: string,
    userAddress: string,
    decimals: number = 18
  ): Promise<string> {
    if (!tokenAddress || !userAddress) {
      throw new ValidationError('Token address and user address are required');
    }

    const cacheKey = this.getCacheKey('erc20_balance', tokenAddress, userAddress);
    
    return this.getCachedData(cacheKey, async () => {
      return this.contractManager.getERC20Balance(tokenAddress, userAddress, decimals);
    });
  }

  async getERC20TokenInfo(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    if (!tokenAddress) {
      throw new ValidationError('Token address is required');
    }

    const cacheKey = this.getCacheKey('erc20_info', tokenAddress);
    
    return this.getCachedData(cacheKey, async () => {
      try {
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          this.contractManager.callContract(tokenAddress, 'name').catch(() => 'Unknown'),
          this.contractManager.callContract(tokenAddress, 'symbol').catch(() => 'UNK'),
          this.contractManager.callContract(tokenAddress, 'decimals').catch(() => 18),
          this.contractManager.callContract(tokenAddress, 'totalSupply').catch(() => '0'),
        ]);

        return {
          name: name.toString(),
          symbol: symbol.toString(),
          decimals: parseInt(decimals.toString()),
          totalSupply: totalSupply.toString(),
        };
      } catch (error) {
        throw new NetworkError(`Failed to get token info: ${error}`);
      }
    });
  }

  async getERC721Tokens(
    contractAddress: string,
    userAddress: string,
    maxTokens: number = 50
  ): Promise<NFTToken[]> {
    if (!contractAddress || !userAddress) {
      throw new ValidationError('Contract address and user address are required');
    }

    const cacheKey = this.getCacheKey('erc721_tokens', contractAddress, userAddress);
    
    return this.getCachedData(cacheKey, async () => {
      try {
        // First try to get balance
        const balance = await this.contractManager.callContract(
          contractAddress,
          'balanceOf',
          [userAddress]
        ).catch(() => 0);

        const balanceNum = parseInt(balance.toString());
        if (balanceNum === 0) {
          return [];
        }

        const tokens: NFTToken[] = [];
        const limit = Math.min(balanceNum, maxTokens);

        // Try to use tokenOfOwnerByIndex if available
        for (let i = 0; i < limit; i++) {
          try {
            const tokenId = await this.contractManager.callContract(
              contractAddress,
              'tokenOfOwnerByIndex',
              [userAddress, i]
            );

            const token = await this.getERC721TokenDetails(contractAddress, tokenId.toString());
            tokens.push(token);
          } catch (error) {
            // If tokenOfOwnerByIndex doesn't exist, we can't enumerate tokens
            console.warn('Could not enumerate NFT tokens:', error);
            break;
          }
        }

        return tokens;
      } catch (error) {
        console.error('Failed to get ERC721 tokens:', error);
        return [];
      }
    });
  }

  async getERC721TokenDetails(contractAddress: string, tokenId: string): Promise<NFTToken> {
    const cacheKey = this.getCacheKey('erc721_details', contractAddress, tokenId);
    
    return this.getCachedData(cacheKey, async () => {
      try {
        const tokenURI = await this.contractManager.getERC721TokenURI(contractAddress, tokenId);
        
        let metadata: Record<string, any> = {};
        let name = `Token #${tokenId}`;
        let description = '';
        let imageUrl = '';

        // Try to fetch metadata from tokenURI
        if (tokenURI) {
          try {
            // Handle IPFS URIs
            const uri = tokenURI.startsWith('ipfs://') 
              ? `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
              : tokenURI;

            const response = await fetch(uri);
            if (response.ok) {
              metadata = await response.json();
              name = metadata.name || name;
              description = metadata.description || '';
              imageUrl = metadata.image || '';
              
              // Handle IPFS image URIs
              if (imageUrl.startsWith('ipfs://')) {
                imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
              }
            }
          } catch (error) {
            console.warn('Failed to fetch NFT metadata:', error);
          }
        }

        return {
          tokenId,
          contractAddress,
          name,
          description,
          imageUrl,
          metadata,
        };
      } catch (error) {
        throw new NetworkError(`Failed to get NFT token details: ${error}`);
      }
    });
  }

  async getMultipleERC20Balances(
    tokens: Array<{ address: string; decimals?: number }>,
    userAddress: string
  ): Promise<Array<{ address: string; balance: string; symbol?: string }>> {
    if (!userAddress) {
      throw new ValidationError('User address is required');
    }

    try {
      const balancePromises = tokens.map(async (token) => {
        const [balance, info] = await Promise.all([
          this.getERC20Balance(token.address, userAddress, token.decimals || 18),
          this.getERC20TokenInfo(token.address).catch(() => ({
            name: 'Unknown',
            symbol: 'UNK',
            decimals: 18,
            totalSupply: '0',
          })),
        ]);

        return {
          address: token.address,
          balance,
          symbol: info.symbol,
        };
      });

      return await Promise.all(balancePromises);
    } catch (error) {
      throw new NetworkError(`Failed to get multiple ERC20 balances: ${error}`);
    }
  }

  async getPortfolioValue(
    userAddress: string,
    tokens: Array<{ address: string; decimals?: number; priceUSD?: number }>
  ): Promise<{
    totalValueUSD: number;
    tokens: Array<{
      address: string;
      balance: string;
      symbol: string;
      valueUSD: number;
    }>;
  }> {
    if (!userAddress) {
      throw new ValidationError('User address is required');
    }

    try {
      const tokenData = await Promise.all(
        tokens.map(async (token) => {
          const [balance, info] = await Promise.all([
            this.getERC20Balance(token.address, userAddress, token.decimals || 18),
            this.getERC20TokenInfo(token.address).catch(() => ({
              name: 'Unknown',
              symbol: 'UNK',
              decimals: 18,
              totalSupply: '0',
            })),
          ]);

          const balanceNum = parseFloat(balance);
          const valueUSD = balanceNum * (token.priceUSD || 0);

          return {
            address: token.address,
            balance,
            symbol: info.symbol,
            valueUSD,
          };
        })
      );

      const totalValueUSD = tokenData.reduce((sum, token) => sum + token.valueUSD, 0);

      return {
        totalValueUSD,
        tokens: tokenData,
      };
    } catch (error) {
      throw new NetworkError(`Failed to get portfolio value: ${error}`);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Clean up expired cache entries
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout * 2) {
        this.cache.delete(key);
      }
    }
  }

  dispose(): void {
    this.clearCache();
  }
}