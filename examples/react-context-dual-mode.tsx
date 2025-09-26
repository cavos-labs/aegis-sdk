/**
 * Example: Using AegisProvider with Dual Wallet Mode
 *
 * This example demonstrates how to use the updated AegisProvider
 * that supports both in-app and social login wallet modes.
 */

import React, { useState } from 'react';
import { AegisProvider, useAegis } from '../src';

// Example 1: Social Login Mode Provider
function SocialLoginApp() {
  return (
    <AegisProvider
      config={{
        appId: 'your-cavos-app-id',
        appName: 'My Social DApp',
        network: 'SN_SEPOLIA',
        walletMode: 'social-login', // Enable social login mode
        enableLogging: true,
        trackingApiUrl: 'https://services.cavos.xyz' // Optional
      }}
    >
      <SocialLoginWallet />
    </AegisProvider>
  );
}

// Example 2: In-App Wallet Mode Provider (Default)
function InAppWalletApp() {
  return (
    <AegisProvider
      config={{
        appId: 'tracking-app-id',
        appName: 'My In-App DApp',
        network: 'SN_SEPOLIA',
        // walletMode defaults to 'in-app'
        paymasterApiKey: 'your-avnu-api-key',
        enableLogging: true
      }}
    >
      <InAppWallet />
    </AegisProvider>
  );
}

// Social Login Wallet Component
function SocialLoginWallet() {
  const {
    walletMode,
    isConnected,
    currentAddress,
    signUp,
    signIn,
    signOut,
    getSocialWallet,
    isSocialAuthenticated,
    aegisAccount,
    error
  } = useAegis();

  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password123');

  const handleSignUp = async () => {
    try {
      const walletData = await signUp(email, password);
      console.log('Sign up successful:', walletData);
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      const walletData = await signIn(email, password);
      console.log('Sign in successful:', walletData);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleExecuteTransaction = async () => {
    try {
      const result = await aegisAccount.execute(
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', // ETH contract
        'transfer',
        ['0x123...', '1000000000000000000'] // Transfer 1 ETH
      );
      console.log('Transaction executed:', result.transactionHash);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  const socialWallet = getSocialWallet();

  return (
    <div>
      <h2>Social Login Wallet ({walletMode})</h2>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      <div>
        <h3>Authentication Status</h3>
        <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
        <p>Social Authenticated: {isSocialAuthenticated() ? 'Yes' : 'No'}</p>
        <p>Address: {currentAddress || 'Not connected'}</p>
        {socialWallet && (
          <div>
            <p>Email: {socialWallet.email}</p>
            <p>Organization: {socialWallet.organization.org_name}</p>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div>
          <h3>Authentication</h3>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <button onClick={handleSignUp}>Sign Up</button>
          <button onClick={handleSignIn}>Sign In</button>
        </div>
      ) : (
        <div>
          <h3>Wallet Actions</h3>
          <button onClick={handleExecuteTransaction}>Execute Transaction</button>
          <button onClick={signOut}>Sign Out</button>
        </div>
      )}
    </div>
  );
}

// In-App Wallet Component
function InAppWallet() {
  const {
    walletMode,
    isConnected,
    currentAddress,
    deployWallet,
    connectWallet,
    disconnect,
    aegisAccount,
    error
  } = useAegis();

  const [privateKey, setPrivateKey] = useState('');
  const [deployedKey, setDeployedKey] = useState('');

  const handleDeployWallet = async () => {
    try {
      const newPrivateKey = await deployWallet();
      setDeployedKey(newPrivateKey);
      console.log('Wallet deployed with private key:', newPrivateKey);
      alert('Wallet deployed! Store this private key securely: ' + newPrivateKey);
    } catch (error) {
      console.error('Deploy failed:', error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet(privateKey);
      console.log('Wallet connected');
    } catch (error) {
      console.error('Connect failed:', error);
    }
  };

  const handleExecuteTransaction = async () => {
    try {
      const result = await aegisAccount.execute(
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', // ETH contract
        'transfer',
        ['0x123...', '1000000000000000000'] // Transfer 1 ETH
      );
      console.log('Transaction executed:', result.transactionHash);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      <h2>In-App Wallet ({walletMode})</h2>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      <div>
        <h3>Connection Status</h3>
        <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
        <p>Address: {currentAddress || 'Not connected'}</p>
        {deployedKey && (
          <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
            <strong>Deployed Private Key:</strong> {deployedKey}
            <br />
            <small>Store this securely! You'll need it to connect to your wallet.</small>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div>
          <h3>Wallet Setup</h3>
          <div>
            <button onClick={handleDeployWallet}>Deploy New Wallet</button>
          </div>
          <div style={{ margin: '20px 0' }}>
            <input
              type="text"
              placeholder="Enter private key to connect"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              style={{ width: '400px' }}
            />
            <br />
            <button onClick={handleConnectWallet} disabled={!privateKey}>
              Connect Existing Wallet
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h3>Wallet Actions</h3>
          <button onClick={handleExecuteTransaction}>Execute Transaction</button>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}

// Dual Mode Demo Component
function DualModeDemo() {
  const [mode, setMode] = useState<'social' | 'inapp'>('social');

  return (
    <div>
      <h1>Aegis SDK Dual Wallet Mode Demo</h1>

      <div style={{ margin: '20px 0' }}>
        <button
          onClick={() => setMode('social')}
          style={{
            background: mode === 'social' ? '#007bff' : '#ccc',
            color: mode === 'social' ? 'white' : 'black',
            margin: '0 10px',
            padding: '10px 20px'
          }}
        >
          Social Login Mode
        </button>
        <button
          onClick={() => setMode('inapp')}
          style={{
            background: mode === 'inapp' ? '#007bff' : '#ccc',
            color: mode === 'inapp' ? 'white' : 'black',
            margin: '0 10px',
            padding: '10px 20px'
          }}
        >
          In-App Wallet Mode
        </button>
      </div>

      {mode === 'social' ? <SocialLoginApp /> : <InAppWalletApp />}
    </div>
  );
}

export default DualModeDemo;

// Usage notes:
console.log(`
🎯 AegisProvider Dual Mode Usage:

1. ✅ Same provider supports both wallet modes
2. ✅ Mode determined by walletMode config
3. ✅ Context provides mode-specific methods
4. ✅ Graceful handling of unavailable methods
5. ✅ Same transaction execution API

Social Login Mode:
- signUp(), signIn(), signOut()
- getSocialWallet(), isSocialAuthenticated()
- Automatic token management

In-App Mode:
- deployWallet(), connectWallet()
- User manages private keys
- Direct Starknet interaction

Both Modes:
- execute(), executeBatch() work the same
- isConnected, currentAddress consistent
- error handling unified
`);