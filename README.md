# Aegis SDK

Simple SDK for Starknet wallets with gasless transactions.

Get your App ID at: https://aegis.cavos.xyz

## Installation

```bash
npm install @cavos/aegis
```

## Quick Start

### React Native / Expo (Recommended)

```typescript
// 1. Setup the provider in your app root (_layout.tsx)
import { AegisProvider } from '@cavos/aegis';

export default function App() {
  return (
    <AegisProvider
      config={{
        network: 'SN_SEPOLIA',
        appName: 'MyApp',
        appId: 'your-unique-app-id',
        paymasterApiKey: 'your-avnu-api-key',
        enableLogging: true
      }}
    >
      {/* Your app */}
    </AegisProvider>
  );
}

// 2. Use in any component
import { useAegis } from '@cavos/aegis';

function WalletButton() {
  const { isConnected, currentAddress, deployWallet, disconnect } = useAegis();

  if (isConnected) {
    return (
      <View>
        <Text>Connected: {currentAddress}</Text>
        <Button onPress={disconnect} title="Disconnect" />
      </View>
    );
  }

  return <Button onPress={deployWallet} title="Create Wallet" />;
}
```

### Basic SDK Usage

```typescript
import { AegisSDK } from '@cavos/aegis';

const sdk = new AegisSDK({
  network: 'SN_SEPOLIA',
  appName: 'MyApp',
  appId: 'your-unique-app-id',
  paymasterApiKey: 'your-avnu-api-key',
  enableLogging: true
});

// Deploy new wallet (generates + deploys + connects)
const privateKey = await sdk.deployAccount();
// 🔐 Store this privateKey securely!

// Or connect with existing key
await sdk.connectAccount('0x123...your_private_key');
```

## Core Operations

### Execute Transactions

```typescript
// Single transaction (gasless)
const result = await sdk.execute(
  '0x123...contract_address',
  'transfer',
  ['0x456...recipient', '1000000000000000000'] // 1 ETH in wei
);

console.log('Transaction:', result.transactionHash);

// Multiple transactions in one batch
const calls = [
  {
    contractAddress: '0x123...token',
    entrypoint: 'approve',
    calldata: ['0x456...spender', '1000000000000000000']
  },
  {
    contractAddress: '0x789...dex',
    entrypoint: 'swap',
    calldata: ['0x123...token_in', '0xabc...token_out', '1000000000000000000']
  }
];

const batchResult = await sdk.executeBatch(calls);
```

### Check Balances

```typescript
// ETH balance
const ethBalance = await sdk.getETHBalance();
console.log('ETH:', ethBalance);

// Token balance
const tokenBalance = await sdk.getTokenBalance(
  '0x123...token_address',
  18 // decimals
);
console.log('Tokens:', tokenBalance);

// NFTs
const nfts = await sdk.getNFTs('0x123...nft_contract');
```

### Read Contract Data

```typescript
// Call any contract function
const result = await sdk.call(
  '0x123...contract',
  'balanceOf',
  [sdk.address]
);
```

## Account Management

```typescript
// Check connection
console.log('Connected:', sdk.isConnected);
console.log('Address:', sdk.address);

// Generate new private key
const newKey = sdk.generateAccount();

// Connect account
await sdk.connectAccount(privateKey);

// Deploy account
await sdk.deployAccount();

// Disconnect
sdk.disconnect();
```

## Configuration

```typescript
interface WalletConfig {
  network: 'SN_MAINNET' | 'SN_SEPOLIA' | 'SN_DEVNET';
  appName: string;
  appId: string; // Required: Get from https://aegis.cavos.xyz

  // Optional
  paymasterApiKey?: string;        // For gasless transactions
  rpcUrl?: string;                 // Custom RPC
  enableLogging?: boolean;         // Debug logs (default: false)
  maxRetries?: number;             // Transaction retries (default: 3)
  trackingApiUrl?: string;         // Custom analytics URL
}
```

## Key Storage (Important!)

**The SDK does NOT store private keys.** You must handle storage:

### React Native/Expo (use provided context)
```typescript
// Uses expo-secure-store automatically
<AegisProvider config={...}>
  {/* Your app */}
</AegisProvider>
```

### Manual Storage
```typescript
// Example with expo-secure-store
import * as SecureStore from 'expo-secure-store';

// Store
await SecureStore.setItemAsync('wallet_key', privateKey);

// Load
const privateKey = await SecureStore.getItemAsync('wallet_key');
if (privateKey) {
  await sdk.connectAccount(privateKey);
}

// Remove
await SecureStore.deleteItemAsync('wallet_key');
```

## Error Handling

```typescript
try {
  const result = await sdk.execute(contract, method, params);
} catch (error) {
  if (error.message.includes('insufficient')) {
    console.log('Not enough balance');
  } else if (error.message.includes('nonce')) {
    console.log('Transaction already sent');
  } else {
    console.log('Transaction failed:', error.message);
  }
}
```

## Utilities

```typescript
// Wait for transaction
const confirmed = await sdk.waitForTransaction(txHash);

// Check transaction status
const status = await sdk.getTransactionStatus(txHash); // 'pending', 'confirmed', 'failed'

// Estimate gas
const gasEstimate = await sdk.estimateGas(contract, method, params);

// Switch networks
await sdk.switchNetwork('SN_MAINNET');
```

## Analytics

The SDK automatically tracks:
- ✅ Wallet deployments
- ✅ Transaction executions
- 🔒 No private data transmitted
- ⚡ Zero performance impact

## Platform Support

- ✅ React Native / Expo
- ✅ Node.js
- ✅ Modern browsers
- ✅ Full TypeScript support

## Security

- 🔐 Client-side signing only
- 🚫 Private keys never transmitted
- ✅ Secure storage on device
- 📊 Privacy-first analytics

## Support

- 📖 Documentation: [docs.cavos.xyz](https://docs.cavos.xyz/)
- 🐛 Issues: [GitHub](https://github.com/cavos-labs/aegis-sdk/issues)
- 💬 Discord: [Community](https://discord.gg/Vvq2ekEV47)
- 📧 Email: adrianvrj@cavos.xyz

## License

MIT License

---

**Get started:** Grab your App ID from [aegis.cavos.xyz](https://aegis.cavos.xyz) and start building! 🚀