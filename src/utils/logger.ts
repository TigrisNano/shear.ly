type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  [key: string]: unknown;
}

function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/[\r\n\u2028\u2029]/g, " ");
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeLogValue);
  }

  if (value !== null && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      sanitized[sanitizeLogValue(key) as string] = sanitizeLogValue(item);
    }

    return sanitized;
  }

  return value;
}

function writeLog(entry: LogEntry): void {
  let output: typeof console.log;

  switch (entry.level) {
    case "error":
      output = console.error;
      break;
    case "warn":
      output = console.warn;
      break;
    default:
      output = console.log;
  }

  const sanitizedEntry = sanitizeLogValue(entry);

  output(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...(sanitizedEntry as LogEntry),
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
