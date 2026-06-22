/**
 * In-process event bus for project lifecycle events.
 * SSE endpoints subscribe here; lib files (scaffold, dev-servers, etc.) publish here.
 */
import { EventEmitter } from "events";

export interface ProjectEvent {
  projectId: string;
  type: "scaffold" | "scaffold-progress" | "dev-server" | "dev-stderr" | "build" | "render" | "audio";
  data: Record<string, unknown>;
}

const bus = new EventEmitter();
bus.setMaxListeners(200); // SSE + internal listeners

// Prevent unhandled listener errors from crashing the process
bus.on("error", (err) => {
  console.error("[events] Unhandled listener error:", err.message);
});

export function publishProjectEvent(
  projectId: string,
  type: ProjectEvent["type"],
  data: Record<string, unknown>
) {
  const event: ProjectEvent = { projectId, type, data };
  try {
    bus.emit("project-event", event);
  } catch (err: any) {
    console.error(`[events] Error publishing ${type} for ${projectId}:`, err.message);
  }
}

export function subscribeToProject(
  projectId: string,
  handler: (event: ProjectEvent) => void
): () => void {
  const listener = (event: ProjectEvent) => {
    try {
      if (event.projectId === projectId) handler(event);
    } catch (err: any) {
      console.error(`[events] Error in listener for ${projectId}:`, err.message);
    }
  };
  bus.on("project-event", listener);
  return () => { bus.off("project-event", listener); };
}
