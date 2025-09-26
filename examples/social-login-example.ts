/**
 * Example: Using Aegis SDK with Social Login Wallets
 *
 * This example demonstrates how to use the social login wallet mode
 * with cavos-wallet-provider integration.
 */

import { AegisSDK, SocialWalletData } from '../src';

// Example 1: Initialize SDK in social login mode
const socialSDK = new AegisSDK({
  appId: 'your-cavos-app-id-from-dashboard', // Cavos app_id for both tracking and authentication
  appName: 'My DApp',
  network: 'SN_SEPOLIA',
  enableLogging: true,

  // Enable social login mode
  walletMode: 'social-login',
  // trackingApiUrl: 'https://services.cavos.xyz' // Optional, defaults to this - used for both tracking and social login
});

// Example 2: Initialize SDK in in-app wallet mode (default)
const inAppSDK = new AegisSDK({
  appId: 'my-app-tracking-id',
  appName: 'My DApp',
  network: 'SN_SEPOLIA',
  enableLogging: true,
  paymasterApiKey: 'your-avnu-api-key', // For gasless transactions

  // walletMode defaults to 'in-app', no social login config needed
});

async function socialLoginExample() {
  try {
    console.log('=== Social Login Wallet Example ===');

    // Sign up a new user
    const walletData: SocialWalletData = await socialSDK.signUp(
      'user@example.com',
      'securePassword123'
    );

    console.log('User signed up successfully!');
    console.log('Wallet Address:', walletData.wallet.address);
    console.log('User Email:', walletData.email);
    console.log('Organization:', walletData.organization.org_name);

    // Check if authenticated
    console.log('Is authenticated:', socialSDK.isSocialAuthenticated());
    console.log('Is connected:', socialSDK.isConnected);
    console.log('Current address:', socialSDK.address);

    // Execute a transaction (same API as in-app wallets!)
    const contractAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'; // ETH
    const result = await socialSDK.execute(
      contractAddress,
      'transfer',
      ['0x123...', '1000000000000000000'] // Transfer 1 ETH
    );

    console.log('Transaction executed:', result.transactionHash);

    // Sign out
    await socialSDK.signOut();
    console.log('Signed out successfully');

  } catch (error) {
    console.error('Social login example failed:', error);
  }
}

async function inAppWalletExample() {
  try {
    console.log('=== In-App Wallet Example ===');

    // Deploy a new account (user manages the private key)
    const privateKey = await inAppSDK.deployAccount();
    console.log('Account deployed! Store this private key securely:', privateKey);

    // Or connect with existing private key
    // await inAppSDK.connectAccount('your-existing-private-key');

    console.log('Is connected:', inAppSDK.isConnected);
    console.log('Current address:', inAppSDK.address);

    // Execute a transaction (same API as social login!)
    const contractAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'; // ETH
    const result = await inAppSDK.execute(
      contractAddress,
      'transfer',
      ['0x123...', '1000000000000000000'] // Transfer 1 ETH
    );

    console.log('Transaction executed:', result.transactionHash);

    // Disconnect
    inAppSDK.disconnect();
    console.log('Disconnected successfully');

  } catch (error) {
    console.error('In-app wallet example failed:', error);
  }
}

async function signInExample() {
  try {
    console.log('=== Social Login Sign In Example ===');

    // Sign in with existing user
    const walletData = await socialSDK.signIn(
      'user@example.com',
      'securePassword123'
    );

    console.log('User signed in successfully!');
    console.log('Wallet Address:', walletData.wallet.address);

    // Get social wallet data
    const currentWallet = socialSDK.getSocialWallet();
    console.log('Current social wallet:', currentWallet?.wallet.address);

  } catch (error) {
    console.error('Sign in example failed:', error);
  }
}

// Error handling examples
async function errorHandlingExample() {
  try {
    // This will throw an error because in-app methods don't work in social login mode
    await socialSDK.deployAccount();
  } catch (error) {
    console.log('Expected error:', error.message);
    // "deployAccount() is not available in social login mode. Use signUp() or signIn() instead."
  }

  try {
    // This will throw an error because social methods don't work in in-app mode
    await inAppSDK.signIn('user@example.com', 'password');
  } catch (error) {
    console.log('Expected error:', error.message);
    // "signIn() is only available in social login mode. Use connectAccount() for in-app wallets."
  }
}

// Run examples
async function runExamples() {
  await socialLoginExample();
  await inAppWalletExample();
  await signInExample();
  await errorHandlingExample();
}

// Uncomment to run examples
// runExamples().catch(console.error);