/**
 * Scaffold Repair — restore missing skeleton files without touching chapters.
 *
 * Triggered when isScaffolded() returns false (skeleton incomplete) but
 * hasRealChapters() returns true (chapters exist). Repairs only the scaffolding
 * — never deletes or overwrites chapter code.
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { projectDir, writeProjectFile } from "@/lib/projects";
import { getSkill } from "@/lib/skills";
import { MAIN_SKILL_ID } from "@/lib/skills";

const SENTINEL_FILES = [
  "src/styles/tokens.css",
  "src/primitives/index.ts",
  "src/PrimitivePreview.tsx",
  "src/config/stage.ts",
  "src/components/VisualFrame.tsx",
  "node_modules/gsap",
  "node_modules/.bin/vite",
];

function templateRoot(): string {
  const skill = getSkill(MAIN_SKILL_ID);
  return path.join(skill?.path ?? "", "templates");
}

export async function repairScaffold(
  projectId: string,
  theme: string,
  orientation: string,
  projectFormat: string,
  mainSkillId: string
): Promise<void> {
  const presDir = path.join(projectDir(projectId), "presentation");
  const templateDir = templateRoot();

  // Ensure directories exist
  fs.mkdirSync(path.join(presDir, "src/styles"), { recursive: true });
  fs.mkdirSync(path.join(presDir, "src/hooks"), { recursive: true });
  fs.mkdirSync(path.join(presDir, "src/components"), { recursive: true });
  fs.mkdirSync(path.join(presDir, "src/registry"), { recursive: true });
  fs.mkdirSync(path.join(presDir, "src/primitives"), { recursive: true });
  fs.mkdirSync(path.join(presDir, "src/config"), { recursive: true });
  fs.mkdirSync(path.join(presDir, "public"), { recursive: true });
  fs.mkdirSync(path.join(presDir, "scripts"), { recursive: true });

  // Copy individual missing files from template (skip chapters/)
  const filesToRepair: Array<{ src: string; dest: string }> = [
    { src: "vite.config.ts", dest: "vite.config.ts" },
    { src: "index.html", dest: "index.html" },
    { src: "src/main.tsx", dest: "src/main.tsx" },
    { src: "src/registry/types.ts", dest: "src/registry/types.ts" },
    { src: "src/PrimitivePreview.tsx", dest: "src/PrimitivePreview.tsx" },
    { src: "src/config/stage.ts", dest: "src/config/stage.ts" },
    { src: "src/components/VisualFrame.tsx", dest: "src/components/VisualFrame.tsx" },
    { src: "src/components/AutoStartGate.tsx", dest: "src/components/AutoStartGate.tsx" },
    { src: "src/components/MaskReveal.tsx", dest: "src/components/MaskReveal.tsx" },
    { src: "src/styles/tokens.css", dest: "src/styles/tokens.css" },
  ];

  for (const { src, dest } of filesToRepair) {
    const destPath = path.join(presDir, dest);
    const srcPath = path.join(templateDir, src);
    if (!fs.existsSync(destPath) && fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  // Copy primitives directory (only new files, don't overwrite)
  const primSrc = path.join(templateDir, "src/primitives");
  const primDest = path.join(presDir, "src/primitives");
  if (fs.existsSync(primSrc)) {
    copyDirIfMissing(primSrc, primDest);
  }

  // Don't touch chapters.ts if it has real entries
  const chaptersTs = path.join(presDir, "src/registry/chapters.ts");
  if (!fs.existsSync(chaptersTs)) {
    const tplChapters = path.join(templateDir, "src/registry/chapters.ts");
    if (fs.existsSync(tplChapters)) {
      fs.copyFileSync(tplChapters, chaptersTs);
    }
  }

  // Run npm install if node_modules is missing
  if (!fs.existsSync(path.join(presDir, "node_modules", ".bin", "vite"))) {
    await new Promise<void>((resolve) => {
      const proc = spawn("npm", ["install"], {
        cwd: presDir,
        env: { ...process.env },
        stdio: "inherit",
      });
      proc.on("close", () => resolve());
    });
  }
}

/** Recursively copy directory, skipping files that already exist at destination */
function copyDirIfMissing(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirIfMissing(srcPath, destPath);
    } else if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
