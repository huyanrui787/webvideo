import type { CSSProperties } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  highlights?: number[];
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
}

/** Syntax-highlighted code display with optional line highlights. */
export function CodeBlock({
  code,
  language = "",
  highlights = [],
  stepTime: _stepTime,
  className,
  style,
}: CodeBlockProps) {
  const lines = (code ?? "").split("\n");
  return (
    <div
      className={className}
      style={{
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "var(--text-code, 14px)",
        lineHeight: 1.7,
        padding: "var(--space-4)",
        borderRadius: "var(--radius-md, 8px)",
        background: "var(--surface-2, rgba(255,255,255,0.06))",
        color: "var(--text, #eee)",
        overflow: "auto",
        ...style,
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            padding: "0 var(--space-2)",
            background: highlights.includes(i + 1) ? "var(--accent-muted, rgba(255,255,255,0.08))" : undefined,
          }}
        >
          <span style={{ opacity: 0.4, marginRight: "var(--space-3)", userSelect: "none" }}>
            {String(i + 1).padStart(2, " ")}
          </span>
          {line || " "}
        </div>
      ))}
    </div>
  );
}
