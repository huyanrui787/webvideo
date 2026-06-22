import { useEffect, useRef } from "react";

interface BgmConfig {
  src: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}

interface Options {
  autoStarted: boolean;
  paused?: boolean;
  playbackRate?: number;
  isSeekMode?: boolean;
}

export function useBgm({
  autoStarted,
  paused = false,
  playbackRate = 1,
  isSeekMode = false,
}: Options) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const configRef = useRef<BgmConfig | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (isSeekMode) return;
    const base = import.meta.env.BASE_URL ?? "/";
    fetch(`${base}audio/bgm.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg: BgmConfig | null) => {
        if (!cfg) return;
        configRef.current = cfg;
        const src = cfg.src.startsWith("/") ? `${base}${cfg.src.slice(1)}` : cfg.src;
        const audio = new Audio(src);
        audio.loop = cfg.loop !== false;
        audio.volume = 0;
        audio.preload = "auto";
        audio.playbackRate = playbackRate;
        audioRef.current = audio;
        if (autoStarted && !startedRef.current) {
          startedRef.current = true;
          audio.play().then(() => fadeVolume(audio, 0, cfg.volume, cfg.fadeIn)).catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = "";
        audioRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeekMode]);

  useEffect(() => {
    if (isSeekMode) return;
    const a = audioRef.current;
    const cfg = configRef.current;
    if (!a || !cfg) return;
    if (autoStarted && !startedRef.current) {
      startedRef.current = true;
      a.play().then(() => fadeVolume(a, 0, cfg.volume, cfg.fadeIn)).catch(() => {});
    }
  }, [autoStarted, isSeekMode]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (paused) {
      a.pause();
    } else if (autoStarted && startedRef.current) {
      a.play().catch(() => {});
    }
  }, [paused, autoStarted]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = playbackRate;
  }, [playbackRate]);
}

function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationSec: number
) {
  if (durationSec <= 0) { audio.volume = to; return; }
  const steps = 30;
  const stepMs = (durationSec * 1000) / steps;
  const delta = (to - from) / steps;
  let current = from;
  audio.volume = from;
  const id = setInterval(() => {
    current += delta;
    audio.volume = Math.max(0, Math.min(1, current));
    if ((delta > 0 && current >= to) || (delta < 0 && current <= to)) {
      audio.volume = to;
      clearInterval(id);
    }
  }, stepMs);
}
