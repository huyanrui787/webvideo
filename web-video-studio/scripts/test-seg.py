#!/usr/bin/env python3
"""
Segmentation test using pure OpenCV — no model downloads needed.

Two approaches:
  1. GrabCut — classic OpenCV foreground extraction (needs a bounding box)
  2. Depth-guided — uses existing pseudo-depth map as segmentation proxy

Usage:
  python3 scripts/test-seg.py <image.png> [--depth <depth.png>]
"""

import sys, os, time, argparse
from pathlib import Path

import cv2
import numpy as np


def grabcut_segment(image_bgr: np.ndarray):
    """
    GrabCut foreground extraction.
    Auto-detects subject bounding box via edge-density centroid.
    """
    h, w = image_bgr.shape[:2]

    # Find likely subject region via edge density
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    # Blur edges to create a density heatmap
    density = cv2.GaussianBlur(edges.astype(np.float32), (51, 51), 0)

    # Find the center of mass of edge density
    ys, xs = np.meshgrid(np.arange(h), np.arange(w), indexing="ij")
    total = density.sum()
    if total < 1:
        # Fallback: center 60% of image
        cx, cy = w // 2, h // 2
        bw, bh = int(w * 0.5), int(h * 0.7)
    else:
        cx = int((xs * density).sum() / total)
        cy = int((ys * density).sum() / total)
        # Box size proportional to edge spread
        spread = max(np.sqrt(((xs - cx) ** 2 + (ys - cy) ** 2) * density).sum() / total, min(w, h) * 0.2)
        spread = min(spread * 1.5, min(w, h) * 0.45)
        bw = int(spread)
        bh = int(spread)

    # Clamp bounding box within image
    x1 = max(5, cx - bw)
    y1 = max(5, cy - bh)
    x2 = min(w - 5, cx + bw)
    y2 = min(h - 5, cy + bh)
    rect = (x1, y1, x2 - x1, y2 - y1)

    # GrabCut
    mask = np.zeros((h, w), np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    cv2.grabCut(image_bgr, mask, rect, bgd_model, fgd_model, 3, cv2.GC_INIT_WITH_RECT)

    # mask: 0=bg, 1=fg, 2=probable_bg, 3=probable_fg
    fg_mask = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)

    # Clean up with morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)

    return fg_mask, rect


def depth_segment(image_bgr: np.ndarray, depth_path: str):
    """
    Use pseudo-depth map to segment foreground (near) from background (far).
    """
    depth = cv2.imread(depth_path, cv2.IMREAD_UNCHANGED)
    if depth is None:
        return None

    h, w = image_bgr.shape[:2]
    depth = cv2.resize(depth, (w, h)).astype(np.float32)
    if depth.max() > 255:
        depth /= 65535.0
    elif depth.max() > 1.0:
        depth /= 255.0

    # Otsu threshold on depth: near = foreground, far = background
    depth_u8 = (depth * 255).astype(np.uint8)
    _, fg_mask = cv2.threshold(depth_u8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Clean up
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)

    return fg_mask


def save_result(image_bgr, fg_mask, out_path: str, method: str, bbox=None):
    """Save segmentation visualization: original + mask overlay + cutout."""
    h, w = image_bgr.shape[:2]
    mask_f = fg_mask.astype(np.float32) / 255.0
    mask_3 = np.stack([mask_f] * 3, axis=-1)

    # Overlay
    green = np.zeros_like(image_bgr)
    green[:, :, 1] = 100
    overlay = (image_bgr * 0.5 + green * mask_3 * 0.5).astype(np.uint8)

    # Draw bbox if available
    if bbox:
        x, y, bw, bh = bbox
        cv2.rectangle(overlay, (x, y), (x + bw, y + bh), (0, 255, 255), 2)

    cv2.imwrite(out_path, overlay)

    # Cutout (foreground on black)
    cutout = (image_bgr * mask_3).astype(np.uint8)
    cutout_path = out_path.replace(".png", ".cutout.png")
    cv2.imwrite(cutout_path, cutout)

    # Mask alone
    mask_path = out_path.replace(".png", ".mask.png")
    cv2.imwrite(mask_path, fg_mask)

    print(f"  Overlay: {out_path}")
    print(f"  Cutout:  {cutout_path}")
    print(f"  Mask:    {mask_path}")
    if bbox:
        print(f"  BBox:    {bbox}")
    print(f"  FG%:     {mask_f.mean() * 100:.1f}%")


def main():
    parser = argparse.ArgumentParser(description="Test segmentation")
    parser.add_argument("image", help="Input image path")
    parser.add_argument("--depth", default=None, help="Depth map path")
    parser.add_argument("--method", default="grabcut", choices=["grabcut", "depth", "both"])
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"✗ Image not found: {args.image}", file=sys.stderr)
        sys.exit(1)

    image = cv2.imread(args.image)
    if image is None:
        print(f"✗ Cannot read: {args.image}", file=sys.stderr)
        sys.exit(1)

    print(f"Image: {args.image}  ({image.shape[1]}×{image.shape[0]})")
    out_base = args.output or str(Path(args.image).with_suffix(".seg.png"))

    methods = ["grabcut", "depth"] if args.method == "both" else [args.method]

    for method in methods:
        print(f"\n─── {method.upper()} ───")
        t0 = time.time()

        if method == "grabcut":
            fg_mask, bbox = grabcut_segment(image)
            out = out_base.replace(".seg.png", ".gc.png")
            save_result(image, fg_mask, out, "grabcut", bbox)

        elif method == "depth":
            depth_path = args.depth
            # Auto-detect depth from depth/ subdirectory
            if not depth_path:
                img_dir = Path(args.image).parent
                img_stem = Path(args.image).stem
                candidate = img_dir / "depth" / f"{img_stem}_depth.png"
                if candidate.exists():
                    depth_path = str(candidate)

            if not depth_path or not os.path.exists(depth_path):
                print(f"  ✗ No depth map found. Run estimate-depth.py first, or pass --depth")
                continue

            fg_mask = depth_segment(image, depth_path)
            if fg_mask is None:
                print(f"  ✗ Failed to read depth map")
                continue
            out = out_base.replace(".seg.png", ".depth.png")
            save_result(image, fg_mask, out, "depth")

        print(f"  Time: {time.time() - t0:.2f}s")

    print("\n✓ Done")


if __name__ == "__main__":
    main()
