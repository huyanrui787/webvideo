import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface PuzzleAssemblyProps { pieces?: number; color?: string; size?: number; title?: string; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function PuzzleAssembly({ pieces = 12, color = "var(--accent)", size = 240, title = "", duration = 4, delay = 0, stepTime, className, style }: PuzzleAssemblyProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 1.5 });
    tlRef.current = tl;

    const puzzlePieces = svg.querySelectorAll(".puz-piece");
    const finale = svg.querySelector("#puz-finale") as SVGGElement;

    // Phase 1: Pieces float in from random positions
    puzzlePieces.forEach((piece, i) => {
      const targetX = parseFloat(piece.getAttribute("data-tx") ?? "0");
      const targetY = parseFloat(piece.getAttribute("data-ty") ?? "0");
      const startX = (Math.random() - 0.5) * 250;
      const startY = (Math.random() - 0.5) * 200;

      tl.fromTo(piece,
        { x: startX, y: startY, opacity: 0, rotation: Math.random() * 30 - 15 },
        { x: 0, y: 0, opacity: 1, rotation: 0, duration: 0.5, ease: "power2.out" },
        i * (duration / pieces / 2)
      );
      // Snap effect
      tl.to(piece, { scale: 1.1, duration: 0.1, ease: "power2.out" }, i * (duration / pieces / 2) + 0.45);
      tl.to(piece, { scale: 1, duration: 0.1, ease: "power2.in" }, i * (duration / pieces / 2) + 0.55);
    });

    // Phase 2: Complete puzzle glows
    if (finale) {
      tl.fromTo(finale, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, duration * 0.7);
    }

    return () => { tl.kill(); };
  }, [pieces, duration, delay, title]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  // Generate a grid of puzzle pieces
  const cols = Math.ceil(Math.sqrt(pieces));
  const rows = Math.ceil(pieces / cols);
  const pw = 200 / cols;
  const ph = 120 / rows;

  return (
    <svg ref={svgRef} width={size} height={size * 0.8} viewBox="0 0 260 180" className={className} style={style}>
      {/* Background pane — the target area */}
      <rect x="30" y="20" width="200" height="120" rx="6" fill="var(--surface)" stroke="var(--bd)" strokeWidth={1} strokeDasharray="4,4" />

      {Array.from({ length: pieces }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 30 + col * pw + pw / 2;
        const y = 20 + row * ph + ph / 2;

        return (
          <g key={i} className="puz-piece" data-tx={x} data-ty={y} style={{transformOrigin:" + x + "px " + y + "px}}>
            <rect
              x={x - pw / 2 + 2} y={y - ph / 2 + 2}
              width={pw - 4} height={ph - 4} rx={2}
              fill={color} opacity={0.15 + (i % 5) * 0.08}
              stroke={color} strokeWidth={1.2}
            />
            {/* Tab connectors */}
            {col < cols - 1 && <circle cx={x + pw / 2} cy={y} r={3} fill={color} opacity={0.5} />}
            {row < rows - 1 && <circle cx={x} cy={y + ph / 2} r={3} fill={color} opacity={0.5} />}
          </g>
        );
      })}

      {/* Finale title */}
      <g id="puz-finale" transform="translate(130, 160)">
        <text x="0" y="0" textAnchor="middle" fontSize={14} fontWeight={600} fill={color} fontFamily="var(--font-sans-cn)">
          {title || "拼图完成"}
        </text>
      </g>
    </svg>
  );
}
