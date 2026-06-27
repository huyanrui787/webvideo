#!/usr/bin/env python3
"""
Character body-part decomposition for skeletal animation.

Takes an illustration + its foreground mask, splits the character into
independently animatable body parts:

  head     — top region of FG
  torso    — middle region
  arm_l    — left side of torso region
  arm_r    — right side of torso region
  legs     — bottom region
  prop     — disconnected FG blobs (speech bubbles, objects)

Each part is saved as an RGBA PNG with transparency.
A JSON skeleton definition maps pivot points and animation constraints.

Usage:
  python3 scripts/decompose-character.py <projectId>
  python3 scripts/decompose-character.py <projectId> --image step-01-c29372.png
"""

import sys, os, time, json, argparse
from pathlib import Path

import cv2
import numpy as np

PROJECTS_ROOT = Path(__file__).resolve().parent.parent / "projects"


def project_dir(pid: str) -> Path:
    return PROJECTS_ROOT / pid


def decompose(image_bgr: np.ndarray, mask: np.ndarray):
    """
    Split a character into body parts.
    Returns dict: { part_name: (rgba_image, pivot_xy, bone_def) }
    """
    h, w = image_bgr.shape[:2]
    mask_f = mask.astype(np.float32) / 255.0

    # Find FG bounding box
    ys, xs = np.where(mask > 128)
    if len(ys) < 100:
        # Too small — treat as single part
        rgba = np.dstack([image_bgr, mask])
        return {"full": (rgba, (w // 2, h // 2), {"type": "full"})}

    x_min, x_max = xs.min(), xs.max()
    y_min, y_max = ys.min(), ys.max()
    fg_h = y_max - y_min
    fg_w = x_max - x_min

    # ── Define body-part regions (heuristic proportions) ──
    # These match typical cartoon character proportions
    head_bottom   = y_min + fg_h * 0.22
    neck_bottom   = y_min + fg_h * 0.30
    torso_bottom  = y_min + fg_h * 0.55
    hip_bottom    = y_min + fg_h * 0.62
    leg_top       = y_min + fg_h * 0.58
    mid_x         = (x_min + x_max) / 2
    arm_left_x    = x_min + fg_w * 0.25
    arm_right_x   = x_min + fg_w * 0.75
    prop_y        = y_min + fg_h * 0.3  # above this = prop region

    parts = {}

    # ── Head ────────────────────────────────────────────────────────────
    head_region = np.zeros((h, w), dtype=np.float32)
    head_region[:int(head_bottom), :] = 1.0
    head_alpha = mask_f * head_region
    if head_alpha.max() > 0.01:
        head_pivot = (int(mid_x), int(y_min + fg_h * 0.08))
        parts["head"] = (
            make_rgba(image_bgr, head_alpha),
            head_pivot,
            {"type": "head", "sway": 6, "nod": 4, "tilt": 3},
        )

    # ── Torso ───────────────────────────────────────────────────────────
    torso_region = np.zeros((h, w), dtype=np.float32)
    torso_region[int(neck_bottom):int(torso_bottom), int(x_min * 0.9):int(x_max * 1.1)] = 1.0
    # Exclude arm side regions
    torso_region[:, int(arm_right_x):] = 0.3
    torso_region[:, :int(arm_left_x)] = 0.3
    torso_alpha = mask_f * torso_region
    if torso_alpha.max() > 0.01:
        torso_pivot = (int(mid_x), int(y_min + fg_h * 0.35))
        parts["torso"] = (
            make_rgba(image_bgr, torso_alpha),
            torso_pivot,
            {"type": "torso", "sway": 4, "breathe": 0.006},
        )

    # ── Left arm ────────────────────────────────────────────────────────
    arm_l_region = np.zeros((h, w), dtype=np.float32)
    arm_l_region[int(neck_bottom):int(hip_bottom), :int(arm_left_x + fg_w * 0.05)] = 1.0
    arm_l_alpha = mask_f * arm_l_region
    # Remove overlap with torso
    arm_l_alpha = np.clip(arm_l_alpha - torso_alpha * 0.3, 0, 1)
    if arm_l_alpha.max() > 0.01:
        arm_l_pivot = (int(x_min + fg_w * 0.1), int(y_min + fg_h * 0.35))
        parts["arm_l"] = (
            make_rgba(image_bgr, arm_l_alpha),
            arm_l_pivot,
            {"type": "arm", "swing": 12, "side": "left"},
        )

    # ── Right arm ───────────────────────────────────────────────────────
    arm_r_region = np.zeros((h, w), dtype=np.float32)
    arm_r_region[int(neck_bottom):int(hip_bottom), int(arm_right_x - fg_w * 0.05):] = 1.0
    arm_r_alpha = mask_f * arm_r_region
    arm_r_alpha = np.clip(arm_r_alpha - torso_alpha * 0.3, 0, 1)
    if arm_r_alpha.max() > 0.01:
        arm_r_pivot = (int(x_max - fg_w * 0.1), int(y_min + fg_h * 0.35))
        parts["arm_r"] = (
            make_rgba(image_bgr, arm_r_alpha),
            arm_r_pivot,
            {"type": "arm", "swing": 10, "side": "right"},
        )

    # ── Legs ────────────────────────────────────────────────────────────
    leg_region = np.zeros((h, w), dtype=np.float32)
    leg_region[int(leg_top):, :] = 1.0
    leg_alpha = mask_f * leg_region
    if leg_alpha.max() > 0.01:
        leg_pivot = (int(mid_x), int(y_min + fg_h * 0.65))
        parts["legs"] = (
            make_rgba(image_bgr, leg_alpha),
            leg_pivot,
            {"type": "legs", "sway": 2},
        )

    # ── Props (speech bubbles, objects — disconnected FG blobs) ─────────
    # Find small connected components above the character
    _, labels, stats, _ = cv2.connectedComponentsWithStats(
        (mask > 128).astype(np.uint8), connectivity=4
    )
    for i in range(1, len(stats)):
        area = stats[i, cv2.CC_STAT_AREA]
        cy = stats[i, cv2.CC_STAT_TOP] + stats[i, cv2.CC_STAT_HEIGHT] / 2
        if area < fg_h * fg_w * 0.3 and cy < y_min + fg_h * 0.5:
            prop_alpha = np.where(labels == i, mask_f, 0).astype(np.float32)
            if prop_alpha.max() > 0.01 and prop_alpha.sum() > 100:
                name = f"prop_{i}"
                px = int(stats[i, cv2.CC_STAT_LEFT] + stats[i, cv2.CC_STAT_WIDTH] / 2)
                py = int(stats[i, cv2.CC_STAT_TOP] + stats[i, cv2.CC_STAT_HEIGHT] / 2)
                parts[name] = (
                    make_rgba(image_bgr, prop_alpha),
                    (px, py),
                    {"type": "prop", "float": 3},
                )

    # If no parts found (decomposition failed), return full character
    if not parts:
        rgba = np.dstack([image_bgr, mask])
        return {"full": (rgba, (w // 2, h // 2), {"type": "full"})}

    return parts


def make_rgba(image_bgr, alpha):
    """Create RGBA image from BGR + alpha mask."""
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    alpha_u8 = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    rgba = np.dstack([image_rgb, alpha_u8])
    return rgba


def main():
    parser = argparse.ArgumentParser(description="Character body-part decomposition")
    parser.add_argument("project", help="Project ID")
    parser.add_argument("--image", default=None, help="Single image to process")
    args = parser.parse_args()

    pid = args.project
    ill_dir = project_dir(pid) / "assets" / "illustrations"
    mask_dir = ill_dir / "masks"
    parts_dir = ill_dir / "parts"

    if not ill_dir.exists():
        print(f"✗ illustrations dir not found: {ill_dir}", file=sys.stderr)
        sys.exit(1)
    if not mask_dir.exists():
        print(f"✗ masks dir not found — run segment-illust.py first", file=sys.stderr)
        sys.exit(1)

    # Build image list
    if args.image:
        candidates = [ill_dir / args.image]
    else:
        candidates = sorted(
            f for f in ill_dir.iterdir()
            if f.suffix.lower() == ".png" and f.is_file() and f.parent == ill_dir
        )

    images = []
    for img_path in candidates:
        if not img_path.exists():
            print(f"  ✗ not found: {img_path.name}")
            continue
        mask_path = mask_dir / f"{img_path.stem}_mask.png"
        if not mask_path.exists():
            continue
        images.append((img_path, mask_path))

    if not images:
        print("✗ No image+mask pairs found", file=sys.stderr)
        sys.exit(1)

    parts_dir.mkdir(exist_ok=True)

    todo = []
    skipped = 0
    for img_path, _ in images:
        out_dir = parts_dir / img_path.stem
        skeleton_file = out_dir / "skeleton.json"
        if skeleton_file.exists():
            skipped += 1
        else:
            todo.append((img_path, mask_dir / f"{img_path.stem}_mask.png"))

    print(f"Images: {len(images)} total, {skipped} cached, {len(todo)} to process")

    if not todo:
        print("✓ All characters already decomposed")
        return

    t0 = time.time()
    for i, (img_path, mask_path) in enumerate(todo):
        image = cv2.imread(str(img_path))
        mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
        if image is None or mask is None:
            print(f"  ✗ Cannot read {img_path.name}")
            continue

        parts = decompose(image, mask)
        out_dir = parts_dir / img_path.stem
        out_dir.mkdir(exist_ok=True)

        # Save each part as RGBA PNG
        skeleton = {"parts": {}, "imageSize": [image.shape[1], image.shape[0]]}
        for name, (rgba, pivot, bone) in parts.items():
            part_path = out_dir / f"{name}.png"
            cv2.imwrite(str(part_path), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
            skeleton["parts"][name] = {
                "file": f"{name}.png",
                "pivot": list(pivot),
                "bone": bone,
            }

        with open(out_dir / "skeleton.json", "w") as f:
            json.dump(skeleton, f, indent=2)

        elapsed = time.time() - t0
        rate = (i + 1) / elapsed if elapsed > 0 else 0
        remaining = (len(todo) - i - 1) / rate if rate > 0 else 0
        print(f"  [{i+1}/{len(todo)}] {img_path.name} → {len(parts)} parts ({elapsed:.0f}s, ~{remaining:.0f}s)")

    total = time.time() - t0
    print(f"✓ Done — {len(todo)} characters in {total:.1f}s ({total/max(len(todo),1):.2f}s each)")


if __name__ == "__main__":
    main()
