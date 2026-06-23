import { useEffect, useState, type CSSProperties } from "react";

interface TypeWriterProps {
  /** The text to type out */
  text: string;
  /** Characters per second. Default: 40 */
  speed?: number;
  /** Delay before typing starts, in seconds. Default: 0 */
  delay?: number;
  /** Show blinking cursor. Default: true */
  cursor?: boolean;
  /** Cursor character. Default: "█" */
  cursorChar?: string;
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
  /** Monospace font override. Default: var(--font-mono) */
  fontFamily?: string;
}

/**
 * Types text out character by character, terminal style.
 * In seek mode, shows the exact number of characters visible at stepTime.
 *
 * Usage:
 *   <TypeWriter text="npm install gsap" speed={30} stepTime={stepTime} />
 *   <TypeWriter text={`> running build...\n> done in 0.6s`} speed={25} />
 */
export function TypeWriter({
  text,
  speed = 40,
  delay = 0,
  cursor = true,
  cursorChar = "█",
  stepTime,
  className,
  style,
  fontFamily,
}: TypeWriterProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [showCursor, setShowCursor] = useState(cursor);

  const charDuration = 1 / speed;
  const totalDuration = text.length * charDuration;

  useEffect(() => {
    if (stepTime !== undefined) return;

    let start: number | null = null;
    let raf: number;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000 - delay;
      if (elapsed < 0) { raf = requestAnimationFrame(animate); return; }

      const chars = Math.min(text.length, Math.floor(elapsed * speed));
      setVisibleChars(chars);

      if (chars < text.length) {
        raf = requestAnimationFrame(animate);
      } else {
        // Done typing — cursor blink continues
        setShowCursor(cursor);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seek mode
  if (stepTime !== undefined) {
    const elapsed = stepTime - delay;
    const chars = elapsed <= 0 ? 0 : elapsed >= totalDuration ? text.length : Math.floor(elapsed * speed);
    const done = chars >= text.length;
    return (
      <span className={className} style={{ ...(fontFamily ? { fontFamily } : {}), whiteSpace: "pre", ...style }}>
        {text.slice(0, chars)}
        {cursor && !done && <span style={{ opacity: 1 }}>{cursorChar}</span>}
        {cursor && done && <span style={{ opacity: 0 }}>{cursorChar}</span>}
      </span>
    );
  }

  const done = visibleChars >= text.length;
  return (
    <span className={className} style={{ ...(fontFamily ? { fontFamily } : {}), whiteSpace: "pre", ...style }}>
      {text.slice(0, visibleChars)}
      {showCursor && (
        <span style={{ animation: done ? "caret-blink 1s step-end infinite" : "none" }}>
          {cursorChar}
        </span>
      )}
    </span>
  );
}
