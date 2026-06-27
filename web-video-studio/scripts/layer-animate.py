#!/usr/bin/env python3
"""
Layer-based animation renderer.

Splits a static illustration into foreground + background, then animates
each layer independently:

  Foreground (character): mesh-warp deformation — subtle breathing, swaying,
                          gentle head/body oscillation.
  Background (scene):     hole-filling via inpainting where FG was removed,
                          then parallax depth-weighted displacement.
  Composite:              background first, foreground on top, per-frame.

This creates a "living illustration" effect — the character feels alive
while the environment has atmospheric depth.

Usage:
  python3 scripts/layer-animate.py <image.png> <mask.png> <depth.png> <out.mp4> [options]

Options:
  --duration=5.0       Clip duration in seconds
  --fps=30             Frame rate
  --resolution=1920x1080
  --breath=0.008       Breathing intensity (0 = none, 0.02 = strong)
  --sway=8             Max horizontal sway in pixels
  --parallax=24        Max parallax displacement for background
"""

import sys, os, math, subprocess, argparse, time
from pathlib import Path

import cv2
import numpy as np


def load_and_resize(img_path, mask_path, depth_path, target_size):
    """Load inputs, resize to target resolution."""
    img = cv2.imread(img_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {img_path}")
    mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    if mask is None:
        raise FileNotFoundError(f"Cannot read mask: {mask_path}")
    depth = cv2.imread(depth_path, cv2.IMREAD_UNCHANGED)
    if depth is None:
        depth = np.full(img.shape[:2], 128, dtype=np.uint8)

    tw, th = target_size
    img = cv2.resize(img, (tw, th), interpolation=cv2.INTER_LANCZOS4)
    mask = cv2.resize(mask, (tw, th), interpolation=cv2.INTER_LINEAR)
    depth = cv2.resize(depth, (tw, th), interpolation=cv2.INTER_LINEAR)

    # Normalize mask to [0, 1]
    mask_f = mask.astype(np.float32)
    if mask_f.max() > 1:
        mask_f /= 255.0
    mask_f = np.clip(mask_f, 0, 1)

    # Normalize depth
    depth_f = depth.astype(np.float32)
    dmax = depth_f.max()
    if dmax > 255:
        depth_f /= 65535.0
    elif dmax > 1.0:
        depth_f /= 255.0
    depth_f = np.clip(depth_f, 0, 1)

    return img, mask_f, depth_f


def inpaint_background(bg_img, fg_mask):
    """Fill the foreground region in the background using inpainting."""
    fg_mask_u8 = (fg_mask * 255).astype(np.uint8)
    # Dilate mask slightly so inpaint covers the edges
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    fg_mask_dilated = cv2.dilate(fg_mask_u8, kernel, iterations=1)
    # Telea inpainting — fast, decent for simple backgrounds
    inpainted = cv2.inpaint(bg_img, fg_mask_dilated, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
    return inpainted


def build_mesh_warp(h, w, t, mask_f, breath_intensity, sway_amplitude):
    """
    Build displacement maps for foreground mesh warp.

    Effects:
      - Breathing: subtle vertical scale oscillation (chest rise/fall)
      - Sway: horizontal sinusoidal displacement (body sway)
      - Micro-jitter: tiny high-frequency noise for organic feel

    All modulated by mask — only affect foreground pixels.
    Returns (map_x, map_y) for cv2.remap.
    """
    y_coords, x_coords = np.meshgrid(
        np.arange(h, dtype=np.float32),
        np.arange(w, dtype=np.float32),
        indexing="ij",
    )

    # ── Breathing (vertical scale oscillation, centered on FG centroid) ──
    # Find FG center of mass
    total = mask_f.sum()
    if total > 0:
        fg_cy = (y_coords * mask_f).sum() / total
        fg_cx = (x_coords * mask_f).sum() / total
    else:
        fg_cy, fg_cx = h / 2, w / 2

    breath_phase = math.sin(t * 2 * math.pi * 0.4)  # ~2.5s breathing cycle
    breath_scale = 1.0 + breath_phase * breath_intensity

    # Vertical: expand/contract from FG center
    dy_breath = (y_coords - fg_cy) * (breath_scale - 1.0)

    # Horizontal: slight expansion too
    dx_breath = (x_coords - fg_cx) * (breath_scale - 1.0) * 0.5

    # ── Sway (horizontal oscillation) ──
    sway_phase = math.sin(t * 2 * math.pi * 0.55 + 0.3)  # slightly different frequency
    dx_sway = sway_phase * sway_amplitude

    # ── Combine, modulate by mask ──
    dx = (dx_breath + dx_sway) * mask_f
    dy = dy_breath * mask_f

    map_x = x_coords + dx
    map_y = y_coords + dy

    return map_x, map_y


def render_layer_animation(
    image: np.ndarray,
    mask: np.ndarray,
    depth: np.ndarray,
    output_path: str,
    duration: float = 5.0,
    fps: int = 30,
    breath_intensity: float = 0.008,
    sway_amplitude: float = 8.0,
    parallax_amplitude: float = 24.0,
):
    h, w = image.shape[:2]
    total_frames = int(duration * fps)

    # ── Split layers ─────────────────────────────────────────────────────
    mask_3 = np.stack([mask] * 3, axis=-1)
    fg_img = (image * mask_3).astype(np.uint8)
    bg_img_original = (image * (1 - mask_3)).astype(np.uint8)

    # Inpaint background (fill FG hole)
    bg_img = inpaint_background(bg_img_original, mask)

    # ── Pre-compute mesh grids for BG parallax ───────────────────────────
    y_coords, x_coords = np.meshgrid(
        np.arange(h, dtype=np.float32),
        np.arange(w, dtype=np.float32),
        indexing="ij",
    )
    cx, cy = w / 2.0, h / 2.0
    max_dx = parallax_amplitude
    max_dy = parallax_amplitude * 0.3
    zoom_total = 1.04

    # ── ffmpeg pipe ──────────────────────────────────────────────────────
    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{w}x{h}",
        "-pix_fmt", "bgr24",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-crf", "18",
        "-preset", "fast",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output_path,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

    # ── Frame loop ───────────────────────────────────────────────────────
    t0 = time.time()
    for fi in range(total_frames):
        t = fi / total_frames  # 0 → 1

        # ── Foreground: mesh warp ────────────────────────────────────────
        fg_map_x, fg_map_y = build_mesh_warp(
            h, w, t, mask, breath_intensity, sway_amplitude
        )
        fg_warped = cv2.remap(fg_img, fg_map_x, fg_map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0))

        # ── Background: parallax displacement ────────────────────────────
        dx_par = (
            math.sin(t * 2 * math.pi * 0.6) * max_dx * 0.7
            + math.sin(t * 2 * math.pi * 1.1) * max_dx * 0.3
        )
        dy_par = (
            math.cos(t * 2 * math.pi * 0.45) * max_dy * 0.6
            + math.sin(t * 2 * math.pi * 1.0) * max_dy * 0.4
        )
        zoom = 1.0 + t * (zoom_total - 1.0)

        bg_map_x = (x_coords - cx) / zoom + cx + dx_par * depth
        bg_map_y = (y_coords - cy) / zoom + cy + dy_par * depth
        bg_warped = cv2.remap(bg_img, bg_map_x, bg_map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

        # ── Composite: BG + FG ──────────────────────────────────────────
        # FG alpha is anti-aliased from warped mask
        fg_alpha = cv2.remap(mask, fg_map_x, fg_map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        fg_alpha_3 = np.stack([fg_alpha] * 3, axis=-1)
        frame = (fg_warped * fg_alpha_3 + bg_warped * (1 - fg_alpha_3)).astype(np.uint8)

        proc.stdin.write(frame.tobytes())

        # Progress tick every 30 frames
        if fi > 0 and fi % 30 == 0:
            elapsed = time.time() - t0
            fps_actual = fi / elapsed if elapsed > 0 else 0
            eta = (total_frames - fi) / fps_actual if fps_actual > 0 else 0
            ts = int(elapsed)
            print(f"  frame {fi}/{total_frames}  ({fps_actual:.0f}fps, {ts}s elapsed, ~{eta:.0f}s remaining)")

    proc.stdin.close()
    ret = proc.wait()
    if ret != 0:
        raise RuntimeError(f"ffmpeg exited with code {ret}")

    total_t = time.time() - t0
    print(f"  ✓ {total_frames} frames in {total_t:.1f}s ({total_frames/total_t:.0f}fps avg)")


def main():
    parser = argparse.ArgumentParser(description="Layer-based animation renderer")
    parser.add_argument("image", help="Input image path")
    parser.add_argument("mask", help="Foreground mask path (white=foreground)")
    parser.add_argument("depth", help="Depth map path")
    parser.add_argument("output", help="Output MP4 path")
    parser.add_argument("--duration", type=float, default=5.0)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--resolution", type=str, default="1920x1080")
    parser.add_argument("--breath", type=float, default=0.008,
                        help="Breathing intensity (0=none, 0.02=strong)")
    parser.add_argument("--sway", type=float, default=8.0,
                        help="Max horizontal sway in pixels")
    parser.add_argument("--parallax", type=float, default=24.0,
                        help="Max parallax displacement")
    args = parser.parse_args()

    for p in [args.image, args.mask, args.depth]:
        if not os.path.exists(p):
            print(f"✗ File not found: {p}", file=sys.stderr)
            sys.exit(1)

    tw, th = map(int, args.resolution.split("x"))
    target_size = (tw, th)

    try:
        img, mask, depth = load_and_resize(args.image, args.mask, args.depth, target_size)
        render_layer_animation(
            img, mask, depth, args.output,
            duration=args.duration,
            fps=args.fps,
            breath_intensity=args.breath,
            sway_amplitude=args.sway,
            parallax_amplitude=args.parallax,
        )
    except Exception as e:
        print(f"✗ {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
