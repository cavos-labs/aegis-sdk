export class SecureStorage {
  constructor() {
    // Key storage is handled by your application. Use connectAccount(privateKey) to connect with an existing key.
  }

  // Placeholder methods for backward compatibility
  async storePrivateKey(): Promise<void> {
    throw new Error('Key storage not implemented. Please handle key storage in your application and use connectAccount(privateKey).');
  }

  async getPrivateKey(): Promise<string | null> {
    throw new Error('Key storage not implemented. Please handle key storage in your application and use connectAccount(privateKey).');
  }

  async removePrivateKey(): Promise<void> {
    throw new Error('Key storage not implemented. Please handle key storage in your application and use connectAccount(privateKey).');
  }

  getStorageType(): 'none' {
    return 'none';
  }
}