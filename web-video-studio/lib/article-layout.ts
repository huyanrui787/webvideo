/**
 * Article layout engine for illustrated-article mode.
 *
 * Takes raw Markdown + illustration shots → produces a flat list of
 * LayoutBlock[] with illustrations inserted at optimal positions.
 */

import type { IllustrationShot, LayoutBlock, BlockType } from "@/lib/db/schema";
import { nanoid } from "nanoid";

// ─── Markdown parsing ─────────────────────────────────────────────────────

interface ParsedBlock {
  type: BlockType;
  content: string;   // raw markdown text (stripped of # markers for headings)
  level?: number;    // 1-3 for headings
  raw: string;       // original line(s)
}

/** Parse article markdown into a flat list of semantic blocks. */
export function parseArticle(markdown: string): ParsedBlock[] {
  const lines = markdown.split("\n");
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        content: headingMatch[2]!.trim(),
        level: headingMatch[1]!.length,
        raw: line,
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i]!.startsWith("> ")) {
        quoteLines.push(lines[i]!.replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "quote",
        content: quoteLines.join("\n"),
        raw: quoteLines.join("\n"),
      });
      continue;
    }

    // Horizontal rule → divider
    if (/^[-*_]{3,}\s*$/.test(line)) {
      blocks.push({ type: "divider", content: "", raw: line });
      i++;
      continue;
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    if (line.trim() !== "") {
      const paraLines: string[] = [];
      while (i < lines.length) {
        const l = lines[i]!;
        if (l.trim() === "") break;
        if (l.startsWith("#") || l.startsWith("> ") || /^[-*_]{3,}\s*$/.test(l)) break;
        paraLines.push(l);
        i++;
      }
      const text = paraLines.join("\n").trim();
      if (text) {
        blocks.push({ type: "paragraph", content: text, raw: text });
      }
    } else {
      i++;
    }
  }

  return blocks;
}

// ─── Illustration placement scoring ───────────────────────────────────────

interface PlacementScore {
  index: number;      // position in blocks array (insert AFTER this index)
  score: number;
  shotId: string;
}

/**
 * Score how well a shot matches a paragraph block.
 * Higher = better placement. Returns 0-100.
 */
function scoreMatch(shot: IllustrationShot, block: ParsedBlock): number {
  if (block.type !== "paragraph" && block.type !== "heading") return 0;

  const text = block.content.toLowerCase();
  let score = 0;

  // Keyword overlap between shot metadata and paragraph text
  const searchTokens = [
    shot.theme,
    shot.coreIdea,
    ...JSON.parse(shot.elements || "[]") as string[],
    ...JSON.parse(shot.labels || "[]") as string[],
  ];

  for (const token of searchTokens) {
    if (!token || token.length < 2) continue;
    if (text.includes(token.toLowerCase())) score += 15;
  }

  // Bonus: paragraph is medium-length (not too short, not too long)
  if (block.content.length > 100 && block.content.length < 500) score += 5;

  // Penalty: inline lists or code blocks
  if (/[*\-\d]\.\s/.test(block.content)) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Find optimal insertion points for all shots.
 * Returns a map: blockIndex → shot (insert after this block index).
 */
export function placeIllustrations(
  blocks: ParsedBlock[],
  shots: IllustrationShot[]
): Map<number, IllustrationShot> {
  const placements = new Map<number, IllustrationShot>();
  if (shots.length === 0) return placements;

  // Score all (shot, block) pairs
  const scores: PlacementScore[] = [];
  for (const shot of shots) {
    for (let i = 0; i < blocks.length; i++) {
      const s = scoreMatch(shot, blocks[i]!);
      if (s > 0) {
        scores.push({ index: i, score: s, shotId: shot.id });
      }
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Greedy assignment: each shot gets its best unmatched block
  const usedShots = new Set<string>();
  const usedPositions = new Set<number>();

  for (const s of scores) {
    if (usedShots.has(s.shotId)) continue;

    // Ensure minimum spacing: 2 blocks between illustrations
    const tooClose = [...usedPositions].some((pos) => Math.abs(pos - s.index) <= 2);
    if (tooClose) continue;

    const shot = shots.find((sh) => sh.id === s.shotId);
    if (!shot) continue;

    placements.set(s.index, shot);
    usedShots.add(s.shotId);
    usedPositions.add(s.index);
  }

  // Place unmatched shots at evenly spaced positions near the end of each third
  const unmatched = shots.filter((s) => !usedShots.has(s.id));
  const third = Math.floor(blocks.length / (unmatched.length + 1));
  let offset = third;
  for (const shot of unmatched) {
    while (usedPositions.has(offset) && offset < blocks.length - 1) offset++;
    placements.set(Math.min(offset, blocks.length - 2), shot);
    usedPositions.add(offset);
    offset += third;
  }

  return placements;
}

// ─── Merge blocks + illustrations ─────────────────────────────────────────

/**
 * Merge parsed blocks with placed illustrations into a flat LayoutBlock[].
 * Inserts a cover illustration at the very beginning.
 */
export function buildLayout(
  blocks: ParsedBlock[],
  placements: Map<number, IllustrationShot>,
  coverShot?: IllustrationShot | null
): LayoutBlock[] {
  const result: LayoutBlock[] = [];

  // Insert cover at position 0
  if (coverShot) {
    result.push(makeIllustBlock(coverShot, "full"));
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    result.push({
      id: nanoid(8),
      type: block.type,
      content: block.content,
    });

    // Insert illustration after this block if placed here
    const shot = placements.get(i);
    if (shot) {
      result.push(makeIllustBlock(shot));
    }
  }

  return result;
}

function makeIllustBlock(
  shot: IllustrationShot,
  width: LayoutBlock["width"] = "full"
): LayoutBlock {
  return {
    id: nanoid(8),
    type: "illustration",
    shotId: shot.id,
    illustrationUrl: shot.assetUrl ?? undefined,
    caption: generateCaption(shot),
    width,
    spacingBefore: "large",
  };
}

/** Generate a short Chinese caption from shot metadata. */
function generateCaption(shot: IllustrationShot): string {
  // Use coreIdea trimmed to ~20 chars
  const idea = shot.coreIdea || shot.theme || "";
  if (idea.length <= 20) return idea;
  // Try to break at a punctuation
  const cut = idea.slice(0, 20).search(/[，。；、！？]/);
  return cut > 0 ? idea.slice(0, cut + 1) : idea.slice(0, 20) + "…";
}

// ─── Full pipeline ────────────────────────────────────────────────────────

export function autoLayout(
  markdown: string,
  shots: IllustrationShot[],
  coverShot?: IllustrationShot | null
): LayoutBlock[] {
  const blocks = parseArticle(markdown);
  const placements = placeIllustrations(blocks, shots);
  return buildLayout(blocks, placements, coverShot);
}
