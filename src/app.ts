import express from "express";
import { errorMiddleware } from "./middleware/error.middleware";
import { pool } from "./db/database";
import linkRoutes from "./routes/link.routes";
import doraRoutes from "./routes/dora.routes";
import { correlationIdMiddleware } from "./middleware/correlation-id.middleware";
import { register, metricsMiddleware } from "./monitoring/metrics";

const app = express();
app.disable("x-powered-by");

app.use(express.json());
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);

app.get("/metrics", async (_req, res, next) => {
  try {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
});

app.get("/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1;");

    res.status(200).json({
      status: "ok",
    });
  } catch (error) {
    next(error);
  }
});

app.use("/links", linkRoutes);
app.use("/dora", doraRoutes);
app.use(errorMiddleware);

export default app;
