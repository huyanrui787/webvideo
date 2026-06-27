/**
 * Server-side video pipeline orchestrator.
 *
 * Triggered automatically when ProjectSetStatus("building") is called
 * for standard video projects. Handles scaffold + build auto-start.
 */
import { isScaffolded, startScaffold } from "@/lib/scaffold";
import { MAIN_SKILL_ID } from "@/lib/skills";
import { publishProjectEvent } from "@/lib/events";

/**
 * Trigger scaffold for a video project if not already done.
 * Non-blocking — scaffold runs in background and publishes SSE events.
 */
export function triggerVideoScaffold(projectId: string, project: {
  theme?: string | null;
  orientation?: string | null;
  projectFormat?: string | null;
  mainSkillId?: string | null;
}): void {
  if (isScaffolded(projectId)) {
    publishProjectEvent(projectId, "scaffold", { status: "done" });
    return;
  }

  const theme = project.theme ?? "midnight-press";
  const orientation = project.orientation ?? "landscape";
  const projectFormat = project.projectFormat ?? "video";
  const mainSkillId = project.mainSkillId ?? MAIN_SKILL_ID;

  startScaffold(projectId, theme, orientation, projectFormat, mainSkillId);
  console.log(`[video-pipeline] Scaffold triggered for ${projectId}`);
}
