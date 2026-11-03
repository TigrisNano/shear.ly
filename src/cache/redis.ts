import { createClient } from "redis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const client = createClient({
  url: env.redis.url,
});

let connectionPromise: Promise<void> | undefined;

client.on("error", (error) => {
  logger.warn("Redis", "Redis connection error", {
    error: error.message,
  });
});

client.on("end", () => {
  connectionPromise = undefined;
});

async function ensureConnected(): Promise<void> {
  if (client.isReady) return;

  if (!connectionPromise) {
    connectionPromise = client
      .connect()
      .then(() => undefined)
      .catch((error: Error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  await connectionPromise;
}

export async function getCache<T>(key: string): Promise<T | undefined> {
  try {
    await ensureConnected();

    const value = await client.get(key);

    return value ? (JSON.parse(value) as T) : undefined;
  } catch (error) {
    logger.warn("Redis", "Cache read failed", {
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return undefined;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds = 60,
): Promise<void> {
  try {
    await ensureConnected();

    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  } catch (error) {
    logger.warn("Redis", "Cache write failed", {
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function deleteCache(...keys: string[]): Promise<void> {
  try {
    await ensureConnected();

    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    logger.warn("Redis", "Cache invalidation failed", {
      keys,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
