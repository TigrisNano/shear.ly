
import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incomingId = req.header("x-correlation-id")?.trim();

  const correlationId =
    incomingId && /^[a-zA-Z0-9._:-]{1,128}$/.test(incomingId)
      ? incomingId
      : randomUUID();

  res.locals.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  console.log(
    JSON.stringify({
      level: "info",
      service: "shearly-api",
      event: "http_request_started",
      correlationId,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString(),
    }),
  );

  res.on("finish", () => {
    console.log(
      JSON.stringify({
        level: "info",
        service: "shearly-api",
        event: "http_request_completed",
        correlationId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
      }),
    );
  });

  next();
}
