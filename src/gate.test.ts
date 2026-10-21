import { Request, Response } from "express";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function vulnerableSearch(
  req: Request,
  res: Response,
): Promise<void> {
  const search = String(req.query.search ?? "");

  // Intentionally vulnerable: user input is concatenated into SQL.
  const query = `SELECT * FROM links WHERE original_url = '${search}'`;

  try {
    const result = await pool.query(query);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Database query failed" });
  }
}
