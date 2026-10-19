import { randomInt } from "node:crypto";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 200, maxDelayMs = 2000 } = options;

  async function runAttempt(attempt: number): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw error;
      }

      const exponentialDelay = Math.min(
        maxDelayMs,
        baseDelayMs * 2 ** (attempt - 1),
      );

      const delay = randomInt(Math.max(1, Math.floor(exponentialDelay)));

      await new Promise<void>((resolve) => {
        setTimeout(resolve, delay);
      });

      return runAttempt(attempt + 1);
    }
  }

  return runAttempt(1);
}
