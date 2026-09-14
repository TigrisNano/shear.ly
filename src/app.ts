import express from "express";
import { errorMiddleware } from "./middleware/error.middleware";
import { pool } from "./db/database";
import linkRoutes from "./routes/link.routes";

const app = express();

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1;");

    res.status(200).json({
      status: "ok",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
    });
  }
});

app.use("/links", linkRoutes);
app.use(errorMiddleware);

export default app;
