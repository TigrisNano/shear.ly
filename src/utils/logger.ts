type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  [key: string]: unknown;
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
      ...entry,
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
