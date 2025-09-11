import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Account, Call } from 'starknet';
import { 
  WalletConfig, 
  WalletContextValue, 
  TransactionResult, 
  ExecutionOptions, 
  NFTToken,
  NetworkType,
  PaymasterConfig,
  NetworkError
} from '../types';

import { SecureStorage } from '../storage/secure-storage';
import { NetworkManager } from '../network/network-manager';
import { AccountManager } from '../account/account-manager';
import { PaymasterIntegration } from '../transaction/paymaster';
import { TransactionManager } from '../transaction/transaction-manager';
import { ContractManager } from '../contract/contract-manager';
import { BalanceManager } from '../balance/balance-manager';

interface WalletProviderProps {
  children: ReactNode;
  config: WalletConfig;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider: React.FC<WalletProviderProps> = ({ children, config }) => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Managers
  const [storage] = useState(() => new SecureStorage(`aegis-${config.appName}`));
  const [network] = useState(() => new NetworkManager(config.network, config.rpcUrl));
  const [accountManager] = useState(() => new AccountManager(storage, network));
  
  const [paymaster] = useState(() => {
    const paymasterConfig: PaymasterConfig = {
      apiKey: config.paymasterApiKey,
      backendUrl: config.paymasterBackendUrl,
      supportedNetworks: ['SN_MAINNET', 'SN_SEPOLIA'],
    };
    return new PaymasterIntegration(network, paymasterConfig);
  });

  const [transactionManager] = useState(() => 
    new TransactionManager(network, paymaster, config.batchSize, config.maxRetries)
  );

  const [contractManager] = useState(() => new ContractManager(network, transactionManager));
  const [balanceManager] = useState(() => new BalanceManager(network, contractManager));

  // Initialize network connection on mount
  useEffect(() => {
    const initializeNetwork = async () => {
      try {
        const isConnected = await network.testConnection();
        if (!isConnected) {
          setError(new NetworkError('Failed to connect to network'));
        }
      } catch (error) {
        setError(error instanceof Error ? error : new Error('Network initialization failed'));
      }
    };

    initializeNetwork();
  }, [network]);

  // Update managers when account changes
  useEffect(() => {
    transactionManager.setAccount(account);
    contractManager.setAccount(account);
  }, [account, transactionManager, contractManager]);

  const generateAccount = useCallback(async (): Promise<string> => {
    try {
      setError(null);
      const privateKey = accountManager.generatePrivateKey();
      return privateKey;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to generate account');
      setError(err);
      throw err;
    }
  }, [accountManager]);

  const connectAccount = useCallback(async (privateKey: string): Promise<void> => {
    try {
      setIsConnecting(true);
      setError(null);

      const connectedAccount = await accountManager.connectAccount(privateKey);
      
      setAccount(connectedAccount);
      setAddress(connectedAccount.address);
      setIsConnected(true);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to connect account');
      setError(err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [accountManager]);

  const deployAccount = useCallback(async (privateKey?: string): Promise<void> => {
    try {
      setError(null);
      
      if (privateKey) {
        await connectAccount(privateKey);
      }
      
      if (!account && !privateKey) {
        throw new Error('No account to deploy');
      }

      const keyToUse = privateKey || (account as any)?.signer?.pk;
      if (!keyToUse) {
        throw new Error('No private key available for deployment');
      }

      await accountManager.deployAccount(keyToUse);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to deploy account');
      setError(err);
      throw err;
    }
  }, [account, accountManager, connectAccount]);

  const disconnectAccount = useCallback((): void => {
    setAccount(null);
    setAddress(null);
    setIsConnected(false);
    setError(null);
    accountManager.disconnectAccount();
  }, [accountManager]);

  const exportPrivateKey = useCallback(async (): Promise<string | null> => {
    try {
      if (!account) {
        throw new Error('No account connected');
      }

      // Try to get stored accounts for this app
      const storedAccounts = await accountManager.getStoredAccounts(config.appName);
      const currentAddress = account.address;
      
      // Find the storage key for current account
      const storageKey = storedAccounts.find(key => key.includes(currentAddress));
      
      if (storageKey) {
        return await accountManager.exportPrivateKey(storageKey);
      }

      // Fallback: try to get from account object (if available)
      return (account as any)?.signer?.pk || null;
    } catch (error) {
      console.error('Failed to export private key:', error);
      return null;
    }
  }, [account, accountManager, config.appName]);

  const executeTransaction = useCallback(async (
    calls: Call[],
    options: ExecutionOptions = {}
  ): Promise<TransactionResult> => {
    try {
      setError(null);
      return await transactionManager.executeTransaction(calls, options);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Transaction failed');
      setError(err);
      throw err;
    }
  }, [transactionManager]);

  const executeBatch = useCallback(async (
    calls: Call[],
    options: ExecutionOptions = {}
  ): Promise<TransactionResult> => {
    try {
      setError(null);
      return await transactionManager.executeBatch(calls, options);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Batch execution failed');
      setError(err);
      throw err;
    }
  }, [transactionManager]);

  const addToQueue = useCallback((calls: Call[]): void => {
    transactionManager.addToQueue(calls);
  }, [transactionManager]);

  const callContract = useCallback(async (
    contractAddress: string,
    method: string,
    args: any[]
  ): Promise<any> => {
    try {
      setError(null);
      return await contractManager.callContract(contractAddress, method, args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Contract call failed');
      setError(err);
      throw err;
    }
  }, [contractManager]);

  const estimateGas = useCallback(async (calls: Call[]): Promise<string> => {
    try {
      setError(null);
      return await transactionManager.estimateGas(calls);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Gas estimation failed');
      setError(err);
      throw err;
    }
  }, [transactionManager]);

  const getETHBalance = useCallback(async (userAddress?: string): Promise<string> => {
    try {
      setError(null);
      const targetAddress = userAddress || address;
      if (!targetAddress) {
        throw new Error('No address provided');
      }
      return await balanceManager.getETHBalance(targetAddress);
    } catch (error) {
      console.error('Failed to get ETH balance:', error);
      return '0';
    }
  }, [balanceManager, address]);

  const getERC20Balance = useCallback(async (
    tokenAddress: string,
    decimals: number = 18,
    userAddress?: string
  ): Promise<string> => {
    try {
      setError(null);
      const targetAddress = userAddress || address;
      if (!targetAddress) {
        throw new Error('No address provided');
      }
      return await balanceManager.getERC20Balance(tokenAddress, targetAddress, decimals);
    } catch (error) {
      console.error('Failed to get ERC20 balance:', error);
      return '0';
    }
  }, [balanceManager, address]);

  const getERC721Tokens = useCallback(async (
    contractAddress: string,
    userAddress?: string
  ): Promise<NFTToken[]> => {
    try {
      setError(null);
      const targetAddress = userAddress || address;
      if (!targetAddress) {
        throw new Error('No address provided');
      }
      return await balanceManager.getERC721Tokens(contractAddress, targetAddress);
    } catch (error) {
      console.error('Failed to get ERC721 tokens:', error);
      return [];
    }
  }, [balanceManager, address]);

  const waitForTransaction = useCallback(async (txHash: string): Promise<boolean> => {
    try {
      setError(null);
      return await transactionManager.waitForTransaction(txHash);
    } catch (error) {
      console.error('Failed to wait for transaction:', error);
      return false;
    }
  }, [transactionManager]);

  const getTransactionStatus = useCallback(async (
    txHash: string
  ): Promise<'pending' | 'confirmed' | 'failed'> => {
    try {
      setError(null);
      return await transactionManager.getTransactionStatus(txHash);
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return 'pending';
    }
  }, [transactionManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      network.dispose();
      transactionManager.dispose();
      contractManager.dispose();
      balanceManager.dispose();
    };
  }, [network, transactionManager, contractManager, balanceManager]);

  const contextValue: WalletContextValue = {
    // Connection state
    isConnected,
    isConnecting,
    account,
    address,
    network: config.network,

    // Account management
    generateAccount,
    connectAccount,
    deployAccount,
    disconnectAccount,
    exportPrivateKey,

    // Transaction execution
    executeTransaction,
    executeBatch,
    addToQueue,

    // Contract interactions
    callContract,
    estimateGas,

    // Balance queries
    getETHBalance,
    getERC20Balance,
    getERC721Tokens,

    // Utilities
    waitForTransaction,
    getTransactionStatus,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
      {config.enableLogging && error && (
        <div style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          background: 'red', 
          color: 'white', 
          padding: '10px',
          borderRadius: '5px',
          zIndex: 9999 
        }}>
          Error: {error.message}
        </div>
      )}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextValue => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};