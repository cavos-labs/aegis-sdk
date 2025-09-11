/**
 * Backend client for communicating with Aegis services
 */

import type { AegisConfig, InternalAegisConfig } from '../types/config';
import { AegisError, AegisErrorCode, AegisErrorType } from '../types/errors';
import { validateInternalConfig, expandConfigWithDefaults } from './validation';

/**
 * Response from backend app configuration endpoint
 */
interface BackendConfigResponse {
  success: boolean;
  data?: {
    paymasterApiKey: string;
    backendUrl: string;
    analyticsEndpoint: string;
    supportedNetworks: string[];
    appMetadata: {
      name: string;
      version: string;
      features: string[];
    };
    rateLimit?: {
      requestsPerMinute: number;
      burstLimit: number;
    };
    security?: {
      requireHttps: boolean;
      allowedOrigins: string[];
    };
  };
  error?: string;
  message?: string;
}

/**
 * Configuration for backend client
 */
interface BackendClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  userAgent: string;
}

/**
 * Default backend configuration
 */
const DEFAULT_BACKEND_CONFIG: BackendClientConfig = {
  baseUrl: 'https://api.aegis.com',
  timeout: 10000, // 10 seconds
  retries: 3,
  userAgent: '@aegis/sdk/1.0.0',
};

/**
 * Client for communicating with Aegis backend services
 */
export class BackendClient {
  private config: BackendClientConfig;

  constructor(config?: Partial<BackendClientConfig>) {
    this.config = { ...DEFAULT_BACKEND_CONFIG, ...config };
  }

  /**
   * Expand user configuration by fetching backend settings
   */
  async expandConfiguration(userConfig: AegisConfig): Promise<InternalAegisConfig> {
    // Validate and expand user config with defaults
    const configWithDefaults = expandConfigWithDefaults(userConfig);
    
    try {
      // Fetch configuration from backend
      const backendResponse = await this.fetchAppConfiguration(configWithDefaults.appId);
      
      // Create internal configuration
      const internalConfig: InternalAegisConfig = {
        ...configWithDefaults,
        paymasterApiKey: backendResponse?.paymasterApiKey || "",
        backendUrl: backendResponse?.backendUrl || "",
        analyticsEndpoint: backendResponse?.analyticsEndpoint || "",
        supportedNetworks: backendResponse?.supportedNetworks || [],
        appMetadata: backendResponse?.appMetadata || {name: "", version: "", features: []},
      };

      // Validate the complete configuration
      validateInternalConfig(internalConfig);

      return internalConfig;
    } catch (error) {
      if (error instanceof AegisError) {
        throw error;
      }
      
      throw new AegisError(
        AegisErrorType.BACKEND_ERROR,
        AegisErrorCode.BACKEND_UNREACHABLE,
        `Failed to fetch app configuration: ${error instanceof Error ? error : String(error)}`,
        true,
        { appId: configWithDefaults.appId, originalError: error }
      );
    }
  }

  /**
   * Fetch app configuration from backend
   */
  private async fetchAppConfiguration(appId: string): Promise<BackendConfigResponse['data']> {
    const url = `${this.config.baseUrl}/v1/apps/${appId}/config`;
    
    let lastError: Error | null = null;
    
    // Retry logic
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.makeRequest(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': this.config.userAgent,
            'X-SDK-Version': '1.0.0',
          },
        });

        const data = await response.json() as BackendConfigResponse;

        if (!data.success || !data.data) {
          throw new AegisError(
            AegisErrorType.BACKEND_ERROR,
            AegisErrorCode.INVALID_API_RESPONSE,
            data.error || data.message || 'Invalid response from backend',
            false,
            { appId, response: data }
          );
        }

        // TypeScript doesn't know that data.data is defined after the check above
        const backendConfig = data.data;
        if (!backendConfig) {
          throw new AegisError(
            AegisErrorType.BACKEND_ERROR,
            AegisErrorCode.INVALID_API_RESPONSE,
            'Backend response missing required data',
            false,
            { appId, response: data }
          );
        }

        return backendConfig;
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof AegisError) {
          // Don't retry for non-recoverable errors
          if (!error.recoverable) {
            throw error;
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries) {
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }

    // All retries failed
    if (lastError instanceof AegisError) {
      throw lastError;
    }

    throw new AegisError(
      AegisErrorType.BACKEND_ERROR,
      AegisErrorCode.BACKEND_UNREACHABLE,
      `Failed to fetch app configuration after ${this.config.retries} attempts: ${lastError instanceof Error ? lastError : String(lastError)}`,
      true,
      { appId, attempts: this.config.retries, lastError }
    );
  }

  /**
   * Send usage analytics to backend
   */
  async sendAnalytics(
    analyticsEndpoint: string,
    appId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      const payload = {
        appId,
        eventType,
        eventData,
        timestamp: Date.now(),
        sdkVersion: '1.0.0',
      };

      await this.makeRequest(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.config.userAgent,
        },
        body: JSON.stringify(payload),
      });

      // Analytics failures are not critical - just log and continue
    } catch (error) {
      console.warn('Failed to send analytics:', error);
    }
  }

  /**
   * Report error to backend for monitoring
   */
  async reportError(
    backendUrl: string,
    appId: string,
    error: AegisError
  ): Promise<void> {
    try {
      const payload = {
        appId,
        error: error.toJSON(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        timestamp: Date.now(),
        sdkVersion: '1.0.0',
      };

      const url = `${backendUrl}/v1/errors`;

      await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.config.userAgent,
        },
        body: JSON.stringify(payload),
      });
    } catch (reportError) {
      // Error reporting failures are not critical
      console.warn('Failed to report error to backend:', reportError);
    }
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        throw new AegisError(
          AegisErrorType.BACKEND_ERROR,
          this.mapHttpStatusToErrorCode(response.status),
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status >= 500, // Server errors are recoverable
          { 
            status: response.status, 
            statusText: response.statusText,
            url,
            errorData 
          }
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AegisError) {
        throw error;
      }

      // Handle network/timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AegisError(
          AegisErrorType.NETWORK_ERROR,
          AegisErrorCode.NETWORK_TIMEOUT,
          `Request timeout after ${this.config.timeout}ms`,
          true,
          { url, timeout: this.config.timeout }
        );
      }

      throw new AegisError(
        AegisErrorType.NETWORK_ERROR,
        AegisErrorCode.RPC_REQUEST_FAILED,
        `Network request failed: ${error instanceof Error ? error : String(error)}`,
        true,
        { url, originalError: error }
      );
    }
  }

  /**
   * Map HTTP status codes to error codes
   */
  private mapHttpStatusToErrorCode(status: number): AegisErrorCode {
    switch (status) {
      case 400:
      case 422:
        return AegisErrorCode.INVALID_APP_ID;
      case 401:
      case 403:
        return AegisErrorCode.BACKEND_UNREACHABLE;
      case 404:
        return AegisErrorCode.INVALID_APP_ID;
      case 429:
        return AegisErrorCode.BACKEND_UNREACHABLE;
      case 500:
      case 502:
      case 503:
      case 504:
        return AegisErrorCode.BACKEND_UNREACHABLE;
      default:
        return AegisErrorCode.BACKEND_UNREACHABLE;
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update backend client configuration
   */
  updateConfig(config: Partial<BackendClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if backend is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'User-Agent': this.config.userAgent,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}