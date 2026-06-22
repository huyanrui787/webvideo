import { requireProjectAccess } from "@/lib/api-helpers";
import { projectDir } from "@/lib/projects";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const chaptersDir = path.join(projectDir(id), "presentation/src/chapters");
  if (!fs.existsSync(chaptersDir)) {
    return Response.json({ chapters: [] });
  }

  // Read all chapter dirs in order
  const dirs = fs
    .readdirSync(chaptersDir)
    .filter((d) => fs.statSync(path.join(chaptersDir, d)).isDirectory())
    .sort();

  const chapters: Array<{ id: string; narrations: string[] }> = [];

  for (const dir of dirs) {
    const narFile = path.join(chaptersDir, dir, "narrations.ts");
    if (!fs.existsSync(narFile)) continue;

    const src = fs.readFileSync(narFile, "utf-8");
    // Extract string literals from the narrations array
    // Matches both single and double quoted strings, multi-line
    const narrations: string[] = [];
    // Find the array body between the first [ and last ]
    const arrayMatch = src.match(/\[([^]*)\]/);
    if (arrayMatch) {
      const body = arrayMatch[1];
      // Extract all string literals (handles escaped quotes)
      const strPattern = /`([^`]*)`|"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
      let m: RegExpExecArray | null;
      while ((m = strPattern.exec(body)) !== null) {
        const text = (m[1] ?? m[2] ?? m[3] ?? "").replace(/\\n/g, " ").trim();
        if (text) narrations.push(text);
      }
    }

    chapters.push({ id: dir, narrations });
  }

  return Response.json({ chapters });
}
