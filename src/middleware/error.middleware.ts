import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const statusCode = error.statusCode || 500;

  const code = error.code || "INTERNAL_SERVER_ERROR";

  const message = error.message || "Internal server error";

  return res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}
