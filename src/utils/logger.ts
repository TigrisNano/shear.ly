type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  [key: string]: unknown;
}

function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/[\r\n]/g, " ");
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeLogValue);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key.replace(/[\r\n]/g, " "),
        sanitizeLogValue(item),
      ]),
    );
  }

  return value;
}

function writeLog(entry: LogEntry): void {
  const output =
    entry.level === "error"
      ? console.error
      : entry.level === "warn"
        ? console.warn
        : console.log;

  output(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...(sanitizeLogValue(entry) as LogEntry),
    }),
  );
}

export const logger = {
  info(
    context: string,
    message: string,
    data: Record<string, unknown> = {},
  ): void {
    writeLog({ level: "info", context, message, ...data });
  },

  warn(
    context: string,
    message: string,
    data: Record<string, unknown> = {},
  ): void {
    writeLog({ level: "warn", context, message, ...data });
  },

  error(
    context: string,
    message: string,
    data: Record<string, unknown> = {},
  ): void {
    writeLog({ level: "error", context, message, ...data });
  },
};
