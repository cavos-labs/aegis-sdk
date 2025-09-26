import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AegisSDK } from '../core/aegis-sdk';
import { SocialWalletData, WalletMode } from '../types';

interface AegisContextType {
  aegisAccount: AegisSDK;
  isConnected: boolean;
  currentAddress: string | null;
  walletMode: WalletMode;

  // In-app wallet actions
  deployWallet: () => Promise<string>; // Deploy new wallet and return private key
  connectWallet: (privateKey: string) => Promise<void>; // Connect with existing private key

  // Social login actions
  signUp: (email: string, password: string) => Promise<SocialWalletData>; // Sign up new user
  signIn: (email: string, password: string) => Promise<SocialWalletData>; // Sign in existing user
  signOut: () => Promise<void>; // Sign out social login user
  getSocialWallet: () => SocialWalletData | null; // Get current social wallet data
  isSocialAuthenticated: () => boolean; // Check social authentication status

  // Common actions
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
    walletMode?: WalletMode; // Optional, defaults to 'in-app'
    trackingApiUrl?: string; // Optional, used for social login base URL
  };
}

export const AegisProvider: React.FC<AegisProviderProps> = ({
  children,
  config
}) => {
  // Use default AVNU API key if not provided (only needed for in-app wallets)
  const configWithDefaults = {
    ...config,
    paymasterApiKey: config.paymasterApiKey || 'c37c52b7-ea5a-4426-8121-329a78354b0b',
    walletMode: config.walletMode || 'in-app' as WalletMode
  };

  const [aegisAccount] = useState(() => new AegisSDK(configWithDefaults));
  const [isConnected, setIsConnected] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const walletMode = configWithDefaults.walletMode;

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

  // Social login methods
  const signUp = async (email: string, password: string): Promise<SocialWalletData> => {
    try {
      setError(null);

      const walletData = await aegisAccount.signUp(email, password);

      // Update state
      setCurrentAddress(aegisAccount.address);
      setIsConnected(true);

      return walletData;
    } catch (error) {
      const errorMsg = `Failed to sign up: ${error}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const signIn = async (email: string, password: string): Promise<SocialWalletData> => {
    try {
      setError(null);

      const walletData = await aegisAccount.signIn(email, password);

      // Update state
      setCurrentAddress(aegisAccount.address);
      setIsConnected(true);

      return walletData;
    } catch (error) {
      const errorMsg = `Failed to sign in: ${error}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);

      await aegisAccount.signOut();

      // Reset state
      setCurrentAddress(null);
      setIsConnected(false);
    } catch (error) {
      const errorMsg = `Failed to sign out: ${error}`;
      setError(errorMsg);
      // Don't throw on sign out failures, just log them
      console.error(errorMsg);
    }
  };

  const getSocialWallet = (): SocialWalletData | null => {
    try {
      return aegisAccount.getSocialWallet();
    } catch (error) {
      // Method not available in in-app mode
      return null;
    }
  };

  const isSocialAuthenticated = (): boolean => {
    try {
      return aegisAccount.isSocialAuthenticated();
    } catch (error) {
      // Method not available in in-app mode
      return false;
    }
  };

  const disconnect = () => {
    if (walletMode === 'social-login') {
      // For social login, use signOut
      signOut().catch(console.error);
    } else {
      // For in-app wallets, use disconnect
      aegisAccount.disconnect();

      // Reset state
      setCurrentAddress(null);
      setIsConnected(false);
      setError(null);
    }
  };

  const value: AegisContextType = {
    aegisAccount,
    isConnected,
    currentAddress,
    walletMode,
    deployWallet,
    connectWallet,
    signUp,
    signIn,
    signOut,
    getSocialWallet,
    isSocialAuthenticated,
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