
import { Pool } from "pg";
import { env } from "../config/env";

const timeoutOptions = {
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
  statement_timeout: 5000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
};

export const pool = new Pool({
  ...timeoutOptions,
  host: env.postgres.host,
  port: env.postgres.port,
  database: env.postgres.database,
  user: env.postgres.user,
  password: env.postgres.password,
  ssl:
    process.env.POSTGRES_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

export const replicaPool = new Pool({
  ...timeoutOptions,
  host: env.postgresReplica.host,
  port: env.postgresReplica.port,
  database: env.postgresReplica.database,
  user: env.postgresReplica.user,
  password: env.postgresReplica.password,
  ssl:
    process.env.POSTGRES_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});
