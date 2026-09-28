import { pool, replicaPool } from "../db/database";
import { CreateLinkData } from "../types/link.types";

export async function createLink(data: CreateLinkData) {
  const result = await pool.query(
    `
        INSERT INTO links (original_url, short_code)
        VALUES ($1, $2)
        RETURNING *;
        `,
    [data.originalUrl, data.shortCode],
  );

  return result.rows[0];
}

export async function findLinkByShortCode(shortCode: string) {
  const result = await replicaPool.query(
    `
        SELECT *
        FROM links
        WHERE short_code = $1
        `,
    [shortCode],
  );

  return result.rows[0];
}

export async function findLinkById(id: number) {
  const result = await replicaPool.query(
    `
        SELECT *
        FROM links
        WHERE id = $1;
        `,
    [id],
  );

  return result.rows[0];
}

export async function findAllLinks() {
  const result = await replicaPool.query(
    `
        SELECT *
        FROM links
        ORDER BY id DESC;
        `,
  );

  return result.rows;
}

export async function updateLink(id: number, originalUrl: string) {
  const result = await pool.query(
    `
        UPDATE links
        SET
            original_url = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *;
        `,
    [originalUrl, id],
  );

  return result.rows[0];
}

export async function deleteLink(id: number) {
  const result = await pool.query(
    `
        DELETE FROM links
        WHERE id = $1
        RETURNING *;
        `,
    [id],
  );

  return result.rows[0];
}
