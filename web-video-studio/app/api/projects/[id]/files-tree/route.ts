import { NextResponse } from "next/server";
import { projectDir } from "@/lib/projects";
import { requireProjectAccess } from "@/lib/api-helpers";
import path from "path";
import fs from "fs";

export interface FileTreeNode {
  name: string;
  path: string; // relative to project root
  type: "file" | "dir";
  children?: FileTreeNode[];
}

const SKIP = new Set(["node_modules", ".git", "dist", ".vite", "__pycache__"]);

function buildTree(absDir: string, relBase: string): FileTreeNode[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const nodes: FileTreeNode[] = [];

  for (const entry of entries.sort((a, b) => {
    // Dirs first, then files
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  })) {
    if (SKIP.has(entry.name) || entry.name.startsWith(".")) continue;

    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relPath,
        type: "dir",
        children: buildTree(path.join(absDir, entry.name), relPath),
      });
    } else {
      nodes.push({ name: entry.name, path: relPath, type: "file" });
    }
  }

  return nodes;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;
  const base = projectDir(id);
  const srcDir = path.join(base, "presentation/src");

  if (!fs.existsSync(srcDir)) {
    return NextResponse.json({ tree: [], exists: false });
  }

  const tree = buildTree(srcDir, "presentation/src");
  return NextResponse.json({ tree, exists: true });
}
