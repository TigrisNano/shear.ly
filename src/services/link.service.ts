import { createHash, randomBytes } from "node:crypto";
import { publishClickRegistered } from "../messaging/rabbitmq.publisher";
import {
  findLinkByShortCode,
  createLink,
  findLinkById,
  findAllLinks,
  updateLink,
  deleteLink,
} from "../repositories/link.repository";
import { CreateLinkInput } from "../types/link.types";
import { logger } from "../utils/logger";
import {
  findIdempotencyKey,
  saveIdempotencyKey,
} from "../repositories/idempotency.repository";

function generateShortCode(): string {
  return randomBytes(4).toString("hex");
}

function createRequestHash(input: CreateLinkInput): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export async function createShortLink(
  input: CreateLinkInput,
  idempotencyKey?: string,
) {
  if (!idempotencyKey) {
    const shortCode = generateShortCode();

    return createLink({
      originalUrl: input.originalUrl,
      shortCode,
    });
  }

  const requestHash = createRequestHash(input);

  const existingKey = await findIdempotencyKey(idempotencyKey);

  if (existingKey) {
    if (existingKey.request_hash !== requestHash) {
      const error = new Error(
        "Idempotency-Key was already used with a different request",
      );

      (error as any).statusCode = 409;
      (error as any).code = "IDEMPOTENCY_KEY_REUSED";

      throw error;
    }

    return existingKey.response_body;
  }

  const shortCode = generateShortCode();

  const link = await createLink({
    originalUrl: input.originalUrl,
    shortCode,
  });

  await saveIdempotencyKey(idempotencyKey, requestHash, 201, link);

  return link;
}

export async function getLinkByShortCode(
  shortCode: string,
  correlationId: string,
) {
  const link = await findLinkByShortCode(shortCode);

  if (!link) return undefined;

  try {
    await publishClickRegistered(shortCode, correlationId);
  } catch (error) {
    logger.error("LinkService", "Failed to publish click event", {
      service: "shearly-api",
      event: "click_event_publish_failed",
      error: error instanceof Error ? error.message : "Unknown error",
      correlationId,
    });
  }

  return link;
}

export async function getLinkById(id: number) {
  return findLinkById(id);
}

export async function getAllLinks() {
  return findAllLinks();
}

export async function updateShortLink(id: number, originalUrl: string) {
  return updateLink(id, originalUrl);
}

export async function removeLink(id: number) {
  return deleteLink(id);
}
