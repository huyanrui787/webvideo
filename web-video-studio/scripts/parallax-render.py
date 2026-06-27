#!/usr/bin/env python3
"""
Parallax video renderer — converts a static image + depth map into a video
clip with 2.5D parallax motion (depth-weighted pixel displacement).

The effect: near objects shift more than distant objects, simulating a subtle
camera orbit/sway. Much more lifelike than flat Ken Burns zoom.

Usage:
  python3 scripts/parallax-render.py <image.png> <depth.png> <output.mp4> [options]

Options:
  --duration=5.0     Clip duration in seconds (default 5.0)
  --fps=30           Output frame rate
  --amplitude=24     Max horizontal pixel displacement
  --resolution=1920x1080  Output resolution (resizes input to fill)

Pipe-based ffmpeg encoding — no temp files.
"""

import sys, os, math, subprocess, argparse
from pathlib import Path

import cv2
import numpy as np


def render_parallax(
    image_path: str,
    depth_path: str,
    output_path: str,
    duration: float = 5.0,
    fps: int = 30,
    amplitude: float = 24.0,
    resolution=None,
):
    # ── Load inputs ──────────────────────────────────────────────────────
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    depth = cv2.imread(depth_path, cv2.IMREAD_GRAYSCALE)
    if depth is None:
        raise FileNotFoundError(f"Cannot read depth map: {depth_path}")

    h, w = img.shape[:2]

    # Resize depth to match image
    depth = cv2.resize(depth, (w, h)).astype(np.float32)

    # Normalize: handle 8-bit (max~255), 16-bit (max~65535), or already-float
    d_max = depth.max()
    if d_max > 255:
        depth /= 65535.0
    elif d_max > 1.0:
        depth /= 255.0
    # else already in [0, 1]

    # Apply gentle edge-preserving blur to depth for smoother motion
    depth_u8 = (np.clip(depth, 0, 1) * 255).astype(np.uint8)
    depth_u8 = cv2.bilateralFilter(depth_u8, 9, 75, 75)
    depth = depth_u8.astype(np.float32) / 255.0

    # ── Resolution ───────────────────────────────────────────────────────
    out_w, out_h = resolution if resolution else (w, h)
    # We render at output resolution, then resize depth to match
    if (out_w, out_h) != (w, h):
        img = cv2.resize(img, (out_w, out_h), interpolation=cv2.INTER_LANCZOS4)
        depth = cv2.resize(depth, (out_w, out_h))
        h, w = out_h, out_w

    # ── Motion parameters ────────────────────────────────────────────────
    total_frames = int(duration * fps)
    # Lissajous-like camera orbit — gentle figure-8 + slight drift
    max_dx = amplitude
    max_dy = amplitude * 0.3
    zoom_total = 1.04  # subtle progressive zoom over entire clip

    # Meshgrid for vectorized remap (compute once)
    y_coords, x_coords = np.meshgrid(
        np.arange(h, dtype=np.float32),
        np.arange(w, dtype=np.float32),
        indexing="ij",
    )
    cx, cy = w / 2.0, h / 2.0

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
    for fi in range(total_frames):
        t = fi / total_frames  # 0 → 1

        # Lissajous orbit (gentle figure-8)
        dx = (
            math.sin(t * 2 * math.pi * 0.6) * max_dx * 0.7
            + math.sin(t * 2 * math.pi * 1.1) * max_dx * 0.3
        )
        dy = (
            math.cos(t * 2 * math.pi * 0.45) * max_dy * 0.6
            + math.sin(t * 2 * math.pi * 1.0) * max_dy * 0.4
        )

        # Progressive zoom
        zoom = 1.0 + t * (zoom_total - 1.0)

        # Map: un-zoom from center, then apply depth-weighted displacement
        map_x = (x_coords - cx) / zoom + cx + dx * depth
        map_y = (y_coords - cy) / zoom + cy + dy * depth

        frame = cv2.remap(img, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        proc.stdin.write(frame.tobytes())

    proc.stdin.close()
    ret = proc.wait()
    if ret != 0:
        raise RuntimeError(f"ffmpeg exited with code {ret}")


def main():
    parser = argparse.ArgumentParser(description="Parallax video renderer")
    parser.add_argument("image", help="Input image path")
    parser.add_argument("depth", help="Depth map path (grayscale, white=near)")
    parser.add_argument("output", help="Output MP4 path")
    parser.add_argument("--duration", type=float, default=5.0)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--amplitude", type=float, default=24.0,
                        help="Max horizontal pixel displacement (default: 24)")
    parser.add_argument("--resolution", type=str, default=None,
                        help="Output resolution WxH (e.g. 1920x1080)")
    args = parser.parse_args()

    resolution = None
    if args.resolution:
        parts = args.resolution.split("x")
        resolution = (int(parts[0]), int(parts[1]))

    if not os.path.exists(args.image):
        print(f"✗ Image not found: {args.image}", file=sys.stderr)
        sys.exit(1)
    if not os.path.exists(args.depth):
        print(f"✗ Depth map not found: {args.depth}", file=sys.stderr)
        sys.exit(1)

    try:
        render_parallax(
            args.image, args.depth, args.output,
            duration=args.duration,
            fps=args.fps,
            amplitude=args.amplitude,
            resolution=resolution,
        )
        print(f"✓ {args.output}")
    except Exception as e:
        print(f"✗ {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
