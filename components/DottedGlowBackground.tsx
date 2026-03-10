
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';

type DottedGlowBackgroundProps = {
  className?: string;
  gap?: number;
  radius?: number;
  color?: string;
  glowColor?: string;
  opacity?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
};

export default function DottedGlowBackground({
  className,
  gap = 32,
  radius = 1.5,
  color = "rgba(150, 200, 255, 0.05)",
  glowColor = "rgba(100, 210, 255, 0.2)",
  opacity = 1,
  speedMin = 0.2,
  speedMax = 0.8,
  speedScale = 0.5,
}: DottedGlowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stopped = false;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    setTimeout(resize, 0);

    // Dynamic Gradient Points (Aurora Effect)
    const gradientPoints = [
      { x: Math.random(), y: Math.random(), color: 'rgba(15, 23, 42, 0.4)', vx: 0.001, vy: 0.001, radius: 0.8 },
      { x: Math.random(), y: Math.random(), color: 'rgba(30, 41, 59, 0.3)', vx: -0.0008, vy: 0.0012, radius: 0.6 },
      { x: Math.random(), y: Math.random(), color: 'rgba(76, 29, 149, 0.15)', vx: 0.0015, vy: -0.0007, radius: 0.9 },
      { x: Math.random(), y: Math.random(), color: 'rgba(20, 184, 166, 0.1)', vx: -0.0012, vy: -0.001, radius: 0.7 }
    ];

    let dots: { x: number; y: number; phase: number; speed: number }[] = [];

    const regenDots = () => {
      dots = [];
      const { width, height } = container.getBoundingClientRect();
      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
          const y = j * gap;
          dots.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            speed: speedMin + Math.random() * (speedMax - speedMin),
          });
        }
      }
    };

    regenDots();
    window.addEventListener("resize", regenDots);

    const draw = (now: number) => {
      if (stopped) return;
      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      
      // Draw Calming Aurora Base
      gradientPoints.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;

        const g = ctx.createRadialGradient(
          p.x * width, p.y * height, 0,
          p.x * width, p.y * height, p.radius * Math.max(width, height)
        );
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      });

      // Draw Grid Dots
      ctx.globalAlpha = opacity;
      const time = (now / 1000) * speedScale;

      dots.forEach((d) => {
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod;
        const intensity = 0.1 + 0.9 * (lin * lin);

        ctx.beginPath();
        ctx.arc(d.x, d.y, radius * (0.8 + intensity * 0.4), 0, Math.PI * 2);
        
        if (intensity > 0.7) {
           ctx.fillStyle = glowColor;
           ctx.shadowColor = glowColor;
           ctx.shadowBlur = 6 * (intensity - 0.7) * 4;
        } else {
           ctx.fillStyle = color;
           ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = opacity * (intensity > 0.7 ? 1 : 0.2 + intensity * 0.4); 
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", regenDots);
      ro.disconnect();
    };
  }, [gap, radius, color, glowColor, opacity, speedMin, speedMax, speedScale]);

  return (
    <div ref={containerRef} className={className} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
