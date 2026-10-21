
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/db/database", () => ({
  pool: {
    query: vi.fn(),
  },
  replicaPool: {
    query: vi.fn(),
  },
}));

vi.mock("../src/services/link.service", () => ({
  createShortLink: vi.fn(),
  getLinkByShortCode: vi.fn(),
  getLinkById: vi.fn(),
  getAllLinks: vi.fn(),
  updateShortLink: vi.fn(),
  removeLink: vi.fn(),
}));

import app from "../src/app";
import { pool } from "../src/db/database";
import {
  createShortLink,
  getAllLinks,
} from "../src/services/link.service";

const mockPoolQuery = vi.mocked(pool.query);
const mockCreateShortLink = vi.mocked(createShortLink);
const mockGetAllLinks = vi.mocked(getAllLinks);

const link = {
  id: 1,
  original_url: "https://example.com",
  short_code: "abc12345",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /health", () => {
  it("returns 200 when the database is available", async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ "?column?": 1 }],
    } as never);

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(mockPoolQuery).toHaveBeenCalledWith("SELECT 1;");
  });

  it("returns 500 when the database query fails", async () => {
    mockPoolQuery.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    const response = await request(app).get("/health");

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe(
      "INTERNAL_SERVER_ERROR",
    );
    expect(response.body.error.message).toBe(
      "Database unavailable",
    );
  });
});

describe("POST /links", () => {
  it("creates a short link through the HTTP API", async () => {
    mockCreateShortLink.mockResolvedValueOnce(link as never);

    const response = await request(app)
      .post("/links")
      .send({ originalUrl: "https://example.com" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(link);
    expect(mockCreateShortLink).toHaveBeenCalledWith(
      { originalUrl: "https://example.com" },
      undefined,
    );
  });

  it("rejects an invalid URL through the HTTP API", async () => {
    const response = await request(app)
      .post("/links")
      .send({ originalUrl: "not-a-valid-url" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_URL");
    expect(mockCreateShortLink).not.toHaveBeenCalled();
  });
});

describe("GET /links", () => {
  it("returns the list of links through the HTTP API", async () => {
    mockGetAllLinks.mockResolvedValueOnce([link] as never);

    const response = await request(app).get("/links");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([link]);
    expect(mockGetAllLinks).toHaveBeenCalledOnce();
  });
});
