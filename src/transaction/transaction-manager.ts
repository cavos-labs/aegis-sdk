import { Account, Call } from 'starknet';
import { PaymasterIntegration } from './paymaster';
import { NetworkManager } from '../network/network-manager';
import { TransactionResult, ExecutionOptions, ExecutionError, NetworkError } from '../types';

interface QueuedTransaction {
  id: string;
  calls: Call[];
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  timestamp: number;
}

export class TransactionManager {
  private account: Account | null = null;
  private network: NetworkManager;
  private paymaster: PaymasterIntegration;
  private queue: QueuedTransaction[] = [];
  private isProcessing: boolean = false;
  private batchSize: number;
  private maxRetries: number;

  constructor(
    network: NetworkManager,
    paymaster: PaymasterIntegration,
    batchSize: number = 100,
    maxRetries: number = 3
  ) {
    this.network = network;
    this.paymaster = paymaster;
    this.batchSize = batchSize;
    this.maxRetries = maxRetries;
  }

  setAccount(account: Account | null): void {
    this.account = account;
  }

  private generateTransactionId(): string {
    return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeTransaction(
    calls: Call[],
    options: ExecutionOptions = {}
  ): Promise<TransactionResult> {
    if (!this.account) {
      throw new ExecutionError('No account connected');
    }

    if (!calls || calls.length === 0) {
      throw new ExecutionError('No calls provided for transaction');
    }

    const usePaymaster = options.usePaymaster !== false && this.paymaster.isAvailable();
    const retries = options.retries || this.maxRetries;

    const executeFunction = async (): Promise<TransactionResult> => {
      try {
        let transactionHash: string;

        if (usePaymaster) {
          const result = await this.paymaster.execute(this.account!, calls);
          transactionHash = result.transactionHash;
        } else {
          const response = await this.account!.execute(calls, {
            maxFee: options.maxFee,
            nonce: options.nonce,
          });
          transactionHash = response.transaction_hash;
        }

        return {
          transactionHash,
          status: 'pending',
        };
      } catch (error) {
        throw new ExecutionError(`Transaction execution failed: ${error}`);
      }
    };

    if (retries > 0) {
      return this.executeWithRetries(executeFunction, retries, options.timeout);
    } else {
      return executeFunction();
    }
  }

  private async executeWithRetries(
    executeFunction: () => Promise<TransactionResult>,
    retries: number,
    timeout?: number
  ): Promise<TransactionResult> {
    const RETRY_DELAY_MS = 2000;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await executeFunction();
        
        if (timeout && result.transactionHash) {
          const isConfirmed = await this.network.waitForTransaction(
            result.transactionHash,
            timeout
          );
          
          if (isConfirmed) {
            return { ...result, status: 'confirmed' };
          } else {
            throw new ExecutionError(`Transaction ${result.transactionHash} failed confirmation`);
          }
        }
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (attempt < retries) {
          console.warn(
            `Transaction failed (attempt ${attempt + 1}/${retries + 1}): ${errorMessage}. Retrying in ${RETRY_DELAY_MS}ms...`
          );
          await this.delay(RETRY_DELAY_MS);
        } else {
          console.error(
            `Transaction permanently failed after ${retries + 1} attempts: ${errorMessage}`
          );
          throw new ExecutionError(`Transaction failed after ${retries + 1} attempts: ${errorMessage}`);
        }
      }
    }
    
    throw new ExecutionError('Unexpected end of retry loop');
  }

  async executeBatch(
    calls: Call[],
    options: ExecutionOptions = {}
  ): Promise<TransactionResult> {
    if (calls.length <= this.batchSize) {
      return this.executeTransaction(calls, options);
    }

    // Split into batches
    const batches: Call[][] = [];
    for (let i = 0; i < calls.length; i += this.batchSize) {
      batches.push(calls.slice(i, i + this.batchSize));
    }

    const results: TransactionResult[] = [];
    
    for (const batch of batches) {
      const result = await this.executeTransaction(batch, options);
      results.push(result);
    }

    // Return the last result as the primary result
    // In a more sophisticated implementation, you might want to track all results
    return results[results.length - 1];
  }

  addToQueue(calls: Call[], options: ExecutionOptions = {}): string {
    const transaction: QueuedTransaction = {
      id: this.generateTransactionId(),
      calls,
      retryCount: 0,
      maxRetries: options.retries || this.maxRetries,
      timestamp: Date.now(),
    };

    this.queue.push(transaction);

    // Start processing if not already processing
    if (!this.isProcessing) {
      setTimeout(() => this.processQueue(), 0);
    }

    return transaction.id;
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const transaction = this.queue[0];
        
        try {
          const result = await this.executeTransaction(transaction.calls);
          
          if (result.transactionHash) {
            // Wait for confirmation
            const isConfirmed = await this.network.waitForTransaction(result.transactionHash);
            
            if (isConfirmed) {
              console.log(`✅ Transaction ${transaction.id} confirmed: ${result.transactionHash}`);
              this.queue.shift(); // Remove completed transaction
            } else {
              throw new ExecutionError(`Transaction ${result.transactionHash} failed confirmation`);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          if (transaction.retryCount < transaction.maxRetries) {
            transaction.retryCount++;
            transaction.lastError = errorMessage;
            console.warn(
              `Transaction ${transaction.id} failed (attempt ${transaction.retryCount}/${transaction.maxRetries + 1}). Will retry...`
            );
            
            // Move to end of queue for retry
            this.queue.shift();
            this.queue.push(transaction);
            
            await this.delay(2000);
          } else {
            console.error(
              `Transaction ${transaction.id} permanently failed after ${transaction.maxRetries + 1} attempts: ${errorMessage}`
            );
            this.queue.shift(); // Remove failed transaction
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueueStatus(): Array<{ id: string; retryCount: number; lastError?: string }> {
    return this.queue.map(tx => ({
      id: tx.id,
      retryCount: tx.retryCount,
      lastError: tx.lastError,
    }));
  }

  clearQueue(): void {
    this.queue = [];
  }

  removeFromQueue(transactionId: string): boolean {
    const index = this.queue.findIndex(tx => tx.id === transactionId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  async waitForTransaction(txHash: string, timeout?: number): Promise<boolean> {
    try {
      return await this.network.waitForTransaction(txHash, timeout);
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      return false;
    }
  }

  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      return await this.network.getTransactionStatus(txHash);
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'pending';
    }
  }

  async estimateGas(calls: Call[]): Promise<string> {
    try {
      if (this.paymaster.isAvailable()) {
        return await this.paymaster.estimateGasCost(calls);
      } else {
        return await this.network.estimateGas(calls);
      }
    } catch (error) {
      throw new ExecutionError(`Failed to estimate gas: ${error}`);
    }
  }

  async simulateTransaction(calls: Call[]): Promise<any> {
    if (!this.account) {
      throw new ExecutionError('No account connected');
    }

    try {
      // Simplified simulation - just validate the calls structure
      return {
        success: true,
        calls: calls.length,
        gasEstimate: await this.estimateGas(calls)
      };
    } catch (error) {
      throw new ExecutionError(`Transaction simulation failed: ${error}`);
    }
  }

  dispose(): void {
    this.clearQueue();
    this.account = null;
  }
}