import { pool } from "../db/database";

export async function findIdempotencyKey(key: string) {
  const result = await pool.query(
    `
        SELECT *
        FROM idem_keys
        WHERE key = $1;
        `,
    [key],
  );

  return result.rows[0];
}

export async function saveIdempotencyKey(
  key: string,
  requestHash: string,
  responseStatus: number,
  responseBody: object,
) {
  const result = await pool.query(
    `
        INSERT INTO idem_keys (
            key,
            request_hash,
            response_status,
            response_body,
            created_at
        )
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *;
        `,
    [key, requestHash, responseStatus, responseBody],
  );

  return result.rows[0];
}
