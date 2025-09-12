# Aegis SDK

A comprehensive SDK for Starknet wallet functionality with automatic account management, gasless transactions, and built-in analytics tracking. Perfect for developers who want to integrate seamless wallet experiences without blockchain complexity.

Reffer to https://aegis.cavos.xyz to get your App Id.

## Key Features

- 🔐 **Automatic Account Management**: Accounts are saved and loaded automatically between sessions
- ⛽ **Gasless Transactions**: AVNU paymaster integration for seamless user experience
- 📊 **Built-in Analytics**: Automatic tracking of wallet deployments and transactions
- 🏗️ **Account Abstraction**: Smart contract accounts with automatic deployment
- 🔗 **Multi-Network Support**: Mainnet, Sepolia testnet, and local devnet
- 💰 **Asset Queries**: ETH, ERC-20, and ERC-721 balance and asset management
- 🔄 **Fire-and-Forget Tracking**: Zero performance impact analytics

## Installation

```bash
npm install @cavos/aegis-sdk
```

## Quick Start

### Initialize the SDK

```typescript
import { AegisSDK } from '@cavos/aegis-sdk';

// Initialize the SDK (appId is REQUIRED for tracking)
const sdk = new AegisSDK({
  network: 'SN_MAINNET', // or 'SN_SEPOLIA', 'SN_DEVNET'
  appName: 'MyDApp',
  appId: 'my_unique_app_123', // REQUIRED: Your unique app identifier
  paymasterApiKey: 'your_avnu_api_key', // For gasless transactions
  enableLogging: true // Optional: Enable debug logs
});

// ✅ If you have a previously stored account, it's automatically connected!
console.log('Auto-connected:', sdk.isConnected);
console.log('Account address:', sdk.address);
```

### Deploy New Account (First Time Users)

```typescript
// Deploy a new account with gasless deployment
const privateKey = await sdk.deployAccount();

console.log('✅ Account deployed successfully!');
console.log('Private key (save this!):', privateKey);
console.log('Account address:', sdk.address);
console.log('Connected:', sdk.isConnected); // true

// ✅ Account is automatically saved and will be loaded next time you initialize the SDK
// ✅ Deployment is automatically tracked for analytics
```

### Connect with Existing Private Key

```typescript
// Connect using an existing private key
const address = await sdk.connectAccount('0x1234...your_private_key');

console.log('✅ Connected to account:', address);
console.log('Account saved for future sessions');

// ✅ Account is automatically saved for persistence
// ✅ Connection is tracked for analytics
```

## Transaction Execution

### Single Transaction

```typescript
// Execute a single transaction (automatically gasless)
const result = await sdk.execute(
  '0x123...contract_address',
  'transfer', // method name
  ['0x456...recipient', '1000000000000000000'] // parameters [recipient, amount in wei]
);

console.log('✅ Transaction hash:', result.transactionHash);
console.log('Status:', result.status); // 'pending', 'confirmed', or 'failed'

// ✅ Transaction is automatically tracked for analytics
// ✅ Zero performance impact - tracking happens in background
```

### Batch Transactions

```typescript
// Execute multiple transactions in a single batch
const calls = [
  {
    contractAddress: '0x123...token_contract',
    entrypoint: 'approve',
    calldata: ['0x456...spender', '2000000000000000000'] // 2 tokens
  },
  {
    contractAddress: '0x789...dex_contract', 
    entrypoint: 'swap',
    calldata: ['0x123...token_in', '0xabc...token_out', '1000000000000000000']
  }
];

const result = await sdk.executeBatch(calls);

console.log('✅ Batch transaction hash:', result.transactionHash);
// ✅ Batch is automatically tracked as single transaction
```

### Transaction Options

```typescript
// Advanced transaction options
const options = {
  usePaymaster: true,    // Use gasless transactions (default: true)
  retries: 3,           // Retry attempts (default: 3)
  timeout: 60000,       // Timeout in ms (default: 60000)
  maxFee: '1000000000000000', // Max fee in wei
};

const result = await sdk.execute(
  '0x123...contract',
  'method_name',
  ['param1', 'param2'],
  options
);
```

## Reading Blockchain Data

### Balance Queries

```typescript
// Get ETH balance for current account
const ethBalance = await sdk.getETHBalance();
console.log('ETH Balance:', ethBalance, 'ETH');

// Get ETH balance for any address
const otherEthBalance = await sdk.getETHBalance('0x123...other_address');

// Get ERC-20 token balance
const tokenBalance = await sdk.getTokenBalance(
  '0x123...token_contract',
  18, // token decimals
  sdk.address // optional: address to check (defaults to current account)
);
console.log('Token Balance:', tokenBalance);

// Get NFTs owned by current account
const nfts = await sdk.getNFTs('0x123...nft_contract');
console.log('NFTs:', nfts);
```

### Contract Calls (Read-Only)

```typescript
// Call any contract view function
const result = await sdk.call(
  '0x123...contract_address',
  'balanceOf', // method name
  [sdk.address] // parameters
);
console.log('Balance from contract call:', result);

// Call with multiple parameters
const allowance = await sdk.call(
  '0x123...token_contract',
  'allowance',
  [sdk.address, '0x456...spender_address']
);
```

## Account Management

### Check Connection Status

```typescript
// Check if account is connected
console.log('Connected:', sdk.isConnected); // boolean

// Get current account address
console.log('Address:', sdk.address); // string | null

// The SDK automatically loads saved accounts on initialization
```

### Export Private Key

```typescript
// Export private key for current account
const privateKey = await sdk.exportPrivateKey();
if (privateKey) {
  console.log('Private key:', privateKey);
  // ⚠️ Keep this secure! Never share or log in production
}
```

### Multiple Accounts

```typescript
// Get all stored accounts for your app
const storedAccounts = await sdk.getStoredAccounts();
console.log('All stored accounts:', storedAccounts);

// Connect to a specific stored account
// (This automatically happens when you call connectAccount with a private key)
```

### Disconnect Account

```typescript
// Disconnect current account (doesn't delete stored account)
sdk.disconnect();
console.log('Connected:', sdk.isConnected); // false

// Account remains stored and will auto-connect next time you initialize the SDK
```

## Network Management

### Switch Networks

```typescript
// Switch to different network
await sdk.switchNetwork('SN_SEPOLIA');
console.log('Switched to Sepolia testnet');

// Switch with custom RPC URL
await sdk.switchNetwork('SN_MAINNET', 'https://my-custom-rpc.com');
```

## Utility Functions

### Transaction Status

```typescript
// Wait for transaction confirmation
const isConfirmed = await sdk.waitForTransaction('0x123...tx_hash');
console.log('Transaction confirmed:', isConfirmed);

// Check transaction status
const status = await sdk.getTransactionStatus('0x123...tx_hash');
console.log('Status:', status); // 'pending', 'confirmed', or 'failed'

// Estimate gas for transaction
const gasEstimate = await sdk.estimateGas(
  '0x123...contract',
  'method_name', 
  ['param1', 'param2']
);
console.log('Estimated gas:', gasEstimate);
```

### Convenience Methods

```typescript
// Transfer ETH
const result = await sdk.transferETH(
  '0x456...recipient',
  '1000000000000000000' // 1 ETH in wei
);

// Transfer ERC-20 tokens
const tokenResult = await sdk.transferToken(
  '0x123...token_contract',
  '0x456...recipient',
  '100', // amount in token units (not wei)
  18 // token decimals
);

// Approve token spending
const approveResult = await sdk.approveToken(
  '0x123...token_contract',
  '0x456...spender',
  '1000', // amount in token units
  18 // token decimals
);
```

## Configuration Options

```typescript
interface WalletConfig {
  network: 'SN_MAINNET' | 'SN_SEPOLIA' | 'SN_DEVNET';
  appName: string;                    // Your app name for account storage
  appId: string;                      // REQUIRED: Unique app identifier for tracking
  
  // Optional configurations
  rpcUrl?: string;                    // Custom RPC URL
  paymasterApiKey?: string;           // AVNU paymaster API key for gasless transactions
  paymasterBackendUrl?: string;       // Custom paymaster backend URL
  trackingApiUrl?: string;            // Custom tracking API URL (default: https://services.cavos.xyz)
  trackingTimeout?: number;           // Tracking request timeout in ms (default: 5000)
  maxRetries?: number;                // Transaction retry attempts (default: 3)
  batchSize?: number;                // Batch size limit (default: 100)
  enableLogging?: boolean;            // Enable debug logs (default: false)
}
```

## Built-in Analytics & Tracking

The SDK automatically tracks wallet deployments and transactions to `https://services.cavos.xyz` for analytics:

### What's Tracked

✅ **Wallet Deployments**: When new accounts are deployed
- App ID, wallet address, network, public key
- Helps track user acquisition and network usage

✅ **Transaction Executions**: When transactions are executed
- App ID, transaction hash, network
- Helps track user engagement and transaction volume

### Tracking Features

- 🔥 **Fire-and-Forget**: Zero performance impact on your app
- 🚫 **No Blocking**: Tracking failures never affect wallet operations
- 🔒 **Privacy-First**: No private keys or personal data transmitted
- ⚡ **5-Second Timeout**: Fast timeout prevents hanging requests
- 📊 **Automatic**: No additional code required

### Data Transmitted

```typescript
// Wallet deployment tracking
{
  app_id: "your_app_123",
  address: "0x1234...wallet_address",
  network: "mainnet" | "sepolia",
  public_key: "0x5678...public_key" // derived from blockchain data
}

// Transaction tracking  
{
  app_id: "your_app_123",
  transaction_hash: "0x9abc...tx_hash",
  network: "mainnet" | "sepolia"
}
```

## Account Persistence

The SDK automatically handles account persistence:

### How It Works

1. **First Time**: Deploy or connect an account
   ```typescript
   const sdk = new AegisSDK({ appId: 'my_app', appName: 'MyApp', network: 'SN_MAINNET' });
   const privateKey = await sdk.deployAccount(); // Account is saved automatically
   ```

2. **Subsequent Sessions**: Account loads automatically
   ```typescript
   const sdk = new AegisSDK({ appId: 'my_app', appName: 'MyApp', network: 'SN_MAINNET' });
   // SDK automatically connects to your saved account
   console.log('Connected:', sdk.isConnected); // true (if account was saved)
   console.log('Address:', sdk.address); // your wallet address
   ```

### Storage Details

- **Web**: Encrypted localStorage with app-specific keys
- **Mobile**: Device secure storage (Keychain/Keystore)
- **Isolation**: Each app has isolated account storage
- **Security**: Private keys never leave the device unencrypted

## Error Handling

```typescript
import { NetworkError, ValidationError, ExecutionError, DeploymentError } from '@cavos/aegis-sdk';

try {
  await sdk.execute('0x123...', 'transfer', ['0x456...', '1000']);
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
    // Handle connectivity problems
  } else if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
    // Handle validation errors
  } else if (error instanceof ExecutionError) {
    console.error('Transaction failed:', error.message);
    // Handle transaction failures
  } else if (error instanceof DeploymentError) {
    console.error('Deployment failed:', error.message);
    // Handle account deployment issues
  }
}
```

## Best Practices

### 1. Secure Private Key Handling
```typescript
// ✅ Good: Let SDK handle private keys
const privateKey = await sdk.deployAccount();
// Store this securely (SDK does this automatically)

// ❌ Bad: Don't log private keys in production
console.log(privateKey); // Only for development
```

### 2. Error Handling
```typescript
// ✅ Good: Always handle errors
try {
  const result = await sdk.execute(...);
  console.log('Success:', result.transactionHash);
} catch (error) {
  console.error('Transaction failed:', error);
  // Show user-friendly error message
}
```

### 3. Connection Checking
```typescript
// ✅ Good: Check connection before operations
if (!sdk.isConnected) {
  console.log('Please connect or deploy an account first');
  return;
}

const result = await sdk.execute(...);
```

### 4. Batch Operations
```typescript
// ✅ Good: Batch related transactions
const calls = [
  { contractAddress: token, entrypoint: 'approve', calldata: [spender, amount] },
  { contractAddress: dex, entrypoint: 'swap', calldata: [token_in, token_out, amount] }
];
await sdk.executeBatch(calls);

// ❌ Less efficient: Separate transactions
await sdk.execute(token, 'approve', [spender, amount]);
await sdk.execute(dex, 'swap', [token_in, token_out, amount]);
```

## Platform Support

- ✅ **Node.js** 16+ (backend/scripts)
- ✅ **Modern Browsers** (Chrome, Firefox, Safari, Edge)
- ✅ **React** 16.8+ (hooks required)
- ✅ **React Native** 0.70+ 
- ✅ **Expo** SDK 49+
- ✅ **TypeScript** Full type support

## Security

- 🔐 Private keys stored in device secure storage
- 🚫 Keys never transmitted unencrypted
- ✅ Client-side transaction signing
- ✅ Industry-standard cryptographic libraries
- 🔒 App-isolated account storage
- 📊 Privacy-first analytics (no personal data)

## Support & Resources

- 📖 **Documentation**: [Full API Documentation (outdated)](https://docs.cavos.xyz/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/cavos-labs/aegis-sdk/issues)
- 💬 **Discord**: [Community Support](https://discord.gg/Vvq2ekEV47)
- 📧 **Email**: adrianvrj@cavos.xyz

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Ready to get started?** Initialize the SDK with your `appId` and start building! 🚀