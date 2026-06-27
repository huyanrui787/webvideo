"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────

interface BoneDef {
  type: "head" | "torso" | "arm" | "legs" | "prop" | "full";
  sway?: number;
  nod?: number;
  tilt?: number;
  swing?: number;
  breathe?: number;
  float?: number;
  side?: "left" | "right";
}

interface PartDef {
  file: string;
  pivot: [number, number]; // [x, y] in image pixels
  bone: BoneDef;
}

interface Skeleton {
  parts: Record<string, PartDef>;
  imageSize: [number, number]; // [width, height]
}

interface ActionKeyframe {
  t: number; // time in seconds
  headRot?: number;
  headTilt?: number;
  headNod?: number;
  torsoBreathe?: number;
  armLSwing?: number;
  armRSwing?: number;
  /**
   * Optional per-part overrides:
   *   partOverrides: { head: { rot: 15, x: 0, y: -2 } }
   */
  partOverrides?: Record<string, { rot?: number; x?: number; y?: number; scale?: number }>;
}

interface BoneCharacterProps {
  /** Base URL for part images (e.g., /api/projects/X/assets/illustrations/parts/step-01-xxx/) */
  partsBaseUrl: string;
  /** Skeleton definition (from skeleton.json) */
  skeleton: Skeleton;
  /** Animation timeline — keyframes sorted by time */
  timeline?: ActionKeyframe[];
  /** Current playback time in seconds */
  currentTime?: number;
  /** Playback speed multiplier */
  speed?: number;
  /** Container width in px (height auto-scaled from imageSize) */
  width?: number;
  /** CSS class for the container */
  className?: string;
  /** Called when animation loops */
  onLoop?: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpKeyframes(kf: ActionKeyframe[], time: number, key: keyof ActionKeyframe): number {
  if (kf.length === 0) return 0;
  if (kf.length === 1) return (kf[0][key] as number) ?? 0;

  // Clamp time to keyframe range
  const first = kf[0].t;
  const last = kf[kf.length - 1].t;
  if (time <= first) return (kf[0][key] as number) ?? 0;
  if (time >= last) return (kf[kf.length - 1][key] as number) ?? 0;

  // Find bracketing keyframes
  let lo = 0;
  for (let i = kf.length - 1; i >= 0; i--) {
    if (kf[i].t <= time) {
      lo = i;
      break;
    }
  }
  const hi = Math.min(lo + 1, kf.length - 1);
  if (lo === hi) return (kf[lo][key] as number) ?? 0;

  const range = kf[hi].t - kf[lo].t;
  const frac = range > 0 ? (time - kf[lo].t) / range : 0;
  const a = (kf[lo][key] as number) ?? 0;
  const b = (kf[hi][key] as number) ?? 0;
  return lerp(a, b, frac);
}

function buildDefaultTimeline(duration: number): ActionKeyframe[] {
  // A gentle idle animation that loops
  return [
    { t: 0, headRot: 0, headTilt: 0, torsoBreathe: 0, armLSwing: 0, armRSwing: 0 },
    { t: duration * 0.25, headRot: 2, headTilt: 1, torsoBreathe: 0.5, armLSwing: 3, armRSwing: -2 },
    { t: duration * 0.5, headRot: 0, headTilt: -0.5, torsoBreathe: 1, armLSwing: 0, armRSwing: 0 },
    { t: duration * 0.75, headRot: -2, headTilt: -1, torsoBreathe: 0.5, armLSwing: -2, armRSwing: 3 },
    { t: duration, headRot: 0, headTilt: 0, torsoBreathe: 0, armLSwing: 0, armRSwing: 0 },
  ];
}

// ─── Component ──────────────────────────────────────────────────────────

export function BoneCharacter({
  partsBaseUrl,
  skeleton,
  timeline: propTimeline,
  currentTime = 0,
  speed = 1,
  width = 800,
  className,
  onLoop,
}: BoneCharacterProps) {
  const [imgW, imgH] = skeleton.imageSize;
  const scale = width / imgW;
  const height = imgH * scale;

  const timeline = propTimeline ?? buildDefaultTimeline(5);
  const duration = timeline.length > 0 ? timeline[timeline.length - 1].t : 5;

  // Looped time
  const t = (currentTime * speed) % duration;

  // Interpolate global bone params
  const headRot = lerpKeyframes(timeline, t, "headRot");
  const headTilt = lerpKeyframes(timeline, t, "headTilt");
  const headNod = lerpKeyframes(timeline, t, "headNod");
  const torsoBreathe = lerpKeyframes(timeline, t, "torsoBreathe");
  const armLSwing = lerpKeyframes(timeline, t, "armLSwing");
  const armRSwing = lerpKeyframes(timeline, t, "armRSwing");

  // Detect loop
  const prevTRef = useRef(t);
  useEffect(() => {
    if (t < prevTRef.current && onLoop) onLoop();
    prevTRef.current = t;
  }, [t, onLoop]);

  // Compute per-part transform
  function partTransform(partName: string, bone: BoneDef): React.CSSProperties {
    let rot = 0;
    let tx = 0;
    let ty = 0;
    let sc = 1;

    switch (bone.type) {
      case "head":
        rot = (headRot * (bone.sway ?? 6)) / 6;
        // Also apply tilt (X rotation via skew or translate)
        ty = (headNod * (bone.nod ?? 4)) / 4 * -2;
        break;
      case "torso":
        sc = 1 + torsoBreathe * (bone.breathe ?? 0.006) * 50;
        tx = (headRot * (bone.sway ?? 4)) / 6 * 0.5;
        break;
      case "arm":
        if (bone.side === "left") {
          rot = armLSwing * (bone.swing ?? 10) / 10;
        } else {
          rot = armRSwing * (bone.swing ?? 10) / 10;
        }
        break;
      case "legs":
        tx = (headRot * (bone.sway ?? 2)) / 6 * 0.3;
        break;
      case "prop":
        ty = Math.sin(t * 2 * Math.PI * 0.7) * (bone.float ?? 3);
        break;
    }

    // Check for per-part overrides in the current keyframe
    const currentKf = timeline.reduce((best, kf) => (kf.t <= t ? kf : best), timeline[0]);
    if (currentKf?.partOverrides?.[partName]) {
      const ov = currentKf.partOverrides[partName];
      if (ov.rot !== undefined) rot = ov.rot;
      if (ov.x !== undefined) tx = ov.x;
      if (ov.y !== undefined) ty = ov.y;
      if (ov.scale !== undefined) sc = ov.scale;
    }

    return {
      transform: `rotate(${rot}deg) translate(${tx}px, ${ty}px) scale(${sc})`,
      transition: "transform 50ms linear", // smooth interpolation
    };
  }

  // Render order: background parts first, head last (on top)
  const renderOrder = ["legs", "torso", "arm_l", "arm_r", "head"];
  const orderedNames = Object.keys(skeleton.parts).sort((a, b) => {
    const ai = renderOrder.indexOf(a);
    const bi = renderOrder.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
      }}
    >
      {orderedNames.map((name) => {
        const part = skeleton.parts[name];
        if (!part) return null;

        const [px, py] = part.pivot;
        const imgUrl = `${partsBaseUrl.replace(/\/$/, "")}/${part.file}`;

        return (
          <img
            key={name}
            src={imgUrl}
            alt={name}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transformOrigin: `${(px / imgW) * 100}% ${(py / imgH) * 100}%`,
              ...partTransform(name, part.bone),
            }}
            draggable={false}
          />
        );
      })}
    </div>
  );
}

// ─── Hook: generate timeline from TTS segments ──────────────────────────

export interface TtsSegment {
  start: number; // seconds
  end: number;
  text: string;
  /** Emotion tags in the text like [惊讶] [疲惫] [激动] */
  emotion?: string;
}

/**
 * Generate animation keyframes from TTS segment timing.
 * Maps emotion tags to bone animation parameters.
 */
export function buildTimelineFromTts(segments: TtsSegment[]): ActionKeyframe[] {
  const keyframes: ActionKeyframe[] = [];

  for (const seg of segments) {
    const mid = (seg.start + seg.end) / 2;
    const emotion = seg.emotion?.toLowerCase() ?? "";

    // Default idle pose
    let kf: ActionKeyframe = {
      t: seg.start,
      headRot: 0,
      headTilt: 0,
      armLSwing: 0,
      armRSwing: 0,
    };

    // Map emotions to poses
    if (emotion.includes("惊讶") || emotion.includes("震惊")) {
      kf = { ...kf, headRot: -5, headTilt: -3, torsoBreathe: -0.3 };
    } else if (emotion.includes("疲惫") || emotion.includes("累") || emotion.includes("焦虑")) {
      kf = { ...kf, headRot: 3, headTilt: 2, headNod: -2, torsoBreathe: -0.2 };
    } else if (emotion.includes("激动") || emotion.includes("兴奋")) {
      kf = { ...kf, headRot: -3, headTilt: -2, torsoBreathe: 0.5, armLSwing: 5, armRSwing: -5 };
    } else if (emotion.includes("无奈") || emotion.includes("叹气")) {
      kf = { ...kf, headRot: 2, headTilt: 1, headNod: -3, armLSwing: -2, armRSwing: 2 };
    } else if (emotion.includes("愤怒") || emotion.includes("生气")) {
      kf = { ...kf, headRot: -4, torsoBreathe: 0.8, armLSwing: 8, armRSwing: -8 };
    }

    keyframes.push(kf);

    // Peak pose at midpoint
    keyframes.push({ ...kf, t: mid });

    // Return to neutral at end
    keyframes.push({
      t: seg.end,
      headRot: 0,
      headTilt: 0,
      headNod: 0,
      torsoBreathe: 0,
      armLSwing: 0,
      armRSwing: 0,
    });
  }

  return keyframes.sort((a, b) => a.t - b.t);
}
