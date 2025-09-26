import { Account, ec, hash, CallData, CairoCustomEnum, CairoOption } from 'starknet';
import { CryptoUtils } from '../core/crypto';
import { SecureStorage } from '../storage/secure-storage';
import { NetworkManager } from '../network/network-manager';
import { AccountType, WalletAccount, DeploymentError, ValidationError, SocialWalletData } from '../types';
import { SocialAuthManager } from '../auth/social-auth-manager';

export class AccountManager {
  private storage: SecureStorage;
  private network: NetworkManager;
  private currentAccount: Account | null = null;
  private enableLogging: boolean;
  private socialAuthManager: SocialAuthManager | null = null;
  private currentSocialWallet: SocialWalletData | null = null;

  constructor(storage: SecureStorage, network: NetworkManager, enableLogging: boolean = false) {
    this.storage = storage;
    this.network = network;
    this.enableLogging = enableLogging;
  }

  // ===============================
  // SOCIAL LOGIN INTEGRATION
  // ===============================

  setSocialAuthManager(socialAuthManager: SocialAuthManager): void {
    this.socialAuthManager = socialAuthManager;
  }

  async connectSocialAccount(walletData: SocialWalletData): Promise<string> {
    if (!walletData.wallet?.address) {
      throw new ValidationError('Invalid social wallet data: missing address');
    }

    // Store the social wallet data
    this.currentSocialWallet = walletData;

    // Create a mock Account object for consistency with existing code
    // This account won't be used for actual signing since social login uses server-side execution
    const mockAccount = this.createMockAccountFromSocial(walletData);
    this.currentAccount = mockAccount;

    if (this.enableLogging) {
      console.log('[AccountManager] Social account connected:', walletData.wallet.address);
    }

    return walletData.wallet.address;
  }

  getSocialWallet(): SocialWalletData | null {
    return this.currentSocialWallet;
  }

  isSocialLoginMode(): boolean {
    return this.currentSocialWallet !== null;
  }

  private createMockAccountFromSocial(walletData: SocialWalletData): Account {
    // Create a mock Account object that provides the interface expected by other components
    // The private key is set to a placeholder since actual signing happens server-side
    const provider = this.network.getProvider();
    const mockPrivateKey = '0x1'; // Placeholder - not used for actual signing

    const mockAccount = new Account(provider, walletData.wallet.address, mockPrivateKey);

    // Override the execute method to throw an error if called directly
    // Social login transactions should go through the social transaction manager
    const originalExecute = mockAccount.execute.bind(mockAccount);
    mockAccount.execute = () => {
      throw new Error('Social login accounts cannot execute transactions directly. Use the SDK\'s execute methods.');
    };

    return mockAccount;
  }

  generatePrivateKey(): string {
    return CryptoUtils.generateSecurePrivateKey();
  }

  generateAccountAddress(privateKey: string, accountType: AccountType = 'argentX'): string {
    if (!CryptoUtils.isValidPrivateKey(privateKey)) {
      throw new ValidationError('Invalid private key provided');
    }

    const publicKey = CryptoUtils.getPublicKey(privateKey);
    const classHash = CryptoUtils.getAccountClassHash(accountType);
    const constructorCalldata = CryptoUtils.getConstructorCalldata(privateKey, accountType);

    return CryptoUtils.calculateContractAddress(publicKey, classHash, constructorCalldata);
  }

  getDeploymentData(privateKey: string, accountType: AccountType = 'argentX'): any {
    const publicKey = CryptoUtils.getPublicKey(privateKey);
    const classHash = CryptoUtils.getAccountClassHash(accountType);
    const constructorCalldata = CryptoUtils.getConstructorCalldata(privateKey, accountType);

    return {
      classHash,
      constructorCalldata,
      addressSalt: publicKey,
      contractAddress: this.generateAccountAddress(privateKey, accountType),
    };
  }

  // Storage-related methods removed - users handle their own key storage

  async connectAccount(privateKey: string, accountType: AccountType = 'argentX'): Promise<Account> {
    if (!CryptoUtils.isValidPrivateKey(privateKey)) {
      throw new ValidationError('Invalid private key provided');
    }

    const provider = this.network.getProvider();
    const address = this.generateAccountAddress(privateKey, accountType);
    
    this.currentAccount = new Account(provider, address, privateKey);
    return this.currentAccount;
  }

  // connectStoredAccount removed - users handle their own key storage

  async deployAccount(
    privateKey: string,
    accountType: AccountType = 'argentX',
    maxFee?: string
  ): Promise<void> {
    if (!this.currentAccount || (this.currentAccount.signer as any)?.pk !== privateKey) {
      await this.connectAccount(privateKey, accountType);
    }

    if (!this.currentAccount) {
      throw new DeploymentError('No account connected for deployment');
    }

    try {
      const starkKeyPub = CryptoUtils.getPublicKey(privateKey);
      const contractAddress = this.generateAccountAddress(privateKey, accountType);
      const constructorCalldata = CryptoUtils.getConstructorCalldata(privateKey, accountType);
      
      const { transaction_hash } = await this.currentAccount.deployAccount(
        {
          classHash: CryptoUtils.getAccountClassHash(accountType),
          constructorCalldata: constructorCalldata,
          addressSalt: starkKeyPub,
          contractAddress: contractAddress,
        },
        { maxFee: 100_000_000_000_000 } // Same maxFee as POW uses, no version specified = V1
      ).catch((error) => {
        // Handle already deployed case like POW does
        if (error instanceof Error && error.message.includes('already deployed')) {
          return { transaction_hash: "Account already exists" };
        }
        throw error;
      });
      
      if (transaction_hash === "Account already exists") {
        if (this.enableLogging) {
          console.log('Account already deployed, skipping deployment');
        }
        return;
      }

      // Wait for deployment to complete
      const isSuccess = await this.network.waitForTransaction(transaction_hash);
      
      if (!isSuccess) {
        throw new DeploymentError(`Account deployment failed: ${transaction_hash}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('already deployed')) {
        if (this.enableLogging) {
          console.log('Account already deployed, continuing...');
        }
        return;
      }
      throw new DeploymentError(`Failed to deploy account: ${error}`);
    }
  }

  async isAccountDeployed(address: string): Promise<boolean> {
    try {
      const provider = this.network.getProvider();
      const classHash = await provider.getClassHashAt(address);
      
      // If we get a class hash, the account is deployed
      return classHash !== '0x0' && classHash.length > 0;
    } catch (error) {
      // If we can't get the class hash, assume it's not deployed
      return false;
    }
  }

  // updateDeploymentStatus removed - users handle their own storage

  getCurrentAccount(): Account | null {
    return this.currentAccount;
  }

  getCurrentAddress(): string | null {
    return this.currentAccount?.address || null;
  }

  // exportPrivateKey and removeAccount removed - users handle their own storage

  disconnectAccount(): void {
    this.currentAccount = null;
    this.currentSocialWallet = null;

    if (this.enableLogging) {
      console.log('[AccountManager] Account disconnected');
    }
  }

  // storeKeyAndConnect removed - users handle their own storage, use connectAccount directly

  async getAccountBalance(address?: string): Promise<string> {
    const targetAddress = address || this.getCurrentAddress();
    if (!targetAddress) {
      throw new ValidationError('No address provided and no account connected');
    }

    try {
      const provider = this.network.getProvider();
      // Use ETH contract address for Starknet
      const ETH_CONTRACT = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const balance = await provider.callContract({
        contractAddress: ETH_CONTRACT,
        entrypoint: 'balanceOf',
        calldata: [targetAddress]
      });
      return balance[0];
    } catch (error) {
      if (this.enableLogging) {
        console.error('Failed to get account balance:', error);
      }
      return '0';
    }
  }

  // validateAccountAccess removed - users handle their own storage

  /**
   * Calculate account address using AVNU's ArgentX deployment method
   * @param privateKey The private key to calculate address for
   * @returns The calculated contract address
   */
  generateAVNUAccountAddress(privateKey: string): string {
    const argentXAccountClassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);

    const signer = new CairoCustomEnum({
      Starknet: { pubkey: starkKeyPub },
    });
    const guardian = new CairoOption(1);
    const constructorCallData = CallData.compile({
      owner: signer,
      guardian: guardian,
    });

    return hash.calculateContractAddressFromHash(
      argentXAccountClassHash,
      argentXAccountClassHash,
      constructorCallData,
      0
    );
  }

  /**
   * Deploy account using AVNU gasless deployment
   * @param privateKey The private key for the account to deploy
   * @param apiKey AVNU API key for gasless transactions
   * @returns The deployed account address
   * @throws {DeploymentError} If deployment fails
   */
  async deployAccountWithAVNU(privateKey: string, apiKey: string): Promise<string> {
    if (!CryptoUtils.isValidPrivateKey(privateKey)) {
      throw new ValidationError('Invalid private key provided');
    }

    if (!apiKey) {
      throw new DeploymentError("AVNU API key is required for gasless deployment");
    }

    const argentXAccountClassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";
    const starkKeyPub = ec.starkCurve.getStarkKey(privateKey);

    // Create constructor calldata
    const signer = new CairoCustomEnum({
      Starknet: { pubkey: starkKeyPub },
    });
    const guardian = new CairoOption(1);
    const constructorCallData = CallData.compile({
      owner: signer,
      guardian: guardian,
    });

    // Calculate contract address
    const contractAddress = hash.calculateContractAddressFromHash(
      argentXAccountClassHash,
      argentXAccountClassHash,
      constructorCallData,
      0
    );

    // Prepare deployment data
    const deploymentData = {
      class_hash: argentXAccountClassHash,
      salt: argentXAccountClassHash,
      unique: "0x0",
      calldata: constructorCallData.map((x) => `0x${BigInt(x).toString(16)}`),
    };

    // Determine AVNU API URL
    const currentNetwork = this.network.getCurrentNetwork();
    const baseUrl = currentNetwork === 'SN_SEPOLIA'
      ? "https://sepolia.api.avnu.fi"
      : "https://starknet.api.avnu.fi";

    try {
      // Step 1: Build typed data
      const typeDataResponse = await fetch(`${baseUrl}/paymaster/v1/build-typed-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          userAddress: contractAddress,
          accountClassHash: argentXAccountClassHash,
          deploymentData,
          calls: [],
        }),
      });

      if (!typeDataResponse.ok) {
        const errorText = await typeDataResponse.text();
        throw new DeploymentError(`Failed to build typed data: ${errorText}`);
      }

      // Step 2: Execute deployment
      const executeResponse = await fetch(`${baseUrl}/paymaster/v1/deploy-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          userAddress: contractAddress,
          deploymentData: deploymentData,
        }),
      });

      if (!executeResponse.ok) {
        const errorText = await executeResponse.text();
        throw new DeploymentError(`Failed to execute deployment: ${errorText}`);
      }

      const result = await executeResponse.json();

      return contractAddress;
    } catch (error) {
      if (error instanceof DeploymentError) {
        throw error;
      }
      throw new DeploymentError(`AVNU deployment failed: ${error}`);
    }
  }

  /**
   * Connect to an AVNU deployed account
   * @param privateKey The private key for the account
   * @returns Connected Account instance
   */
  async connectAVNUAccount(privateKey: string): Promise<Account> {
    if (!CryptoUtils.isValidPrivateKey(privateKey)) {
      throw new ValidationError('Invalid private key provided');
    }

    const provider = this.network.getProvider();
    const address = this.generateAVNUAccountAddress(privateKey);
    
    this.currentAccount = new Account(provider, address, privateKey);
    return this.currentAccount;
  }
}