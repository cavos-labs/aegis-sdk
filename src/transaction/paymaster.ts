import { Account, Call, ec } from 'starknet';
import { toBeHex } from 'ethers';
import { executeCalls, formatCall, GaslessOptions, BASE_URL, SEPOLIA_BASE_URL } from '@avnu/gasless-sdk';
import { NetworkManager } from '../network/network-manager';
import { PaymasterConfig, ExecutionError, NetworkError, NetworkType } from '../types';

export class PaymasterIntegration {
  private network: NetworkManager;
  private config: PaymasterConfig;

  constructor(network: NetworkManager, config: PaymasterConfig) {
    this.network = network;
    this.config = config;
  }

  isAvailable(): boolean {
    const currentNetwork = this.network.getCurrentNetwork();
    return (
      this.network.supportsPaymaster() &&
      this.config.supportedNetworks.includes(currentNetwork) &&
      (!!this.config.apiKey || !!this.config.backendUrl)
    );
  }

  async executeWithAVNU(
    account: Account,
    calls: Call[],
    deploymentData?: any
  ): Promise<{ transactionHash: string }> {
    if (!this.config.apiKey) {
      throw new ExecutionError('AVNU API key not configured');
    }

    try {
      const currentNetwork = this.network.getCurrentNetwork();
      const baseUrl = currentNetwork === 'SN_SEPOLIA' ? SEPOLIA_BASE_URL : BASE_URL;

      const options: GaslessOptions = {
        baseUrl,
        apiKey: this.config.apiKey,
      };

      // Log what we're sending to AVNU
      const executionOptions = deploymentData ? { deploymentData } : { };
      console.log('🔧 AVNU SDK execution params:', {
        account: account.address,
        calls,
        executionOptions,
        options
      });

      const result = await executeCalls(
        account,
        calls,
        executionOptions,
        options
      );

      return { transactionHash: result.transactionHash };
    } catch (error) {
      throw new ExecutionError(`AVNU paymaster execution failed: ${error}`);
    }
  }

  async executeWithBackend(
    account: Account,
    calls: Call[],
    deploymentData?: any
  ): Promise<{ transactionHash: string }> {
    if (!this.config.backendUrl) {
      throw new ExecutionError('Backend paymaster URL not configured');
    }

    try {
      const formattedCalls = formatCall(calls);
      const network = this.network.getCurrentNetwork();

      // Step 1: Build gasless transaction data
      const buildGaslessTxDataUrl = `${this.config.backendUrl}/paymaster/build-gasless-tx`;
      const gaslessTxInput = {
        account: account.address,
        calls: formattedCalls,
        network: network,
        deploymentData: deploymentData || undefined,
      };

      const gaslessTxResponse = await fetch(buildGaslessTxDataUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gaslessTxInput),
      });

      if (!gaslessTxResponse.ok) {
        throw new NetworkError(`Failed to build gasless transaction: ${gaslessTxResponse.statusText}`);
      }

      const gaslessTxRes = await gaslessTxResponse.json();

      if (gaslessTxRes.error) {
        throw new ExecutionError(gaslessTxRes.error);
      }

      // Step 2: Sign the transaction
      const privateKey = (account as any).signer?.pk || (account as any).pk;
      if (!privateKey) {
        throw new ExecutionError('Private key not accessible for signing');
      }

      // Always produce a [r, s] string[] signature in hex, regardless of signer's return type
      const rawSignature = ec.starkCurve.sign(gaslessTxRes.data.messageHash, privateKey);
      let signature: [string, string];
      if (Array.isArray(rawSignature)) {
        // Array form: [r, s]
        signature = [
          toBeHex(BigInt(rawSignature[0])),
          toBeHex(BigInt(rawSignature[1]))
        ];
      } else if (rawSignature.r !== undefined && rawSignature.s !== undefined) {
        // Object form: { r, s }
        signature = [
          toBeHex(BigInt(rawSignature.r)),
          toBeHex(BigInt(rawSignature.s))
        ];
      } else {
        throw new ExecutionError('Unexpected signature format returned by signer');
      }
      // Step 3: Send gasless transaction
      const sendGaslessTxUrl = `${this.config.backendUrl}/paymaster/send-gasless-tx`;
      const sendGaslessTxInput = {
        account: account.address,
        txData: JSON.stringify(gaslessTxRes.data.typedData),
        signature: signature,
        network: network,
        deploymentData: deploymentData || undefined,
      };

      const sendGaslessTxResponse = await fetch(sendGaslessTxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendGaslessTxInput),
      });

      if (!sendGaslessTxResponse.ok) {
        throw new NetworkError(`Failed to send gasless transaction: ${sendGaslessTxResponse.statusText}`);
      }

      const sendGaslessTxRes = await sendGaslessTxResponse.json();

      if (sendGaslessTxRes.error) {
        throw new ExecutionError(sendGaslessTxRes.error);
      }

      if (sendGaslessTxRes.data?.revertError) {
        throw new ExecutionError(`Transaction reverted: ${sendGaslessTxRes.data.revertError}`);
      }

      if (!sendGaslessTxRes.data?.transactionHash) {
        throw new ExecutionError('No transaction hash returned from paymaster');
      }

      return { transactionHash: sendGaslessTxRes.data.transactionHash };
    } catch (error) {
      if (error instanceof ExecutionError || error instanceof NetworkError) {
        throw error;
      }
      throw new ExecutionError(`Backend paymaster execution failed: ${error}`);
    }
  }

  async execute(
    account: Account,
    calls: Call[],
    deploymentData?: any,
    preferredMethod?: 'avnu' | 'backend'
  ): Promise<{ transactionHash: string }> {
    if (!this.isAvailable()) {
      throw new ExecutionError('Paymaster not available for current network or configuration');
    }

    // Determine which method to use
    let useAVNU = false;
    let useBackend = false;

    if (preferredMethod === 'avnu' && this.config.apiKey) {
      useAVNU = true;
    } else if (preferredMethod === 'backend' && this.config.backendUrl) {
      useBackend = true;
    } else if (this.config.apiKey && !this.config.backendUrl) {
      useAVNU = true;
    } else if (this.config.backendUrl && !this.config.apiKey) {
      useBackend = true;
    } else if (this.config.apiKey) {
      // Default to AVNU if both are available
      useAVNU = true;
    } else if (this.config.backendUrl) {
      useBackend = true;
    } else {
      throw new ExecutionError('No paymaster configuration available');
    }

    try {
      if (useAVNU) {
        return await this.executeWithAVNU(account, calls, deploymentData);
      } else if (useBackend) {
        return await this.executeWithBackend(account, calls, deploymentData);
      }
      
      throw new ExecutionError('No valid paymaster method available');
    } catch (error) {
      // If preferred method fails, try the other one as fallback
      if (useAVNU && this.config.backendUrl) {
        console.warn('AVNU paymaster failed, trying backend fallback...');
        return await this.executeWithBackend(account, calls, deploymentData);
      } else if (useBackend && this.config.apiKey) {
        console.warn('Backend paymaster failed, trying AVNU fallback...');
        return await this.executeWithAVNU(account, calls, deploymentData);
      }
      
      throw error;
    }
  }

  async estimateGasCost(calls: Call[]): Promise<string> {
    try {
      // This is a simplified estimation
      // In practice, you'd want to query the paymaster for actual costs
      const baseGas = BigInt(21000);
      const callGas = BigInt(calls.length * 50000);
      
      return (baseGas + callGas).toString();
    } catch (error) {
      throw new ExecutionError(`Failed to estimate gas cost: ${error}`);
    }
  }

  getSupportedNetworks(): NetworkType[] {
    return this.config.supportedNetworks;
  }

  getConfig(): PaymasterConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<PaymasterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  async validateConfiguration(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        return false;
      }

      // Test AVNU configuration if available
      if (this.config.apiKey) {
        const currentNetwork = this.network.getCurrentNetwork();
        const baseUrl = currentNetwork === 'SN_SEPOLIA' ? SEPOLIA_BASE_URL : BASE_URL;
        
        // Make a simple request to validate API key
        const testResponse = await fetch(`${baseUrl}/health`, {
          headers: {
            'x-api-key': this.config.apiKey,
          },
        });
        
        if (!testResponse.ok) {
          console.warn('AVNU API key validation failed');
        }
      }

      // Test backend configuration if available
      if (this.config.backendUrl) {
        const healthResponse = await fetch(`${this.config.backendUrl}/health`);
        if (!healthResponse.ok) {
          console.warn('Backend paymaster health check failed');
        }
      }

      return true;
    } catch (error) {
      console.error('Paymaster configuration validation failed:', error);
      return false;
    }
  }
}