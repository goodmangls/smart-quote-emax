/**
 * Simple retry with exponential backoff (design Section 6.2).
 * Retries up to `maxRetries` times with delays of 1s, 2s, 4s...
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Unreachable');
}
