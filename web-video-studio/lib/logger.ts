/**
 * Minimal structured logger with request-ID tracing.
 * Replace console.log/warn/error in server code with this.
 */
import { nanoid } from "nanoid";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  reqId?: string;
  projectId?: string;
  [key: string]: unknown;
}

function formatEntry(entry: LogEntry): string {
  const { ts, level, msg, ...meta } = entry;
  const metaStr = Object.keys(meta).length > 0 ? " " + JSON.stringify(meta) : "";
  return `[${ts}] ${level.toUpperCase()} ${msg}${metaStr}`;
}

function log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = { ts: new Date().toISOString(), level, msg, ...meta };
  const line = formatEntry(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") log("debug", msg, meta);
  },
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};

/** Generate a short request ID for tracing. Call at the start of each API handler. */
export function reqId(): string {
  return nanoid(8);
}
