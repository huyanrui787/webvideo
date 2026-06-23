import { useCallback, useEffect, useState } from "react";
import type { PlaybackMode } from "./useAudioPlayer";

const ORDER: PlaybackMode[] = ["manual", "audio", "auto"];

function readModeFromURL(): PlaybackMode {
  if (typeof window === "undefined") return "manual";
  const q = new URLSearchParams(window.location.search);
  if (q.get("auto") === "1" || q.get("render") === "1") return "auto";
  if (q.get("audio") === "1") return "audio";
  return "manual";
}

function shouldAutoStart(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  return q.get("auto") === "1" || q.get("audio") === "1" || q.get("render") === "1";
}

/**
 * Playback mode state machine + URL sync + keyboard toggle.
 *
 * Modes:
 *   • `manual` — silent, you click / arrow-key to advance
 *   • `audio`  — audio plays per step, but you still click to advance
 *   • `auto`   — audio plays AND advances automatically (full recording mode)
 *
 * Initial mode is read from URL: `?auto=1` or `?audio=1`. Press `M` to
 * cycle: manual → audio → auto → manual. URL stays in sync so reload
 * preserves the mode.
 *
 * When auto/audio mode is active, autoStarted defaults to true — the user
 * already chose this mode and a refresh should resume immediately. Audio
 * autoplay may be blocked by the browser; auto-advance falls back to
 * text-length estimation.
 */
export function useAutoMode() {
  const [mode, setModeState] = useState<PlaybackMode>(() => readModeFromURL());
  const [autoStarted, setAutoStarted] = useState(() => shouldAutoStart());

  const setMode = useCallback((m: PlaybackMode) => {
    setModeState(m);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("audio");
    url.searchParams.delete("auto");
    if (m === "audio") url.searchParams.set("audio", "1");
    if (m === "auto") url.searchParams.set("auto", "1");
    window.history.replaceState(null, "", url.toString());
    if (m !== "auto") setAutoStarted(false);
  }, []);

  const cycleMode = useCallback(() => {
    setMode(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]!);
  }, [mode, setMode]);

  // Keyboard: `M` cycles mode. `Space` starts auto if gated.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        cycleMode();
      } else if (e.key === " " && mode === "auto" && !autoStarted) {
        e.preventDefault();
        setAutoStarted(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, autoStarted, cycleMode]);

  return { mode, setMode, cycleMode, autoStarted, setAutoStarted };
}
