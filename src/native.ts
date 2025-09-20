// React Native-specific exports
export * from './index';

// React Native-specific utilities or overrides can be added here
// For now, we export everything from the main index

/**
 * IMPORTANT: KEY STORAGE NOTICE
 *
 * This SDK does NOT handle private key storage for you. You are responsible for:
 * 1. Securely storing private keys using your preferred storage solution
 * 2. Implementing your own key management (save/load/delete)
 * 3. Using secure storage libraries like:
 *    - expo-secure-store (for Expo projects)
 *    - @react-native-keychain/react-native-keychain
 *    - @react-native-async-storage/async-storage (with encryption)
 *
 * Usage:
 * 1. Generate a private key: const privateKey = aegis.generateAccount()
 * 2. Store it securely in your app
 * 3. Connect when needed: await aegis.connectAccount(privateKey)
 * 4. Deploy the account: await aegis.deployAccount(privateKey)
 */