/**
 * useIframeHealth — bidirectional health-check heartbeat for the preview iframe.
 *
 * Sends health pings every 5 seconds. Expects pongs with compile errors,
 * runtime errors, and app uptime. Updates the store's devDegraded flag
 * and provides structured error info to the UI.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { createHealthPing, isHealthPong, type HealthReport } from "./iframe-protocol";
import { useProjectStore } from "@/stores/project-store";

const PING_INTERVAL = 5000;
const PONG_TIMEOUT = 3000;
const MAX_MISSED_PONGS = 3;

export interface IframeHealthState {
  connected: boolean;
  lastReport: HealthReport | null;
  missedPongs: number;
  appUptimeMs: number;
}

export function useIframeHealth(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  devPort: number | null,
  enabled: boolean
) {
  const setDevDegraded = useProjectStore((s) => s.setDevDegraded);
  const setDevCrashed = useProjectStore((s) => s.setDevCrashed);
  const stateRef = useRef<IframeHealthState>({
    connected: false,
    lastReport: null,
    missedPongs: 0,
    appUptimeMs: 0,
  });

  const handlePong = useCallback((report: HealthReport) => {
    stateRef.current.connected = true;
    stateRef.current.lastReport = report;
    stateRef.current.missedPongs = 0;
    stateRef.current.appUptimeMs = report.appUptimeMs;

    // Update degraded state based on compile errors
    if (report.compileErrors.length > 0) {
      setDevDegraded(true);
    } else if (report.compileErrors.length === 0 && report.appAlive) {
      setDevDegraded(false);
    }
    setDevCrashed(false);
  }, [setDevDegraded, setDevCrashed]);

  useEffect(() => {
    if (!enabled || !devPort || !iframeRef.current) return;

    const ping = () => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      const pingMsg = createHealthPing();
      let pongReceived = false;

      const timeout = setTimeout(() => {
        if (pongReceived) return;
        stateRef.current.missedPongs++;
        if (stateRef.current.missedPongs >= MAX_MISSED_PONGS) {
          stateRef.current.connected = false;
          setDevCrashed(true);
        }
      }, PONG_TIMEOUT);

      const handler = (e: MessageEvent) => {
        if (!isHealthPong(e.data)) return;
        if (e.data.id !== pingMsg.id) return;
        pongReceived = true;
        clearTimeout(timeout);
        handlePong(e.data.payload as HealthReport);
      };

      window.addEventListener("message", handler);
      iframe.contentWindow.postMessage(pingMsg, "*");

      return () => {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
      };
    };

    const interval = setInterval(ping, PING_INTERVAL);
    // Send first ping immediately
    setTimeout(ping, 2000);

    return () => {
      clearInterval(interval);
      stateRef.current = { connected: false, lastReport: null, missedPongs: 0, appUptimeMs: 0 };
    };
  }, [enabled, devPort, iframeRef, handlePong, setDevCrashed]);

  return stateRef;
}
