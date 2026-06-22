/**
 * Extract JSON objects from markdown code blocks in AI response text.
 * Uses brace-counting to handle nested `}` characters inside JSON string values.
 * Pure function — no side effects, no dependencies.
 */
export function extractJsonBlocks(text: string): object[] {
  const results: object[] = [];
  let i = 0;
  while ((i = text.indexOf("```json", i)) !== -1) {
    const start = text.indexOf("{", i);
    if (start === -1) break;
    let depth = 0, inString = false, escaped = false;
    for (let j = start; j < text.length; j++) {
      const ch = text[j];
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          try { results.push(JSON.parse(text.slice(start, j + 1))); } catch { /* malformed JSON — skip */ }
          i = j;
          break;
        }
      }
    }
    if (depth !== 0) break; // unclosed JSON — likely truncated, stop
    i++;
  }
  return results;
}
