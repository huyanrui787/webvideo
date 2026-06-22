import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

interface GeoGlobeProps {
  /** Highlighted arc routes: [lon1,lat1,lon2,lat2]. Default: [] */
  routes?: [number, number, number, number][];
  /** Dots to mark on the globe */
  markers?: { lon: number; lat: number; label?: string }[];
  /** Globe rotation speed (degrees/sec). Default: 6 */
  rotationSpeed?: number;
  /** Initial longitude offset. Default: 0 */
  startLon?: number;
  color?: string;
  accentColor?: string;
  stepTime?: number;
  style?: CSSProperties;
  className?: string;
}

// Simplified world coastline as a series of [lon, lat] polylines (major land masses)
// Encoded as a flat array of segments separated by [999,999]
const LAND_POLYS: number[][] = [
  // North America (simplified)
  [-140,60],[-125,50],[-80,45],[-75,45],[-70,43],[-70,25],[-90,15],[-85,10],
  [-77,8],[-80,25],[-98,19],[-104,19],[-117,32],[-120,37],[-122,37],[-124,45],
  [-123,50],[-130,55],[-140,60],
  [999,999],
  // Greenland
  [-50,83],[-20,83],[-18,76],[-24,68],[-42,65],[-52,65],[-55,69],[-50,83],
  [999,999],
  // Europe
  [-10,36],[5,36],[15,38],[28,40],[36,36],[36,42],[28,46],[14,48],[6,47],
  [-2,47],[-5,44],[-10,44],[-10,36],
  [999,999],
  [-5,44],[-2,47],[3,47],[8,47],[8,54],[5,55],[9,57],[14,58],[24,57],[28,56],
  [28,46],[20,44],[14,44],[12,44],[8,43],[3,44],[-5,44],
  [999,999],
  // Scandinavia
  [5,57],[5,62],[8,63],[14,65],[18,70],[26,71],[28,68],[24,60],[20,56],[14,56],[8,57],[5,57],
  [999,999],
  // Africa
  [-18,15],[-17,14],[-15,12],[-15,10],[-14,9],[-11,8],[-8,5],[-3,5],
  [2,5],[9,4],[15,0],[22,-6],[30,-10],[35,-18],[35,-25],[30,-32],
  [26,-34],[18,-30],[16,-24],[12,-18],[10,-8],[8,4],[2,6],[0,6],
  [-3,5],[-10,8],[-18,15],
  [999,999],
  // Asia
  [28,40],[36,36],[42,37],[50,26],[57,22],[60,22],[62,24],[68,24],
  [72,22],[80,20],[80,12],[74,8],[80,5],[100,5],[104,10],[100,14],
  [104,20],[110,18],[120,22],[122,30],[122,38],[130,32],[132,35],
  [136,35],[140,38],[140,44],[136,55],[130,60],[115,53],[100,50],
  [80,50],[60,44],[44,36],[36,36],
  [999,999],
  // Japan
  [130,32],[131,34],[133,35],[135,36],[136,38],[136,40],[140,40],[141,38],[138,35],[136,34],[133,33],[130,32],
  [999,999],
  // Australia
  [114,-22],[120,-20],[124,-18],[130,-12],[136,-12],[140,-18],[144,-18],
  [150,-22],[152,-26],[152,-30],[150,-36],[146,-40],[140,-38],[132,-35],
  [125,-34],[118,-26],[114,-22],
  [999,999],
  // South America
  [-80,0],[-76,-2],[-74,-8],[-70,-18],[-66,-24],[-56,-30],[-52,-34],[-60,-40],
  [-66,-44],[-68,-54],[-66,-56],[-56,-52],[-48,-28],[-40,-20],[-38,-15],
  [-35,-8],[-36,-2],[-52,2],[-60,6],[-72,10],[-80,0],
  [999,999],
];

function project(lon: number, lat: number, rotLon: number, cx: number, cy: number, r: number) {
  const lonRad = ((lon + rotLon) * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  // Orthographic projection
  const x = cx + r * cosLat * Math.sin(lonRad);
  const y = cy - r * Math.sin(latRad);
  const visible = cosLat * Math.cos(lonRad) > 0;
  return { x, y, visible };
}

function arcPoints(lon1: number, lat1: number, lon2: number, lat2: number, steps = 40): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([lon1 + (lon2 - lon1) * t, lat1 + (lat2 - lat1) * t]);
  }
  return pts;
}

/**
 * Animated 3D globe with land outlines and flight-arc routes.
 *
 * Usage:
 *   <GeoGlobe
 *     routes={[[116, 40, -74, 40], [2, 48, 139, 35]]}
 *     markers={[{ lon: 116, lat: 40, label: "北京" }]}
 *     stepTime={stepTime}
 *   />
 */
export function GeoGlobe({
  routes = [],
  markers = [],
  rotationSpeed = 6,
  startLon = 0,
  color = "rgba(100,180,255,0.6)",
  accentColor = "#f59e0b",
  stepTime,
  style,
  className,
}: GeoGlobeProps) {
  const ref = useSeekableCanvas(
    (ctx, t, w, h) => {
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.42;
      const rotLon = startLon + t * rotationSpeed;

      // Globe sphere background
      const grd = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      grd.addColorStop(0, "#1a3050");
      grd.addColorStop(0.7, "#0a1828");
      grd.addColorStop(1, "#050d18");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Atmosphere glow
      const atmGrd = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.08);
      atmGrd.addColorStop(0, "rgba(80,140,255,0.3)");
      atmGrd.addColorStop(1, "rgba(80,140,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2);
      ctx.fillStyle = atmGrd;
      ctx.fill();

      // Latitude/longitude grid
      ctx.strokeStyle = "rgba(100,180,255,0.08)";
      ctx.lineWidth = 0.8;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lon = -180; lon <= 180; lon += 3) {
          const p = project(lon, lat, rotLon, cx, cy, r);
          if (!p.visible) { first = true; continue; }
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          first = false;
        }
        ctx.stroke();
      }
      for (let lon = 0; lon < 360; lon += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = project(lon, lat, rotLon, cx, cy, r);
          if (!p.visible) { first = true; continue; }
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          first = false;
        }
        ctx.stroke();
      }

      // Land polygons
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.7;
      let segStart = true;
      ctx.beginPath();
      for (const [lon, lat] of LAND_POLYS) {
        if (lon === 999) { segStart = true; continue; }
        const p = project(lon, lat, rotLon, cx, cy, r);
        if (!p.visible) { segStart = true; continue; }
        segStart ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        segStart = false;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Routes
      routes.forEach((route, ri) => {
        const routeProgress = Math.min(1, t * 0.5);
        const pts = arcPoints(...route);
        const visiblePts = Math.floor(pts.length * routeProgress);
        if (visiblePts < 2) return;

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.9;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        let fst = true;
        pts.slice(0, visiblePts).forEach(([lon, lat]) => {
          const p = project(lon, lat, rotLon, cx, cy, r);
          if (!p.visible) { fst = true; return; }
          fst ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          fst = false;
        });
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Endpoint dot
        const endPt = route.slice(2) as [number, number];
        const ep = project(endPt[0], endPt[1], rotLon, cx, cy, r);
        if (ep.visible && routeProgress > 0.8) {
          ctx.beginPath();
          ctx.arc(ep.x, ep.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = accentColor;
          ctx.fill();
          // Ripple
          const ripple = (t * 2 + ri) % 1;
          ctx.beginPath();
          ctx.arc(ep.x, ep.y, 5 + ripple * 15, 0, Math.PI * 2);
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 1 - ripple;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      // Markers
      markers.forEach(({ lon, lat, label }) => {
        const p = project(lon, lat, rotLon, cx, cy, r);
        if (!p.visible) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.fill();
        if (label) {
          ctx.fillStyle = "#fff";
          ctx.font = `bold ${w * 0.018}px sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(label, p.x + 8, p.y);
        }
      });

      // Globe border
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(100,180,255,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
    { stepTime },
  );

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", ...style }}
    />
  );
}
