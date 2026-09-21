import { Pool } from "pg";

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "127.0.0.1",
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || "shearly",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
});

export async function registerClick(shortCode: string) {
  const result = await pool.query(
    `
        INSERT INTO analytics_clicks (short_code, click_count)
        VALUES ($1, 1)
        ON CONFLICT (short_code)
        DO UPDATE SET
            click_count = analytics_clicks.click_count + 1
        RETURNING *;
        `,
    [shortCode],
  );

  return result.rows[0];
}

export async function getLinkAnalytics(shortCode: string) {
  const result = await pool.query(
    `
        SELECT *
        FROM analytics_clicks
        WHERE short_code = $1;
        `,
    [shortCode],
  );

  return result.rows[0];
}

export async function getTotalClicks() {
  const result = await pool.query(
    `
        SELECT COALESCE(SUM(click_count), 0)::integer AS total_clicks
        FROM analytics_clicks;
        `,
  );

  return result.rows[0];
}
