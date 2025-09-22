import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AegisSDK } from '../core/aegis-sdk';

interface AegisContextType {
  aegisAccount: AegisSDK;
  isConnected: boolean;
  currentAddress: string | null;

  // Actions
  deployWallet: () => Promise<string>; // Deploy new wallet and return private key
  connectWallet: (privateKey: string) => Promise<void>; // Connect with existing private key
  disconnect: () => void;

  // Utils
  error: string | null;
}

const AegisContext = createContext<AegisContextType | undefined>(undefined);

interface AegisProviderProps {
  children: ReactNode;
  config: {
    network: 'SN_MAINNET' | 'SN_SEPOLIA' | 'SN_DEVNET';
    appName: string;
    appId: string;
    paymasterApiKey?: string;
    enableLogging?: boolean;
  };
}

export const AegisProvider: React.FC<AegisProviderProps> = ({
  children,
  config
}) => {
  // Use default AVNU API key if not provided
  const configWithDefaults = {
    ...config,
    paymasterApiKey: config.paymasterApiKey || 'c37c52b7-ea5a-4426-8121-329a78354b0b'
  };

  const [aegisAccount] = useState(() => new AegisSDK(configWithDefaults));
  const [isConnected, setIsConnected] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deployWallet = async (): Promise<string> => {
    try {
      setError(null);

      // Deploy account (generates private key AND deploys it)
      const privateKey = await aegisAccount.deployAccount();

      // Update state (SDK is already connected after deployAccount)
      setCurrentAddress(aegisAccount.address);
      setIsConnected(true);

      // Return private key for user to store securely
      return privateKey;
    } catch (error) {
      const errorMsg = `Failed to deploy wallet: ${error}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const connectWallet = async (walletPrivateKey: string) => {
    try {
      setError(null);

      // Connect to the account using the SDK
      await aegisAccount.connectAccount(walletPrivateKey);

      // Update state
      setCurrentAddress(aegisAccount.address);
      setIsConnected(true);
    } catch (error) {
      const errorMsg = `Failed to connect wallet: ${error}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const disconnect = () => {
    // Disconnect from SDK
    aegisAccount.disconnect();

    // Reset state
    setCurrentAddress(null);
    setIsConnected(false);
    setError(null);
  };

  const value: AegisContextType = {
    aegisAccount,
    isConnected,
    currentAddress,
    deployWallet,
    connectWallet,
    disconnect,
    error,
  };

  return (
    <AegisContext.Provider value={value}>
      {children}
    </AegisContext.Provider>
  );
};

export const useAegis = (): AegisContextType => {
  const context = useContext(AegisContext);
  if (context === undefined) {
    throw new Error('useAegis must be used within an AegisProvider');
  }
  return context;
};