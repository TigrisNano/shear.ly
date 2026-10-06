import "dotenv/config";

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }

  return value;
}

export const env = {
  postgres: {
    host: getEnv("POSTGRES_HOST"),
    port: Number(getEnv("POSTGRES_PORT")),
    database: getEnv("POSTGRES_DB"),
    user: getEnv("POSTGRES_USER"),
    password: getEnv("POSTGRES_PASSWORD"),
  },

  postgresReplica: {
    host: getEnv("POSTGRES_REPLICA_HOST"),
    port: Number(getEnv("POSTGRES_REPLICA_PORT")),
    database: getEnv("POSTGRES_DB"),
    user: getEnv("POSTGRES_USER"),
    password: getEnv("POSTGRES_PASSWORD"),
  },

  rabbitmq: {
    host: getEnv("RABBITMQ_HOST"),
    port: Number(getEnv("RABBITMQ_PORT")),
    user: getEnv("RABBITMQ_USER"),
    password: getEnv("RABBITMQ_PASSWORD"),
  },

  port: Number(getEnv("PORT")),
};
