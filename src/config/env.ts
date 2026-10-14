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
    host: process.env.POSTGRES_REPLICA_HOST || getEnv("POSTGRES_HOST"),
    port: Number(process.env.POSTGRES_REPLICA_PORT || getEnv("POSTGRES_PORT")),
    database: getEnv("POSTGRES_DB"),
    user: getEnv("POSTGRES_USER"),
    password: getEnv("POSTGRES_PASSWORD"),
  },

  rabbitmq: {
    host: process.env.RABBITMQ_HOST || "localhost",
    port: Number(process.env.RABBITMQ_PORT || 5672),
    user: process.env.RABBITMQ_USER || "shear",
    password: process.env.RABBITMQ_PASSWORD || "your_password",
  },

  port: Number(getEnv("PORT")),
};
