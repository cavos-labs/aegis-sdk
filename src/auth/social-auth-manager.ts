import {
  SocialWalletData,
  NetworkType,
  AuthenticationError,
  TokenExpiredError,
  SocialLoginError,
  PasswordResetResponse,
  AccountDeleteResponse
} from '../types';
import { SecureStorage } from '../storage/secure-storage';

export class SocialAuthManager {
  private appId: string;
  private storage: SecureStorage;
  public readonly baseUrl: string; // Make it public so TransactionManager can access it
  private network: NetworkType;
  private enableLogging: boolean;
  private currentWallet: SocialWalletData | null = null;

  constructor(
    appId: string,
    baseUrl: string,
    network: NetworkType,
    enableLogging: boolean = false
  ) {
    this.appId = appId;
    this.network = network;
    this.enableLogging = enableLogging;
    this.baseUrl = baseUrl;
    this.storage = new SecureStorage();

    if (this.enableLogging) {
      console.log('[SocialAuthManager] Initialized with config:', {
        appId: this.appId,
        baseUrl: this.baseUrl,
        network
      });
    }
  }

  // ===============================
  // TOKEN STORAGE METHODS
  // ===============================

  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      const key = `social_tokens_${this.appId}_${this.network}`;
      const tokenData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        stored_at: Date.now()
      };

      await this.storage.setItem(key, JSON.stringify(tokenData));

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Tokens stored successfully');
      }
    } catch (error) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Failed to store tokens:', error);
      }
      throw new SocialLoginError('Failed to store authentication tokens');
    }
  }

  private async getStoredTokens(): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
      const key = `social_tokens_${this.appId}_${this.network}`;
      const stored = await this.storage.getItem(key);

      if (!stored) {
        return null;
      }

      const tokenData = JSON.parse(stored);
      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      };
    } catch (error) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Failed to retrieve tokens:', error);
      }
      return null;
    }
  }

  private async clearStoredTokens(): Promise<void> {
    try {
      const key = `social_tokens_${this.appId}_${this.network}`;
      await this.storage.removeItem(key);

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Tokens cleared successfully');
      }
    } catch (error) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Failed to clear tokens:', error);
      }
    }
  }

  private async storeWalletData(walletData: SocialWalletData): Promise<void> {
    try {
      const key = `social_wallet_${this.appId}_${this.network}`;
      await this.storage.setItem(key, JSON.stringify(walletData));
      this.currentWallet = walletData;

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Wallet data stored successfully');
      }
    } catch (error) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Failed to store wallet data:', error);
      }
      throw new SocialLoginError('Failed to store wallet data');
    }
  }

  private async getStoredWalletData(): Promise<SocialWalletData | null> {
    try {
      const key = `social_wallet_${this.appId}_${this.network}`;
      const stored = await this.storage.getItem(key);

      if (!stored) {
        return null;
      }

      const walletData = JSON.parse(stored) as SocialWalletData;
      this.currentWallet = walletData;
      return walletData;
    } catch (error) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Failed to retrieve wallet data:', error);
      }
      return null;
    }
  }

  private async clearWalletData(): Promise<void> {
    try {
      const key = `social_wallet_${this.appId}_${this.network}`;
      await this.storage.removeItem(key);
      this.currentWallet = null;

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Wallet data cleared successfully');
      }
    } catch (error) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Failed to clear wallet data:', error);
      }
    }
  }

  // ===============================
  // TOKEN VALIDATION METHODS
  // ===============================

  private async isTokenExpired(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/external/auth/token/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
      });

      if (!response.ok) {
        return true;
      }

      const data = await response.json();
      return data.expired || data.used || !data.valid;
    } catch (error) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Token validation failed:', error);
      }
      return true;
    }
  }

  async getValidAccessToken(): Promise<string> {
    const tokens = await this.getStoredTokens();

    if (!tokens) {
      throw new AuthenticationError('No authentication tokens found. Please sign in.');
    }

    // Check if token is expired
    const isExpired = await this.isTokenExpired(tokens.access_token);

    if (!isExpired) {
      return tokens.access_token;
    }

    // Token is expired, try to refresh
    if (this.enableLogging) {
      console.log('[SocialAuthManager] Access token expired, attempting refresh');
    }

    try {
      await this.refreshToken();
      const refreshedTokens = await this.getStoredTokens();

      if (!refreshedTokens) {
        throw new TokenExpiredError('Failed to refresh tokens');
      }

      return refreshedTokens.access_token;
    } catch (error) {
      // Refresh failed, clear tokens and require re-authentication
      await this.clearStoredTokens();
      await this.clearWalletData();
      throw new AuthenticationError('Authentication expired. Please sign in again.');
    }
  }

  // ===============================
  // AUTHENTICATION METHODS
  // ===============================

  async signUp(email: string, password: string): Promise<SocialWalletData> {
    try {
      if (this.enableLogging) {
        console.log('[SocialAuthManager] Attempting sign up for:', email);
      }

      const response = await fetch(`${this.baseUrl}/api/v1/external/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.appId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          network: this.network.toLowerCase().replace('sn_', '')
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthenticationError(`Sign up failed: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const walletData = await response.json();

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Sign up response:', JSON.stringify(walletData, null, 2));
      }

      // Validate response structure (actual response has data wrapper)
      if (!walletData.success || !walletData.data) {
        throw new AuthenticationError(`Sign up failed: Invalid response structure. Missing success or data. Response: ${JSON.stringify(walletData)}`);
      }

      const responseData = walletData.data;

      if (!responseData.authData || !responseData.authData.accessToken || !responseData.authData.refreshToken) {
        throw new AuthenticationError(`Sign up failed: Invalid response structure. Missing authData or tokens. Response: ${JSON.stringify(walletData)}`);
      }

      if (!responseData.wallet || !responseData.wallet.address) {
        throw new AuthenticationError(`Sign up failed: Invalid response structure. Missing wallet data. Response: ${JSON.stringify(walletData)}`);
      }

      // Transform to expected format
      const typedWalletData: SocialWalletData = {
        user_id: responseData.user_id,
        email: responseData.email,
        organization: responseData.organization,
        wallet: {
          address: responseData.wallet.address,
          network: responseData.wallet.network
        },
        authData: {
          access_token: responseData.authData.accessToken,
          refresh_token: responseData.authData.refreshToken,
          expires_in: responseData.authData.expiresIn || 300
        },
        walletStatus: responseData.walletStatus
      };

      // Store tokens and wallet data
      await this.storeTokens(typedWalletData.authData.access_token, typedWalletData.authData.refresh_token);
      await this.storeWalletData(typedWalletData);

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Sign up successful for:', email);
      }

      return walletData;
    } catch (error: any) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Sign up failed:', error);
      }

      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError(`Sign up failed: ${error.message}`);
    }
  }

  async signIn(email: string, password: string): Promise<SocialWalletData> {
    try {
      if (this.enableLogging) {
        console.log('[SocialAuthManager] Attempting sign in for:', email);
      }

      const response = await fetch(`${this.baseUrl}/api/v1/external/auth/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.appId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          network: this.network.toLowerCase().replace('sn_', '')
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthenticationError(`Sign in failed: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const walletData = await response.json();

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Sign in response:', JSON.stringify(walletData, null, 2));
      }

      // Validate response structure (actual response has data wrapper)
      if (!walletData.success || !walletData.data) {
        throw new AuthenticationError(`Sign in failed: Invalid response structure. Missing success or data. Response: ${JSON.stringify(walletData)}`);
      }

      const responseData = walletData.data;

      if (!responseData.authData || !responseData.authData.accessToken || !responseData.authData.refreshToken) {
        throw new AuthenticationError(`Sign in failed: Invalid response structure. Missing authData or tokens. Response: ${JSON.stringify(walletData)}`);
      }

      if (!responseData.wallet || !responseData.wallet.address) {
        throw new AuthenticationError(`Sign in failed: Invalid response structure. Missing wallet data. Response: ${JSON.stringify(walletData)}`);
      }

      // Transform to expected format
      const typedWalletData: SocialWalletData = {
        user_id: responseData.user_id,
        email: responseData.email,
        organization: responseData.organization,
        wallet: {
          address: responseData.wallet.address,
          network: responseData.wallet.network
        },
        authData: {
          access_token: responseData.authData.accessToken,
          refresh_token: responseData.authData.refreshToken,
          expires_in: responseData.authData.expiresIn || 300
        },
        walletStatus: responseData.walletStatus
      };

      // Store tokens and wallet data
      await this.storeTokens(typedWalletData.authData.access_token, typedWalletData.authData.refresh_token);
      await this.storeWalletData(typedWalletData);

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Sign in successful for:', email);
      }

      return typedWalletData;
    } catch (error: any) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Sign in failed:', error);
      }

      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError(`Sign in failed: ${error.message}`);
    }
  }

  async refreshToken(): Promise<void> {
    const tokens = await this.getStoredTokens();

    if (!tokens) {
      throw new AuthenticationError('No refresh token available');
    }

    try {
      if (this.enableLogging) {
        console.log('[SocialAuthManager] Refreshing access token');
      }

      const response = await fetch(`${this.baseUrl}/api/v1/external/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: tokens.refresh_token,
          app_id: this.appId,
          network: this.network.toLowerCase().replace('sn_', '')
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new TokenExpiredError(`Token refresh failed: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      // Store new tokens
      await this.storeTokens(data.access_token, data.refresh_token);

      // Update wallet data with new tokens if we have it
      if (this.currentWallet) {
        this.currentWallet.authData.access_token = data.access_token;
        this.currentWallet.authData.refresh_token = data.refresh_token;
        await this.storeWalletData(this.currentWallet);
      }

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Token refresh successful');
      }
    } catch (error: any) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Token refresh failed:', error);
      }

      if (error instanceof TokenExpiredError) {
        throw error;
      }

      throw new TokenExpiredError(`Token refresh failed: ${error.message}`);
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.enableLogging) {
        console.log('[SocialAuthManager] Signing out');
      }

      // Clear stored data
      await this.clearStoredTokens();
      await this.clearWalletData();

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Sign out completed');
      }
    } catch (error) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Sign out failed:', error);
      }
      // Don't throw on sign out failures, just log them
    }
  }

  // ===============================
  // ACCOUNT MANAGEMENT METHODS
  // ===============================

  /**
   * Trigger password reset email for a user
   * @param email User's email address
   * @returns Promise with generic success message
   * @throws SocialLoginError if request fails
   */
  async passwordReset(email: string): Promise<PasswordResetResponse> {
    try {
      if (this.enableLogging) {
        console.log('[SocialAuthManager] Triggering password reset for:', email);
      }

      const response = await fetch(`${this.baseUrl}/api/v1/external/auth/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          app_id: this.appId,
          network: this.getNetworkString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SocialLoginError(
          `Password reset failed: ${response.status} ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Password reset email sent successfully');
      }

      return {
        message: data.data?.message || data.message,
        timestamp: data.data?.timestamp || Date.now()
      };
    } catch (error: any) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Password reset failed:', error);
      }

      if (error instanceof SocialLoginError) {
        throw error;
      }

      throw new SocialLoginError(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Delete user account from Auth0 and remove wallet data
   * Requires valid authentication - will auto-refresh expired tokens
   * @returns Promise with deletion details
   * @throws AuthenticationError if not authenticated
   * @throws SocialLoginError if request fails
   */
  async deleteAccount(): Promise<AccountDeleteResponse> {
    try {
      if (this.enableLogging) {
        console.log('[SocialAuthManager] Attempting account deletion');
      }

      // Get valid access token (will auto-refresh if expired)
      const accessToken = await this.getValidAccessToken();

      const response = await fetch(`${this.baseUrl}/api/v1/external/auth/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: this.appId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SocialLoginError(
          `Account deletion failed: ${response.status} ${JSON.stringify(errorData)}`
        );
      }

      const responseData = await response.json();

      // Clear local storage after successful deletion
      await this.clearStoredTokens();
      await this.clearWalletData();

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Account deleted successfully');
      }

      return {
        user_id: responseData.data.user_id,
        email: responseData.data.email,
        org_id: responseData.data.org_id,
        deletedWalletsCount: responseData.data.deletedWalletsCount,
        timestamp: responseData.data.timestamp,
        alreadyDeletedFromAuth0: responseData.data.alreadyDeletedFromAuth0
      };
    } catch (error: any) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Account deletion failed:', error);
      }

      if (error instanceof AuthenticationError || error instanceof SocialLoginError) {
        throw error;
      }

      throw new SocialLoginError(`Account deletion failed: ${error.message}`);
    }
  }

  /**
   * Recover existing session using stored access token
   * @returns Promise with recovered wallet data
   * @throws AuthenticationError if no stored session found
   * @throws SocialLoginError if request fails
   */
  async recoverSession(): Promise<SocialWalletData> {
    try {
      if (this.enableLogging) {
        console.log('[SocialAuthManager] Attempting session recovery');
      }

      // Get stored tokens
      const tokens = await this.getStoredTokens();

      if (!tokens) {
        throw new AuthenticationError('No stored session found. Please sign in.');
      }

      const response = await fetch(`${this.baseUrl}/api/v1/external/auth/session/recover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: this.appId
        }),
      });

      if (!response.ok) {
        // Session recovery failed, clear stored data
        await this.clearStoredTokens();
        await this.clearWalletData();

        const errorData = await response.json().catch(() => ({}));
        throw new AuthenticationError(
          `Session recovery failed: ${response.status}. Please sign in again.`
        );
      }

      const responseData = await response.json();

      // Validate response structure
      if (!responseData.success || !responseData.data) {
        throw new AuthenticationError('Invalid session recovery response');
      }

      const data = responseData.data;

      // Transform to SocialWalletData format
      const walletData: SocialWalletData = {
        user_id: data.user_id,
        email: data.email,
        organization: data.organization,
        wallet: data.wallet,
        authData: {
          access_token: data.authData?.accessToken || tokens.access_token,
          refresh_token: data.authData?.refreshToken || tokens.refresh_token,
          expires_in: data.authData?.expiresIn || 300
        },
        walletStatus: data.walletStatus
      };

      // Store updated tokens if provided
      if (data.authData) {
        await this.storeTokens(
          walletData.authData.access_token,
          walletData.authData.refresh_token
        );
      }

      // Store wallet data
      await this.storeWalletData(walletData);

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Session recovered successfully for:', data.email);
      }

      return walletData;
    } catch (error: any) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Session recovery failed:', error);
      }

      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new SocialLoginError(`Session recovery failed: ${error.message}`);
    }
  }

  // ===============================
  // WALLET DATA METHODS
  // ===============================

  getCurrentWallet(): SocialWalletData | null {
    return this.currentWallet;
  }

  async loadStoredWallet(): Promise<SocialWalletData | null> {
    return await this.getStoredWalletData();
  }

  isAuthenticated(): boolean {
    return this.currentWallet !== null;
  }

  getCurrentAddress(): string | null {
    return this.currentWallet?.wallet.address || null;
  }

  getCurrentEmail(): string | null {
    return this.currentWallet?.email || null;
  }

  // ===============================
  // OAUTH URL GENERATION
  // ===============================

  /**
   * Get Apple OAuth URL for manual browser opening
   * @param redirectUri The redirect URI for your app
   * @returns OAuth URL to open in browser
   */
  async getAppleOAuthUrl(redirectUri: string): Promise<string> {
    try {
      if (this.enableLogging) {
        console.log('[SocialAuthManager] Generating Apple OAuth URL');
      }

      const networkString = this.getNetworkString();

      const response = await fetch(`${this.baseUrl}/api/v1/external/auth/apple?network=${networkString}&final_redirect_uri=${encodeURIComponent(redirectUri)}&app_id=${this.appId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.appId}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthenticationError(`Apple OAuth URL generation failed: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      if (!data.url) {
        throw new AuthenticationError('Invalid Apple OAuth response: missing URL');
      }

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Apple OAuth URL generated successfully');
      }

      return data.url;
    } catch (error: any) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Apple OAuth URL generation failed:', error);
      }
      throw new AuthenticationError(`Apple OAuth URL generation failed: ${error.message}`);
    }
  }

  /**
   * Get Google OAuth URL for manual browser opening
   * @param redirectUri The redirect URI for your app
   * @returns OAuth URL to open in browser
   */
  async getGoogleOAuthUrl(redirectUri: string): Promise<string> {
    try {
      if (this.enableLogging) {
        console.log('[SocialAuthManager] Generating Google OAuth URL');
      }

      const networkString = this.getNetworkString();

      const response = await fetch(`${this.baseUrl}/api/v1/external/auth/google?network=${networkString}&final_redirect_uri=${encodeURIComponent(redirectUri)}&app_id=${this.appId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.appId}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuthenticationError(`Google OAuth URL generation failed: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      if (!data.url) {
        throw new AuthenticationError('Invalid Google OAuth response: missing URL');
      }

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Google OAuth URL generated successfully');
      }

      return data.url;
    } catch (error: any) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] Google OAuth URL generation failed:', error);
      }
      throw new AuthenticationError(`Google OAuth URL generation failed: ${error.message}`);
    }
  }

  /**
   * Parse OAuth callback data from WebBrowser result or URL
   * @param callbackData Either a URL string or WebBrowser result object
   * @returns Parsed and validated social wallet data
   */
  async parseOAuthCallback(callbackData: string | any): Promise<SocialWalletData> {
    try {
      if (this.enableLogging) {
        console.log('[SocialAuthManager] Parsing OAuth callback data');
      }

      let callbackUrl: string;

      // Handle different input types
      if (typeof callbackData === 'string') {
        callbackUrl = callbackData;
      } else if (callbackData && callbackData.url) {
        // WebBrowser.openAuthSessionAsync result format: { type: 'success', url: '...' }
        callbackUrl = callbackData.url;
      } else {
        throw new AuthenticationError('Invalid callback data format');
      }

      // Parse the URL to extract user_data parameter
      const url = new URL(callbackUrl);
      const userDataParam = url.searchParams.get('user_data');

      if (!userDataParam) {
        throw new AuthenticationError('No user_data found in callback URL');
      }

      // The user_data is URL encoded JSON
      const userDataJson = decodeURIComponent(userDataParam);
      const userData = JSON.parse(userDataJson);

      if (this.enableLogging) {
        console.log('[SocialAuthManager] Parsed user data:', userData);
      }

      // Validate required fields
      if (!userData.user_id || !userData.email || !userData.wallet?.address || !userData.authData?.accessToken) {
        throw new AuthenticationError('Invalid OAuth callback: missing required user data');
      }

      // Transform to expected SocialWalletData format
      const walletData: SocialWalletData = {
        user_id: userData.user_id,
        email: userData.email,
        organization: {
          org_id: userData.org_id?.toString() || '0',
          org_name: 'OAuth Organization'
        },
        wallet: {
          address: userData.wallet.address,
          network: userData.wallet.network || this.getNetworkString()
        },
        authData: {
          access_token: userData.authData.accessToken,
          refresh_token: userData.authData.refreshToken || '',
          expires_in: userData.authData.expiresIn || 300
        }
      };

      // Store tokens and wallet data
      await this.storeTokens(walletData.authData.access_token, walletData.authData.refresh_token);
      await this.storeWalletData(walletData);

      if (this.enableLogging) {
        console.log('[SocialAuthManager] OAuth callback parsed successfully for:', userData.email);
      }

      return walletData;
    } catch (error: any) {
      if (this.enableLogging) {
        console.error('[SocialAuthManager] OAuth callback parsing failed:', error);
      }
      throw new AuthenticationError(`OAuth callback parsing failed: ${error.message}`);
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private getNetworkString(): string {
    return this.network.toLowerCase().replace('sn_', '');
  }
}