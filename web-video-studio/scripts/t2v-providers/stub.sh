#!/bin/bash
# Stub T2V provider — generates a simple test pattern video via ffmpeg.
# Replace this with an actual T2V API call (e.g., fal.ai, Runway, Pika).
#
# Contract:
#   Input:  $PROMPT        — text description of the video
#           $OUTPUT_PATH    — where to write the MP4
#           $DURATION_SEC   — target duration in seconds
#   Output: MP4 at $OUTPUT_PATH
#   Exit:   0 on success, non-zero on failure

set -euo pipefail

PROMPT="${PROMPT:-test prompt}"
OUTPUT_PATH="${OUTPUT_PATH:?OUTPUT_PATH required}"
DURATION_SEC="${DURATION_SEC:-5.0}"

echo "[stub] Generating ${DURATION_SEC}s test video → ${OUTPUT_PATH}"
echo "[stub] Prompt: ${PROMPT:0:80}..."

# Generate a simple test pattern: colored bars + text overlay
# This creates a valid MP4 so the pipeline works end-to-end
ffmpeg -y \
  -f lavfi -i "color=c=0x1a1a2e:s=1920x1080:d=${DURATION_SEC}:r=30" \
  -f lavfi -i "color=c=0x6c5ce7:s=800x600:d=${DURATION_SEC}:r=30" \
  -filter_complex "[0][1]overlay=(W-w)/2:(H-h)/2:format=auto, \
    drawtext=text='AI Animation Video':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2-40:enable='between(t,0,${DURATION_SEC})', \
    drawtext=text='T2V Stub Provider':fontcolor=0xaaaaaa:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2+20:enable='between(t,0,${DURATION_SEC})'" \
  -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p \
  -movflags +faststart \
  "$OUTPUT_PATH"

echo "[stub] Done: $(du -h "$OUTPUT_PATH" | cut -f1)"
