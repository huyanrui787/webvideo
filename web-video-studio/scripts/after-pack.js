/**
 * electron-builder afterPack hook — ad-hoc sign the .app bundle.
 *
 * Without this, Electron's embedded linker signature creates a mismatch:
 * the binary claims to be signed but no CodeResources exist in the bundle,
 * causing macOS to show "damaged and can't be opened."
 *
 * Steps:
 *   1. Strip existing linker signatures
 *   2. Fully clean xattrs (especially com.apple.FinderInfo which Finder re-applies)
 *   3. Remove Finder detritus (.DS_Store, ._*, etc.)
 *   4. Ad-hoc sign the entire .app bundle RIGHT AFTER cleaning
 *
 * Result: Gatekeeper shows "unidentified developer" (not "damaged"),
 * which the user can bypass via right-click → Open.
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.default = async function afterPack(context) {
  const { appOutDir, packager } = context;
  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  if (!fs.existsSync(appPath)) {
    console.log(`[after-pack] App not found at ${appPath}, skipping`);
    return;
  }

  console.log(`[after-pack] Signing: ${appPath}`);

  try {
    // 1. Strip existing linker signature (Electron binary has one from build)
    execSync(`codesign --remove-signature "${appPath}" 2>/dev/null; exit 0`, {
      stdio: "pipe", timeout: 30_000, shell: true,
    });
    const macExe = path.join(appPath, "Contents", "MacOS", appName);
    if (fs.existsSync(macExe)) {
      try {
        execSync(`codesign --remove-signature "${macExe}" 2>/dev/null; exit 0`, {
          stdio: "pipe", timeout: 10_000, shell: true,
        });
      } catch { /* ok */ }
    }
    console.log("[after-pack] Removed linker signatures");

    // 2. Clean xattrs and sign ATOMICALLY — Finder re-applies FinderInfo constantly
    // The xattr delete + codesign must be in the same shell command to minimize the race window
    execSync(
      [
        // Clean all xattrs on the .app bundle itself
        `xattr -d com.apple.FinderInfo "${appPath}" 2>/dev/null || true`,
        `xattr -d com.apple.provenance "${appPath}" 2>/dev/null || true`,
        // Clean Finder detritus files (must happen before signing)
        `find "${appPath}" \\( -name ".DS_Store" -o -name "._*" \\) -delete 2>/dev/null || true`,
        // Sign immediately
        `codesign --force --sign - "${appPath}"`,
      ].join(" && "),
      { stdio: "pipe", timeout: 60_000, shell: true }
    );
    console.log("[after-pack] ✓ Ad-hoc signed successfully");

    // Verify
    const verify = execSync(`codesign -dvv "${appPath}" 2>&1`, {
      stdio: "pipe", timeout: 10_000,
    }).toString();
    const hasSealed = verify.includes("Sealed Resources");
    console.log(
      `[after-pack] Verify: ${hasSealed ? "Sealed ✓" : "No seal ✗"}`
    );
  } catch (err) {
    const msg = err.stderr?.toString() || err.message;
    console.error("[after-pack] Signing error:", msg.slice(0, 300));
    console.log(
      "[after-pack] App built without signature — right-click → Open to bypass Gatekeeper"
    );
  }
};
