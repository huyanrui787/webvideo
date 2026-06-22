"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  hue: number;
}

interface ParticleCanvasProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  repelRadius?: number;
  repelStrength?: number;
}

/**
 * Canvas 2D particle system with cursor interaction.
 * Particles glow, drift, connect, and react to cursor movement.
 */
export function ParticleCanvas({
  className = "",
  particleCount = 120,
  connectionDistance = 160,
  repelRadius = 220,
  repelStrength = 4,
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const rafRef = useRef<number>(0);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const initParticles = useCallback(
    (w: number, h: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          radius: Math.random() * 2.5 + 1,
          opacity: Math.random() * 0.5 + 0.25,
          hue: Math.random() * 60 + 240, // indigo-violet range: 240-300
        });
      }
      particlesRef.current = particles;
    },
    [particleCount]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas!.parentElement!;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      sizeRef.current = { w, h };
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    initParticles(sizeRef.current.w, sizeRef.current.h);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      initParticles(sizeRef.current.w, sizeRef.current.h);
    });
    resizeObserver.observe(canvas.parentElement!);

    // Mouse tracking
    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    }

    function onPointerLeave() {
      mouseRef.current.active = false;
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    // Animation loop
    function tick() {
      const { w, h } = sizeRef.current;
      const mouse = mouseRef.current;
      const particles = particlesRef.current;

      // Clear with full transparency
      ctx!.clearRect(0, 0, w, h);

      // Draw connection lines first (behind particles)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const lineOpacity = (1 - dist / connectionDistance) * 0.15;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 80%, 70%, ${lineOpacity})`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }

      // Draw glow under mouse cursor
      if (mouse.active) {
        const glow = ctx!.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, repelRadius * 0.8
        );
        glow.addColorStop(0, "rgba(99, 102, 241, 0.06)");
        glow.addColorStop(1, "rgba(99, 102, 241, 0)");
        ctx!.fillStyle = glow;
        ctx!.fillRect(0, 0, w, h);
      }

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Cursor repulsion
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < repelRadius && dist > 0) {
            const force = ((repelRadius - dist) / repelRadius) * repelStrength;
            p.vx += (dx / dist) * force * 0.12;
            p.vy += (dy / dist) * force * 0.12;
          }
        }

        // Apply velocity with damping
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.997;
        p.vy *= 0.997;

        // Minimum drift
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < 0.15) {
          p.vx += (Math.random() - 0.5) * 0.08;
          p.vy += (Math.random() - 0.5) * 0.08;
        }

        // Wrap edges
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        // Draw glow
        const glowGrad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        glowGrad.addColorStop(0, `hsla(${p.hue}, 90%, 70%, ${p.opacity * 0.6})`);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx!.fillStyle = glowGrad;
        ctx!.fill();

        // Draw particle core
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 80%, 80%, ${p.opacity})`;
        ctx!.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [initParticles, particleCount, connectionDistance, repelRadius, repelStrength]);

  return (
    <canvas
      ref={canvasRef}
      className={`block absolute inset-0 ${className}`}
      aria-hidden="true"
    />
  );
}
