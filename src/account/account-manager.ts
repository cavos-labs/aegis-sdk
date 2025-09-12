import { Account } from 'starknet';
import { CryptoUtils } from '../core/crypto';
import { SecureStorage } from '../storage/secure-storage';
import { NetworkManager } from '../network/network-manager';
import { AccountType, WalletAccount, DeploymentError, ValidationError } from '../types';

export class AccountManager {
  private storage: SecureStorage;
  private network: NetworkManager;
  private currentAccount: Account | null = null;

  constructor(storage: SecureStorage, network: NetworkManager) {
    this.storage = storage;
    this.network = network;
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

  private generateStorageKey(appName: string, accountType: AccountType, address: string): string {
    const network = this.network.getCurrentNetwork();
    return `${network}.${appName}.${accountType}.${address}`;
  }

  async storeAccount(
    privateKey: string,
    appName: string,
    accountType: AccountType = 'argentX'
  ): Promise<string> {
    if (!CryptoUtils.isValidPrivateKey(privateKey)) {
      throw new ValidationError('Invalid private key provided');
    }

    const address = this.generateAccountAddress(privateKey, accountType);
    const storageKey = this.generateStorageKey(appName, accountType, address);

    await this.storage.storePrivateKey(storageKey, privateKey);

    // Store account metadata
    const accountData: WalletAccount = {
      address,
      privateKey: '', // Don't store in metadata
      accountType,
      isDeployed: false, // Will be updated after deployment
      network: this.network.getCurrentNetwork(),
    };

    await this.storage.storeValue(`${storageKey}.metadata`, JSON.stringify(accountData));

    return storageKey;
  }

  async getStoredAccounts(appName: string): Promise<string[]> {
    const allKeys = await this.storage.getAllKeys();
    const network = this.network.getCurrentNetwork();
    const prefix = `${network}.${appName}.`;
    
    return allKeys.filter(key => key.startsWith(prefix) && !key.endsWith('.metadata'));
  }

  async getAccountMetadata(storageKey: string): Promise<WalletAccount | null> {
    try {
      const metadataJson = await this.storage.getValue(`${storageKey}.metadata`);
      if (!metadataJson) return null;
      
      return JSON.parse(metadataJson) as WalletAccount;
    } catch (error) {
      console.error('Failed to get account metadata:', error);
      return null;
    }
  }

  async connectAccount(privateKey: string, accountType: AccountType = 'argentX'): Promise<Account> {
    if (!CryptoUtils.isValidPrivateKey(privateKey)) {
      throw new ValidationError('Invalid private key provided');
    }

    const provider = this.network.getProvider();
    const address = this.generateAccountAddress(privateKey, accountType);
    
    this.currentAccount = new Account(provider, address, privateKey);
    return this.currentAccount;
  }

  async connectStoredAccount(storageKey: string): Promise<Account> {
    const privateKey = await this.storage.getPrivateKey(storageKey);
    if (!privateKey) {
      throw new ValidationError('Account not found in storage');
    }

    const metadata = await this.getAccountMetadata(storageKey);
    const accountType = metadata?.accountType || 'argentX';

    return this.connectAccount(privateKey, accountType);
  }

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
      const deploymentData = this.getDeploymentData(privateKey, accountType);
      
      const deployOptions = {
        version: 3, // Use V3 transactions
        resourceBounds: {
          l1_gas: {
            max_amount: '0x186a0', // 100000
            max_price_per_unit: '0x5af3107a4000' // 100000000000000 wei
          },
          l2_gas: {
            max_amount: '0x0',
            max_price_per_unit: '0x0'
          }
        }
      };
      
      // Add l1_data_gas field that RPC expects but types don't include yet
      // (deployOptions.resourceBounds as any).l1_data_gas = {
      //   max_amount: '0x186a0', // 100000
      //   max_price_per_unit: '0x1' // 1 wei
      // };

      const { transaction_hash } = await this.currentAccount.deployAccount(
        deploymentData,
        deployOptions
      );

      // Wait for deployment to complete
      const isSuccess = await this.network.waitForTransaction(transaction_hash);
      
      if (!isSuccess) {
        throw new DeploymentError(`Account deployment failed: ${transaction_hash}`);
      }

      console.log(`Account deployed successfully: ${this.currentAccount.address}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already deployed')) {
        console.log('Account already deployed, continuing...');
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

  async updateDeploymentStatus(storageKey: string, isDeployed: boolean): Promise<void> {
    const metadata = await this.getAccountMetadata(storageKey);
    if (metadata) {
      metadata.isDeployed = isDeployed;
      await this.storage.storeValue(`${storageKey}.metadata`, JSON.stringify(metadata));
    }
  }

  getCurrentAccount(): Account | null {
    return this.currentAccount;
  }

  getCurrentAddress(): string | null {
    return this.currentAccount?.address || null;
  }

  async exportPrivateKey(storageKey: string): Promise<string | null> {
    return await this.storage.getPrivateKey(storageKey);
  }

  async removeAccount(storageKey: string): Promise<void> {
    await this.storage.removePrivateKey(storageKey);
    await this.storage.removeValue(`${storageKey}.metadata`);
  }

  disconnectAccount(): void {
    this.currentAccount = null;
  }

  async storeKeyAndConnect(
    privateKey: string,
    appName: string,
    accountType: AccountType = 'argentX'
  ): Promise<Account> {
    const storageKey = await this.storeAccount(privateKey, appName, accountType);
    const account = await this.connectAccount(privateKey, accountType);
    
    // Check if account is deployed
    const isDeployed = await this.isAccountDeployed(account.address);
    await this.updateDeploymentStatus(storageKey, isDeployed);
    
    return account;
  }

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
      console.error('Failed to get account balance:', error);
      return '0';
    }
  }

  async validateAccountAccess(storageKey: string): Promise<boolean> {
    try {
      const privateKey = await this.storage.getPrivateKey(storageKey);
      return privateKey !== null && CryptoUtils.isValidPrivateKey(privateKey);
    } catch (error) {
      return false;
    }
  }
}