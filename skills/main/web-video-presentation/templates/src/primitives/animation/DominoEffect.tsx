import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface DominoEffectProps { count?: number; color?: string; size?: number; labels?: string[]; duration?: number; delay?: number; stepTime?: number; className?: string; style?: CSSProperties; }

export function DominoEffect({ count = 10, color = "var(--accent)", size = 280, labels, duration = 3.5, delay = 0, stepTime, className, style }: DominoEffectProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 2 });
    tlRef.current = tl;

    const dominoes = svg.querySelectorAll(".dom-piece");
    const tags = svg.querySelectorAll(".dom-tag");
    const finale = svg.querySelector("#dom-finale") as SVGGElement | null;

    dominoes.forEach((dom, i) => {
      // Each domino: rotate forward (fall), then settle
      const t = i * (duration / count);
      tl.to(dom, { rotation: 90, duration: 0.25, ease: "power3.in", transformOrigin: `var(--dom-origin-${i})` }, t);
      // After falling, label pops up
      if (tags[i]) {
        tl.fromTo(tags[i], { opacity: 0, scale: 0, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, t + 0.15);
      }
    });

    // Finale reveal
    if (finale) {
      const revealT = count * (duration / count) + 0.3;
      tl.fromTo(finale, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, revealT);
    }

    return () => { tl.kill(); };
  }, [count, duration, delay, labels]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  const pieces = Array.from({ length: count }, (_, i) => ({
    x: 25 + (i / (count - 1)) * 250,
    y: 60,
    row: i >= count / 2 ? 2 : 1,
  }));

  return (
    <svg ref={svgRef} width={size} height={size * 0.7} viewBox="0 0 300 200" className={className} style={style}>
      <defs>
        {pieces.map((_, i) => (
          <style key={i}>{`.dom-piece:nth-child(${i+1}) { --dom-origin-${i}: ${pieces[i].x}px ${pieces[i].y + 30}px; }`}</style>
        ))}
      </defs>
      {/* Ground line */}
      <line x1="10" y1="140" x2="290" y2="140" stroke="var(--text-mute)" strokeWidth={1} opacity={0.3} />
      {pieces.map((p, i) => (
        <g key={i}>
          <g className="dom-piece" transform={`translate(${p.x}, ${p.y})`}>
            <rect x="-6" y="-30" width="12" height="30" rx="2" fill={color} opacity={0.8} stroke={color} strokeWidth={1} />
            <circle cx="0" cy="-20" r="2" fill="var(--bg)" />
            <line x1="-6" y1="0" x2="6" y2="0" stroke={color} strokeWidth={0.5} />
          </g>
          {labels && labels[i] && (
            <text className="dom-tag" x={p.x} y={70} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill={color}>{labels[i]}</text>
          )}
        </g>
      ))}
      {/* Finale: big text */}
      <g id="dom-finale" transform="translate(150, 170)">
        <rect x="-80" y="-22" width="160" height="44" rx="8" fill={color} fillOpacity={0.1} stroke={color} strokeWidth={1.5} />
        <text x="0" y="6" textAnchor="middle" fontSize={22} fontWeight={700} fill={color}>{labels?.[0] ?? "核心结论"}</text>
      </g>
    </svg>
  );
}
