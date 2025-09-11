/**
 * In-app wallet implementation with client-side key management
 */

import { Account, Call, RpcProvider, Contract } from 'starknet';
import type { 
  AegisWallet, 
  ExecuteOptions, 
  TransactionResult, 
  TokenBalance 
} from '../../types/wallet';
import type { InternalAegisConfig } from '../../types/config';
import { AegisError, AegisErrorCode, AegisErrorType } from '../../types/errors';
import { 
  generateAccountAddress, 
  prepareDeploymentData, 
  getPublicKeyFromPrivateKey,
  type AccountType 
} from '../../utils/crypto';
import { validateCallData } from '../../core/validation';
import type { StorageManager } from '../../utils/storage/StorageManager';
import type { KeyManager } from '../../utils/crypto/KeyManager';

/**
 * Standard ERC20 ABI for balance queries
 */
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt252' }],
    outputs: [{ name: 'balance', type: 'felt252' }],
    stateMutability: 'view',
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'felt252' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'felt252' }],
    stateMutability: 'view',
  },
];

/**
 * ETH token contract address on Starknet
 */
const ETH_TOKEN_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

/**
 * In-app wallet implementation for client-side key management
 */
export class InAppWallet implements AegisWallet {
  public readonly type = 'inapp' as const;
  public address: string;
  public network: string;

  private privateKey: string;
  private account: Account;
  private provider: RpcProvider;
  private config: InternalAegisConfig;
  private storageManager: StorageManager;
  private keyManager: KeyManager;
  private accountType: AccountType;
  private deployed: boolean = false;

  constructor(
    privateKey: string,
    network: string,
    provider: RpcProvider,
    config: InternalAegisConfig,
    storageManager: StorageManager,
    keyManager: KeyManager,
    accountType: AccountType = 'argentx'
  ) {
    this.privateKey = privateKey;
    this.network = network;
    this.provider = provider;
    this.config = config;
    this.storageManager = storageManager;
    this.keyManager = keyManager;
    this.accountType = accountType;

    // Generate account address using POW patterns
    this.address = generateAccountAddress(privateKey, accountType);

    // Create Starknet Account instance
    this.account = new Account(provider, this.address, privateKey);
  }

  /**
   * Create a new in-app wallet
   */
  static async create(
    appId: string,
    network: string,
    provider: RpcProvider,
    config: InternalAegisConfig,
    storageManager: StorageManager,
    keyManager: KeyManager,
    accountType: AccountType = 'argentx',
    options: { withBiometrics?: boolean; name?: string } = {}
  ): Promise<InAppWallet> {
    try {
      // Generate secure private key
      const privateKey = keyManager.generatePrivateKey();

      // Create wallet instance
      const wallet = new InAppWallet(
        privateKey,
        network,
        provider,
        config,
        storageManager,
        keyManager,
        accountType
      );

      // Store private key securely
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
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.WALLET_NOT_FOUND,
        `Failed to create in-app wallet: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Connect to existing wallet from stored key
   */
  static async fromStoredKey(
    keyId: string,
    appId: string,
    network: string,
    provider: RpcProvider,
    config: InternalAegisConfig,
    storageManager: StorageManager,
    keyManager: KeyManager,
    accountType: AccountType = 'argentx',
    withBiometrics: boolean = false
  ): Promise<InAppWallet> {
    try {
      // Parse key ID to extract address
      // Key format: "network.appId.accountType.address"
      const keyParts = keyId.split('.');
      if (keyParts.length !== 4) {
        throw new AegisError(
          AegisErrorType.WALLET_ERROR,
          AegisErrorCode.INVALID_PRIVATE_KEY,
          'Invalid key ID format'
        );
      }

      const [keyNetwork, keyAppId, keyAccountType, address] = keyParts;

      // Validate key matches parameters
      if (keyNetwork !== network || keyAppId !== appId || keyAccountType !== accountType) {
        throw new AegisError(
          AegisErrorType.WALLET_ERROR,
          AegisErrorCode.WALLET_NOT_FOUND,
          'Key ID does not match wallet parameters'
        );
      }

      // Retrieve private key
      const privateKey = await keyManager.getPrivateKey(
        appId,
        network,
        accountType,
        address,
        withBiometrics
      );

      if (!privateKey) {
        throw new AegisError(
          AegisErrorType.STORAGE_ERROR,
          AegisErrorCode.KEY_NOT_FOUND,
          'Private key not found in storage'
        );
      }

      // Create wallet instance
      const wallet = new InAppWallet(
        privateKey,
        network,
        provider,
        config,
        storageManager,
        keyManager,
        accountType as AccountType
      );

      // Verify address matches
      if (wallet.address !== address) {
        throw new AegisError(
          AegisErrorType.WALLET_ERROR,
          AegisErrorCode.INVALID_PRIVATE_KEY,
          'Stored private key does not match expected address'
        );
      }

      return wallet;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }

      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.WALLET_NOT_FOUND,
        `Failed to connect wallet from stored key: ${error}`,
        false,
        error
      );
    }
  }

  /**
   * Execute transaction calls
   */
  async execute(calls: Call[], options: ExecuteOptions = {}): Promise<TransactionResult> {
    try {
      // Validate calls
      validateCallData(calls);

      const retries = options.retries || this.config.maxTransactionRetries || 3;

      if (this.network === 'devnet') {
        return await this.executeDirectly(calls, options, retries);
      } else {
        return await this.executeWithPaymaster(calls, options, retries);
      }
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }

      throw new AegisError(
        AegisErrorType.TRANSACTION_ERROR,
        AegisErrorCode.TRANSACTION_FAILED,
        `Transaction execution failed: ${error}`,
        true,
        error
      );
    }
  }

  /**
   * Sign a message with the wallet's private key
   */
  async signMessage(message: string): Promise<string> {
    try {
      // The Starknet.js Account.signMessage expects a TypedData, not a string.
      // For simple string messages, wrap the string in a basic EIP-712 typed data structure.
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
      // signature is an array of felts (strings). Return as a comma-separated string.
      return Array.isArray(signature) ? signature.join(",") : String(signature);
    } catch (error) {
      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.INVALID_PRIVATE_KEY,
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
  async getETHBalance(): Promise<string> {
    try {
      // ETH on Starknet is typically represented by the ETH token contract.
      // You may want to make the ETH address configurable, but here we use the canonical ETH address.
      const ETH_ADDRESS = "0x049d36570d4e46e6b72bfc718fc8f349bca18babedd23e8a6d6f2b3e7c5e0a"; // Mainnet & testnet ETH address
      const contract = new Contract(ERC20_ABI, ETH_ADDRESS, this.provider);
      const balance = await contract.balanceOf(this.address);

      // ETH has 18 decimals
      const decimals = 18;
      let balanceStr = balance.toString();

      // Format with decimals
      const balanceNum = BigInt(balanceStr);
      const divisor = BigInt(10 ** decimals);
      const whole = balanceNum / divisor;
      const fraction = balanceNum % divisor;

      if (fraction === 0n) {
        balanceStr = whole.toString();
      } else {
        const fractionStr = fraction.toString().padStart(decimals, '0');
        balanceStr = `${whole}.${fractionStr.replace(/0+$/, '')}`;
      }

      return balanceStr;
    } catch (error) {
      throw new AegisError(
        AegisErrorType.NETWORK_ERROR,
        AegisErrorCode.RPC_REQUEST_FAILED,
        `Failed to get ETH balance: ${error}`,
        true,
        error
      );
    }
  }

  /**
   * Get ERC20 token balance
   */
  async getERC20Balance(tokenAddress: string, decimals?: number): Promise<string> {
    try {
      const contract = new Contract(ERC20_ABI, tokenAddress, this.provider);
      const balance = await contract.balanceOf(this.address);
      
      let balanceStr = balance.toString();
      
      // Apply decimal formatting if provided
      if (decimals && decimals > 0) {
        const balanceNum = BigInt(balanceStr);
        const divisor = BigInt(10 ** decimals);
        const whole = balanceNum / divisor;
        const fraction = balanceNum % divisor;
        
        if (fraction === 0n) {
          balanceStr = whole.toString();
        } else {
          const fractionStr = fraction.toString().padStart(decimals, '0');
          balanceStr = `${whole}.${fractionStr.replace(/0+$/, '')}`;
        }
      }
      
      return balanceStr;
    } catch (error) {
      throw new AegisError(
        AegisErrorType.NETWORK_ERROR,
        AegisErrorCode.RPC_REQUEST_FAILED,
        `Failed to get ERC20 balance: ${error}`,
        true,
        error
      );
    }
  }

  /**
   * Deploy the account if not already deployed
   */
  async deploy(): Promise<void> {
    try {
      if (await this.isDeployed()) {
        return; // Already deployed
      }

      if (this.network === 'devnet') {
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
        AegisErrorType.TRANSACTION_ERROR,
        AegisErrorCode.TRANSACTION_FAILED,
        `Account deployment failed: ${error}`,
        true,
        error
      );
    }
  }

  /**
   * Check if account is deployed
   */
  async isDeployed(): Promise<boolean> {
    try {
      const classHash = await this.provider.getClassHashAt(this.address);
      return classHash !== '0x0';
    } catch {
      return false;
    }
  }

  /**
   * Disconnect and clear wallet state
   */
  async disconnect(): Promise<void> {
    // Clear private key from memory
    this.privateKey = '';
    
    // Note: Private key remains in secure storage unless explicitly removed
  }

  /**
   * Export private key (with proper security warning)
   */
  async exportPrivateKey(): Promise<string> {
    if (!this.privateKey) {
      throw new AegisError(
        AegisErrorType.WALLET_ERROR,
        AegisErrorCode.WALLET_NOT_FOUND,
        'Wallet is disconnected - private key not available'
      );
    }

    return this.privateKey;
  }

  /**
   * Get account public key
   */
  getPublicKey(): string {
    return getPublicKeyFromPrivateKey(this.privateKey);
  }

  /**
   * Get account type
   */
  getAccountType(): AccountType {
    return this.accountType;
  }

  /**
   * Execute transaction directly (for devnet)
   */
  private async executeDirectly(
    calls: Call[], 
    options: ExecuteOptions, 
    retries: number
  ): Promise<TransactionResult> {
    const executeWithRetries = async (attempt: number): Promise<TransactionResult> => {
      try {
        const maxFee = options.maxFee || '100000000000000'; // Default max fee
        
        const result = await this.account.execute(calls, {
          maxFee,
          nonce: options.nonce,
        });

        if (retries > 0) {
          const isConfirmed = await this.waitForTransaction(result.transaction_hash);
          if (!isConfirmed) {
            throw new Error(`Transaction ${result.transaction_hash} failed confirmation`);
          }
        }

        return {
          transaction_hash: result.transaction_hash,
          status: 'confirmed',
        };
      } catch (error) {
        if (attempt < retries) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
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
  private async executeWithPaymaster(
    calls: Call[], 
    options: ExecuteOptions, 
    retries: number
  ): Promise<TransactionResult> {
    // This will be implemented when PaymasterIntegration is created
    // For now, throw an error indicating the feature is not yet available
    throw new AegisError(
      AegisErrorType.TRANSACTION_ERROR,
      AegisErrorCode.PAYMASTER_ERROR,
      'Paymaster integration not yet implemented'
    );
  }

  /**
   * Deploy account to devnet
   */
  private async deployToDevnet(): Promise<void> {
    const deploymentData = prepareDeploymentData(this.privateKey, this.accountType);

    const deployResult = await this.account.deployAccount(
      {
        classHash: deploymentData.classHash,
        constructorCalldata: deploymentData.constructorCalldata,
        addressSalt: deploymentData.salt,
      },
      { maxFee: '100000000000000' } // Default max fee for devnet
    );

    await this.provider.waitForTransaction(deployResult.transaction_hash);
  }

  /**
   * Deploy account with paymaster
   */
  private async deployWithPaymaster(): Promise<void> {
    // This will be implemented when PaymasterIntegration is created
    throw new AegisError(
      AegisErrorType.TRANSACTION_ERROR,
      AegisErrorCode.PAYMASTER_ERROR,
      'Paymaster deployment not yet implemented'
    );
  }

  /**
   * Wait for transaction confirmation
   */
  private async waitForTransaction(txHash: string): Promise<boolean> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        
        if (receipt.isSuccess()) {
          return true;
        } else {
          return false;
        }
        
        await this.delay(5000);
      } catch (error) {
        // Transaction might not be available yet
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await this.delay(5000);
      }
    }

    return false;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get detailed token balance information
   */
  async getTokenBalance(tokenAddress: string): Promise<TokenBalance> {
    try {
      const contract = new Contract(ERC20_ABI, tokenAddress, this.provider);
      
      const [balance, symbol, decimals] = await Promise.all([
        contract.balanceOf(this.address),
        contract.symbol().catch(() => 'UNKNOWN'),
        contract.decimals().catch(() => 18),
      ]);

      const balanceStr = balance.toString();
      const decimalsNum = Number(decimals);
      
      // Format balance for display
      const balanceNum = BigInt(balanceStr);
      const divisor = BigInt(10 ** decimalsNum);
      const whole = balanceNum / divisor;
      const fraction = balanceNum % divisor;
      
      let formatted: string;
      if (fraction === 0n) {
        formatted = whole.toString();
      } else {
        const fractionStr = fraction.toString().padStart(decimalsNum, '0');
        formatted = `${whole}.${fractionStr.replace(/0+$/, '')}`;
      }

      return {
        address: tokenAddress,
        symbol: symbol.toString(),
        name: symbol.toString(), // For ERC20, name often equals symbol
        decimals: decimalsNum,
        balance: balanceStr,
        formatted,
      };
    } catch (error) {
      throw new AegisError(
        AegisErrorType.NETWORK_ERROR,
        AegisErrorCode.RPC_REQUEST_FAILED,
        `Failed to get token balance information: ${error}`,
        true,
        error
      );
    }
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(): Promise<void> {
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
      // Don't throw errors for metadata updates
      console.warn('Failed to update last used timestamp:', error);
    }
  }
}