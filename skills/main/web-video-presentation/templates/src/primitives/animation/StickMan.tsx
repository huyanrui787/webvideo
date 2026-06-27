import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface StickManProps {
  action?: "walk" | "wave" | "think" | "celebrate" | "idle" | "point";
  color?: string; size?: number; duration?: number; delay?: number;
  stepTime?: number; className?: string; style?: CSSProperties;
}

export function StickMan({
  action = "idle", color = "#f59e0b", size = 240,
  duration = 3, delay = 0, stepTime, className, style,
}: StickManProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const sc = "#d97706"; const dk = "#92400e";

  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 0.8 });
    tlRef.current = tl;
    const bodyGroup = svg.querySelector("#sm-body-group") as SVGGElement;
    const uaL = svg.querySelector("#sm-ua-l") as SVGGElement;
    const uaR = svg.querySelector("#sm-ua-r") as SVGGElement;
    const faL = svg.querySelector("#sm-fa-l") as SVGGElement;
    const faR = svg.querySelector("#sm-fa-r") as SVGGElement;
    const legL = svg.querySelector("#sm-leg-l") as SVGRectElement;
    const legR = svg.querySelector("#sm-leg-r") as SVGRectElement;
    const shL = "68px 128px"; const shR = "172px 128px";
    const elL = "50px 148px"; const elR = "190px 148px";

    switch (action) {
      case "walk":
        tl.to(uaL, { rotation: -20, duration: 0.35, ease: "sine.inOut", transformOrigin: shL }, 0);
        tl.to(uaR, { rotation: 20, duration: 0.35, ease: "sine.inOut", transformOrigin: shR }, 0);
        tl.to(legR, { rotation: 15, duration: 0.35, ease: "sine.inOut", transformOrigin: "135px 195px" }, 0);
        tl.to(legL, { rotation: -15, duration: 0.35, ease: "sine.inOut", transformOrigin: "105px 195px" }, 0);
        tl.to(bodyGroup, { y: -3, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0);
        tl.to(uaL, { rotation: 20, duration: 0.35, ease: "sine.inOut", transformOrigin: shL }, 0.35);
        tl.to(uaR, { rotation: -20, duration: 0.35, ease: "sine.inOut", transformOrigin: shR }, 0.35);
        tl.to(legR, { rotation: -15, duration: 0.35, ease: "sine.inOut", transformOrigin: "135px 195px" }, 0.35);
        tl.to(legL, { rotation: 15, duration: 0.35, ease: "sine.inOut", transformOrigin: "105px 195px" }, 0.35);
        tl.to(bodyGroup, { y: -3, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.35);
        break;
      case "wave":
        tl.to(uaR, { rotation: -130, duration: 0.3, ease: "power2.out", transformOrigin: shR }, 0)
          .to(faR, { rotation: -40, duration: 0.3, ease: "power2.out", transformOrigin: elR }, 0.1)
          .to(uaR, { rotation: -110, duration: 0.15, transformOrigin: shR }, 0.3)
          .to(uaR, { rotation: -130, duration: 0.15, transformOrigin: shR }, 0.45)
          .to(uaR, { rotation: 0, duration: 0.3, ease: "power2.in", transformOrigin: shR }, 0.8)
          .to(faR, { rotation: 0, duration: 0.3, ease: "power2.in", transformOrigin: elR }, 0.8);
        break;
      case "think":
        tl.to(bodyGroup, { rotation: 2, duration: 0.5, transformOrigin: "120px 140px" }, 0);
        tl.to(uaR, { rotation: 60, duration: 0.5, transformOrigin: shR }, 0);
        tl.to(faR, { rotation: 30, duration: 0.4, transformOrigin: elR }, 0.1);
        break;
      case "celebrate":
        tl.to(uaL, { rotation: -150, duration: 0.5, ease: "back.out(2)", transformOrigin: shL }, 0)
          .to(faL, { rotation: -30, duration: 0.4, ease: "back.out(2)", transformOrigin: elL }, 0.1)
          .to(uaR, { rotation: 150, duration: 0.5, ease: "back.out(2)", transformOrigin: shR }, 0)
          .to(faR, { rotation: 30, duration: 0.4, ease: "back.out(2)", transformOrigin: elR }, 0.1)
          .to(bodyGroup, { y: -8, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 7 }, 0.3);
        break;
      case "point":
        tl.to(uaR, { rotation: -80, duration: 0.4, ease: "power2.out", transformOrigin: shR }, 0)
          .to(faR, { rotation: -20, duration: 0.3, ease: "power2.out", transformOrigin: elR }, 0.1);
        break;
      default: // idle
        tl.to(bodyGroup, { scaleY: 1.012, duration: 2, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "120px 200px" }, 0);
        tl.to(uaL, { rotation: -6, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: shL }, 0);
        tl.to(uaR, { rotation: 6, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: shR }, 0.5);
        break;
    }
    return () => { tl.kill(); };
  }, [action, delay]);

  useEffect(() => { if (stepTime != null && tlRef.current) tlRef.current.seek(stepTime % (tlRef.current.duration() || 1)); }, [stepTime]);

  const s = size / 260;

  return (
    <svg ref={svgRef} width={size} height={size * 1.25} viewBox="0 0 260 320" className={className} style={style}>
      <g transform={`scale(${s})`} style={{transformOrigin:"0px 0px"}}>
        <rect id="sm-leg-l" x="80" y="195" width="26" height="48" rx="10" fill={color}/>
        <rect id="sm-leg-r" x="132" y="195" width="26" height="48" rx="10" fill={color}/>
        <rect x="78" y="240" width="30" height="10" rx="5" fill={dk}/>
        <rect x="130" y="240" width="30" height="10" rx="5" fill={dk}/>
        <g id="sm-body-group">
          <rect x="75" y="115" width="90" height="85" rx="20" fill={color}/>
          <ellipse cx="120" cy="125" rx="22" ry="14" fill={sc} opacity={0.3}/>
          <g id="sm-ua-l">
            <rect x="58" y="120" width="20" height="28" rx="8" fill={color}/>
            <g id="sm-fa-l" style={{transformOrigin:"68px 148px"}}>
              <rect x="54" y="142" width="16" height="26" rx="7" fill={color}/>
              <rect x="52" y="164" width="20" height="9" rx="4" fill={dk}/>
            </g>
          </g>
          <g id="sm-ua-r">
            <rect x="162" y="120" width="20" height="28" rx="8" fill={color}/>
            <g id="sm-fa-r" style={{transformOrigin:"172px 148px"}}>
              <rect x="170" y="142" width="16" height="26" rx="7" fill={color}/>
              <rect x="168" y="164" width="20" height="9" rx="4" fill={dk}/>
            </g>
          </g>
          <g transform="translate(120, 82)">
            <circle cx="0" cy="-2" r="32" fill={color}/>
            <circle cx="0" cy="-2" r="28" fill={sc} opacity={0.25}/>
            <ellipse cx="-13" cy="-5" rx="7" ry="8" fill="#FFF"/>
            <ellipse cx="13" cy="-5" rx="7" ry="8" fill="#FFF"/>
            <circle cx="-11" cy="-3" r="4" fill="#1A1A1A"/>
            <circle cx="15" cy="-3" r="4" fill="#1A1A1A"/>
            <circle cx="-12" cy="-5" r="1.5" fill="#FFF"/>
            <circle cx="14" cy="-5" r="1.5" fill="#FFF"/>
            <path d="M -6 8 Q 0 13 6 8" fill="none" stroke={dk} strokeWidth={2} strokeLinecap="round"/>
          </g>
        </g>
      </g>
    </svg>
  );
}
