/**
 * Structured iframe communication protocol v2.
 *
 * Replaces ad-hoc postMessage strings with a typed, versioned envelope.
 * Supports: commands, events, responses, errors, and health checks.
 */

// ── Protocol Version ────────────────────────────────────────────────────────

export const PROTOCOL_VERSION = 2;

// ── Core Types ──────────────────────────────────────────────────────────────

export interface IframeEnvelope<T = unknown> {
  /** Unique correlation ID */
  id: string;
  /** Protocol version for negotiation */
  version: number;
  /** Message direction */
  direction: "host-to-presentation" | "presentation-to-host";
  /** Message kind */
  kind: "command" | "event" | "response" | "error" | "health-ping" | "health-pong";
  /** Message type (e.g., "play", "seek", "step-changed") */
  type: string;
  /** Payload data */
  payload: T;
  /** Unix timestamp in ms */
  timestamp: number;
}

// ── Health Check ────────────────────────────────────────────────────────────

export interface HealthReport {
  /** Is the React app alive and responding? */
  appAlive: boolean;
  /** Uptime in ms since app started */
  appUptimeMs: number;
  /** Vite compile errors (if any) */
  compileErrors: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
  }>;
  /** Runtime errors since last report */
  runtimeErrors: Array<{
    message: string;
    source: string;
    lineno: number;
    colno: number;
  }>;
  /** Current step number in the presentation */
  currentStep: number;
  /** Total steps across all chapters */
  totalSteps: number;
}

export type HealthPing = IframeEnvelope<{}>;
export type HealthPong = IframeEnvelope<HealthReport>;

// ── Step Change Event ───────────────────────────────────────────────────────

export interface StepChangePayload {
  chapter: number;
  step: number;
  chapterId: string;
  globalIndex: number;
}

export type StepChangeEvent = IframeEnvelope<StepChangePayload>;

// ── Element Selection (edit mode) ───────────────────────────────────────────

export interface ElementSelectionPayload {
  selector: string;
  tagName: string;
  text: string;
  rect: { x: number; y: number; width: number; height: number };
}

export type ElementSelectionEvent = IframeEnvelope<ElementSelectionPayload>;

// ── Utility Functions ───────────────────────────────────────────────────────

let counter = 0;

/** Generate a unique message ID */
export function generateId(): string {
  return `msg_${Date.now()}_${++counter}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Create a command envelope */
export function createCommand<T>(type: string, payload: T): IframeEnvelope<T> {
  return {
    id: generateId(),
    version: PROTOCOL_VERSION,
    direction: "host-to-presentation",
    kind: "command",
    type,
    payload,
    timestamp: Date.now(),
  };
}

/** Create an event envelope */
export function createEvent<T>(type: string, payload: T): IframeEnvelope<T> {
  return {
    id: generateId(),
    version: PROTOCOL_VERSION,
    direction: "presentation-to-host",
    kind: "event",
    type,
    payload,
    timestamp: Date.now(),
  };
}

/** Create a health ping */
export function createHealthPing(): HealthPing {
  return {
    id: generateId(),
    version: PROTOCOL_VERSION,
    direction: "host-to-presentation",
    kind: "health-ping",
    type: "health-ping",
    payload: {},
    timestamp: Date.now(),
  };
}

/** Check if a message is a valid protocol envelope */
export function isEnvelope(msg: unknown): msg is IframeEnvelope {
  if (!msg || typeof msg !== "object") return false;
  const m = msg as Record<string, unknown>;
  return typeof m.id === "string"
    && typeof m.version === "number"
    && typeof m.kind === "string"
    && typeof m.type === "string"
    && typeof m.timestamp === "number";
}

/** Check if a message is a health pong */
export function isHealthPong(msg: unknown): msg is HealthPong {
  return isEnvelope(msg) && msg.kind === "health-pong";
}

/** Check if a message is a step change event */
export function isStepChange(msg: unknown): msg is StepChangeEvent {
  return isEnvelope(msg) && msg.type === "step-changed";
}
