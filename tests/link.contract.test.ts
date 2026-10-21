import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createHash } from "node:crypto";

vi.mock("../src/db/database", () => ({
  pool: { query: vi.fn() },
  replicaPool: { query: vi.fn() },
}));

vi.mock("../src/repositories/link.repository", () => ({
  createLink: vi.fn(),
  findLinkByShortCode: vi.fn(),
  findLinkById: vi.fn(),
  findAllLinks: vi.fn(),
  updateLink: vi.fn(),
  deleteLink: vi.fn(),
}));

vi.mock("../src/repositories/idempotency.repository", () => ({
  findIdempotencyKey: vi.fn(),
  saveIdempotencyKey: vi.fn(),
}));

vi.mock("../src/messaging/rabbitmq.publisher", () => ({
  publishClickRegistered: vi.fn().mockResolvedValue(undefined),
}));

import app from "../src/app";

import {
  createLink,
  findLinkByShortCode,
  findLinkById,
  findAllLinks,
  updateLink,
  deleteLink,
} from "../src/repositories/link.repository";

import {
  findIdempotencyKey,
  saveIdempotencyKey,
} from "../src/repositories/idempotency.repository";

import { publishClickRegistered } from "../src/messaging/rabbitmq.publisher";

import {
  createShortLink,
  getLinkByShortCode,
  getLinkById,
  getAllLinks,
  updateShortLink,
  removeLink,
} from "../src/services/link.service";

const mockCreateLink = vi.mocked(createLink);
const mockFindLinkById = vi.mocked(findLinkById);
const mockFindLinkByShortCode = vi.mocked(findLinkByShortCode);
const mockFindAllLinks = vi.mocked(findAllLinks);
const mockUpdateLink = vi.mocked(updateLink);
const mockDeleteLink = vi.mocked(deleteLink);
const mockFindIdempotencyKey = vi.mocked(findIdempotencyKey);
const mockSaveIdempotencyKey = vi.mocked(saveIdempotencyKey);
const mockPublishClick = vi.mocked(publishClickRegistered);

const testLink = {
  id: 42,
  original_url: "https://example.com",
  short_code: "contract123",
};

const input = {
  originalUrl: "https://example.com",
};

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("REST API contract", () => {
  it("POST /links returns the expected response structure", async () => {
    mockCreateLink.mockResolvedValueOnce(testLink as never);

    const response = await request(app)
      .post("/links")
      .send({ originalUrl: input.originalUrl });

    expect(response.status).toBe(201);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      id: 42,
      original_url: "https://example.com",
      short_code: "contract123",
    });

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      original_url: expect.any(String),
      short_code: expect.any(String),
    });

    expect(mockCreateLink).toHaveBeenCalledWith({
      originalUrl: input.originalUrl,
      shortCode: expect.any(String),
    });
  });

  it("GET /links/:id returns the expected link", async () => {
    mockFindLinkById.mockResolvedValueOnce(testLink as never);

    const response = await request(app).get(`/links/${testLink.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(testLink);
    expect(mockFindLinkById).toHaveBeenCalledWith(testLink.id);
  });

  it("GET /links/r/:shortCode redirects to the original URL", async () => {
    mockFindLinkByShortCode.mockResolvedValueOnce(testLink as never);
    mockPublishClick.mockResolvedValueOnce(undefined as never);

    const response = await request(app)
      .get(`/links/r/${testLink.short_code}`)
      .redirects(0);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(testLink.original_url);
    expect(mockPublishClick).toHaveBeenCalledWith(
      testLink.short_code,
      expect.any(String),
    );
  });
});

describe("link service contract", () => {
  describe("createShortLink", () => {
    it("creates a link without an idempotency key", async () => {
      mockCreateLink.mockResolvedValueOnce(testLink as never);

      await expect(createShortLink(input)).resolves.toEqual(testLink);

      expect(mockCreateLink).toHaveBeenCalledWith({
        originalUrl: input.originalUrl,
        shortCode: expect.stringMatching(/^[a-f0-9]{8}$/),
      });

      expect(mockFindIdempotencyKey).not.toHaveBeenCalled();
    });

    it("creates a link and saves the idempotency response", async () => {
      mockFindIdempotencyKey.mockResolvedValueOnce(null as never);
      mockCreateLink.mockResolvedValueOnce(testLink as never);
      mockSaveIdempotencyKey.mockResolvedValueOnce(undefined as never);

      await expect(createShortLink(input, "key-1")).resolves.toEqual(testLink);

      const expectedHash = createHash("sha256")
        .update(JSON.stringify(input))
        .digest("hex");

      expect(mockSaveIdempotencyKey).toHaveBeenCalledWith(
        "key-1",
        expectedHash,
        201,
        testLink,
      );
    });

    it("returns the saved response for an identical repeated request", async () => {
      const requestHash = createHash("sha256")
        .update(JSON.stringify(input))
        .digest("hex");

      mockFindIdempotencyKey.mockResolvedValueOnce({
        request_hash: requestHash,
        response_body: testLink,
      } as never);

      await expect(createShortLink(input, "key-1")).resolves.toEqual(testLink);

      expect(mockCreateLink).not.toHaveBeenCalled();
      expect(mockSaveIdempotencyKey).not.toHaveBeenCalled();
    });

    it("rejects reuse of an idempotency key with different input", async () => {
      mockFindIdempotencyKey.mockResolvedValueOnce({
        request_hash: "different-hash",
        response_body: testLink,
      } as never);

      await expect(createShortLink(input, "key-1")).rejects.toMatchObject({
        message: "Idempotency-Key was already used with a different request",
        statusCode: 409,
        code: "IDEMPOTENCY_KEY_REUSED",
      });

      expect(mockCreateLink).not.toHaveBeenCalled();
    });

    it("propagates idempotency repository errors", async () => {
      mockFindIdempotencyKey.mockRejectedValueOnce(new Error("Database error"));

      await expect(createShortLink(input, "key-1")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("getLinkByShortCode", () => {
    it("returns undefined when the link does not exist", async () => {
      mockFindLinkByShortCode.mockResolvedValueOnce(undefined as never);

      await expect(
        getLinkByShortCode("missing", "correlation-1"),
      ).resolves.toBeUndefined();

      expect(mockPublishClick).not.toHaveBeenCalled();
    });

    it("returns the link and publishes a click event", async () => {
      mockFindLinkByShortCode.mockResolvedValueOnce(testLink as never);
      mockPublishClick.mockResolvedValueOnce(undefined as never);

      await expect(
        getLinkByShortCode(testLink.short_code, "correlation-1"),
      ).resolves.toEqual(testLink);

      expect(mockPublishClick).toHaveBeenCalledWith(
        testLink.short_code,
        "correlation-1",
      );
    });

    it("returns the link even if publishing the event fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFindLinkByShortCode.mockResolvedValueOnce(testLink as never);
      mockPublishClick.mockRejectedValueOnce(new Error("RabbitMQ unavailable"));

      await expect(
        getLinkByShortCode(testLink.short_code, "correlation-1"),
      ).resolves.toEqual(testLink);

      expect(consoleSpy).toHaveBeenCalledOnce();
      expect(consoleSpy.mock.calls[0][0]).toContain(
        "click_event_publish_failed",
      );
    });

    it("propagates repository errors", async () => {
      mockFindLinkByShortCode.mockRejectedValueOnce(
        new Error("Database error"),
      );

      await expect(
        getLinkByShortCode("abc12345", "correlation-1"),
      ).rejects.toThrow("Database error");

      expect(mockPublishClick).not.toHaveBeenCalled();
    });
  });

  describe("repository wrappers", () => {
    it("gets a link by ID", async () => {
      mockFindLinkById.mockResolvedValueOnce(testLink as never);

      await expect(getLinkById(42)).resolves.toEqual(testLink);
      expect(mockFindLinkById).toHaveBeenCalledWith(42);
    });

    it("gets all links", async () => {
      mockFindAllLinks.mockResolvedValueOnce([testLink] as never);

      await expect(getAllLinks()).resolves.toEqual([testLink]);
      expect(mockFindAllLinks).toHaveBeenCalledOnce();
    });

    it("updates a link", async () => {
      mockUpdateLink.mockResolvedValueOnce(testLink as never);

      await expect(updateShortLink(42, "https://example.org")).resolves.toEqual(
        testLink,
      );

      expect(mockUpdateLink).toHaveBeenCalledWith(42, "https://example.org");
    });

    it("deletes a link", async () => {
      mockDeleteLink.mockResolvedValueOnce(undefined as never);

      await expect(removeLink(42)).resolves.toBeUndefined();
      expect(mockDeleteLink).toHaveBeenCalledWith(42);
    });
  });
});
