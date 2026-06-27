#!/usr/bin/env python3
"""
Batch foreground segmentation for line-art illustrations.

Uses contour-clustering (no model downloads):
  1. Threshold to extract dark strokes
  2. Dilate to connect nearby strokes into regions
  3. Connected-components → largest region = foreground
  4. Erode back + slight dilate for clean mask

Output: assets/illustrations/masks/<name>_mask.png  (grayscale, 255=foreground)

Usage:
  python3 scripts/segment-illust.py <projectId>
"""

import sys, time
from pathlib import Path

import cv2
import numpy as np

PROJECTS_ROOT = Path(__file__).resolve().parent.parent / "projects"


def project_dir(pid: str) -> Path:
    return PROJECTS_ROOT / pid


def segment_lineart(image: np.ndarray):
    """
    Segment foreground from line-art illustration.
    Returns uint8 mask (255 = foreground, 0 = background).
    """
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # ── 1. Extract dark strokes (invert: black lines → white) ──
    _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

    # ── 2. Dilate to connect nearby strokes into coherent regions ──
    kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (20, 20))
    dilated = cv2.dilate(binary, kernel_dilate, iterations=3)

    # ── 3. Connected components, pick largest as foreground ──
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(dilated, connectivity=4)
    if num_labels <= 1:
        # No structure found — return full-image mask
        return np.full((h, w), 255, dtype=np.uint8)

    # Sort by area descending (skip label 0 = background)
    areas = [(i, stats[i, cv2.CC_STAT_AREA]) for i in range(1, num_labels)]
    areas.sort(key=lambda x: x[1], reverse=True)
    fg_label = areas[0][0]

    fg_area_pct = areas[0][1] / (h * w)

    # If the largest component is nearly the whole image or tiny, fall back
    if fg_area_pct > 0.85:
        return np.full((h, w), 255, dtype=np.uint8)

    fg_mask = (labels == fg_label).astype(np.uint8) * 255

    # ── 4. Erode back to original line thickness ──
    kernel_erode = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (10, 10))
    fg_mask = cv2.erode(fg_mask, kernel_erode, iterations=2)

    # ── 5. Slight dilate to fill small gaps ──
    kernel_fill = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    fg_mask = cv2.dilate(fg_mask, kernel_fill, iterations=1)

    # ── 6. Smooth edges ──
    fg_mask = cv2.GaussianBlur(fg_mask, (5, 5), 0)
    _, fg_mask = cv2.threshold(fg_mask, 128, 255, cv2.THRESH_BINARY)

    return fg_mask


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/segment-illust.py <projectId>", file=sys.stderr)
        sys.exit(1)

    project_id = sys.argv[1]
    ill_dir = project_dir(project_id) / "assets" / "illustrations"
    mask_dir = ill_dir / "masks"

    if not ill_dir.exists():
        print(f"✗ illustrations dir not found: {ill_dir}", file=sys.stderr)
        sys.exit(1)

    images = sorted(
        f for f in ill_dir.iterdir()
        if f.suffix.lower() == ".png" and f.is_file() and f.parent == ill_dir
    )
    if not images:
        print("✗ No PNG images found", file=sys.stderr)
        sys.exit(1)

    mask_dir.mkdir(exist_ok=True)

    todo = []
    skipped = 0
    for img in images:
        out = mask_dir / f"{img.stem}_mask.png"
        if out.exists():
            skipped += 1
        else:
            todo.append((img, out))

    print(f"Images: {len(images)} total, {skipped} cached, {len(todo)} to process")

    if not todo:
        print("✓ All masks already exist")
        return

    t0 = time.time()
    for i, (img_path, out_path) in enumerate(todo):
        image = cv2.imread(str(img_path))
        if image is None:
            print(f"  ✗ Cannot read {img_path.name}, skipping")
            continue

        mask = segment_lineart(image)
        cv2.imwrite(str(out_path), mask)

        elapsed = time.time() - t0
        rate = (i + 1) / elapsed if elapsed > 0 else 0
        remaining = (len(todo) - i - 1) / rate if rate > 0 else 0
        fg_pct = mask.sum() / (255 * mask.size)
        print(f"  [{i+1}/{len(todo)}] {img_path.name}  FG={fg_pct*100:.0f}%  ({elapsed:.1f}s, ~{remaining:.0f}s)")

    total = time.time() - t0
    print(f"✓ Done — {len(todo)} masks in {total:.1f}s ({total/max(len(todo),1):.2f}s per image)")


if __name__ == "__main__":
    main()
