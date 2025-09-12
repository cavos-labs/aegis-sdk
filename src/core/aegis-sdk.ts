import { Account, Call, CallData, hash, ec } from 'starknet';
import { 
  WalletConfig, 
  TransactionResult, 
  ExecutionOptions, 
  NFTToken,
  NetworkType,
  PaymasterConfig
} from '../types';
import { CryptoUtils } from './crypto';

import { SecureStorage } from '../storage/secure-storage';
import { NetworkManager } from '../network/network-manager';
import { AccountManager } from '../account/account-manager';
import { PaymasterIntegration } from '../transaction/paymaster';
import { TransactionManager } from '../transaction/transaction-manager';
import { ContractManager } from '../contract/contract-manager';
import { BalanceManager } from '../balance/balance-manager';

export class AegisSDK {
  private storage: SecureStorage;
  private network: NetworkManager;
  private accountManager: AccountManager;
  private paymaster: PaymasterIntegration;
  private transactionManager: TransactionManager;
  private contractManager: ContractManager;
  private balanceManager: BalanceManager;
  
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
  }

  // ===============================
  // ACCOUNT MANAGEMENT
  // ===============================

  /**
   * Deploy a new account (creates private key automatically)
   * Returns the private key - store it securely!
   */
  async deployAccount(): Promise<string> {
    try {
      // Generate new private key
      const privateKey = this.accountManager.generatePrivateKey();
      
      if (this.config.enableLogging) {
        console.log('🔑 Generated private key:', privateKey);
      }
      
      // Validate private key
      if (!CryptoUtils.isValidPrivateKey(privateKey)) {
        throw new Error('Generated private key is invalid');
      }
      
      // Connect to the account
      const account = await this.accountManager.connectAccount(privateKey);
      
      if (this.config.enableLogging) {
        console.log('🔗 Connected to account:', account.address);
      }
      
      // Deploy the account using POW's paymaster approach
      await this.deployAccountUsingPOWPaymaster(privateKey);
      
      // Store the account
      await this.accountManager.storeKeyAndConnect(privateKey, this.config.appName);
      
      // Set as current account
      this.currentAccount = account;
      this.currentPrivateKey = privateKey;
      
      // Update managers
      this.transactionManager.setAccount(account);
      this.contractManager.setAccount(account);
      
      if (this.config.enableLogging) {
        console.log('✅ Account deployed successfully:', account.address);
      }
      
      return privateKey;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Deploy account failed:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      throw error;
    }
  }

  /**
   * POW's exact account class hash function
   */
  private getAccountClassHash(accountClassName?: string): string {
    // Default to Argent X account class hash
    if (!accountClassName)
      return "0x01a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";

    if (accountClassName === "argentX") {
      return "0x01a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";
    } else if (accountClassName === "devnet") {
      return "0x02b31e19e45c06f29234e06e2ee98a9966479ba3067f8785ed972794fdb0065c";
    } else {
      if (this.config.enableLogging)
        console.error(`Unsupported account class: ${accountClassName}`);
      return "";
    }
  }

  /**
   * POW's exact deploy calldata function
   */
  private getDeployCalldata(privateKey: string, accountClassName?: string) {
    // Default to Argent X account class calldata
    if (!accountClassName) {
      const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
      const constructorCalldata = CallData.compile({
        owner: starkKeyPub,
        guardian: "0x0",
      });
      return constructorCalldata;
    }
    if (accountClassName === "argentX") {
      const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
      const constructorCalldata = CallData.compile({
        owner: starkKeyPub,
        guardian: "0x0",
      });
      return constructorCalldata;
    } else if (accountClassName === "devnet") {
      const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
      const constructorCalldata = CallData.compile({ pub_key: starkKeyPub });
      return constructorCalldata;
    } else {
      if (this.config.enableLogging)
        console.error(`Unsupported account class: ${accountClassName}`);
      return CallData.compile({});
    }
  }

  /**
   * POW's exact generate account address function
   */
  private generateAccountAddress(privateKey: string, accountClassName?: string) {
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    const constructorCalldata = this.getDeployCalldata(privateKey, accountClassName);
    const contractAddress = hash.calculateContractAddressFromHash(
      starkKeyPub,
      this.getAccountClassHash(accountClassName),
      constructorCalldata,
      0,
    );
    return contractAddress;
  }

  /**
   * Deploy account exactly like POW project does - no changes
   */
  private async deployAccountExactlyLikePOW(privateKey: string, accountClassName?: string): Promise<void> {
    const provider = this.network.getProvider();

    if (!provider) {
      console.error("Provider is not initialized.");
      return;
    }

    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
    const contractAddress = this.generateAccountAddress(
      privateKey,
      accountClassName,
    );
    const constructorCalldata = this.getDeployCalldata(
      privateKey,
      accountClassName,
    );

    const accountInstance = new Account(
      provider,
      contractAddress,
      privateKey,
    );
    
    const { transaction_hash, contract_address } = await accountInstance
      .deployAccount(
        {
          classHash: this.getAccountClassHash(accountClassName),
          constructorCalldata: constructorCalldata,
          addressSalt: starkKeyPub,
          contractAddress: contractAddress,
        },
        { maxFee: 100_000_000_000_000 },
      )
      .catch((error) => {
        // POW's exact error handling - assume already deployed
        return {
          transaction_hash: "Account already exists",
          contract_address: contractAddress,
        };
      });
      
    if (transaction_hash === "Account already exists") {
      // Connect to existing account
      this.currentAccount = new Account(provider, contractAddress, privateKey);
      this.currentPrivateKey = privateKey;
      if (this.config.enableLogging) {
        console.log('Account already exists, connected:', contractAddress);
      }
      return;
    }
    
    await provider.waitForTransaction(transaction_hash);
    if (this.config.enableLogging)
      console.log("✅ New account created.\n   address =", contract_address);
    
    // Connect to the newly deployed account
    this.currentAccount = new Account(provider, contract_address, privateKey);
    this.currentPrivateKey = privateKey;
  }

  /**
   * POW's exact deployment data function
   */
  private getDeploymentData(privateKey: string, accountClassName?: string) {
    const deploymentData = {
      class_hash: this.getAccountClassHash(accountClassName),
      calldata: this.getDeployCalldataHex(privateKey, accountClassName),
      salt: ec.starkCurve.getStarkKey(privateKey),
      unique: "0x0",
    };
    return deploymentData;
  }

  /**
   * POW's exact deploy calldata hex function
   */
  private getDeployCalldataHex(privateKey: string, accountClassName?: string) {
    // Default to Argent X account class calldata
    if (!accountClassName) {
      const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
      return [starkKeyPub, "0x0"];
    }
    if (accountClassName === "argentX") {
      const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
      return [starkKeyPub, "0x0"];
    } else if (accountClassName === "devnet") {
      const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);
      return [starkKeyPub];
    } else {
      if (this.config.enableLogging)
        console.error(`Unsupported account class: ${accountClassName}`);
      return [];
    }
  }

  /**
   * Deploy account using UDC with an existing funded account via paymaster
   */
  private async deployAccountUsingPOWPaymaster(privateKey: string, accountClassName?: string): Promise<void> {
    const provider = this.network.getProvider();
    
    if (!provider) {
      console.error("Provider is not initialized.");
      return;
    }

    // Use the existing funded account to deploy new accounts
    const DEPLOYER_ADDRESS = '0x06f58A6581F348180A4A8EF0f6a2168cef1a53874A3ec1980D35FFB9b4227948';
    const DEPLOYER_PK = '0x058295e9af8fd50ed9175e597b1d7b18d09e41d62c7f8e0987abeebbd6ab41ae';
    
    const deployerAccount = new Account(provider, DEPLOYER_ADDRESS, DEPLOYER_PK);

    // Calculate new account details
    const publicKey = ec.starkCurve.getStarkKey(privateKey);
    const contractClassHash = this.getAccountClassHash(accountClassName);
    const constructor = CallData.compile([publicKey, "0x0"]); // [owner, guardian]
    
    // Use random salt for unique addresses
    const salt = ec.starkCurve.getStarkKey(privateKey); // Use new account's public key as salt
    
    // Calculate the address where new account will be deployed
    const newAccountAddress = hash.calculateContractAddressFromHash(
      salt,
      contractClassHash,
      constructor,
      0
    );

    if (this.config.enableLogging) {
      console.log('🔧 UDC deployment via existing account:', {
        deployerAccount: DEPLOYER_ADDRESS,
        newAccountAddress,
        classHash: contractClassHash,
        constructor,
        salt
      });
    }

    // Create UDC deployment call
    const UDC_ADDRESS = '0x041a78e741e5af2fec34b695679bc6891742439f7afb8484ecd7766661ad02bf';
    const deployCall: Call = {
      contractAddress: UDC_ADDRESS,
      entrypoint: 'deployContract',
      calldata: CallData.compile({
        classHash: contractClassHash,
        salt: salt,
        unique: "0",
        calldata: constructor,
      }),
    };

    // Execute UDC call using the funded account via paymaster
    const result = await this.paymaster.execute(
      deployerAccount,
      [deployCall]
    );
    
    if (this.config.enableLogging) {
      console.log('✅ Account deployed via UDC + paymaster:', result.transactionHash);
      console.log('🏠 New account address:', newAccountAddress);
    }
    
    // Wait for deployment
    await this.waitForTransaction(result.transactionHash);
    
    // Set current account to the newly deployed account
    this.currentAccount = new Account(provider, newAccountAddress, privateKey);
    this.currentPrivateKey = privateKey;
  }

  /**
   * Connect to an existing account using private key
   */
  async connectAccount(privateKey: string): Promise<string> {
    try {
      const account = await this.accountManager.connectAccount(privateKey);
      
      this.currentAccount = account;
      this.currentPrivateKey = privateKey;
      
      // Update managers
      this.transactionManager.setAccount(account);
      this.contractManager.setAccount(account);
      
      if (this.config.enableLogging) {
        console.log('✅ Account connected:', account.address);
      }
      
      return account.address;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Connect account failed:', error);
      }
      throw error;
    }
  }

  /**
   * Get current account address
   */
  get address(): string | null {
    return this.currentAccount?.address || null;
  }

  /**
   * Check if account is connected
   */
  get isConnected(): boolean {
    return this.currentAccount !== null;
  }

  // ===============================
  // TRANSACTION EXECUTION
  // ===============================

  /**
   * Execute contract calls (main method)
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
      
      return result;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Execute failed:', error);
      }
      throw error;
    }
  }

  /**
   * Execute multiple contract calls in one transaction
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
   * Call contract view function (read-only)
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
}