import { Account, Call } from 'starknet';
import { 
  WalletConfig, 
  TransactionResult, 
  ExecutionOptions, 
  NFTToken,
  NetworkType,
  PaymasterConfig,
  TrackingConfig,
  WalletTrackingData,
  TransactionTrackingData
} from '../types';
import { CryptoUtils } from './crypto';

import { SecureStorage } from '../storage/secure-storage';
import { NetworkManager } from '../network/network-manager';
import { AccountManager } from '../account/account-manager';
import { PaymasterIntegration } from '../transaction/paymaster';
import { TransactionManager } from '../transaction/transaction-manager';
import { ContractManager } from '../contract/contract-manager';
import { BalanceManager } from '../balance/balance-manager';
import { TrackingManager } from '../tracking/tracking-manager';

export class AegisSDK {
  private storage: SecureStorage;
  private network: NetworkManager;
  private accountManager: AccountManager;
  private paymaster: PaymasterIntegration;
  private transactionManager: TransactionManager;
  private contractManager: ContractManager;
  private balanceManager: BalanceManager;
  private trackingManager: TrackingManager;
  
  private currentAccount: Account | null = null;
  private currentPrivateKey: string | null = null;
  
  public readonly config: WalletConfig;

  constructor(config: WalletConfig) {
    this.config = config;
    
    // Initialize managers
    this.storage = new SecureStorage(`aegis-${config.appName}`);
    this.network = new NetworkManager(config.network, config.rpcUrl);
    this.accountManager = new AccountManager(this.storage, this.network);
    
    const paymasterConfig: PaymasterConfig = {
      apiKey: config.paymasterApiKey,
      backendUrl: config.paymasterBackendUrl,
      supportedNetworks: ['SN_MAINNET', 'SN_SEPOLIA'],
    };
    this.paymaster = new PaymasterIntegration(this.network, paymasterConfig);
    
    this.transactionManager = new TransactionManager(
      this.network, 
      this.paymaster, 
      config.batchSize, 
      config.maxRetries
    );
    
    this.contractManager = new ContractManager(this.network, this.transactionManager);
    this.balanceManager = new BalanceManager(this.network, this.contractManager);
    
    // Initialize tracking (always enabled since appId is required)
    const trackingConfig: TrackingConfig = {
      appId: config.appId,
      baseUrl: config.trackingApiUrl || 'https://services.cavos.xyz',
      enabled: true,
      timeout: config.trackingTimeout || 5000,
      endpoints: {
        wallet: '/api/v2/aegis/wallet',
        transaction: '/api/v2/aegis/transaction'
      }
    };
    
    this.trackingManager = new TrackingManager(trackingConfig);
    
    if (config.enableLogging) {
      console.log('[Aegis] Tracking initialized:', {
        appId: config.appId,
        baseUrl: trackingConfig.baseUrl,
        enabled: trackingConfig.enabled
      });
    }
  }

  // ===============================
  // ACCOUNT MANAGEMENT
  // ===============================

  /**
   * Deploy a new account with gasless deployment via AVNU
   * @returns The private key for the deployed account - store it securely!
   * @throws {Error} If deployment fails or configuration is invalid
   */
  async deployAccount(): Promise<string> {
    if (!this.config.paymasterApiKey) {
      throw new Error('AVNU API key is required for gasless deployment');
    }

    // Generate secure private key
    const privateKey = this.accountManager.generatePrivateKey();
    
    if (this.config.enableLogging) {
      console.log('Generated new private key');
    }
    
    // Deploy using AccountManager's AVNU deployment
    await this.accountManager.deployAccountWithAVNU(privateKey, this.config.paymasterApiKey);
    
    // Connect to the deployed account
    const account = await this.accountManager.connectAVNUAccount(privateKey);
    
    // Set as current account
    this.currentAccount = account;
    this.currentPrivateKey = privateKey;
    
    // Update managers
    this.transactionManager.setAccount(account);
    this.contractManager.setAccount(account);
    
    if (this.config.enableLogging) {
      console.log(`Account deployed successfully: ${account.address}`);
    }
    
    // Fire-and-forget wallet deployment tracking
    this.trackWalletDeployment(account.address, privateKey);
    
    return privateKey;
  }


  /**
   * Connect to an existing account using a private key
   * @param privateKey The private key to connect with
   * @param useAVNU Whether to use AVNU account calculation (default: true)
   * @returns The account address
   * @throws {Error} If private key is invalid or connection fails
   */
  async connectAccount(privateKey: string, useAVNU: boolean = true): Promise<string> {
    try {
      let account: Account;
      
      if (useAVNU) {
        // Use AVNU account calculation for consistency with deployed accounts
        account = await this.accountManager.connectAVNUAccount(privateKey);
      } else {
        // Use legacy account calculation
        account = await this.accountManager.connectAccount(privateKey);
      }
      
      this.currentAccount = account;
      this.currentPrivateKey = privateKey;
      
      // Update managers
      this.transactionManager.setAccount(account);
      this.contractManager.setAccount(account);
      
      if (this.config.enableLogging) {
        console.log(`Account connected: ${account.address}`);
      }
      
      return account.address;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('Connect account failed:', error);
      }
      throw error;
    }
  }

  /**
   * Get the current connected account address
   * @returns The account address or null if not connected
   */
  get address(): string | null {
    return this.currentAccount?.address || null;
  }

  /**
   * Check if an account is currently connected
   * @returns True if account is connected, false otherwise
   */
  get isConnected(): boolean {
    return this.currentAccount !== null;
  }

  // ===============================
  // TRANSACTION EXECUTION
  // ===============================

  /**
   * Execute a contract call with gasless transactions
   * @param contractAddress The contract address to call
   * @param entrypoint The function name to call
   * @param calldata Array of parameters for the function
   * @param options Execution options
   * @returns Transaction result with hash and status
   * @throws {Error} If no account is connected or execution fails
   */
  async execute(
    contractAddress: string,
    entrypoint: string,
    calldata: any[] = [],
    options: ExecutionOptions = {}
  ): Promise<TransactionResult> {
    if (!this.currentAccount) {
      throw new Error('No account connected. Call deployAccount() or connectAccount() first.');
    }

    try {
      const calls: Call[] = [{
        contractAddress,
        entrypoint,
        calldata,
      }];

      const result = await this.transactionManager.executeTransaction(calls, options);
      
      if (this.config.enableLogging) {
        console.log('✅ Transaction executed:', result.transactionHash);
      }
      
      // Fire-and-forget transaction tracking
      this.trackTransaction(result.transactionHash);
      
      return result;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Execute failed:', error);
      }
      throw error;
    }
  }

  /**
   * Execute multiple contract calls in a single gasless transaction
   * @param calls Array of contract calls to execute
   * @param options Execution options
   * @returns Transaction result with hash and status
   * @throws {Error} If no account is connected or execution fails
   */
  async executeBatch(calls: Array<{
    contractAddress: string;
    entrypoint: string;
    calldata: any[];
  }>, options: ExecutionOptions = {}): Promise<TransactionResult> {
    if (!this.currentAccount) {
      throw new Error('No account connected. Call deployAccount() or connectAccount() first.');
    }

    try {
      const formattedCalls: Call[] = calls.map(call => ({
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        calldata: call.calldata,
      }));

      const result = await this.transactionManager.executeTransaction(formattedCalls, options);
      
      if (this.config.enableLogging) {
        console.log('✅ Batch executed:', result.transactionHash);
      }
      
      // Fire-and-forget transaction tracking
      this.trackTransaction(result.transactionHash);
      
      return result;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Execute batch failed:', error);
      }
      throw error;
    }
  }

  // ===============================
  // CONTRACT READ OPERATIONS
  // ===============================

  /**
   * Call a contract view function (read-only, no gas required)
   * @param contractAddress The contract address to call
   * @param method The function name to call
   * @param args Array of parameters for the function
   * @returns The function result
   * @throws {Error} If the call fails
   */
  async call(
    contractAddress: string,
    method: string,
    args: any[] = []
  ): Promise<any> {
    try {
      const result = await this.contractManager.callContract(contractAddress, method, args);
      
      if (this.config.enableLogging) {
        console.log('✅ Contract call result:', result);
      }
      
      return result;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Contract call failed:', error);
      }
      throw error;
    }
  }

  // ===============================
  // BALANCE QUERIES
  // ===============================

  /**
   * Get ETH balance
   */
  async getETHBalance(address?: string): Promise<string> {
    const targetAddress = address || this.address;
    if (!targetAddress) {
      throw new Error('No address provided and no account connected');
    }

    try {
      return await this.balanceManager.getETHBalance(targetAddress);
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Get ETH balance failed:', error);
      }
      return '0';
    }
  }

  /**
   * Get ERC-20 token balance
   */
  async getTokenBalance(
    tokenAddress: string,
    decimals: number = 18,
    userAddress?: string
  ): Promise<string> {
    const targetAddress = userAddress || this.address;
    if (!targetAddress) {
      throw new Error('No address provided and no account connected');
    }

    try {
      return await this.balanceManager.getERC20Balance(tokenAddress, targetAddress, decimals);
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Get token balance failed:', error);
      }
      return '0';
    }
  }

  /**
   * Get NFT tokens
   */
  async getNFTs(contractAddress: string, userAddress?: string): Promise<NFTToken[]> {
    const targetAddress = userAddress || this.address;
    if (!targetAddress) {
      throw new Error('No address provided and no account connected');
    }

    try {
      return await this.balanceManager.getERC721Tokens(contractAddress, targetAddress);
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Get NFTs failed:', error);
      }
      return [];
    }
  }

  // ===============================
  // UTILITIES
  // ===============================

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string): Promise<boolean> {
    try {
      return await this.transactionManager.waitForTransaction(txHash);
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Wait for transaction failed:', error);
      }
      return false;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      return await this.transactionManager.getTransactionStatus(txHash);
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Get transaction status failed:', error);
      }
      return 'pending';
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    contractAddress: string,
    entrypoint: string,
    calldata: any[] = []
  ): Promise<string> {
    try {
      const calls: Call[] = [{
        contractAddress,
        entrypoint,
        calldata,
      }];

      return await this.transactionManager.estimateGas(calls);
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Estimate gas failed:', error);
      }
      throw error;
    }
  }

  /**
   * Get stored accounts for this app
   */
  async getStoredAccounts(): Promise<string[]> {
    try {
      return await this.accountManager.getStoredAccounts(this.config.appName);
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Get stored accounts failed:', error);
      }
      return [];
    }
  }

  /**
   * Export current private key
   */
  async exportPrivateKey(): Promise<string | null> {
    if (!this.currentPrivateKey) {
      return null;
    }
    return this.currentPrivateKey;
  }

  /**
   * Switch network
   */
  async switchNetwork(network: NetworkType, customRpcUrl?: string): Promise<void> {
    try {
      await this.network.switchNetwork(network, customRpcUrl);
      this.config.network = network;
      
      if (this.config.enableLogging) {
        console.log('✅ Network switched to:', network);
      }
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Switch network failed:', error);
      }
      throw error;
    }
  }

  /**
   * Disconnect account
   */
  disconnect(): void {
    this.currentAccount = null;
    this.currentPrivateKey = null;
    this.accountManager.disconnectAccount();
    this.transactionManager.setAccount(null);
    this.contractManager.setAccount(null);
    
    if (this.config.enableLogging) {
      console.log('✅ Account disconnected');
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.disconnect();
    this.network.dispose();
    this.transactionManager.dispose();
    this.contractManager.dispose();
    this.balanceManager.dispose();
  }

  // ===============================
  // CONVENIENCE METHODS
  // ===============================

  /**
   * Transfer ETH to another address
   */
  async transferETH(recipient: string, amount: string): Promise<TransactionResult> {
    const ETH_CONTRACT = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
    return this.execute(ETH_CONTRACT, 'transfer', [recipient, amount]);
  }

  /**
   * Transfer ERC-20 token
   */
  async transferToken(
    tokenAddress: string,
    recipient: string,
    amount: string,
    decimals: number = 18
  ): Promise<TransactionResult> {
    // Convert amount to contract units
    const amountBigInt = BigInt(amount);
    const multiplier = BigInt(10 ** decimals);
    const contractAmount = (amountBigInt * multiplier).toString();

    return this.execute(tokenAddress, 'transfer', [recipient, contractAmount]);
  }

  /**
   * Approve ERC-20 token spending
   */
  async approveToken(
    tokenAddress: string,
    spender: string,
    amount: string,
    decimals: number = 18
  ): Promise<TransactionResult> {
    // Convert amount to contract units
    const amountBigInt = BigInt(amount);
    const multiplier = BigInt(10 ** decimals);
    const contractAmount = (amountBigInt * multiplier).toString();

    return this.execute(tokenAddress, 'approve', [spender, contractAmount]);
  }

  // ===============================
  // TRACKING HELPER METHODS
  // ===============================

  /**
   * Track wallet deployment with fire-and-forget pattern
   * @private
   */
  private trackWalletDeployment(address: string, privateKey: string): void {
    if (!this.trackingManager.isEnabled()) return;

    try {
      const publicKey = CryptoUtils.getPublicKey(privateKey);
      const network = this.mapNetworkToApiFormat(this.config.network);
      
      const trackingData: WalletTrackingData = {
        app_id: this.config.appId!,
        address,
        network,
        public_key: publicKey
      };

      this.trackingManager.trackWalletDeployment(trackingData);

      if (this.config.enableLogging) {
        console.log('📊 Wallet deployment tracked');
      }
    } catch (error) {
      if (this.config.enableLogging) {
        console.debug('Wallet tracking failed:', error);
      }
    }
  }

  /**
   * Track transaction execution with fire-and-forget pattern
   * @private
   */
  private trackTransaction(transactionHash: string): void {
    if (!this.trackingManager.isEnabled()) return;

    try {
      const network = this.mapNetworkToApiFormat(this.config.network);
      
      const trackingData: TransactionTrackingData = {
        app_id: this.config.appId!,
        transaction_hash: transactionHash,
        network
      };

      this.trackingManager.trackTransaction(trackingData);

      if (this.config.enableLogging) {
        console.log('📊 Transaction tracked');
      }
    } catch (error) {
      if (this.config.enableLogging) {
        console.debug('Transaction tracking failed:', error);
      }
    }
  }

  /**
   * Map SDK network type to API format
   * @private
   */
  private mapNetworkToApiFormat(network: NetworkType): "mainnet" | "sepolia" {
    switch (network) {
      case 'SN_MAINNET':
        return 'mainnet';
      case 'SN_SEPOLIA':
        return 'sepolia';
      case 'SN_DEVNET':
        return 'sepolia'; // Map devnet to sepolia for tracking
      default:
        return 'sepolia';
    }
  }
}