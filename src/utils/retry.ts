
export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 100,
    maxDelayMs = 2000,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts - 1) {
        break;
      }

      const exponentialDelay = Math.min(
        maxDelayMs,
        baseDelayMs * 2 ** attempt,
      );

      const jitter = Math.random() * exponentialDelay;
      await new Promise((resolve) =>
        setTimeout(resolve, jitter),
      );
    }
  }

  throw lastError;
}
