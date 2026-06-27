import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

interface MoonPhaseProps { speed?: number; size?: number; stepTime?: number; className?: string; style?: CSSProperties; }
function hash(n: number) { const x = Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); }

export function MoonPhase({ speed = 1, size = 200, stepTime, className, style }: MoonPhaseProps) {
  const ref = useSeekableCanvas((ctx, t, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const sx = hash(i*7)*w, sy = hash(i*13)*h;
      ctx.beginPath(); ctx.arc(sx, sy, hash(i*3)*1.5+0.5, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${0.3+0.4*Math.sin(t*1.5*speed+hash(i)*10)})`; ctx.fill();
    }
    const cx = w*0.52, cy = h*0.48, r = Math.min(w,h)*0.33;
    const phase = (t*0.15*speed)%1;
    const grd = ctx.createRadialGradient(cx-r*0.25,cy-r*0.25,r*0.05,cx,cy,r);
    grd.addColorStop(0,"#e8e8d0");grd.addColorStop(0.6,"#c8c8b0");grd.addColorStop(1,"#707060");
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    const sf = phase<0.5?1-phase*4:(phase-0.5)*4-1;
    const sx2=cx+sf*r;const sgd=ctx.createRadialGradient(sx2,cy,0,sx2,cy,r*1.5);
    sgd.addColorStop(0,"rgba(5,5,20,0.98)");sgd.addColorStop(1,"rgba(5,5,20,0.85)");
    ctx.beginPath();
    if(phase<0.5){ctx.arc(cx,cy,r,Math.PI/2,-Math.PI/2,false);ctx.ellipse(cx,cy,Math.abs(sf*r),r,0,-Math.PI/2,Math.PI/2,sf*r>0);}
    else{ctx.arc(cx,cy,r,-Math.PI/2,Math.PI/2,false);ctx.ellipse(cx,cy,Math.abs(-sf*r),r,0,Math.PI/2,-Math.PI/2,-sf*r>0);}
    ctx.closePath();ctx.fillStyle=sgd;ctx.fill();ctx.restore();
    [[0.3,0.4,0.06],[0.55,0.35,0.04],[0.45,0.6,0.035],[0.65,0.55,0.025]].forEach(([fx,fy,fr])=>{
      ctx.beginPath();ctx.arc(cx+(fx-0.5)*r*1.6,cy+(fy-0.5)*r*1.6,fr*r,0,Math.PI*2);
      ctx.strokeStyle="rgba(100,100,80,0.4)";ctx.lineWidth=1;ctx.stroke();
    });
    const ill=Math.round(Math.abs(Math.sin(phase*Math.PI))*100);
    const age=Math.round(phase*29.5);
    const pn=phase<0.1?"新月":phase<0.3?"峨眉月":phase<0.45?"上弦月":phase<0.55?"满月":phase<0.7?"渐亏凸月":"下弦月";
    ctx.fillStyle="rgba(0,80,160,0.4)";ctx.beginPath();ctx.roundRect(w*0.02,h*0.04,w*0.28,h*0.38,[6]);ctx.fill();
    ctx.fillStyle="#0af";ctx.font=`bold ${w*0.025}px monospace`;ctx.textAlign="left";ctx.fillText("DATA LOG:",w*0.04,h*0.12);
    ctx.fillStyle="rgba(255,255,255,0.7)";ctx.font=`${w*0.022}px monospace`;
    [`Illumination: ${ill}%`,`Age: ${age}/29.5d`,`Phase: ${pn}`].forEach((l,i)=>ctx.fillText(l,w*0.04,h*0.18+i*h*0.06));
    ctx.fillStyle="rgba(255,255,255,0.35)";ctx.font=`${w*0.023}px sans-serif`;ctx.textAlign="center";ctx.fillText("月亮",w*0.52,h*0.9);
  });
  const h = size * 0.65;
  return <canvas ref={ref} width={size} height={h} className={className} style={{ background:"#020210", width:size, height:h, ...style }} />;
}
