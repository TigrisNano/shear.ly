
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private openedAt = 0;
  private probeInProgress = false;

  constructor(
    private readonly options: CircuitBreakerOptions = {},
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const threshold = this.options.failureThreshold ?? 3;
    const resetTimeout = this.options.resetTimeoutMs ?? 10_000;

    if (this.state === "OPEN") {
      if (Date.now() - this.openedAt < resetTimeout) {
        throw new Error("Circuit breaker is OPEN");
      }

      this.state = "HALF_OPEN";
    }

    if (this.state === "HALF_OPEN") {
      if (this.probeInProgress) {
        throw new Error("Circuit breaker recovery probe in progress");
      }

      this.probeInProgress = true;
    }

    try {
      const result = await operation();
      this.failures = 0;
      this.state = "CLOSED";
      return result;
    } catch (error) {
      this.failures++;

      if (this.state === "HALF_OPEN" || this.failures >= threshold) {
        this.state = "OPEN";
        this.openedAt = Date.now();
      }

      throw error;
    } finally {
      this.probeInProgress = false;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
