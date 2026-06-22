/**
 * In-process event bus for project lifecycle events.
 * SSE endpoints subscribe here; lib files (scaffold, dev-servers, etc.) publish here.
 */
import { EventEmitter } from "events";

export interface ProjectEvent {
  projectId: string;
  type: "scaffold" | "dev-server" | "build" | "render" | "audio";
  data: Record<string, unknown>;
}

const bus = new EventEmitter();
bus.setMaxListeners(100); // SSE connections + other listeners

export function publishProjectEvent(
  projectId: string,
  type: ProjectEvent["type"],
  data: Record<string, unknown>
) {
  const event: ProjectEvent = { projectId, type, data };
  bus.emit("project-event", event);
}

export function subscribeToProject(
  projectId: string,
  handler: (event: ProjectEvent) => void
): () => void {
  const listener = (event: ProjectEvent) => {
    if (event.projectId === projectId) handler(event);
  };
  bus.on("project-event", listener);
  return () => { bus.off("project-event", listener); };
}
