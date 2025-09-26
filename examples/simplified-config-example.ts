/**
 * Example: Simplified Social Login Configuration
 *
 * This example shows the simplified configuration where we reuse the existing
 * appId and trackingApiUrl from WalletConfig instead of having a separate socialLogin config.
 */

import { AegisSDK, SocialWalletData } from '../src';

// Social Login Mode - Simplified Configuration
const socialSDK = new AegisSDK({
  appId: 'cavos-app-id-from-dashboard', // Your Cavos app_id - used for both tracking and authentication
  appName: 'My DApp',
  network: 'SN_SEPOLIA',
  enableLogging: true,

  // Enable social login mode
  walletMode: 'social-login',

  // Optional: Custom base URL (defaults to 'https://services.cavos.xyz')
  // Used for both tracking and social login authentication
  trackingApiUrl: 'https://services.cavos.xyz'
});

// In-App Wallet Mode - Same as before
const inAppSDK = new AegisSDK({
  appId: 'any-app-id-for-tracking', // Can be different from Cavos app_id
  appName: 'My DApp',
  network: 'SN_SEPOLIA',
  enableLogging: true,
  paymasterApiKey: 'your-avnu-api-key',

  // walletMode defaults to 'in-app'
});

async function demonstrateSimplifiedConfig() {
  console.log('=== Simplified Social Login Configuration ===');

  try {
    // Sign up with social login - no complex configuration needed!
    const walletData: SocialWalletData = await socialSDK.signUp(
      'user@example.com',
      'securePassword123'
    );

    console.log('✅ Social login configured successfully!');
    console.log('Wallet Address:', walletData.wallet.address);
    console.log('Organization:', walletData.organization.org_name);

    // Same transaction API for both wallet modes
    console.log('✅ Transaction API is identical across modes');

    // Social login mode
    await socialSDK.execute('0x123...', 'transfer', ['0x456...', '1000']);

    // In-app mode
    const privateKey = await inAppSDK.deployAccount();
    await inAppSDK.execute('0x123...', 'transfer', ['0x456...', '1000']);

    console.log('✅ Both modes use the same execute() method!');

  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Key benefits of simplified configuration:
console.log(`
🎯 Key Benefits of Simplified Configuration:

1. ✅ Reuses existing appId from WalletConfig
2. ✅ Reuses existing trackingApiUrl for base URL
3. ✅ No separate socialLogin configuration object needed
4. ✅ Simpler migration - just add walletMode: 'social-login'
5. ✅ Same tracking system for both wallet modes
6. ✅ Consistent configuration pattern

Before (complex):
{
  appId: 'tracking-id',
  walletMode: 'social-login',
  socialLogin: {
    appId: 'cavos-app-id',
    baseUrl: 'https://services.cavos.xyz'
  }
}

After (simplified):
{
  appId: 'cavos-app-id',
  walletMode: 'social-login',
  trackingApiUrl: 'https://services.cavos.xyz' // optional
}
`);

// Uncomment to run the demonstration
// demonstrateSimplifiedConfig().catch(console.error);