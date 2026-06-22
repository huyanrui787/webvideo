import type { CSSProperties } from "react";
import { useSeekableCanvas } from "./useSeekableCanvas";

export interface GraphNode {
  id: string;
  x: number; // 0–1920
  y: number; // 0–1080
  label?: string;
  /** Node radius. Default: 12 */
  radius?: number;
  /** If true, rendered with accent color */
  highlight?: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  /** 0–1: when this edge appears (as fraction of total duration). Default: auto */
  revealAt?: number;
}

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /**
   * How many nodes to show. Nodes reveal in order.
   * If undefined, all nodes visible from t=0.
   */
  visibleNodes?: number;
  /** Animation duration for full graph reveal. Default: 2 */
  duration?: number;
  /** Delay before animation starts. Default: 0 */
  delay?: number;
  /** Edge color. Default: "var(--rule)" */
  edgeColor?: string;
  /** Node color. Default: "var(--surface-2)" */
  nodeColor?: string;
  /** Highlighted node color. Default: "var(--accent)" */
  accentColor?: string;
  /** Label font size. Default: 20 */
  fontSize?: number;
  stepTime?: number;
  style?: CSSProperties;
  className?: string;
}

function resolveVar(color: string): string {
  if (!color.startsWith("var(") || typeof document === "undefined") return color;
  const prop = color.match(/var\(([^)]+)\)/)?.[1] ?? "";
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || "#888";
}

/**
 * Animated node-edge network diagram on Canvas.
 * Nodes appear one by one, edges draw between them.
 *
 * Usage (DNS example):
 *   <NetworkGraph
 *     nodes={[
 *       { id: "client", x: 200, y: 540, label: "你的电脑", highlight: true },
 *       { id: "resolver", x: 700, y: 540, label: "本地 DNS" },
 *       { id: "root", x: 1200, y: 300, label: "根域服务器" },
 *       { id: "tld", x: 1200, y: 540, label: ".com 服务器" },
 *       { id: "auth", x: 1200, y: 780, label: "权威服务器" },
 *     ]}
 *     edges={[
 *       { from: "client", to: "resolver" },
 *       { from: "resolver", to: "root" },
 *       { from: "resolver", to: "tld" },
 *       { from: "resolver", to: "auth" },
 *     ]}
 *     visibleNodes={step + 1}
 *     stepTime={stepTime}
 *   />
 */
export function NetworkGraph({
  nodes,
  edges = [],
  visibleNodes,
  duration = 2,
  edgeColor = "var(--rule)",
  nodeColor = "var(--surface-2)",
  accentColor = "var(--accent)",
  fontSize = 20,
  stepTime,
  style,
  className,
}: NetworkGraphProps) {
  const ref = useSeekableCanvas(
    (ctx, t, _w, _h) => {
      const progress = Math.min(1, t / duration);
      const visCount = visibleNodes ?? nodes.length;

      const rEdge = resolveVar(edgeColor);
      const rNode = resolveVar(nodeColor);
      const rAccent = resolveVar(accentColor);

      // Build node map
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      // Draw edges (appear based on revealAt or equally spaced)
      edges.forEach((edge, i) => {
        const revealAt = edge.revealAt ?? (i + 1) / (edges.length + 1);
        const edgeProgress = Math.min(1, Math.max(0, (progress - revealAt * 0.5) * 3));
        if (edgeProgress <= 0) return;

        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return;

        const ex = from.x + (to.x - from.x) * edgeProgress;
        const ey = from.y + (to.y - from.y) * edgeProgress;

        ctx.globalAlpha = edgeProgress * 0.7;
        ctx.strokeStyle = rEdge;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      });

      // Draw nodes
      nodes.slice(0, visCount).forEach((node, i) => {
        const nodeReveal = Math.min(1, Math.max(0, (progress * nodes.length - i) * 2));
        if (nodeReveal <= 0) return;

        const r = (node.radius ?? 14) * nodeReveal;
        const fill = node.highlight ? rAccent : rNode;

        // Outer ring
        ctx.globalAlpha = nodeReveal * 0.3;
        ctx.strokeStyle = node.highlight ? rAccent : rEdge;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2);
        ctx.stroke();

        // Fill
        ctx.globalAlpha = nodeReveal;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Label
        if (node.label) {
          ctx.fillStyle = node.highlight ? "#fff" : resolveVar("var(--text)") || "#fff";
          ctx.font = `${fontSize}px var(--font-mono, monospace)`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label, node.x, node.y + r + fontSize * 1.2);
        }
      });

      ctx.globalAlpha = 1;
    },
    { stepTime },
  );

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
