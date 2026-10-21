import { afterEach, describe, expect, it, vi } from "vitest";

import { retry as apiRetry } from "../src/utils/retry";
import { retry as analyticsRetry } from "../analytics-service/src/retry";

const implementations = [
  { name: "API retry", retry: apiRetry },
  { name: "Analytics retry", retry: analyticsRetry },
];

afterEach(() => {
  vi.useRealTimers();
});

describe.each(implementations)("$name", ({ retry }) => {
  it("returns the result when the operation succeeds on the first attempt", async () => {
    const operation = vi.fn(async () => "success");

    await expect(retry(operation)).resolves.toBe("success");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("retries after a failure and returns the successful result", async () => {
    vi.useFakeTimers();

    let calls = 0;

    const operation = async () => {
      calls += 1;

      if (calls < 3) {
        throw new Error("Temporary failure");
      }

      return "success";
    };

    const result = retry(operation, {
      maxAttempts: 3,
      baseDelayMs: 10,
      maxDelayMs: 20,
    });

    const assertion = expect(result).resolves.toBe("success");

    await vi.runAllTimersAsync();
    await assertion;

    expect(calls).toBe(3);
  });

  it("throws the last error after maxAttempts is reached", async () => {
    vi.useFakeTimers();

    const failure = new Error("Persistent failure");
    let calls = 0;

    const operation = async (): Promise<string> => {
      calls += 1;
      throw failure;
    };

    const result = retry(operation, {
      maxAttempts: 3,
      baseDelayMs: 10,
      maxDelayMs: 20,
    });

    const assertion = expect(result).rejects.toBe(failure);

    await vi.runAllTimersAsync();
    await assertion;

    expect(calls).toBe(3);
  });

  it("does not retry when maxAttempts is 1", async () => {
    const failure = new Error("Failure");
    let calls = 0;

    const operation = async (): Promise<string> => {
      calls += 1;
      throw failure;
    };

    await expect(
      retry(operation, { maxAttempts: 1 }),
    ).rejects.toBe(failure);

    expect(calls).toBe(1);
  });
});
