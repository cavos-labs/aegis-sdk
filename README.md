# Aegis SDK

Simple SDK for Starknet wallets with support for **OAuth (Apple/Google)**, **Email/Password**, and **In-app wallets**.

React and React Native compatible.

One single package for everything.

Get your App ID at: https://aegis.cavos.xyz

## Installation

```bash
npm install @cavos/aegis
```

## Quick Start - Choose Your Authentication

### 🍎 OAuth Login (Apple/Google)

**Perfect for:** Consumer apps, social authentication, best UX

```typescript
import { AegisSDK } from '@cavos/aegis';
import { openAuthSessionAsync } from 'expo-web-browser';

const aegis = new AegisSDK({
  network: 'sepolia',
  appId: 'your-cavos-app-id',
  enableLogging: true
});

// Step 1: Get OAuth URL
const appleUrl = await aegis.getAppleOAuthUrl('exp://192.168.1.16:8081');
const googleUrl = await aegis.getGoogleOAuthUrl('exp://192.168.1.16:8081');

// Step 2: Open URL your way
const result = await openAuthSessionAsync(appleUrl, 'exp://192.168.1.16:8081');

// Step 3: Handle callback to connect account
await aegis.handleOAuthCallback(result);

// Done! Use your connected wallet
console.log('Connected!', aegis.getWalletStatus());
await aegis.execute('0x123...', 'transfer', ['0x456...', '1000']);
```

### 📧 Email/Password Login

**Perfect for:** Simple authentication, no external OAuth

```typescript
import { AegisSDK } from '@cavos/aegis';

const aegis = new AegisSDK({
  network: 'sepolia',
  appId: 'your-cavos-app-id',
  enableLogging: true
});

// Sign up new user
await aegis.signUp('user@example.com', 'password123');

// Or sign in existing user
await aegis.signIn('user@example.com', 'password123');

// Use your connected wallet
await aegis.execute('0x123...', 'transfer', ['0x456...', '1000']);

// Sign out when done
await aegis.signOut();
```

### 🏠 In-App Wallets (Self-Custody)

**Perfect for:** DeFi, power users, full control

```typescript
import { AegisSDK } from '@cavos/aegis';

const aegis = new AegisSDK({
  network: 'sepolia',
  appId: 'your-app-id',
  paymasterApiKey: 'your-avnu-api-key', // For gasless deployment
  enableLogging: true
});

// Create new wallet
const privateKey = await aegis.deployAccount();
console.log('Save this key securely:', privateKey);

// Or connect existing wallet
await aegis.connectAccount('your-existing-private-key');

// Use your wallet
await aegis.execute('0x123...', 'transfer', ['0x456...', '1000']);
```

## 🔄 Multi-Wallet Support

Use both social and in-app wallets in the same app:

```typescript
const aegis = new AegisSDK({
  network: 'sepolia',
  appId: 'your-cavos-app-id'
  // No walletMode needed - both types available!
});

// Use OAuth
const appleUrl = await aegis.getAppleOAuthUrl('exp://192.168.1.16:8081');
const result = await openAuthSessionAsync(appleUrl, 'exp://192.168.1.16:8081');
await aegis.handleOAuthCallback(result);

// Or use email/password
await aegis.signIn('user@example.com', 'password');

// Or use in-app wallet
await aegis.connectAccount('private-key');

// Check what's connected
const status = aegis.getWalletStatus();
console.log('Active wallet:', status.activeWalletType); // 'social' or 'in-app'
console.log('Social wallet:', status.social.address);
console.log('In-app wallet:', status.inApp.address);
```

## 📱 OAuth Browser Opening Methods

### Expo WebBrowser (Recommended)
```typescript
import { openAuthSessionAsync } from 'expo-web-browser';

const url = await aegis.getAppleOAuthUrl('exp://192.168.1.16:8081');
const result = await openAuthSessionAsync(url, 'exp://192.168.1.16:8081');
await aegis.handleOAuthCallback(result);
```

### React Native Linking
```typescript
import { Linking } from 'react-native';

const url = await aegis.getAppleOAuthUrl('yourapp://oauth-callback');
await Linking.openURL(url);

// Handle deep link callback
const handleDeepLink = async (callbackUrl) => {
  await aegis.handleOAuthCallback(callbackUrl);
};
```

### Web Browser
```typescript
const url = await aegis.getAppleOAuthUrl('https://yourapp.com/callback');
window.location.href = url;

// On callback page
await aegis.handleOAuthCallback(window.location.href);
```

## 💰 Transaction Examples

All authentication methods use the same transaction API:

```typescript
// Single transaction
const result = await aegis.execute(
  '0x123...contract',
  'transfer',
  ['0x456...recipient', '1000000000000000000']
);

// Batch transactions
const calls = [
  {
    contractAddress: '0x123...token',
    entrypoint: 'approve',
    calldata: ['0x456...spender', '1000000000000000000']
  },
  {
    contractAddress: '0x789...dex',
    entrypoint: 'swap',
    calldata: ['0x123...', '0xabc...', '1000000000000000000']
  }
];
const batchResult = await aegis.executeBatch(calls);

// Check balances
const ethBalance = await aegis.getETHBalance();
const tokenBalance = await aegis.getTokenBalance('0x123...', 18);
const nfts = await aegis.getNFTs('0x123...');

// Read contract data
const result = await aegis.call('0x123...', 'balanceOf', [aegis.address]);
```

## 🔧 Configuration

```typescript
interface WalletConfig {
  network: 'mainnet' | 'sepolia';
  appId: string; // Get from https://aegis.cavos.xyz

  // Optional
  paymasterApiKey?: string;    // For gasless in-app wallet deployment
  rpcUrl?: string;             // Custom RPC endpoint
  enableLogging?: boolean;     // Debug logs
  maxRetries?: number;         // Transaction retries (default: 3)
  trackingApiUrl?: string;     // Custom base URL
}
```

## 📊 Account Management

```typescript
// Check connection status
console.log('Connected:', aegis.isWalletConnected());
console.log('Active type:', aegis.getActiveWalletType()); // 'social' | 'in-app' | null

// Get wallet details
const status = aegis.getWalletStatus();
console.log('Social wallet:', status.social);
console.log('In-app wallet:', status.inApp);

// Get current address (works with any wallet type)
console.log('Address:', aegis.address);

// Disconnect wallets
await aegis.signOut(); // For social wallets
aegis.disconnect(); // For in-app wallets
await aegis.disconnectAllWallets(); // Disconnect everything
```

## 🔐 Security & Storage

### OAuth & Email/Password
- ✅ **No key storage needed** - handled automatically
- 🔐 Authentication tokens managed securely
- 🚫 Private keys managed server-side by Cavos

### In-App Wallets
- ⚠️ **You must store private keys securely**
- 🔐 Client-side signing only
- 🚫 Private keys never transmitted

```typescript
// Example secure storage (React Native)
import * as SecureStore from 'expo-secure-store';

// Store private key
const privateKey = await aegis.deployAccount();
await SecureStore.setItemAsync('wallet_key', privateKey);

// Load on app start
const savedKey = await SecureStore.getItemAsync('wallet_key');
if (savedKey) {
  await aegis.connectAccount(savedKey);
}
```

## 🛠️ Error Handling

```typescript
try {
  // OAuth
  const url = await aegis.getAppleOAuthUrl('exp://192.168.1.16:8081');
  const result = await openAuthSessionAsync(url, 'exp://192.168.1.16:8081');
  await aegis.handleOAuthCallback(result);
} catch (error) {
  if (error.message.includes('Social auth manager not initialized')) {
    console.error('Configure SDK with valid appId');
  } else if (error.message.includes('OAuth callback parsing failed')) {
    console.error('Invalid callback data');
  } else {
    console.error('OAuth error:', error.message);
  }
}

try {
  // Email/password
  await aegis.signIn('user@example.com', 'password');
} catch (error) {
  if (error.message.includes('Authentication failed')) {
    console.error('Invalid credentials');
  } else {
    console.error('Login error:', error.message);
  }
}

try {
  // Transactions
  await aegis.execute('0x123...', 'transfer', ['0x456...', '1000']);
} catch (error) {
  if (error.message.includes('insufficient')) {
    console.error('Not enough balance');
  } else if (error.message.includes('nonce')) {
    console.error('Transaction already sent');
  } else {
    console.error('Transaction failed:', error.message);
  }
}
```

## 📋 API Reference

### Authentication Methods
- `getAppleOAuthUrl(redirectUri)` - Get Apple OAuth URL
- `getGoogleOAuthUrl(redirectUri)` - Get Google OAuth URL
- `handleOAuthCallback(callbackData)` - Process OAuth callback
- `signUp(email, password)` - Create account with email/password
- `signIn(email, password)` - Sign in with email/password
- `signOut()` - Sign out from social authentication

### In-App Wallet Methods
- `generateAccount()` - Generate new private key
- `deployAccount()` - Deploy new wallet (gasless with paymaster)
- `connectAccount(privateKey)` - Connect existing wallet
- `disconnect()` - Disconnect in-app wallet

### Transaction Methods
- `execute(contract, method, params)` - Single transaction
- `executeBatch(calls)` - Batch transactions
- `call(contract, method, params)` - Read contract data

### Balance Methods
- `getETHBalance()` - Get ETH balance
- `getTokenBalance(address, decimals)` - Get token balance
- `getNFTs(contractAddress)` - Get NFT tokens

### Utility Methods
- `getWalletStatus()` - Get detailed wallet status
- `getActiveWalletType()` - Get active wallet type
- `isWalletConnected()` - Check if any wallet connected
- `disconnectAllWallets()` - Disconnect all wallets

## 🌐 Platform Support

- ✅ **React Native / Expo** - Full support
- ✅ **Web browsers** - Full support
- ✅ **Node.js** - Server-side support
- ✅ **TypeScript** - Full type safety

## 📖 More Resources

- **Dashboard:** [aegis.cavos.xyz](https://aegis.cavos.xyz) - Get your App ID
- **Documentation:** [docs.cavos.xyz](https://docs.cavos.xyz)
- **OAuth Examples:** [OAUTH_EXAMPLE.md](./OAUTH_EXAMPLE.md)
- **Discord:** [Community Support](https://discord.gg/Vvq2ekEV47)

## 📄 License

MIT License

---

**Choose your authentication method and start building! 🚀**

- 🍎 **OAuth**: Best UX, social login
- 📧 **Email/Password**: Simple, familiar
- 🏠 **In-App Wallets**: Self-custody, DeFi-ready