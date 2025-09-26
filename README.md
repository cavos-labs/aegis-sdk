# Aegis SDK

Simple SDK for Starknet wallets with **OAuth (Apple/Google)**, **Email/Password**, and **In-app wallets**.

React and React Native compatible.

Get your App ID at: https://aegis.cavos.xyz

## Installation

```bash
npm install @cavos/aegis
```

## How It Works (Super Simple!)

1. **Wrap your app** with `AegisProvider`
2. **Use the hook** `useAegis()` in any component
3. **Get `aegisAccount`** - this is your wallet object
4. **Use `aegisAccount`** to login and send transactions

That's it!

---

## Step 1: Wrap Your App

```typescript
import { AegisProvider } from '@cavos/aegis';

export default function App() {
  return (
    <AegisProvider
      config={{
        network: 'sepolia',
        appId: 'your-app-id' // Get from https://aegis.cavos.xyz
      }}
    >
      {/* Your app components here */}
      <MyWalletComponent />
    </AegisProvider>
  );
}
```

## Step 2: Use in Any Component

```typescript
import { useAegis } from '@cavos/aegis';
import { openAuthSessionAsync } from 'expo-web-browser';

function MyWalletComponent() {
  const { aegisAccount, isWalletConnected } = useAegis();

  // Login with Apple
  const loginWithApple = async () => {
    const url = await aegisAccount.getAppleOAuthUrl('exp://192.168.1.16:8081');
    const result = await openAuthSessionAsync(url, 'exp://192.168.1.16:8081');
    await aegisAccount.handleOAuthCallback(result);
  };

  // Login with Email
  const loginWithEmail = async () => {
    await aegisAccount.signIn('user@example.com', 'password123');
  };

  // Create new wallet
  const createWallet = async () => {
    const privateKey = await aegisAccount.deployAccount();
    console.log('Save this:', privateKey); // Save securely!
  };

  // Send transaction
  const sendMoney = async () => {
    await aegisAccount.execute(
      '0x123...contract',
      'transfer',
      ['0x456...recipient', '1000']
    );
  };

  if (isWalletConnected) {
    return (
      <div>
        <p>Address: {aegisAccount.address}</p>
        <button onClick={sendMoney}>Send Money</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={loginWithApple}>Login with Apple</button>
      <button onClick={loginWithEmail}>Login with Email</button>
      <button onClick={createWallet}>Create Wallet</button>
    </div>
  );
}
```

---

## The `aegisAccount` Object

This is your main wallet object. Everything happens through `aegisAccount`:

### Login Methods
```typescript
// OAuth (Apple/Google)
const url = await aegisAccount.getAppleOAuthUrl('your-redirect-uri');
const url = await aegisAccount.getGoogleOAuthUrl('your-redirect-uri');
await aegisAccount.handleOAuthCallback(result);

// Email/Password
await aegisAccount.signUp('email@example.com', 'password');
await aegisAccount.signIn('email@example.com', 'password');
await aegisAccount.signOut();

// In-app Wallets
const privateKey = await aegisAccount.deployAccount(); // Creates new wallet
await aegisAccount.connectAccount('private-key'); // Connect existing
aegisAccount.disconnect(); // Disconnect
```

### Transaction Methods
```typescript
// Send transaction
await aegisAccount.execute(contract, method, params);

// Multiple transactions
await aegisAccount.executeBatch([
  { contractAddress: '0x123...', entrypoint: 'approve', calldata: [...] },
  { contractAddress: '0x456...', entrypoint: 'swap', calldata: [...] }
]);

// Read data (no transaction)
const result = await aegisAccount.call(contract, method, params);
```

### Balance Methods
```typescript
const ethBalance = await aegisAccount.getETHBalance();
const tokenBalance = await aegisAccount.getTokenBalance('0x123...', 18);
const nfts = await aegisAccount.getNFTs('0x123...');
```

### Status Methods
```typescript
console.log('Address:', aegisAccount.address);
console.log('Connected:', aegisAccount.isWalletConnected());
console.log('Status:', aegisAccount.getWalletStatus());
```

---

## Three Ways to Login

### OAuth (Apple/Google)
**Best for:** Social apps, easy login

```typescript
// Step 1: Get URL
const url = await aegisAccount.getAppleOAuthUrl('exp://192.168.1.16:8081');

// Step 2: Open browser (your way)
const result = await openAuthSessionAsync(url, 'exp://192.168.1.16:8081');

// Step 3: Handle result
await aegisAccount.handleOAuthCallback(result);
```

### Email/Password
**Best for:** Simple apps, no OAuth setup

```typescript
// Sign up
await aegisAccount.signUp('user@example.com', 'password123');

// Sign in
await aegisAccount.signIn('user@example.com', 'password123');
```

### In-App Wallets
**Best for:** Crypto apps, full control

```typescript
// Create new wallet
const privateKey = await aegisAccount.deployAccount();
// Save this privateKey securely!

// Or connect existing
await aegisAccount.connectAccount('existing-private-key');
```

---

## Complete Example

```typescript
import React from 'react';
import { AegisProvider, useAegis } from '@cavos/aegis';
import { openAuthSessionAsync } from 'expo-web-browser';

// 1. Wrap your app
export default function App() {
  return (
    <AegisProvider config={{ network: 'sepolia', appId: 'your-app-id' }}>
      <WalletApp />
    </AegisProvider>
  );
}

// 2. Use in components
function WalletApp() {
  const { aegisAccount, isWalletConnected } = useAegis();

  const handleAppleLogin = async () => {
    const url = await aegisAccount.getAppleOAuthUrl('exp://192.168.1.16:8081');
    const result = await openAuthSessionAsync(url, 'exp://192.168.1.16:8081');
    await aegisAccount.handleOAuthCallback(result);
  };

  if (isWalletConnected) {
    return (
      <div>
        <h1>Connected!</h1>
        <p>Address: {aegisAccount.address}</p>

        <button onClick={() =>
          aegisAccount.execute('0x123...', 'transfer', ['0x456...', '1000'])
        }>
          Send Transaction
        </button>

        <button onClick={() => aegisAccount.signOut()}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Login to Your Wallet</h1>

      <button onClick={handleAppleLogin}>
        Login with Apple
      </button>

      <button onClick={() =>
        aegisAccount.signIn('user@example.com', 'password')
      }>
        Login with Email
      </button>

      <button onClick={() => aegisAccount.deployAccount()}>
        Create New Wallet
      </button>
    </div>
  );
}
```

---

## Browser Opening (for OAuth)

### Expo (Recommended)
```typescript
import { openAuthSessionAsync } from 'expo-web-browser';

const url = await aegisAccount.getAppleOAuthUrl('exp://192.168.1.16:8081');
const result = await openAuthSessionAsync(url, 'exp://192.168.1.16:8081');
await aegisAccount.handleOAuthCallback(result);
```

### React Native
```typescript
import { Linking } from 'react-native';

const url = await aegisAccount.getAppleOAuthUrl('yourapp://callback');
await Linking.openURL(url);
// Handle the callback in your app
```

### Web
```typescript
const url = await aegisAccount.getAppleOAuthUrl('https://yourapp.com/callback');
window.location.href = url;
// Handle callback on your callback page
```

---

## Security

### OAuth & Email/Password
- No private keys to store
- Automatic token management
- Secure authentication

### In-App Wallets
- **You must store private keys securely**
- Full control of your wallet
- No third-party dependencies

```typescript
// Example: Secure storage (React Native)
import * as SecureStore from 'expo-secure-store';

// Save private key
const privateKey = await aegisAccount.deployAccount();
await SecureStore.setItemAsync('wallet_key', privateKey);

// Load on app start
const savedKey = await SecureStore.getItemAsync('wallet_key');
if (savedKey) {
  await aegisAccount.connectAccount(savedKey);
}
```

---

## Error Handling

```typescript
try {
  await aegisAccount.signIn('user@example.com', 'password');
} catch (error) {
  console.log('Login failed:', error.message);
}

try {
  await aegisAccount.execute('0x123...', 'transfer', ['0x456...', '1000']);
} catch (error) {
  if (error.message.includes('insufficient')) {
    console.log('Not enough money');
  } else {
    console.log('Transaction failed:', error.message);
  }
}
```

---

## Configuration

```typescript
<AegisProvider
  config={{
    network: 'sepolia', // or 'mainnet'
    appId: 'your-app-id', // Required: Get from https://aegis.cavos.xyz
    paymasterApiKey: 'your-key', // Optional: For gasless transactions
    enableLogging: true // Optional: For debugging
  }}
>
```

---

## Remember This!

1. **`AegisProvider`** wraps your app
2. **`useAegis()`** gives you the hook
3. **`aegisAccount`** is your wallet - use it for everything!
4. **Three login ways:** OAuth, Email, or Create Wallet
5. **All transactions** happen through `aegisAccount.execute()`

That's it! Simple as that!

---

## Resources

- **Get App ID:** [aegis.cavos.xyz](https://aegis.cavos.xyz)
- **Documentation:** [docs.cavos.xyz](https://docs.cavos.xyz)
- **Community:** [Discord](https://discord.gg/Vvq2ekEV47)