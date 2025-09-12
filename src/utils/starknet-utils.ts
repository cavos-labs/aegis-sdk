/**
 * Utility functions for handling Starknet-specific data types
 */

/**
 * Parse a Uint256 value returned from Starknet contract calls
 * @param value The value returned from a contract call (can be array, string, or single value)
 * @returns BigInt representation of the Uint256 value
 */
export function parseUint256(value: any): bigint {
  if (Array.isArray(value)) {
    if (value.length >= 2) {
      // Uint256 is returned as [low, high]
      const low = BigInt(value[0] || '0x0');
      const high = BigInt(value[1] || '0x0');
      return low + (high << 128n);
    } else if (value.length === 1) {
      // Single value in array
      return BigInt(value[0] || '0x0');
    } else {
      // Empty array
      return 0n;
    }
  } else if (typeof value === 'string' && value.includes(',')) {
    // Handle comma-separated format "0x0,0x0"
    const parts = value.split(',');
    const low = BigInt(parts[0] || '0x0');
    const high = BigInt(parts[1] || '0x0');
    return low + (high << 128n);
  } else {
    // Single value (fallback)
    try {
      return BigInt(value?.toString() || '0x0');
    } catch {
      return 0n;
    }
  }
}

/**
 * Convert a BigInt balance to token units with specified decimals
 * @param balance The balance in contract units (wei)
 * @param decimals The token decimals
 * @returns String representation of the balance in token units
 */
export function formatTokenBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const tokenBalance = balance / divisor;
  return tokenBalance.toString();
}

/**
 * Convert token units to contract units (wei) with specified decimals
 * @param amount The amount in token units
 * @param decimals The token decimals
 * @returns BigInt representation of the amount in contract units
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const amountBigInt = BigInt(amount);
  const multiplier = BigInt(10 ** decimals);
  return amountBigInt * multiplier;
}

/**
 * Format a balance for display with proper decimal places
 * @param balance The balance in token units
 * @param decimals The number of decimal places to show
 * @returns Formatted string with decimal places
 */
export function formatDisplayBalance(balance: string, decimals: number = 4): string {
  const num = parseFloat(balance);
  if (num === 0) return '0';
  
  // For very small numbers, use exponential notation
  if (num < 0.0001) {
    return num.toExponential(2);
  }
  
  // For normal numbers, use fixed decimal places
  return num.toFixed(decimals);
}

/**
 * Check if a balance is effectively zero (accounting for rounding errors)
 * @param balance The balance to check
 * @param threshold The minimum threshold to consider non-zero
 * @returns True if balance is effectively zero
 */
export function isZeroBalance(balance: string, threshold: number = 1e-10): boolean {
  const num = parseFloat(balance);
  return Math.abs(num) < threshold;
}