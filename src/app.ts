import express from "express";
import { errorMiddleware } from "./middleware/error.middleware";
import { pool } from "./db/database";
import linkRoutes from "./routes/link.routes";

const app = express();
app.disable("x-powered-by");

app.use(express.json());

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
app.use(errorMiddleware);

export default app;
