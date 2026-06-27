import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface CowCharacterProps {
  action?: "idle" | "walk" | "wave" | "celebrate" | "charge" | "point";
  color?: string; spotColor?: string; size?: number;
  duration?: number; delay?: number; stepTime?: number;
  className?: string; style?: CSSProperties;
}

export function CowCharacter({
  action = "idle", color = "#8B5E3C", spotColor = "#6B3F2A", size = 240,
  duration = 3, delay = 0, stepTime, className, style,
}: CowCharacterProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const dk = "#3A2010"; const pk = "#F4A4A0"; const hrn = "#E8D5C0";

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 0.8 });
    tlRef.current = tl;
    const bodyGroup = svg.querySelector("#cow-body-group") as SVGGElement;
    const uaL = svg.querySelector("#cow-ua-l") as SVGGElement;
    const uaR = svg.querySelector("#cow-ua-r") as SVGGElement;
    const faL = svg.querySelector("#cow-fa-l") as SVGGElement;
    const faR = svg.querySelector("#cow-fa-r") as SVGGElement;
    const legL = svg.querySelector("#cow-leg-l") as SVGRectElement;
    const legR = svg.querySelector("#cow-leg-r") as SVGRectElement;
    const tail = svg.querySelector("#cow-tail") as SVGGElement;
    const shL = "68px 128px"; const shR = "172px 128px";
    const elL = "50px 148px"; const elR = "190px 148px";

    switch (action) {
      case "walk":
        tl.to(uaL, { rotation: -25, duration: 0.35, ease: "sine.inOut", transformOrigin: shL }, 0);
        tl.to(uaR, { rotation: 25, duration: 0.35, ease: "sine.inOut", transformOrigin: shR }, 0);
        tl.to(legR, { rotation: 18, duration: 0.35, ease: "sine.inOut", transformOrigin: "135px 195px" }, 0);
        tl.to(legL, { rotation: -18, duration: 0.35, ease: "sine.inOut", transformOrigin: "105px 195px" }, 0);
        tl.to(bodyGroup, { y: -3, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0);
        tl.to(uaL, { rotation: 25, duration: 0.35, ease: "sine.inOut", transformOrigin: shL }, 0.35);
        tl.to(uaR, { rotation: -25, duration: 0.35, ease: "sine.inOut", transformOrigin: shR }, 0.35);
        tl.to(legR, { rotation: -18, duration: 0.35, ease: "sine.inOut", transformOrigin: "135px 195px" }, 0.35);
        tl.to(legL, { rotation: 18, duration: 0.35, ease: "sine.inOut", transformOrigin: "105px 195px" }, 0.35);
        tl.to(bodyGroup, { y: -3, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.35);
        tl.to(tail, { rotation: 12, duration: 0.4, yoyo: true, repeat: 1, transformOrigin: "155px 160px", ease: "sine.inOut" }, 0);
        break;
      case "wave":
        tl.to(uaR, { rotation: -120, duration: 0.3, ease: "power2.out", transformOrigin: shR }, 0)
          .to(faR, { rotation: -40, duration: 0.3, ease: "power2.out", transformOrigin: elR }, 0.1)
          .to(uaR, { rotation: -100, duration: 0.15, transformOrigin: shR }, 0.3)
          .to(uaR, { rotation: -120, duration: 0.15, transformOrigin: shR }, 0.45)
          .to(uaR, { rotation: 0, duration: 0.3, ease: "power2.in", transformOrigin: shR }, 0.8)
          .to(faR, { rotation: 0, duration: 0.3, ease: "power2.in", transformOrigin: elR }, 0.8);
        break;
      case "celebrate":
        tl.to(uaL, { rotation: -140, duration: 0.5, ease: "back.out(2)", transformOrigin: shL }, 0)
          .to(faL, { rotation: -30, duration: 0.4, ease: "back.out(2)", transformOrigin: elL }, 0.1)
          .to(uaR, { rotation: 140, duration: 0.5, ease: "back.out(2)", transformOrigin: shR }, 0)
          .to(faR, { rotation: 30, duration: 0.4, ease: "back.out(2)", transformOrigin: elR }, 0.1)
          .to(bodyGroup, { y: -8, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 7 }, 0.3);
        break;
      case "charge":
        tl.to(bodyGroup, { rotation: -15, duration: 0.4, ease: "power3.in", transformOrigin: "120px 140px" }, 0)
          .to(uaL, { rotation: 15, duration: 0.3, transformOrigin: shL }, 0)
          .to(uaR, { rotation: 15, duration: 0.3, transformOrigin: shR }, 0);
        break;
      case "point":
        tl.to(uaR, { rotation: -80, duration: 0.4, ease: "power2.out", transformOrigin: shR }, 0)
          .to(faR, { rotation: -20, duration: 0.3, ease: "power2.out", transformOrigin: elR }, 0.1);
        break;
      default: // idle
        tl.to(bodyGroup, { scaleY: 1.012, duration: 2, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "120px 200px" }, 0);
        tl.to(uaL, { rotation: -8, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: shL }, 0);
        tl.to(uaR, { rotation: 8, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: shR }, 0.5);
        tl.to(faL, { rotation: -5, duration: 2.5, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: elL }, 0.3);
        tl.to(faR, { rotation: 5, duration: 2.5, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: elR }, 0.8);
        tl.to(tail, { rotation: 6, duration: 2, yoyo: true, repeat: -1, transformOrigin: "155px 160px", ease: "sine.inOut" }, 0);
        break;
    }
    return () => { tl.kill(); };
  }, [action, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  const s = size / 260;

  return (
    <svg ref={svgRef} width={size} height={size * 1.25} viewBox="0 0 260 320" className={className} style={style}>
      <g transform={`scale(${s})`} style={{transformOrigin:"0px 0px"}}>
        {/* Tail */}
        <g id="cow-tail" style={{transformOrigin:"155px 160px"}}>
          <path d="M 148 150 Q 175 148 185 135 Q 192 125 188 115" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"/>
          <ellipse cx="188" cy="112" rx="5" ry="8" fill={spotColor}/>
        </g>
        {/* Legs */}
        <rect id="cow-leg-l" x="80" y="195" width="26" height="48" rx="10" fill={color}/>
        <rect id="cow-leg-r" x="132" y="195" width="26" height="48" rx="10" fill={color}/>
        <rect x="78" y="240" width="30" height="10" rx="5" fill={dk}/>
        <rect x="130" y="240" width="30" height="10" rx="5" fill={dk}/>
        {/* Body Group */}
        <g id="cow-body-group">
          <rect x="75" y="115" width="90" height="85" rx="20" fill={color}/>
          <ellipse cx="105" cy="140" rx="14" ry="10" fill={spotColor} opacity={0.45}/>
          <ellipse cx="130" cy="155" rx="10" ry="12" fill={spotColor} opacity={0.35}/>
          <ellipse cx="95" cy="170" rx="8" ry="6" fill={spotColor} opacity={0.4}/>
          <ellipse cx="120" cy="125" rx="22" ry="14" fill="#F5EDE4" opacity={0.3}/>
          {/* Left arm — 2 segments */}
          <g id="cow-ua-l">
            <rect x="58" y="120" width="20" height="28" rx="8" fill={color}/>
            <g id="cow-fa-l" style={{transformOrigin:"68px 148px"}}>
              <rect x="54" y="142" width="16" height="26" rx="7" fill={color}/>
              <rect x="52" y="164" width="20" height="9" rx="4" fill={dk}/>
            </g>
          </g>
          {/* Right arm — 2 segments */}
          <g id="cow-ua-r">
            <rect x="162" y="120" width="20" height="28" rx="8" fill={color}/>
            <g id="cow-fa-r" style={{transformOrigin:"172px 148px"}}>
              <rect x="170" y="142" width="16" height="26" rx="7" fill={color}/>
              <rect x="168" y="164" width="20" height="9" rx="4" fill={dk}/>
            </g>
          </g>
          {/* Head */}
          <g transform="translate(120, 92)">
            <ellipse cx="0" cy="-5" rx="36" ry="30" fill={color}/>
            <ellipse cx="0" cy="-18" rx="18" ry="12" fill={spotColor} opacity={0.5}/>
            <ellipse cx="-42" cy="-22" rx="15" ry="7" fill={spotColor} transform="rotate(-35)"/>
            <ellipse cx="42" cy="-22" rx="15" ry="7" fill={spotColor} transform="rotate(35)"/>
            <ellipse cx="-42" cy="-24" rx="8" ry="3" fill={pk} transform="rotate(-35)"/>
            <ellipse cx="42" cy="-24" rx="8" ry="3" fill={pk} transform="rotate(35)"/>
            <path d="M -18 -28 Q -26 -50 -20 -58 Q -16 -52 -12 -40" fill={hrn} stroke="#C8B8A0" strokeWidth={1.5}/>
            <path d="M 18 -28 Q 26 -50 20 -58 Q 16 -52 12 -40" fill={hrn} stroke="#C8B8A0" strokeWidth={1.5}/>
            {[-8,-3,2,6].map((dx,i)=><ellipse key={i} cx={dx} cy={-32-i*2} rx={4} ry={5} fill={spotColor} opacity={0.6}/>)}
            <ellipse cx="-15" cy="-5" rx="9" ry="10" fill="#FFF"/><ellipse cx="15" cy="-5" rx="9" ry="10" fill="#FFF"/>
            <circle cx="-13" cy="-3" r="5" fill="#4A2810"/><circle cx="17" cy="-3" r="5" fill="#4A2810"/>
            <circle cx="-12" cy="-4" r="2.5" fill="#1A1A1A"/><circle cx="18" cy="-4" r="2.5" fill="#1A1A1A"/>
            <circle cx="-16" cy="-7" r="2" fill="#FFF"/><circle cx="14" cy="-7" r="2" fill="#FFF"/>
            <path d="M -26 -16 Q -16 -20 -6 -16" fill="none" stroke={spotColor} strokeWidth={2.5} strokeLinecap="round"/>
            <path d="M 26 -16 Q 16 -20 6 -16" fill="none" stroke={spotColor} strokeWidth={2.5} strokeLinecap="round"/>
            <ellipse cx="0" cy="11" rx="20" ry="13" fill={pk}/>
            <ellipse cx="-7" cy="13" rx="4" ry="3" fill="#D4837F"/><ellipse cx="7" cy="13" rx="4" ry="3" fill="#D4837F"/>
            <path d="M -9 17 Q 0 22 9 17" fill="none" stroke="#D4837F" strokeWidth={2} strokeLinecap="round"/>
            <ellipse cx="-18" cy="5" rx="6" ry="4" fill={pk} opacity={0.2}/><ellipse cx="18" cy="5" rx="6" ry="4" fill={pk} opacity={0.2}/>
          </g>
        </g>
      </g>
    </svg>
  );
}
