import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../src/services/link.service", () => ({
  createShortLink: vi.fn(),
  getLinkByShortCode: vi.fn(),
  getLinkById: vi.fn(),
  getAllLinks: vi.fn(),
  updateShortLink: vi.fn(),
  removeLink: vi.fn(),
}));

import { createShortLink } from "../src/services/link.service";
import { createLinkController } from "../src/controllers/link.controller";

const createShortLinkMock = vi.mocked(createShortLink);

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.post("/links", createLinkController);
  return app;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /links", () => {
  it("returns 400 when originalUrl is missing", async () => {
    const response = await request(createTestApp()).post("/links").send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_URL");
    expect(createShortLinkMock).not.toHaveBeenCalled();
  });

  it("returns 400 when originalUrl is not a valid URL", async () => {
    const response = await request(createTestApp())
      .post("/links")
      .send({ originalUrl: "not-a-url" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_URL");
    expect(createShortLinkMock).not.toHaveBeenCalled();
  });

  it("rejects FTP URLs", async () => {
    const response = await request(createTestApp())
      .post("/links")
      .send({ originalUrl: "ftp://example.com/file" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_URL");
    expect(createShortLinkMock).not.toHaveBeenCalled();
  });

  it("creates a link for a valid HTTPS URL", async () => {
    const createdLink = {
      id: 1,
      original_url: "https://example.com",
      short_code: "abc12345",
    };

    createShortLinkMock.mockResolvedValue(createdLink as never);

    const response = await request(createTestApp())
      .post("/links")
      .send({ originalUrl: "https://example.com" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(createdLink);
    expect(createShortLinkMock).toHaveBeenCalledWith(
      {
        originalUrl: "https://example.com",
      },
      undefined,
    );
  });

  it("passes the Idempotency-Key header to the service", async () => {
    createShortLinkMock.mockResolvedValue({
      id: 2,
      original_url: "https://example.org",
      short_code: "xyz12345",
    } as never);

    const response = await request(createTestApp())
      .post("/links")
      .set("Idempotency-Key", "test-key-123")
      .send({ originalUrl: "https://example.org" });

    expect(response.status).toBe(201);
    expect(createShortLinkMock).toHaveBeenCalledWith(
      {
        originalUrl: "https://example.org",
      },
      "test-key-123",
    );
  });
});
