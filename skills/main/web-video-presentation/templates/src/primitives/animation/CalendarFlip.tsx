import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface CalendarFlipProps { pages?: number; color?: string; size?: number; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function CalendarFlip({ pages = 4, color = "var(--accent)", size = 160, duration = 3, delay = 0, stepTime, className, style }: CalendarFlipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 0.5 });
    tlRef.current = tl;

    const cards = el.querySelectorAll(".cal-card");
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return; // Last card stays on bottom
      const t = (i / pages) * duration;

      // Flip the card
      tl.set(card, { zIndex: pages - i, rotationX: 0, transformOrigin: "50% 0%" }, t);
      tl.to(card, { rotationX: -180, duration: 0.5, ease: "power2.in", transformOrigin: "50% 0%" }, t + 1.2);
      tl.set(card, { zIndex: 0 }, t + 1.7);
    });

    return () => { tl.kill(); };
  }, [pages, duration, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  return (
    <div ref={ref} className={className} style={{ width: size, height: size * 1.1, position: "relative", perspective: 400, ...style }}>
      {Array.from({ length: pages }).map((_, i) => {
        const date = 1 + i;
        const isHighlighted = i === 2; // Middle page highlighted
        return (
          <div key={i} className="cal-card" style={{
            position: "absolute", inset: 0,
            background: "var(--surface)", border: `1.5px solid ${isHighlighted ? color : "var(--bd)"}`,
            borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            backfaceVisibility: "hidden", zIndex: pages - i,
          }}>
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-mute)", marginBottom: 4 }}>MARCH</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: isHighlighted ? color : "var(--text)", lineHeight: 1 }}>{date}</div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>{["MON","TUE","WED","THU","FRI","SAT","SUN"][(i*2)%7]}</div>
            {isHighlighted && <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", border: `2px solid ${color}`, opacity: 0.6 }} />}
            {/* Back face hint */}
            <div style={{ position: "absolute", inset: 0, background: "var(--surface)", borderRadius: 8, backfaceVisibility: "hidden", transform: "rotateX(180deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 12, color: "var(--text-mute)", transform: "scaleY(-1)" }}>···</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
