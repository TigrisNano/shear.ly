import { Request, Response } from "express";
import {
  createShortLink,
  getLinkByShortCode,
  getLinkById,
  getAllLinks,
  updateShortLink,
  removeLink,
} from "../services/link.service";

export async function createLinkController(req: Request, res: Response) {
  const { originalUrl } = req.body;

  const idempotencyKey = req.header("Idempotency-Key");

  if (!originalUrl || typeof originalUrl !== "string") {
    return res.status(400).json({
      error: {
        code: "INVALID_URL",
        message: "originalUrl is required",
      },
    });
  }

  let url: URL;

  try {
    url = new URL(originalUrl);
  } catch {
    return res.status(400).json({
      error: {
        code: "INVALID_URL",
        message: "originalUrl must be a valid URL",
      },
    });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return res.status(400).json({
      error: {
        code: "INVALID_URL",
        message: "Only http and https URLs are allowed",
      },
    });
  }

  const link = await createShortLink(
    {
      originalUrl,
    },
    idempotencyKey,
  );

  return res.status(201).json(link);
}

export async function redirectLinkController(req: Request, res: Response) {
  const shortCode = String(req.params.shortCode);

  const link = await getLinkByShortCode(shortCode);

  if (!link) {
    return res.status(404).json({
      error: {
        code: "LINK_NOT_FOUND",
        message: "Short link not found",
      },
    });
  }

  return res.redirect(link.original_url);
}

export async function getLinkByIdController(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: {
        code: "INVALID_ID",
        message: "ID must be a positive integer",
      },
    });
  }

  const link = await getLinkById(id);

  if (!link) {
    return res.status(404).json({
      error: {
        code: "LINK_NOT_FOUND",
        message: "Link not found",
      },
    });
  }

  return res.status(200).json(link);
}

export async function getAllLinksController(_req: Request, res: Response) {
  const links = await getAllLinks();

  return res.status(200).json(links);
}

export async function updateLinkController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { originalUrl } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: {
        code: "INVALID_ID",
        message: "ID must be a positive integer",
      },
    });
  }

  if (!originalUrl || typeof originalUrl !== "string") {
    return res.status(400).json({
      error: {
        code: "INVALID_URL",
        message: "originalUrl is required",
      },
    });
  }

  try {
    const url = new URL(originalUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      return res.status(400).json({
        error: {
          code: "INVALID_URL",
          message: "Only HTTP and HTTPS URLs are allowed",
        },
      });
    }
  } catch {
    return res.status(400).json({
      error: {
        code: "INVALID_URL",
        message: "originalUrl must be a valid URL",
      },
    });
  }

  const link = await updateShortLink(id, originalUrl);

  if (!link) {
    return res.status(404).json({
      error: {
        code: "LINK_NOT_FOUND",
        message: "Link not found",
      },
    });
  }

  return res.status(200).json(link);
}

export async function deleteLinkController(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: {
        code: "INVALID_ID",
        message: "ID must be a positive integer",
      },
    });
  }

  const link = await removeLink(id);

  if (!link) {
    return res.status(404).json({
      error: {
        code: "LINK_NOT_FOUND",
        message: "Link not found",
      },
    });
  }

  return res.status(200).json({
    message: "Link deleted successfully",
    link,
  });
}
