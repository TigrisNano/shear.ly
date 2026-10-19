import { randomInt } from "node:crypto";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 2000;

  const attempt = (number: number): Promise<T> =>
    Promise.resolve()
      .then(operation)
      .catch((error: unknown) => {
        if (number >= maxAttempts) {
          throw error;
        }

        const ceiling = Math.min(
          maxDelayMs,
          baseDelayMs * 2 ** (number - 1),
        );
        const waitMs = randomInt(Math.max(1, Math.floor(ceiling)));

        return new Promise<void>((resolve) => {
          setTimeout(resolve, waitMs);
        }).then(() => attempt(number + 1));
      });

  return attempt(1);
}