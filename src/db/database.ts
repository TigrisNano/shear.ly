import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  host: env.postgres.host,
  port: env.postgres.port,
  database: env.postgres.database,
  user: env.postgres.user,
  password: env.postgres.password,
});

export const replicaPool = new Pool({
  host: env.postgresReplica.host,
  port: env.postgresReplica.port,
  database: env.postgresReplica.database,
  user: env.postgresReplica.user,
  password: env.postgresReplica.password,
});
