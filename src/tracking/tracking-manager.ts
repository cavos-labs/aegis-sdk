import {
  TrackingConfig,
  WalletTrackingData,
  TransactionTrackingData
} from '../types';

export class TrackingManager {
  private config: TrackingConfig;

  constructor(config: TrackingConfig) {
    this.config = { ...config };
    this.validateConfiguration();
  }

  /**
   * Check if tracking is currently enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.config.appId;
  }

  /**
   * Update tracking configuration at runtime
   */
  updateConfig(newConfig: Partial<TrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfiguration();
  }

  /**
   * Track wallet deployment with fire-and-forget pattern
   */
  trackWalletDeployment(data: WalletTrackingData): void {
    if (!this.isEnabled()) return;

    this.makeTrackingCall(this.config.endpoints.wallet, data);
  }

  /**
   * Track transaction execution with fire-and-forget pattern
   */
  trackTransaction(data: TransactionTrackingData): void {
    if (!this.isEnabled()) return;

    this.makeTrackingCall(this.config.endpoints.transaction, data);
  }

  /**
   * Make fire-and-forget HTTP call to tracking endpoint
   * @private
   */
  private makeTrackingCall(endpoint: string, payload: any): void {
    // Fire-and-forget implementation using setTimeout for true async execution
    setTimeout(async () => {
      try {
        // Create AbortController for timeout (React Native compatible)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          this.handleTrackingError(
            new Error(`Tracking API error: ${response.status} - ${response.statusText}`),
            endpoint
          );
        }
      } catch (error) {
        this.handleTrackingError(error as Error, endpoint);
      }
    }, 0); // Immediate async execution
  }

  /**
   * Handle tracking errors gracefully without throwing
   * @private
   */
  private handleTrackingError(error: Error, context: string): void {
    // Debug-level logging only - never throw or impact main functionality
    if (console.debug) {
      console.debug(`[Aegis Tracking] ${context} failed:`, error.message);
    }
  }

  /**
   * Validate tracking configuration
   * @private
   */
  private validateConfiguration(): void {
    if (!this.config.appId) {
      this.config.enabled = false;
      return;
    }

    // Validate app_id format
    if (!this.validateAppId(this.config.appId)) {
      if (console.warn) {
        console.warn('[Aegis Tracking] Invalid app_id format, disabling tracking');
      }
      this.config.enabled = false;
      return;
    }

    // Validate base URL
    try {
      new URL(this.config.baseUrl);
    } catch {
      if (console.warn) {
        console.warn('[Aegis Tracking] Invalid tracking API URL, disabling tracking');
      }
      this.config.enabled = false;
    }
  }

  /**
   * Validate app_id format
   * @private
   */
  private validateAppId(appId: string): boolean {
    return typeof appId === 'string' && 
           appId.length > 0 && 
           appId.length <= 100 &&
           /^[a-zA-Z0-9_-]+$/.test(appId);
  }
}