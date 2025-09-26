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
  TransactionTrackingData,
  SocialWalletData,
  ValidationError,
  AuthenticationError
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
import { SocialAuthManager } from '../auth/social-auth-manager';

export class AegisSDK {
  private storage: SecureStorage;
  private network: NetworkManager;
  private accountManager: AccountManager;
  private paymaster: PaymasterIntegration;
  private transactionManager: TransactionManager;
  private contractManager: ContractManager;
  private balanceManager: BalanceManager;
  private trackingManager: TrackingManager;
  private socialAuthManager: SocialAuthManager | null = null;

  public readonly config: WalletConfig;

  constructor(config: WalletConfig) {
    // Store config without enforcing wallet mode
    this.config = config;

    // Initialize managers
    this.storage = new SecureStorage(); // Simplified storage
    this.network = new NetworkManager(config.network, config.rpcUrl, config.enableLogging);
    this.accountManager = new AccountManager(this.storage, this.network, config.enableLogging);
    
    const paymasterConfig: PaymasterConfig = {
      apiKey: config.paymasterApiKey,
      backendUrl: config.paymasterBackendUrl,
      supportedNetworks: ['SN_MAINNET', 'SN_SEPOLIA'],
    };
    this.paymaster = new PaymasterIntegration(this.network, paymasterConfig, config.enableLogging);
    
    this.transactionManager = new TransactionManager(
      this.network,
      this.paymaster,
      config.batchSize,
      config.maxRetries,
      config.enableLogging
    );
    
    this.contractManager = new ContractManager(this.network, this.transactionManager, config.enableLogging);
    this.balanceManager = new BalanceManager(this.network, this.contractManager, config.enableLogging);
    
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

    // Always initialize social login capabilities
    this.initializeSocialLogin();

    // Auto-loading removed - users explicitly connect with their own stored keys
  }

  private initializeSocialLogin(): void {
    const baseUrl = this.config.trackingApiUrl || 'https://services.cavos.xyz';

    this.socialAuthManager = new SocialAuthManager(
      this.config.appId,
      baseUrl,
      this.config.network,
      this.config.enableLogging || false
    );

    // Connect social auth manager to other managers
    this.accountManager.setSocialAuthManager(this.socialAuthManager);
    this.transactionManager.setSocialAuthManager(this.socialAuthManager);

    if (this.config.enableLogging) {
      console.log('[Aegis] Social login initialized:', {
        appId: this.config.appId,
        baseUrl: baseUrl,
        network: this.config.network
      });
    }
  }

  // ===============================
  // ACCOUNT MANAGEMENT
  // ===============================

  /**
   * Generate a new private key without deploying
   * @returns The private key - store it securely!
   */
  generateAccount(): string {
    const privateKey = this.accountManager.generatePrivateKey();

    if (this.config.enableLogging) {
      console.log('Generated new private key');
    }

    return privateKey;
  }

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
    
    // Connect and store the deployed account
    const account = await this.accountManager.connectAVNUAccount(privateKey);
    
    // Store the account for persistence
    // Storage removed - users handle their own key storage
    
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
      
      // Store the account for persistence
      // Storage removed - users handle their own key storage
      
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
    return this.accountManager.getCurrentAddress();
  }

  /**
   * Check if an account is currently connected
   * @returns True if account is connected, false otherwise
   */
  get isConnected(): boolean {
    return this.accountManager.getCurrentAccount() !== null;
  }

  // ===============================
  // SOCIAL LOGIN AUTHENTICATION
  // ===============================

  /**
   * Sign up a new user with email/password
   * @param email User's email address
   * @param password User's password
   * @returns Social wallet data with user info and wallet address
   * @throws {AuthenticationError} If sign up fails
   */
  async signUp(email: string, password: string): Promise<SocialWalletData> {
    if (!this.socialAuthManager) {
      throw new ValidationError('Social auth manager not initialized');
    }

    try {
      const walletData = await this.socialAuthManager.signUp(email, password);

      // Connect the social account
      await this.accountManager.connectSocialAccount(walletData);
      this.transactionManager.setSocialWallet(walletData);

      if (this.config.enableLogging) {
        console.log('[Aegis] Social sign up successful:', walletData.wallet.address);
      }

      return walletData;
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error('[Aegis] Social sign up failed:', error);
      }
      throw error;
    }
  }

  /**
   * Sign in an existing user with email/password
   * @param email User's email address
   * @param password User's password
   * @returns Social wallet data with user info and wallet address
   * @throws {AuthenticationError} If sign in fails
   */
  async signIn(email: string, password: string): Promise<SocialWalletData> {
    if (!this.socialAuthManager) {
      throw new ValidationError('Social auth manager not initialized');
    }

    try {
      const walletData = await this.socialAuthManager.signIn(email, password);

      // Connect the social account
      await this.accountManager.connectSocialAccount(walletData);
      this.transactionManager.setSocialWallet(walletData);

      if (this.config.enableLogging) {
        console.log('[Aegis] Social sign in successful:', walletData.wallet.address);
      }

      return walletData;
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error('[Aegis] Social sign in failed:', error);
      }
      throw error;
    }
  }

  /**
   * Sign out the current social login user (social login mode only)
   * @throws {ValidationError} If called in in-app wallet mode
   */
  async signOut(): Promise<void> {
    if (!this.socialAuthManager) {
      return; // Already signed out
    }

    try {
      await this.socialAuthManager.signOut();
      this.disconnect(); // Clear local state

      if (this.config.enableLogging) {
        console.log('[Aegis] Social sign out completed');
      }
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error('[Aegis] Social sign out failed:', error);
      }
      // Don't throw on sign out failures, just log them
    }
  }

  /**
   * Get current social wallet data (social login mode only)
   * @returns Social wallet data or null if not signed in
   * @throws {ValidationError} If called in in-app wallet mode
   */
  getSocialWallet(): SocialWalletData | null {
    return this.accountManager.getSocialWallet();
  }

  /**
   * Check if user is authenticated with social login (social login mode only)
   * @returns True if authenticated, false otherwise
   * @throws {ValidationError} If called in in-app wallet mode
   */
  isSocialAuthenticated(): boolean {
    return this.socialAuthManager?.isAuthenticated() || false;
  }

  // ===============================
  // OAUTH URL GENERATION
  // ===============================

  /**
   * Get Apple OAuth URL - open this URL in your preferred browser method
   * @param redirectUri The redirect URI for your app (e.g., 'exp://192.168.1.16:8081' or 'yourapp://oauth')
   * @returns OAuth URL to open
   */
  async getAppleOAuthUrl(redirectUri: string): Promise<string> {
    if (!this.socialAuthManager) {
      throw new ValidationError('Social auth manager not initialized');
    }

    return this.socialAuthManager.getAppleOAuthUrl(redirectUri);
  }

  /**
   * Get Google OAuth URL - open this URL in your preferred browser method
   * @param redirectUri The redirect URI for your app (e.g., 'exp://192.168.1.16:8081' or 'yourapp://oauth')
   * @returns OAuth URL to open
   */
  async getGoogleOAuthUrl(redirectUri: string): Promise<string> {
    if (!this.socialAuthManager) {
      throw new ValidationError('Social auth manager not initialized');
    }

    return this.socialAuthManager.getGoogleOAuthUrl(redirectUri);
  }

  /**
   * Handle OAuth callback data and connect the social account
   * Use this after WebBrowser.openAuthSessionAsync() or similar returns with user data
   * @param callbackData The data returned from OAuth (could be URL string or parsed object)
   */
  async handleOAuthCallback(callbackData: string | any): Promise<void> {
    if (!this.socialAuthManager) {
      throw new ValidationError('Social auth manager not initialized');
    }

    try {
      const walletData = await this.socialAuthManager.parseOAuthCallback(callbackData);

      // Connect the social account
      await this.accountManager.connectSocialAccount(walletData);
      this.transactionManager.setSocialWallet(walletData);

      if (this.config.enableLogging) {
        console.log('[Aegis] OAuth callback handled successfully:', walletData.wallet.address);
      }
    } catch (error: any) {
      if (this.config.enableLogging) {
        console.error('[Aegis] OAuth callback handling failed:', error);
      }
      throw error;
    }
  }

  // ===============================
  // MULTI-WALLET MANAGEMENT
  // ===============================

  /**
   * Get the currently active wallet type
   * @returns 'social' if social wallet is connected, 'in-app' if in-app wallet is connected, null if none
   */
  getActiveWalletType(): 'social' | 'in-app' | null {
    const hasSocialWallet = this.accountManager.isSocialLoginMode();
    const hasInAppWallet = this.accountManager.getCurrentAccount() !== null && !hasSocialWallet;

    if (hasSocialWallet) return 'social';
    if (hasInAppWallet) return 'in-app';
    return null;
  }

  /**
   * Get information about all connected wallets
   * @returns Object containing wallet status information
   */
  getWalletStatus() {
    const socialWallet = this.accountManager.getSocialWallet();
    const inAppAccount = this.accountManager.getCurrentAccount();
    const activeType = this.getActiveWalletType();

    return {
      activeWalletType: activeType,
      social: {
        connected: socialWallet !== null,
        address: socialWallet?.wallet?.address || null,
        email: socialWallet?.email || null
      },
      inApp: {
        connected: inAppAccount !== null && !this.accountManager.isSocialLoginMode(),
        address: inAppAccount?.address || null
      }
    };
  }

  /**
   * Check if any wallet is connected (either social or in-app)
   * @returns True if any wallet type is connected
   */
  isWalletConnected(): boolean {
    return this.getActiveWalletType() !== null;
  }

  /**
   * Disconnect all wallets (both social and in-app)
   */
  async disconnectAllWallets(): Promise<void> {
    // Disconnect social wallet if connected
    if (this.accountManager.isSocialLoginMode()) {
      await this.signOut();
    }

    // Disconnect in-app wallet if connected
    if (this.accountManager.getCurrentAccount()) {
      this.accountManager.disconnectAccount();
    }
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
    if (!this.accountManager.getCurrentAccount()) {
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
    if (!this.accountManager.getCurrentAccount()) {
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
   * @param abi Optional contract ABI for better type safety
   * @returns The function result
   * @throws {Error} If the call fails
   */
  async call(
    contractAddress: string,
    method: string,
    args: any[] = [],
    abi?: any[]
  ): Promise<any> {
    try {
      const result = await this.contractManager.callContract(contractAddress, method, args, abi);
      
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
  // getStoredAccounts and exportPrivateKey removed - users handle their own key storage

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

  // loadExistingAccount method completely removed - users handle their own key storage
}