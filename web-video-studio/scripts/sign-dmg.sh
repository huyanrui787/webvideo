#!/bin/bash
# Post-build: extract .app from electron-builder's DMG, ad-hoc sign it,
# and create a new DMG that doesn't trigger the "damaged" error.
#
# Without this, macOS shows "WebVideo Studio is damaged and can't be opened"
# because Electron's embedded linker signature conflicts with the app bundle.
#
# Result: "unidentified developer" warning (bypass with right-click → Open)
# instead of "damaged" (which can't be bypassed).
set -e

DMG_IN="$1"
if [ -z "$DMG_IN" ]; then
  DMG_IN=$(ls -t release/WebVideo\ Studio-*.dmg 2>/dev/null | grep -v signed | head -1)
fi

if [ ! -f "$DMG_IN" ]; then
  echo "Usage: bash scripts/sign-dmg.sh <path-to-dmg>"
  echo "No unsigned DMG found in release/"
  exit 1
fi

BASE=$(basename "$DMG_IN" .dmg)
DMG_OUT="release/${BASE}-signed.dmg"

echo "=== Input:  $DMG_IN ==="
echo "=== Output: $DMG_OUT ==="

# Clean up any stale mounts
hdiutil detach "/Volumes/WebVideo Studio" -force 2>/dev/null || true
hdiutil detach "/Volumes/WebVideo Studio 0.1.0-arm64" -force 2>/dev/null || true

# Mount original DMG
MOUNT_POINT=$(mktemp -d /tmp/wvs-mount.XXXXXX)
hdiutil attach "$DMG_IN" -mountpoint "$MOUNT_POINT" -nobrowse -quiet
sleep 2

# Find the .app
APP_SRC=$(find "$MOUNT_POINT" -name "*.app" -maxdepth 1 | head -1)
if [ -z "$APP_SRC" ]; then
  echo "ERROR: No .app found in DMG"
  hdiutil detach "$MOUNT_POINT" -quiet
  exit 1
fi
APP_NAME=$(basename "$APP_SRC")
echo "Found: $APP_NAME"

# Copy to staging
STAGING=$(mktemp -d /tmp/wvs-staging.XXXXXX)
cp -R "$APP_SRC" "$STAGING/$APP_NAME"
hdiutil detach "$MOUNT_POINT" -quiet

# Clean and sign
echo "Signing..."
xattr -cr "$STAGING/$APP_NAME" 2>/dev/null || true
find "$STAGING/$APP_NAME" -name ".DS_Store" -delete 2>/dev/null || true
codesign --remove-signature "$STAGING/$APP_NAME" 2>/dev/null || true
codesign --force --sign - "$STAGING/$APP_NAME" 2>/dev/null

# Verify
echo "Verify:"
codesign -dvv "$STAGING/$APP_NAME" 2>&1 | grep -E "Identifier|Signature|Sealed" || echo "(no signature — may need right-click → Open)"

# Create new DMG
rm -f "$DMG_OUT"
hdiutil create -volname "WebVideo Studio" -srcfolder "$STAGING" -ov -format UDZO "$DMG_OUT" > /dev/null 2>&1
xattr -cr "$DMG_OUT" 2>/dev/null || true

# Cleanup
rm -rf "$STAGING" "$MOUNT_POINT"

echo ""
echo "✓ Signed DMG: $DMG_OUT"
echo "  Size: $(du -sh "$DMG_OUT" | cut -f1)"
echo ""
echo "To install:"
echo "  1. Open $DMG_OUT"
echo "  2. Drag 'WebVideo Studio.app' to Applications"
echo "  3. Right-click the app in Applications → Open"
