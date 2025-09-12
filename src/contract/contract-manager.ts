import { Account, Call, Contract, CallData } from 'starknet';
import { NetworkManager } from '../network/network-manager';
import { TransactionManager } from '../transaction/transaction-manager';
import { ExecutionOptions, TransactionResult, ExecutionError, ValidationError } from '../types';

export interface ContractCall {
  contractAddress: string;
  entrypoint: string;
  calldata: any[];
}

export class ContractManager {
  private account: Account | null = null;
  private network: NetworkManager;
  private transactionManager: TransactionManager;
  private contractCache: Map<string, Contract> = new Map();

  constructor(network: NetworkManager, transactionManager: TransactionManager) {
    this.network = network;
    this.transactionManager = transactionManager;
  }

  setAccount(account: Account | null): void {
    this.account = account;
    this.transactionManager.setAccount(account);
  }

  private validateCall(call: ContractCall): void {
    if (!call.contractAddress || typeof call.contractAddress !== 'string') {
      throw new ValidationError('Invalid contract address');
    }

    if (!call.entrypoint || typeof call.entrypoint !== 'string') {
      throw new ValidationError('Invalid entrypoint name');
    }

    if (!Array.isArray(call.calldata)) {
      throw new ValidationError('Calldata must be an array');
    }
  }

  private createContract(contractAddress: string, abi?: any[]): Contract {
    const cacheKey = `${contractAddress}:${JSON.stringify(abi || [])}`;
    
    if (this.contractCache.has(cacheKey)) {
      return this.contractCache.get(cacheKey)!;
    }

    const provider = this.network.getProvider();
    const contract = new Contract(abi || [], contractAddress, provider);

    if (this.account) {
      contract.connect(this.account);
    }

    this.contractCache.set(cacheKey, contract);
    return contract;
  }

  async callContract(
    contractAddress: string,
    method: string,
    args: any[] = [],
    abi?: any[]
  ): Promise<any> {
    try {
      // If no ABI provided, use provider.callContract directly
      if (!abi || abi.length === 0) {
        const provider = this.network.getProvider();
        const result = await provider.callContract({
          contractAddress,
          entrypoint: method,
          calldata: CallData.compile(args)
        });
        return result;
      }

      const contract = this.createContract(contractAddress, abi);

      if (!contract[method]) {
        // Fallback to provider.callContract for unknown methods
        const provider = this.network.getProvider();
        const result = await provider.callContract({
          contractAddress,
          entrypoint: method,
          calldata: CallData.compile(args)
        });
        return result;
      }

      return await contract[method](...args);
    } catch (error) {
      throw new ExecutionError(`Contract call failed: ${error}`);
    }
  }

  async invokeContract(
    contractAddress: string,
    method: string,
    args: any[] = [],
    options: ExecutionOptions = {},
    abi?: any[]
  ): Promise<TransactionResult> {
    if (!this.account) {
      throw new ExecutionError('No account connected');
    }

    try {
      const contract = this.createContract(contractAddress, abi);

      if (!contract[method]) {
        // Fallback to generic invoke
        const calls: Call[] = [{
          contractAddress,
          entrypoint: method,
          calldata: CallData.compile(args),
        }];
        
        return await this.transactionManager.executeTransaction(calls, options);
      }

      const result = await contract[method](...args, {
        maxFee: options.maxFee,
        nonce: options.nonce,
      });

      return {
        transactionHash: result.transaction_hash,
        status: 'pending',
      };
    } catch (error) {
      throw new ExecutionError(`Contract invocation failed: ${error}`);
    }
  }

  async multicall(
    calls: ContractCall[],
    options: ExecutionOptions = {}
  ): Promise<TransactionResult> {
    if (!calls || calls.length === 0) {
      throw new ValidationError('No calls provided for multicall');
    }

    // Validate all calls
    calls.forEach(call => this.validateCall(call));

    try {
      const formattedCalls: Call[] = calls.map(call => ({
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        calldata: CallData.compile(call.calldata),
      }));

      return await this.transactionManager.executeTransaction(formattedCalls, options);
    } catch (error) {
      throw new ExecutionError(`Multicall failed: ${error}`);
    }
  }

  async batchCall(
    calls: Array<{
      contractAddress: string;
      method: string;
      args: any[];
      abi?: any[];
    }>
  ): Promise<any[]> {
    try {
      const promises = calls.map(call =>
        this.callContract(call.contractAddress, call.method, call.args, call.abi)
      );

      return await Promise.all(promises);
    } catch (error) {
      throw new ExecutionError(`Batch call failed: ${error}`);
    }
  }

  async estimateGas(calls: ContractCall[]): Promise<string> {
    // Validate all calls
    calls.forEach(call => this.validateCall(call));

    try {
      const formattedCalls: Call[] = calls.map(call => ({
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        calldata: CallData.compile(call.calldata),
      }));

      return await this.transactionManager.estimateGas(formattedCalls);
    } catch (error) {
      throw new ExecutionError(`Gas estimation failed: ${error}`);
    }
  }

  async simulateCall(calls: ContractCall[]): Promise<any> {
    // Validate all calls
    calls.forEach(call => this.validateCall(call));

    try {
      const formattedCalls: Call[] = calls.map(call => ({
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        calldata: CallData.compile(call.calldata),
      }));

      return await this.transactionManager.simulateTransaction(formattedCalls);
    } catch (error) {
      throw new ExecutionError(`Call simulation failed: ${error}`);
    }
  }

  // ERC-20 Token utilities
  async getERC20Balance(
    tokenAddress: string,
    accountAddress: string,
    decimals: number = 18
  ): Promise<string> {
    try {
      const balance = await this.callContract(tokenAddress, 'balanceOf', [accountAddress]);
      
      // Convert from contract units to token units
      const balanceBigInt = BigInt(balance.toString());
      const divisor = BigInt(10 ** decimals);
      const tokenBalance = balanceBigInt / divisor;
      
      return tokenBalance.toString();
    } catch (error) {
      console.error('Failed to get ERC20 balance:', error);
      return '0';
    }
  }

  async transferERC20(
    tokenAddress: string,
    recipient: string,
    amount: string,
    decimals: number = 18,
    options: ExecutionOptions = {}
  ): Promise<TransactionResult> {
    try {
      // Convert from token units to contract units
      const amountBigInt = BigInt(amount);
      const multiplier = BigInt(10 ** decimals);
      const contractAmount = amountBigInt * multiplier;

      return await this.invokeContract(
        tokenAddress,
        'transfer',
        [recipient, contractAmount.toString()],
        options
      );
    } catch (error) {
      throw new ExecutionError(`ERC20 transfer failed: ${error}`);
    }
  }

  async approveERC20(
    tokenAddress: string,
    spender: string,
    amount: string,
    decimals: number = 18,
    options: ExecutionOptions = {}
  ): Promise<TransactionResult> {
    try {
      // Convert from token units to contract units
      const amountBigInt = BigInt(amount);
      const multiplier = BigInt(10 ** decimals);
      const contractAmount = amountBigInt * multiplier;

      return await this.invokeContract(
        tokenAddress,
        'approve',
        [spender, contractAmount.toString()],
        options
      );
    } catch (error) {
      throw new ExecutionError(`ERC20 approval failed: ${error}`);
    }
  }

  // ERC-721 NFT utilities
  async getERC721Owner(tokenAddress: string, tokenId: string): Promise<string> {
    try {
      const owner = await this.callContract(tokenAddress, 'ownerOf', [tokenId]);
      return owner.toString();
    } catch (error) {
      throw new ExecutionError(`Failed to get NFT owner: ${error}`);
    }
  }

  async transferERC721(
    tokenAddress: string,
    from: string,
    to: string,
    tokenId: string,
    options: ExecutionOptions = {}
  ): Promise<TransactionResult> {
    try {
      return await this.invokeContract(
        tokenAddress,
        'transferFrom',
        [from, to, tokenId],
        options
      );
    } catch (error) {
      throw new ExecutionError(`ERC721 transfer failed: ${error}`);
    }
  }

  async getERC721TokenURI(tokenAddress: string, tokenId: string): Promise<string> {
    try {
      const uri = await this.callContract(tokenAddress, 'tokenURI', [tokenId]);
      return uri.toString();
    } catch (error) {
      console.error('Failed to get NFT token URI:', error);
      return '';
    }
  }

  // Utility methods
  clearCache(): void {
    this.contractCache.clear();
  }

  getCacheSize(): number {
    return this.contractCache.size;
  }

  async getContractCode(contractAddress: string): Promise<any> {
    try {
      // const provider = this.network.getProvider();
      return "Not implemented yet";
    } catch (error) {
      throw new ExecutionError(`Failed to get contract code: ${error}`);
    }
  }

  async isContractDeployed(contractAddress: string): Promise<boolean> {
    try {
      const code = await this.getContractCode(contractAddress);
      return code && code.bytecode && code.bytecode.length > 0;
    } catch (error) {
      console.error('Failed to check contract deployment:', error);
      return false;
    }
  }

  dispose(): void {
    this.clearCache();
    this.account = null;
  }
}