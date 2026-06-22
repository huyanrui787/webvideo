#!/bin/bash
# Generate macOS .icns icon from a 1024x1024 PNG source.
# Usage: bash scripts/generate-icon.sh <path-to-1024x1024.png>
#
# Requires: macOS with sips and iconutil (built-in).
# If no source is provided, creates a simple placeholder icon.

set -e

ICONSET_DIR="AppIcon.iconset"
OUTPUT_DIR="${2:-assets}"
SOURCE="$1"

mkdir -p "$ICONSET_DIR"

if [ -z "$SOURCE" ] || [ ! -f "$SOURCE" ]; then
  echo "No source image provided, generating placeholder icon..."
  # Create a simple 1024x1024 gradient PNG using sips
  # (sips can't create from scratch, so we use a built-in color)
  SOURCE="/tmp/icon-placeholder-1024.png"
  # Use a simple approach: create a colored rectangle via Python
  python3 -c "
import struct, zlib
def create_png(w, h, r, g, b):
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    header = b'\\x89PNG\\r\\n\\x1a\\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    raw = b''
    for y in range(h):
        raw += b'\\x00'  # filter none
        for x in range(w):
            # Simple gradient: blue-purple
            pr = int(r * (1 - y/h) + 30 * (y/h))
            pg = int(g * (1 - y/h) + 20 * (y/h))
            pb = int(b * (1 - y/h) + 80 * (y/h))
            raw += struct.pack('BBB', pr, pg, pb)
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    with open('$SOURCE', 'wb') as f:
        f.write(header + ihdr + idat + iend)
create_png(1024, 1024, 59, 130, 246)
  "
  echo "Placeholder created at $SOURCE"
fi

# Create all required sizes
echo "Generating icon sizes..."
sips -z 16 16   "$SOURCE" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null 2>&1
sips -z 32 32   "$SOURCE" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null 2>&1
sips -z 32 32   "$SOURCE" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null 2>&1
sips -z 64 64   "$SOURCE" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null 2>&1
sips -z 128 128 "$SOURCE" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null 2>&1
sips -z 256 256 "$SOURCE" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null 2>&1
sips -z 256 256 "$SOURCE" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null 2>&1
sips -z 512 512 "$SOURCE" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null 2>&1
sips -z 512 512 "$SOURCE" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null 2>&1
cp "$SOURCE" "$ICONSET_DIR/icon_512x512@2x.png"

# Generate .icns
iconutil -c icns "$ICONSET_DIR" -o "$OUTPUT_DIR/icon.icns"

# Cleanup
rm -rf "$ICONSET_DIR"

echo "✅ Icon created at $OUTPUT_DIR/icon.icns"
