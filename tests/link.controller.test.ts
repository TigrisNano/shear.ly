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

import {
  createShortLink,
  getLinkByShortCode,
  getLinkById,
  getAllLinks,
  updateShortLink,
  removeLink,
} from "../src/services/link.service";

import {
  createLinkController,
  redirectLinkController,
  getLinkByIdController,
  getAllLinksController,
  updateLinkController,
  deleteLinkController,
} from "../src/controllers/link.controller";

const createMock = vi.mocked(createShortLink);
const getByCodeMock = vi.mocked(getLinkByShortCode);
const getByIdMock = vi.mocked(getLinkById);
const getAllMock = vi.mocked(getAllLinks);
const updateMock = vi.mocked(updateShortLink);
const removeMock = vi.mocked(removeLink);

const link = {
  id: 1,
  original_url: "https://example.com",
  short_code: "abc12345",
};

function createTestApp() {
  const app = express();
  app.use(express.json());

  app.post("/links", createLinkController);
  app.get(
    "/links/r/:shortCode",
    (req, res, next) => {
      res.locals.correlationId = "test-correlation-id";
      next();
    },
    redirectLinkController,
  );
  app.get("/links/r/:shortCode", redirectLinkController);
  app.get("/links/:id", getLinkByIdController);
  app.get("/links", getAllLinksController);
  app.put("/links/:id", updateLinkController);
  app.delete("/links/:id", deleteLinkController);

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
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 when originalUrl is not a valid URL", async () => {
    const response = await request(createTestApp())
      .post("/links")
      .send({ originalUrl: "not-a-url" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_URL");
  });

  it("rejects FTP URLs", async () => {
    const response = await request(createTestApp())
      .post("/links")
      .send({ originalUrl: "ftp://example.com/file" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_URL");
  });

  it("creates a link for a valid HTTPS URL", async () => {
    createMock.mockResolvedValue(link as never);
    const response = await request(createTestApp())
      .post("/links")
      .send({ originalUrl: link.original_url });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(link);
    expect(createMock).toHaveBeenCalledWith(
      { originalUrl: link.original_url },
      undefined,
    );
  });

  it("passes the Idempotency-Key header to the service", async () => {
    createMock.mockResolvedValue(link as never);
    const response = await request(createTestApp())
      .post("/links")
      .set("Idempotency-Key", "test-key-123")
      .send({ originalUrl: link.original_url });

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith(
      { originalUrl: link.original_url },
      "test-key-123",
    );
  });
});

describe("GET /links/r/:shortCode", () => {
  it("redirects to the original URL", async () => {
    getByCodeMock.mockResolvedValue(link as never);
    const response = await request(createTestApp()).get("/links/r/abc12345");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(link.original_url);
    expect(getByCodeMock).toHaveBeenCalledWith(
      "abc12345",
      "test-correlation-id",
    );
  });

  it("returns 404 when the short link does not exist", async () => {
    getByCodeMock.mockResolvedValue(null as never);
    const response = await request(createTestApp()).get("/links/r/missing");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("LINK_NOT_FOUND");
  });
});

describe("GET /links/:id", () => {
  it.each(["abc", "0", "-1", "1.5"])(
    "returns 400 for invalid ID %s",
    async (id) => {
      const response = await request(createTestApp()).get(`/links/${id}`);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("INVALID_ID");
    },
  );

  it("returns a link by ID", async () => {
    getByIdMock.mockResolvedValue(link as never);
    const response = await request(createTestApp()).get("/links/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(link);
    expect(getByIdMock).toHaveBeenCalledWith(1);
  });

  it("returns 404 when the ID does not exist", async () => {
    getByIdMock.mockResolvedValue(null as never);
    const response = await request(createTestApp()).get("/links/99");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("LINK_NOT_FOUND");
  });
});

describe("GET /links", () => {
  it("returns all links", async () => {
    getAllMock.mockResolvedValue([link] as never);
    const response = await request(createTestApp()).get("/links");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([link]);
  });
});

describe("PUT /links/:id", () => {
  it("rejects an invalid ID", async () => {
    const response = await request(createTestApp())
      .put("/links/abc")
      .send({ originalUrl: link.original_url });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_ID");
  });

  it("rejects a missing URL", async () => {
    const response = await request(createTestApp()).put("/links/1").send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_URL");
  });

  it("rejects an unsupported protocol", async () => {
    const response = await request(createTestApp())
      .put("/links/1")
      .send({ originalUrl: "ftp://example.com" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_URL");
  });

  it("updates an existing link", async () => {
    updateMock.mockResolvedValue(link as never);
    const response = await request(createTestApp())
      .put("/links/1")
      .send({ originalUrl: link.original_url });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(link);
    expect(updateMock).toHaveBeenCalledWith(1, link.original_url);
  });

  it("returns 404 when the link to update does not exist", async () => {
    updateMock.mockResolvedValue(null as never);
    const response = await request(createTestApp())
      .put("/links/99")
      .send({ originalUrl: link.original_url });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("LINK_NOT_FOUND");
  });
});

describe("DELETE /links/:id", () => {
  it("rejects an invalid ID", async () => {
    const response = await request(createTestApp()).delete("/links/abc");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_ID");
  });

  it("deletes an existing link", async () => {
    removeMock.mockResolvedValue(link as never);
    const response = await request(createTestApp()).delete("/links/1");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Link deleted successfully");
    expect(response.body.link).toEqual(link);
    expect(removeMock).toHaveBeenCalledWith(1);
  });

  it("returns 404 when the link to delete does not exist", async () => {
    removeMock.mockResolvedValue(null as never);
    const response = await request(createTestApp()).delete("/links/99");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("LINK_NOT_FOUND");
  });
});
