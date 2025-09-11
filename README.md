# Aegis SDK

A comprehensive React and React Native compatible SDK for Starknet in-app wallet functionality. Built for developers who want to integrate seamless wallet experiences without the complexity of blockchain infrastructure.

## Features

- 🔐 **Secure Key Management**: Client-side private key storage using device secure storage
- ⛽ **Gasless Transactions**: AVNU paymaster integration for seamless user experience
- 🏗️ **Account Abstraction**: Smart contract accounts with automatic deployment
- 🔗 **Multi-Network Support**: Mainnet, Sepolia testnet, and local devnet
- 📱 **Cross-Platform**: Works with React web and React Native mobile apps
- 🔄 **Transaction Batching**: Automatic transaction queuing and optimization
- 💰 **Asset Queries**: ETH, ERC-20, and ERC-721 balance and asset management
- 🎣 **React Hooks**: Simple, declarative API for wallet operations

## Installation

```bash
npm install @aegis/sdk
```

### Optional Dependencies

For React Native projects, install the appropriate storage dependencies:

```bash
# For Expo projects
npm install expo-secure-store expo-crypto

# For bare React Native projects
npm install @react-native-async-storage/async-storage react-native-get-random-values
```

## Quick Start

### React Setup

```tsx
import React from 'react';
import { WalletProvider, useWallet } from '@aegis/sdk';

const config = {
  network: 'SN_SEPOLIA' as const,
  appName: 'my-dapp',
  paymasterApiKey: 'your-avnu-api-key', // Optional
  enableLogging: true,
};

function App() {
  return (
    <WalletProvider config={config}>
      <MyDApp />
    </WalletProvider>
  );
}

function MyDApp() {
  const {
    isConnected,
    address,
    generateAccount,
    connectAccount,
    deployAccount,
    executeTransaction,
    getETHBalance,
  } = useWallet();

  const handleCreateAccount = async () => {
    try {
      const privateKey = await generateAccount();
      await connectAccount(privateKey);
      await deployAccount(); // Gasless deployment
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  const handleSendTransaction = async () => {
    const calls = [
      {
        contractAddress: '0x123...',
        entrypoint: 'transfer',
        calldata: ['0x456...', '1000000000000000000'], // 1 ETH in wei
      },
    ];

    try {
      const result = await executeTransaction(calls);
      console.log('Transaction hash:', result.transactionHash);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {address}</p>
          <button onClick={handleSendTransaction}>Send Transaction</button>
        </div>
      ) : (
        <button onClick={handleCreateAccount}>Create Account</button>
      )}
    </div>
  );
}
```

### React Native Setup

```tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { WalletProvider, useWallet } from '@aegis/sdk/native';

// Add polyfills at the top of your app
import 'react-native-get-random-values';

const config = {
  network: 'SN_SEPOLIA' as const,
  appName: 'my-mobile-dapp',
  paymasterApiKey: 'your-avnu-api-key',
  enableLogging: __DEV__,
};

function App() {
  return (
    <WalletProvider config={config}>
      <MyMobileDApp />
    </WalletProvider>
  );
}

function MyMobileDApp() {
  const {
    isConnected,
    isConnecting,
    address,
    generateAccount,
    connectAccount,
    deployAccount,
    getETHBalance,
  } = useWallet();

  const handleCreateAccount = async () => {
    try {
      const privateKey = await generateAccount();
      await connectAccount(privateKey);
      await deployAccount();
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  if (isConnecting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Connecting...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {isConnected ? (
        <View>
          <Text>Connected: {address}</Text>
          <Text>Balance: Loading...</Text>
        </View>
      ) : (
        <Button title="Create Account" onPress={handleCreateAccount} />
      )}
    </View>
  );
}
```

## API Reference

### WalletProvider Props

| Prop | Type | Description |
|------|------|-------------|
| `config` | `WalletConfig` | Configuration object for the SDK |
| `children` | `ReactNode` | Child components |

### WalletConfig

```typescript
interface WalletConfig {
  network: 'SN_MAINNET' | 'SN_SEPOLIA' | 'SN_DEVNET';
  appName: string; // Unique identifier for your app
  rpcUrl?: string; // Custom RPC URL (optional)
  paymasterApiKey?: string; // AVNU paymaster API key
  paymasterBackendUrl?: string; // Custom paymaster backend
  maxRetries?: number; // Default: 3
  batchSize?: number; // Default: 100
  enableLogging?: boolean; // Default: false
}
```

### useWallet Hook

The `useWallet` hook provides access to all wallet functionality:

#### Connection State

```typescript
const {
  isConnected,      // boolean: Whether wallet is connected
  isConnecting,     // boolean: Whether connection is in progress
  account,          // Account | null: Starknet account instance
  address,          // string | null: Wallet address
  network,          // string: Current network
} = useWallet();
```

#### Account Management

```typescript
const {
  generateAccount,    // () => Promise<string>: Generate new private key
  connectAccount,     // (privateKey: string) => Promise<void>
  deployAccount,      // (privateKey?: string) => Promise<void>
  disconnectAccount,  // () => void
  exportPrivateKey,   // () => Promise<string | null>
} = useWallet();
```

#### Transaction Execution

```typescript
const {
  executeTransaction,  // (calls: Call[], options?: ExecutionOptions) => Promise<TransactionResult>
  executeBatch,       // (calls: Call[], options?: ExecutionOptions) => Promise<TransactionResult>
  addToQueue,         // (calls: Call[]) => void
  waitForTransaction, // (txHash: string) => Promise<boolean>
  getTransactionStatus, // (txHash: string) => Promise<'pending' | 'confirmed' | 'failed'>
} = useWallet();
```

#### Contract Interactions

```typescript
const {
  callContract,  // (address: string, method: string, args: any[]) => Promise<any>
  estimateGas,   // (calls: Call[]) => Promise<string>
} = useWallet();
```

#### Balance Queries

```typescript
const {
  getETHBalance,     // (address?: string) => Promise<string>
  getERC20Balance,   // (tokenAddress: string, decimals?: number, userAddress?: string) => Promise<string>
  getERC721Tokens,   // (contractAddress: string, userAddress?: string) => Promise<NFTToken[]>
} = useWallet();
```

## Advanced Usage

### Custom Paymaster Backend

```typescript
const config = {
  network: 'SN_SEPOLIA' as const,
  appName: 'my-dapp',
  paymasterBackendUrl: 'https://my-paymaster.example.com',
  // ... other config
};
```

### Transaction Options

```typescript
const options = {
  usePaymaster: true,    // Use paymaster for gasless transactions
  retries: 5,           // Number of retry attempts
  timeout: 60000,       // Timeout in milliseconds
  maxFee: '1000000000000000', // Maximum fee in wei
};

await executeTransaction(calls, options);
```

### Contract Interactions

```typescript
// Read contract data
const balance = await callContract(
  '0x123...', // contract address
  'balanceOf', // method name
  ['0x456...'] // arguments
);

// Write contract data
const calls = [
  {
    contractAddress: '0x123...',
    entrypoint: 'transfer',
    calldata: ['0x456...', '1000000000000000000'],
  },
];

const result = await executeTransaction(calls);
```

### Batch Operations

```typescript
// Queue multiple transactions for automatic batching
addToQueue([
  {
    contractAddress: '0x123...',
    entrypoint: 'approve',
    calldata: ['0x456...', '1000000000000000000'],
  },
]);

addToQueue([
  {
    contractAddress: '0x456...',
    entrypoint: 'swap',
    calldata: ['1000000000000000000'],
  },
]);

// Or execute immediately as a batch
const calls = [
  { contractAddress: '0x123...', entrypoint: 'approve', calldata: ['0x456...', '1000000000000000000'] },
  { contractAddress: '0x456...', entrypoint: 'swap', calldata: ['1000000000000000000'] },
];

await executeBatch(calls);
```

## Security Considerations

- Private keys are stored in device secure storage (Keychain/Keystore on mobile, encrypted localStorage on web)
- Keys never leave the client device unencrypted
- All cryptographic operations use industry-standard libraries
- Paymaster integration is optional and can be disabled
- Transaction validation happens client-side before signing

## Platform Support

### React Web
- ✅ Chrome, Firefox, Safari, Edge (latest 2 versions)
- ✅ Web Crypto API for secure random generation
- ✅ localStorage with encryption fallback

### React Native
- ✅ iOS 13+ / Android API 21+
- ✅ Expo SDK 49+
- ✅ Bare React Native 0.70+
- ✅ Expo SecureStore for secure key storage
- ✅ AsyncStorage with encryption fallback

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```typescript
import { NetworkError, ValidationError, ExecutionError } from '@aegis/sdk';

try {
  await executeTransaction(calls);
} catch (error) {
  if (error instanceof NetworkError) {
    // Handle network connectivity issues
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof ExecutionError) {
    // Handle transaction execution errors
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://docs.aegis.sh)
- 🐛 [Issue Tracker](https://github.com/aegis/sdk/issues)
- 💬 [Discord Community](https://discord.gg/aegis)
- 📧 [Email Support](mailto:support@aegis.sh)