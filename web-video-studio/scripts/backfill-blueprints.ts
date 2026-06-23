#!/usr/bin/env npx tsx
/**
 * Backfill .blueprint.json for existing chapters that don't have one.
 * Reads the generated TSX/CSS/narrations and reconstructs a minimal blueprint
 * so that material-planner and other tools can scan requirements.
 *
 * Usage: npx tsx scripts/backfill-blueprints.ts [projectId]
 *   Without projectId: backfills all projects
 */

import fs from "fs";
import path from "path";

const PROJECTS_ROOT = path.join(import.meta.dirname, "..", "projects");

function findProjects(): string[] {
  return fs.readdirSync(PROJECTS_ROOT).filter((d) => {
    const p = path.join(PROJECTS_ROOT, d);
    return fs.statSync(p).isDirectory();
  });
}

function backfillProject(projectId: string): number {
  const chaptersDir = path.join(PROJECTS_ROOT, projectId, "presentation", "src", "chapters");
  if (!fs.existsSync(chaptersDir)) return 0;

  let count = 0;
  const dirs = fs.readdirSync(chaptersDir).filter((d) => {
    const stat = fs.statSync(path.join(chaptersDir, d));
    return stat.isDirectory() && !d.startsWith(".") && !d.startsWith("__") && d !== "01-example";
  });

  for (const dir of dirs) {
    const bpPath = path.join(chaptersDir, dir, ".blueprint.json");
    if (fs.existsSync(bpPath)) continue; // already has blueprint

    // Read narrations to get step count
    const narrPath = path.join(chaptersDir, dir, "narrations.ts");
    if (!fs.existsSync(narrPath)) continue;

    const narrSrc = fs.readFileSync(narrPath, "utf-8");
    const texts: string[] = [];
    const strRe = /["'`]([^"'`\\]*)["'`]/g;
    let m;
    while ((m = strRe.exec(narrSrc)) !== null) {
      const t = m[1].trim();
      if (t) texts.push(t);
    }

    // Build a minimal blueprint
    const bp = {
      chapterId: dir,
      title: dir.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      steps: texts.map((text) => ({
        narration: text,
        layout: { mode: "template", template: "step-reveal", slots: { steps: [{ heading: text.slice(0, 50) }] } },
      })),
      _backfilled: true,
      _backfilledAt: Date.now(),
    };

    fs.writeFileSync(bpPath, JSON.stringify(bp, null, 2));
    count++;
  }

  return count;
}

const targetId = process.argv[2];
const projectIds = targetId ? [targetId] : findProjects();

let total = 0;
for (const id of projectIds) {
  const count = backfillProject(id);
  if (count > 0) console.log(`  ${id}: ${count} chapters backfilled`);
  total += count;
}

console.log(`\nDone: ${total} .blueprint.json files created across ${projectIds.length} project(s)`);
