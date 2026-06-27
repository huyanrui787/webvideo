#!/usr/bin/env python3
"""
Pseudo-depth estimation for illustration images — pure image processing.

No model downloads, no GPU needed. Uses multiple visual cues to create a
plausible depth map for parallax rendering:

  1. Edge density   — detailed areas tend to be foreground
  2. Color chroma    — saturated areas tend to be foreground
  3. Brightness      — brighter areas advance
  4. Position bias   — bottom of frame is often closer

These are blended into a grayscale depth map (white = near, black = far).
The result isn't metric depth but it's good enough for parallax — the key
insight is that parallax only needs RELATIVE depth, not absolute accuracy.

Usage:
  python3 scripts/estimate-depth.py <projectId>
"""

import sys, time
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

PROJECTS_ROOT = Path(__file__).resolve().parent.parent / "projects"


def project_dir(pid: str) -> Path:
    return PROJECTS_ROOT / pid


def estimate_depth(image: np.ndarray) -> np.ndarray:
    """
    Compute a pseudo-depth map from a BGR image.
    Returns a float32 array in [0, 1] where 1 = near.
    """
    h, w = image.shape[:2]

    # ── 1. Edge density ──────────────────────────────────────────────────
    # More edges/details = closer to viewer
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    edges = np.sqrt(gx ** 2 + gy ** 2)
    edges = cv2.GaussianBlur(edges, (21, 21), 0)
    edges = edges / (edges.max() + 1e-8)

    # ── 2. Color chroma (saturation in Lab) ──────────────────────────────
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab.astype(np.float32))
    # Chroma = distance from gray axis in a*b* plane
    chroma = np.sqrt((a_channel - 128) ** 2 + (b_channel - 128) ** 2)
    chroma = cv2.GaussianBlur(chroma, (31, 31), 0)
    chroma = chroma / (chroma.max() + 1e-8)

    # ── 3. Brightness ────────────────────────────────────────────────────
    # In most illustrations, lighter elements come forward
    l_norm = l_channel / 255.0
    l_norm = cv2.GaussianBlur(l_norm, (15, 15), 0)

    # ── 4. Position bias ─────────────────────────────────────────────────
    # Gentle vertical gradient: bottom = closer (0 bias), top = further (negative bias)
    y_ramp = np.linspace(0, 1, h, dtype=np.float32).reshape(h, 1)
    y_ramp = np.tile(y_ramp, (1, w))  # 0 at top, 1 at bottom
    position = y_ramp * 0.25  # mild bottom bias

    # ── Blend ────────────────────────────────────────────────────────────
    depth = (
        edges   * 0.35 +
        chroma  * 0.25 +
        l_norm  * 0.20 +
        position * 0.20
    )
    depth = np.clip(depth, 0, 1)

    # Normalize to full [0, 1] range for maximum parallax contrast
    d_min, d_max = depth.min(), depth.max()
    if d_max - d_min > 1e-6:
        depth = (depth - d_min) / (d_max - d_min)

    # Gentle edge-preserving smooth for cleaner parallax
    depth_u8 = (depth * 255).astype(np.uint8)
    depth_u8 = cv2.bilateralFilter(depth_u8, 9, 75, 75)
    depth = depth_u8.astype(np.float32) / 255.0

    return depth


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/estimate-depth.py <projectId>", file=sys.stderr)
        sys.exit(1)

    project_id = sys.argv[1]
    ill_dir = project_dir(project_id) / "assets" / "illustrations"
    depth_dir = ill_dir / "depth"

    if not ill_dir.exists():
        print(f"✗ illustrations dir not found: {ill_dir}", file=sys.stderr)
        sys.exit(1)

    # Collect PNG images (not in depth/ subdir)
    images = sorted(
        f for f in ill_dir.iterdir()
        if f.suffix.lower() == ".png" and f.is_file() and f.parent == ill_dir
    )
    if not images:
        print("✗ No PNG images found", file=sys.stderr)
        sys.exit(1)

    depth_dir.mkdir(exist_ok=True)

    # Skip already-processed
    todo = []
    skipped = 0
    for img in images:
        out = depth_dir / f"{img.stem}_depth.png"
        if out.exists():
            skipped += 1
        else:
            todo.append((img, out))

    print(f"Images: {len(images)} total, {skipped} cached, {len(todo)} to process")

    if not todo:
        print("✓ All depth maps already exist")
        return

    # ── Process ──────────────────────────────────────────────────────────
    t0 = time.time()
    for i, (img_path, out_path) in enumerate(todo):
        image = cv2.imread(str(img_path))
        if image is None:
            print(f"  ✗ Cannot read {img_path.name}, skipping")
            continue

        depth = estimate_depth(image)
        depth_u16 = (depth * 65535).astype(np.uint16)
        cv2.imwrite(str(out_path), depth_u16)

        elapsed = time.time() - t0
        rate = (i + 1) / elapsed if elapsed > 0 else 0
        remaining = (len(todo) - i - 1) / rate if rate > 0 else 0
        print(f"  [{i+1}/{len(todo)}] {img_path.name}  ({elapsed:.1f}s elapsed, ~{remaining:.0f}s remaining)")

    total = time.time() - t0
    print(f"✓ Done — {len(todo)} depth maps in {total:.1f}s ({total/max(len(todo),1):.2f}s per image)")


if __name__ == "__main__":
    main()
