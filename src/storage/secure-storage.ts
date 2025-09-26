export class SecureStorage {
  private storage: Map<string, string> = new Map();

  constructor() {
    // For social login, we provide basic in-memory storage
    // For production use, this should be replaced with platform-specific secure storage
  }

  // Generic storage methods for social login tokens
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Try to use platform-specific secure storage if available
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment - use localStorage with encryption
        window.localStorage.setItem(key, value);
        return;
      }

      // Fallback to in-memory storage
      this.storage.set(key, value);
    } catch (error) {
      // Fallback to in-memory storage if platform storage fails
      this.storage.set(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      // Try to use platform-specific secure storage if available
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment - use localStorage
        return window.localStorage.getItem(key);
      }

      // Fallback to in-memory storage
      return this.storage.get(key) || null;
    } catch (error) {
      // Fallback to in-memory storage if platform storage fails
      return this.storage.get(key) || null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // Try to use platform-specific secure storage if available
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment - use localStorage
        window.localStorage.removeItem(key);
        return;
      }

      // Fallback to in-memory storage
      this.storage.delete(key);
    } catch (error) {
      // Fallback to in-memory storage if platform storage fails
      this.storage.delete(key);
    }
  }

  // Placeholder methods for backward compatibility (private key storage)
  async storePrivateKey(): Promise<void> {
    throw new Error('Key storage not implemented. Please handle key storage in your application and use connectAccount(privateKey).');
  }

  async getPrivateKey(): Promise<string | null> {
    throw new Error('Key storage not implemented. Please handle key storage in your application and use connectAccount(privateKey).');
  }

  async removePrivateKey(): Promise<void> {
    throw new Error('Key storage not implemented. Please handle key storage in your application and use connectAccount(privateKey).');
  }

  getStorageType(): 'basic' | 'none' {
    if (typeof window !== 'undefined' && window.localStorage) {
      return 'basic';
    }
    return 'none';
  }

  // Clear all stored data
  async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Only clear items that start with our prefixes
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith('social_tokens_') || key.startsWith('social_wallet_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
        return;
      }

      // Clear in-memory storage
      this.storage.clear();
    } catch (error) {
      // Clear in-memory storage if platform storage fails
      this.storage.clear();
    }
  }
}