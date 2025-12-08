/**
 * Weighted Random Selection Utility
 *
 * Selects a random item from an array based on weighted probabilities.
 * Used for A/B testing link variants with different traffic distribution weights.
 *
 * @example
 * const variants = [
 *   { id: '1', targetUrl: 'https://example.com/a', weight: 30 },
 *   { id: '2', targetUrl: 'https://example.com/b', weight: 70 }
 * ];
 * const selected = selectWeightedRandom(variants);
 * // Returns variant 2 approximately 70% of the time
 */

export interface WeightedItem {
  weight: number;
}

/**
 * Selects a random item from an array based on weighted distribution
 *
 * @param items - Array of items with weight property
 * @returns The selected item, or null if array is empty
 *
 * Algorithm:
 * 1. Calculate total weight of all items
 * 2. Generate random number between 0 and total weight
 * 3. Iterate through items, subtracting their weight from the random number
 * 4. Return the item where the random number becomes <= 0
 */
export function selectWeightedRandom<T extends WeightedItem>(items: T[]): T | null {
  // Handle edge cases
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];

  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  // If total weight is 0, return first item as fallback
  if (totalWeight === 0) return items[0];

  // Generate random number between 0 and total weight
  let random = Math.random() * totalWeight;

  // Iterate through items and find the selected one
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }

  // Fallback to last item (should rarely happen due to floating point precision)
  return items[items.length - 1];
}

/**
 * Validates that weights don't exceed maximum allowed value
 *
 * @param items - Array of items with weight property
 * @param maxTotal - Maximum allowed total weight (default: 100)
 * @returns Object with validation result and current total
 */
export function validateWeights<T extends WeightedItem>(
  items: T[],
  maxTotal: number = 100
): { valid: boolean; currentTotal: number; remaining: number } {
  const currentTotal = items.reduce((sum, item) => sum + item.weight, 0);

  return {
    valid: currentTotal <= maxTotal,
    currentTotal,
    remaining: Math.max(0, maxTotal - currentTotal)
  };
}

/**
 * Normalize weights to sum to a specific total
 *
 * @param items - Array of items with weight property
 * @param targetTotal - Target total weight (default: 100)
 * @returns Array of normalized weights
 *
 * @example
 * const items = [{ weight: 30 }, { weight: 20 }];
 * const normalized = normalizeWeights(items, 100);
 * // Returns [60, 40] - proportionally scaled to sum to 100
 */
export function normalizeWeights<T extends WeightedItem>(
  items: T[],
  targetTotal: number = 100
): number[] {
  const currentTotal = items.reduce((sum, item) => sum + item.weight, 0);

  if (currentTotal === 0) {
    // If all weights are 0, distribute evenly
    const evenWeight = targetTotal / items.length;
    return items.map(() => evenWeight);
  }

  // Scale weights proportionally
  const scale = targetTotal / currentTotal;
  return items.map(item => Math.round(item.weight * scale));
}
