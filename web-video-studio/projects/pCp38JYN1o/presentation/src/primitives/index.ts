// ─── Motion ───────────────────────────────────────────────────────────────
export { Reveal } from "./motion/Reveal";
export type {} from "./motion/Reveal"; // re-export nothing, just for tree-shaking

export { Stagger } from "./motion/Stagger";
export { Counter } from "./motion/Counter";
export { DrawPath } from "./motion/DrawPath";
export { TextGlow } from "./motion/TextGlow";

// ─── Text ─────────────────────────────────────────────────────────────────
export { TypeWriter } from "./text/TypeWriter";

// ─── Canvas ───────────────────────────────────────────────────────────────
export { useSeekableCanvas } from "./canvas/useSeekableCanvas";
export { ParticleField } from "./canvas/ParticleField";
export { NetworkGraph } from "./canvas/NetworkGraph";
export type { GraphNode, GraphEdge } from "./canvas/NetworkGraph";
export { WaveForm } from "./canvas/WaveForm";

// ─── SVG FX ───────────────────────────────────────────────────────────────
export { SvgReveal } from "./svg-fx/SvgReveal";
export { Gauge } from "./svg-fx/Gauge";
export { MagneticField } from "./svg-fx/MagneticField";
export { CircuitFlow } from "./svg-fx/CircuitFlow";
export type { CircuitNode, CircuitWire } from "./svg-fx/CircuitFlow";

// ─── Chart ────────────────────────────────────────────────────────────────
export { ChartPie } from "./chart/ChartPie";
export type { PieSlice } from "./chart/ChartPie";
export { ChartBar } from "./chart/ChartBar";
export type { BarItem } from "./chart/ChartBar";
export { ChartLine } from "./chart/ChartLine";
export type { LineSeries, LinePoint } from "./chart/ChartLine";

// ─── Geo ──────────────────────────────────────────────────────────────────
export { GeoGlobe } from "./geo/GeoGlobe";

// ─── Lottie ───────────────────────────────────────────────────────────────
export { LottiePlayer } from "./lottie/LottiePlayer";

// ─── Code / Media / Data ──────────────────────────────────────────────────
export { CodeBlock } from "./code/CodeBlock";
export { MediaFrame } from "./code/MediaFrame";
export { DataChart } from "./code/DataChart";

// ─── Three.js ─────────────────────────────────────────────────────────────
export { IsoObject } from "./three/IsoObject";
