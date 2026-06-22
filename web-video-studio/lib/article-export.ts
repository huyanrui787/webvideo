/**
 * Article export engine for illustrated-article mode.
 *
 * Converts LayoutBlock[] into various output formats:
 * - WeChat Official Account HTML (inline styles, no class names)
 * - Markdown
 * - Full HTML page
 */

import type { LayoutBlock } from "@/lib/db/schema";

// ─── Shared helpers ───────────────────────────────────────────────────────

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mdToHTML(md: string): string {
  // Minimal inline formatting
  let html = md;
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return html;
}

// ─── WeChat HTML ──────────────────────────────────────────────────────────

/**
 * Generate WeChat Official Account compatible HTML.
 * Rules: inline styles only, no class names, no external fonts,
 * img must use https URLs, width ≤ 640px effective.
 */
export function renderToWechatHTML(blocks: LayoutBlock[], title: string): string {
  const parts: string[] = [];

  // WeChat article header
  parts.push(`<section style="padding: 1em 0;">`);
  parts.push(
    `<h1 style="font-size: 22px; font-weight: bold; color: #1a1a1a; line-height: 1.4; margin-bottom: 1.5em; text-align: center;">${escapeHTML(title)}</h1>`
  );

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph": {
        const text = mdToHTML(escapeHTML(block.content ?? ""));
        const spacing = block.spacingBefore === "large" ? "2em" : "1.2em";
        parts.push(
          `<p style="font-size: 16px; line-height: 1.8; color: #333333; margin-bottom: ${spacing}; letter-spacing: 0.5px;">${text}</p>`
        );
        break;
      }

      case "heading": {
        const level = Math.min((block as Record<string, unknown>).level as number ?? 2, 3);
        const fontSize = level === 1 ? 20 : level === 2 ? 18 : 16;
        parts.push(
          `<h${level} style="font-size: ${fontSize}px; font-weight: bold; color: #1a1a1a; margin: 2em 0 1em; line-height: 1.4;">${escapeHTML(block.content ?? "")}</h${level}>`
        );
        break;
      }

      case "illustration": {
        if (!block.illustrationUrl) break;
        const imgWidth = block.width === "normal" ? "60%" : block.width === "wide" ? "85%" : "100%";
        const spacing = block.spacingBefore === "large" ? "2em" : "1.5em";
        parts.push(
          `<section style="margin: ${spacing} 0; text-align: center;">`
        );
        parts.push(
          `<img src="${block.illustrationUrl}" alt="${escapeHTML(block.caption ?? '')}" style="width: ${imgWidth}; display: block; margin: 0 auto; border-radius: 4px;">`
        );
        if (block.caption) {
          parts.push(
            `<p style="font-size: 13px; color: #999999; margin-top: 0.6em; text-align: center;">${escapeHTML(block.caption)}</p>`
          );
        }
        parts.push(`</section>`);
        break;
      }

      case "quote": {
        parts.push(
          `<blockquote style="border-left: 3px solid #dddddd; padding-left: 1em; margin: 1.5em 0; color: #666666; font-size: 15px; line-height: 1.7;">${escapeHTML(block.content ?? "")}</blockquote>`
        );
        break;
      }

      case "divider": {
        parts.push(
          `<hr style="border: none; border-top: 1px solid #eeeeee; margin: 2em 0; width: 30%; margin-left: auto; margin-right: auto;">`
        );
        break;
      }
    }
  }

  parts.push(`</section>`);
  return parts.join("\n");
}

// ─── Markdown ─────────────────────────────────────────────────────────────

/** Generate standard Markdown with image references. */
export function renderToMarkdown(blocks: LayoutBlock[], title: string): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
        lines.push(block.content ?? "");
        lines.push("");
        break;

      case "heading": {
        const level = Math.min((block as Record<string, unknown>).level as number ?? 2, 3);
        lines.push(`${"#".repeat(level)} ${block.content ?? ""}`);
        lines.push("");
        break;
      }

      case "illustration":
        if (block.illustrationUrl) {
          lines.push(`![${block.caption ?? ""}](${block.illustrationUrl})`);
          if (block.caption) lines.push(`*${block.caption}*`);
          lines.push("");
        }
        break;

      case "quote":
        lines.push(`> ${(block.content ?? "").replace(/\n/g, "\n> ")}`);
        lines.push("");
        break;

      case "divider":
        lines.push("---");
        lines.push("");
        break;
    }
  }

  return lines.join("\n");
}

// ─── Full HTML page ───────────────────────────────────────────────────────

/** Generate a complete standalone HTML page. */
export function renderToHTML(blocks: LayoutBlock[], title: string): string {
  const bodyParts: string[] = [];

  bodyParts.push(`<article class="illustrated-article">`);
  bodyParts.push(`<h1 class="article-title">${escapeHTML(title)}</h1>`);

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph": {
        const text = mdToHTML(escapeHTML(block.content ?? ""));
        bodyParts.push(`<p class="article-para">${text}</p>`);
        break;
      }
      case "heading": {
        const level = Math.min((block as Record<string, unknown>).level as number ?? 2, 3);
        bodyParts.push(`<h${level} class="article-heading">${escapeHTML(block.content ?? "")}</h${level}>`);
        break;
      }
      case "illustration": {
        if (!block.illustrationUrl) break;
        bodyParts.push(`<figure class="article-figure">`);
        bodyParts.push(`<img src="${block.illustrationUrl}" alt="${escapeHTML(block.caption ?? '')}">`);
        if (block.caption) {
          bodyParts.push(`<figcaption>${escapeHTML(block.caption)}</figcaption>`);
        }
        bodyParts.push(`</figure>`);
        break;
      }
      case "quote":
        bodyParts.push(`<blockquote>${escapeHTML(block.content ?? "")}</blockquote>`);
        break;
      case "divider":
        bodyParts.push(`<hr class="article-divider">`);
        break;
    }
  }

  bodyParts.push(`</article>`);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      font-size: 16px; line-height: 1.8; color: #333;
      background: #fff; max-width: 680px; margin: 0 auto; padding: 2em 1.5em;
    }
    .article-title {
      font-size: 24px; font-weight: bold; color: #1a1a1a;
      line-height: 1.4; margin-bottom: 1.5em; text-align: center;
    }
    .article-heading { font-weight: bold; color: #1a1a1a; margin: 2em 0 1em; }
    h2.article-heading { font-size: 20px; }
    h3.article-heading { font-size: 17px; }
    .article-para { margin-bottom: 1.2em; }
    .article-figure { margin: 2em 0; text-align: center; }
    .article-figure img { max-width: 100%; height: auto; border-radius: 4px; }
    .article-figure figcaption { font-size: 13px; color: #999; margin-top: 0.6em; }
    blockquote { border-left: 3px solid #ddd; padding-left: 1em; margin: 1.5em 0; color: #666; }
    .article-divider { border: none; border-top: 1px solid #eee; margin: 2em auto; width: 30%; }
  </style>
</head>
<body>
${bodyParts.join("\n")}
</body>
</html>`;
}
