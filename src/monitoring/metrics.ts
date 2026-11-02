import * as client from "@prometheus-io/client";
import type { Request, Response, NextFunction } from "express";

export const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpActiveRequests = new client.Gauge({
  name: "http_active_requests",
  help: "Number of currently active HTTP requests",
  registers: [register],
});

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === "/metrics") {
    next();
    return;
  }

  const endTimer = httpRequestDuration.startTimer();
  httpActiveRequests.inc();

  let finished = false;

  const finish = (): void => {
    if (finished) return;
    finished = true;

    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : "unmatched";

    const statusCode = res.writableEnded
      ? String(res.statusCode)
      : "499";

    const labels = {
      method: req.method,
      route,
      status_code: statusCode,
    };

    httpRequestsTotal.inc(labels);
    endTimer(labels);
    httpActiveRequests.dec();
  };

  res.once("finish", finish);
  res.once("close", finish);

  next();
}
