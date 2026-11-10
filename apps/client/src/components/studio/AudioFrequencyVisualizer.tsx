"use client";

import React, { useRef, useEffect } from "react";

interface AudioFrequencyVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

export function AudioFrequencyVisualizer({
  isPlaying,
  barCount = 36,
  className = "",
}: AudioFrequencyVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let bars = Array.from({ length: barCount }, () => Math.random() * 0.2 + 0.1);
    let targetBars = Array.from({ length: barCount }, () => 0.1);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const totalGap = (barCount - 1) * 3;
      const barWidth = Math.max(2, (width - totalGap) / barCount);

      // Periodically generate new targets when playing
      if (isPlaying) {
        if (Math.random() < 0.25) {
          targetBars = targetBars.map((_, i) => {
            // Emphasize bass (left), mid (center), and high (right) natural curve
            const curve = Math.sin((i / barCount) * Math.PI);
            const energy = Math.random() * 0.7 + 0.3;
            return Math.min(1, Math.max(0.12, curve * energy * 1.1));
          });
        }
      } else {
        targetBars = targetBars.map(() => 0.08);
      }

      // Smooth interpolation
      for (let i = 0; i < barCount; i++) {
        bars[i] += (targetBars[i] - bars[i]) * 0.18;
        const barHeight = Math.max(3, bars[i] * height);
        const x = i * (barWidth + 3);
        const y = height - barHeight;

        // Gradient from cyan to indigo/emerald
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, "rgba(0, 229, 255, 0.4)");
        grad.addColorStop(0.6, "rgba(0, 229, 255, 0.85)");
        grad.addColorStop(1, "rgba(245, 179, 107, 1)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Rounded bar tops
        const radius = Math.min(barWidth / 2, 2);
        ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        ctx.fill();

        // Subtle glow effect on high peaks
        if (isPlaying && bars[i] > 0.65) {
          ctx.shadowColor = "rgba(0, 229, 255, 0.6)";
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowBlur = 0;
        }
      }

      if (!reduceMotion) {
        animFrameIdRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={32}
      className={`w-full max-w-sm h-8 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
