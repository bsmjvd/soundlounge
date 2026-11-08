"use client";

import React, { useEffect, useRef } from "react";

interface FallingLeavesAmbientProps {
  enabled?: boolean;
}

type LeafSpecies = "maple" | "oak" | "ginkgo" | "birch" | "beech";

interface LeafSpritePair {
  topside: HTMLCanvasElement;
  underside: HTMLCanvasElement;
}

interface LeafParticle {
  x: number;
  y: number;
  depth: number; // 0.25 (distant) to 1.0 (foreground)
  baseSize: number;
  species: LeafSpecies;
  spriteIndex: number;
  pitch: number;
  roll: number;
  yaw: number;
  tilt: number;
  pitchSpeed: number;
  rollSpeed: number;
  yawSpeed: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  baseFallSpeed: number;
  vx: number;
  vy: number;
  opacity: number;
}

/**
 * Procedural Botanical Canvas Rendering
 * Creates photorealistic leaf sprites with organic contours, multi-stop gradients,
 * translucent primary/secondary venation, and distinct topside/underside textures.
 */
function createBotanicalSprite(species: LeafSpecies, isUnderside: boolean, variant: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const r = size / 2;
  ctx.save();
  ctx.translate(r, r);

  switch (species) {
    case "maple": {
      // Japanese Red Maple (Momiji) - 5 serrated lobed foliage
      const grad = ctx.createRadialGradient(0, r * 0.15, r * 0.1, 0, 0, r * 0.95);
      if (isUnderside) {
        grad.addColorStop(0, variant === 0 ? "#ea580c" : "#d97706");
        grad.addColorStop(0.4, variant === 0 ? "#c2410c" : "#b45309");
        grad.addColorStop(0.85, variant === 0 ? "#991b1b" : "#78350f");
        grad.addColorStop(1, "#5b1414");
      } else {
        grad.addColorStop(0, variant === 0 ? "#f97316" : "#f59e0b");
        grad.addColorStop(0.3, variant === 0 ? "#dc2626" : "#ea580c");
        grad.addColorStop(0.7, variant === 0 ? "#991b1b" : "#b91c1c");
        grad.addColorStop(1, "#450a0a");
      }

      ctx.beginPath();
      ctx.moveTo(0, r * 0.72);
      // Bottom left lobe
      ctx.bezierCurveTo(-r * 0.25, r * 0.6, -r * 0.55, r * 0.5, -r * 0.75, r * 0.35);
      ctx.bezierCurveTo(-r * 0.65, r * 0.25, -r * 0.5, r * 0.25, -r * 0.45, r * 0.2);
      // Mid left lobe
      ctx.bezierCurveTo(-r * 0.65, r * 0.1, -r * 0.85, -r * 0.1, -r * 0.9, -r * 0.25);
      ctx.bezierCurveTo(-r * 0.75, -r * 0.25, -r * 0.55, -r * 0.15, -r * 0.45, -r * 0.1);
      // Top left lobe
      ctx.bezierCurveTo(-r * 0.6, -r * 0.35, -r * 0.65, -r * 0.65, -r * 0.6, -r * 0.8);
      ctx.bezierCurveTo(-r * 0.45, -r * 0.65, -r * 0.3, -r * 0.45, -r * 0.2, -r * 0.4);
      // Center top lobe (tallest)
      ctx.bezierCurveTo(-r * 0.25, -r * 0.65, -r * 0.15, -r * 0.9, 0, -r * 0.98);
      ctx.bezierCurveTo(r * 0.15, -r * 0.9, r * 0.25, -r * 0.65, r * 0.2, -r * 0.4);
      // Top right lobe
      ctx.bezierCurveTo(r * 0.3, -r * 0.45, r * 0.45, -r * 0.65, r * 0.6, -r * 0.8);
      ctx.bezierCurveTo(r * 0.65, -r * 0.65, r * 0.6, -r * 0.35, r * 0.45, -r * 0.1);
      // Mid right lobe
      ctx.bezierCurveTo(r * 0.55, -r * 0.15, r * 0.75, -r * 0.25, r * 0.9, -r * 0.25);
      ctx.bezierCurveTo(r * 0.85, -r * 0.1, r * 0.65, r * 0.1, r * 0.45, r * 0.2);
      // Bottom right lobe
      ctx.bezierCurveTo(r * 0.5, r * 0.25, r * 0.65, r * 0.25, r * 0.75, r * 0.35);
      ctx.bezierCurveTo(r * 0.55, r * 0.5, r * 0.25, r * 0.6, 0, r * 0.72);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Botanical delicate vein network
      ctx.strokeStyle = isUnderside ? "rgba(254, 240, 138, 0.55)" : "rgba(254, 215, 170, 0.32)";
      ctx.lineWidth = isUnderside ? 1.4 : 1.0;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.72);
      ctx.lineTo(0, -r * 0.9);
      ctx.moveTo(0, r * 0.3);
      ctx.lineTo(-r * 0.55, -r * 0.7);
      ctx.moveTo(0, r * 0.3);
      ctx.lineTo(r * 0.55, -r * 0.7);
      ctx.moveTo(0, r * 0.4);
      ctx.lineTo(-r * 0.75, -r * 0.2);
      ctx.moveTo(0, r * 0.4);
      ctx.lineTo(r * 0.75, -r * 0.2);
      ctx.moveTo(0, r * 0.5);
      ctx.lineTo(-r * 0.6, r * 0.3);
      ctx.moveTo(0, r * 0.5);
      ctx.lineTo(r * 0.6, r * 0.3);
      ctx.stroke();

      // Petiole Stem
      ctx.strokeStyle = "#5b21b6";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.7);
      ctx.quadraticCurveTo(-r * 0.05, r * 0.85, -r * 0.08, r * 0.98);
      ctx.stroke();
      break;
    }

    case "oak": {
      // Golden Scarlet Oak - sinuous lobed undulating margins
      const grad = ctx.createLinearGradient(0, -r * 0.9, 0, r * 0.9);
      if (isUnderside) {
        grad.addColorStop(0, "#d97706");
        grad.addColorStop(0.5, "#b45309");
        grad.addColorStop(1, "#78350f");
      } else {
        grad.addColorStop(0, "#f59e0b");
        grad.addColorStop(0.35, "#d97706");
        grad.addColorStop(0.75, "#9a3412");
        grad.addColorStop(1, "#451a03");
      }

      ctx.beginPath();
      ctx.moveTo(0, -r * 0.92);
      ctx.bezierCurveTo(r * 0.25, -r * 0.85, r * 0.45, -r * 0.7, r * 0.35, -r * 0.55);
      ctx.bezierCurveTo(r * 0.55, -r * 0.5, r * 0.65, -r * 0.25, r * 0.45, -r * 0.15);
      ctx.bezierCurveTo(r * 0.6, -r * 0.05, r * 0.65, r * 0.2, r * 0.4, r * 0.35);
      ctx.bezierCurveTo(r * 0.5, r * 0.45, r * 0.35, r * 0.65, 0, r * 0.75);
      ctx.bezierCurveTo(-r * 0.35, r * 0.65, -r * 0.5, r * 0.45, -r * 0.4, r * 0.35);
      ctx.bezierCurveTo(-r * 0.65, r * 0.2, -r * 0.6, -r * 0.05, -r * 0.45, -r * 0.15);
      ctx.bezierCurveTo(-r * 0.65, -r * 0.25, -r * 0.55, -r * 0.5, -r * 0.35, -r * 0.55);
      ctx.bezierCurveTo(-r * 0.45, -r * 0.7, -r * 0.25, -r * 0.85, 0, -r * 0.92);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Veins
      ctx.strokeStyle = isUnderside ? "rgba(254, 240, 138, 0.5)" : "rgba(254, 215, 170, 0.32)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.75);
      ctx.lineTo(0, -r * 0.85);
      [-0.6, -0.35, -0.1, 0.15, 0.4].forEach((pos) => {
        ctx.moveTo(0, r * pos);
        ctx.quadraticCurveTo(r * 0.2, r * (pos - 0.1), r * 0.38, r * (pos - 0.15));
        ctx.moveTo(0, r * pos);
        ctx.quadraticCurveTo(-r * 0.2, r * (pos - 0.1), -r * 0.38, r * (pos - 0.15));
      });
      ctx.stroke();

      // Stem
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.75);
      ctx.lineTo(0, r * 0.95);
      ctx.stroke();
      break;
    }

    case "ginkgo": {
      // Ginkgo Biloba - iconic fan with radiating parallel venation
      const grad = ctx.createRadialGradient(0, r * 0.6, r * 0.1, 0, 0, r * 0.9);
      if (isUnderside) {
        grad.addColorStop(0, "#a3e635");
        grad.addColorStop(0.35, "#eab308");
        grad.addColorStop(0.8, "#ca8a04");
        grad.addColorStop(1, "#a16207");
      } else {
        grad.addColorStop(0, "#84cc16");
        grad.addColorStop(0.25, "#facc15");
        grad.addColorStop(0.7, "#eab308");
        grad.addColorStop(1, "#ca8a04");
      }

      ctx.beginPath();
      ctx.moveTo(0, r * 0.6);
      ctx.bezierCurveTo(-r * 0.4, r * 0.45, -r * 0.85, r * 0.1, -r * 0.9, -r * 0.3);
      ctx.bezierCurveTo(-r * 0.8, -r * 0.65, -r * 0.4, -r * 0.85, -r * 0.08, -r * 0.7);
      ctx.lineTo(0, -r * 0.5);
      ctx.lineTo(r * 0.08, -r * 0.7);
      ctx.bezierCurveTo(r * 0.4, -r * 0.85, r * 0.8, -r * 0.65, r * 0.9, -r * 0.3);
      ctx.bezierCurveTo(r * 0.85, r * 0.1, r * 0.4, r * 0.45, 0, r * 0.6);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Radial striations
      ctx.strokeStyle = isUnderside ? "rgba(254, 240, 138, 0.6)" : "rgba(234, 179, 8, 0.45)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let angle = -65; angle <= 65; angle += 10) {
        if (Math.abs(angle) < 4) continue;
        const rad = (angle * Math.PI) / 180;
        ctx.moveTo(0, r * 0.6);
        ctx.quadraticCurveTo(
          Math.sin(rad) * r * 0.5,
          r * 0.6 - Math.cos(rad) * r * 0.6,
          Math.sin(rad) * r * 0.88,
          -Math.cos(rad) * r * 0.7
        );
      }
      ctx.stroke();

      // Petiole Stem
      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.6);
      ctx.quadraticCurveTo(r * 0.05, r * 0.8, 0, r * 0.98);
      ctx.stroke();
      break;
    }

    case "birch": {
      // Quaking Aspen / Golden Birch - broad ovate heart shape with rapid quaking flutter
      const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 0.85);
      if (isUnderside) {
        grad.addColorStop(0, "#fde047");
        grad.addColorStop(0.5, "#ca8a04");
        grad.addColorStop(1, "#854d0e");
      } else {
        grad.addColorStop(0, "#fef08a");
        grad.addColorStop(0.3, "#facc15");
        grad.addColorStop(0.75, "#eab308");
        grad.addColorStop(1, "#a16207");
      }

      ctx.beginPath();
      ctx.moveTo(0, -r * 0.88);
      ctx.bezierCurveTo(r * 0.55, -r * 0.65, r * 0.75, 0, r * 0.45, r * 0.45);
      ctx.bezierCurveTo(r * 0.3, r * 0.6, r * 0.1, r * 0.68, 0, r * 0.65);
      ctx.bezierCurveTo(-r * 0.1, r * 0.68, -r * 0.3, r * 0.6, -r * 0.45, r * 0.45);
      ctx.bezierCurveTo(-r * 0.75, 0, -r * 0.55, -r * 0.65, 0, -r * 0.88);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Veins
      ctx.strokeStyle = isUnderside ? "rgba(254, 240, 138, 0.6)" : "rgba(253, 224, 71, 0.4)";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.65);
      ctx.lineTo(0, -r * 0.82);
      [-0.4, -0.15, 0.1, 0.35].forEach((pos) => {
        ctx.moveTo(0, r * pos);
        ctx.lineTo(r * 0.32, r * (pos - 0.18));
        ctx.moveTo(0, r * pos);
        ctx.lineTo(-r * 0.32, r * (pos - 0.18));
      });
      ctx.stroke();

      // Long flexible petiole stem
      ctx.strokeStyle = "#713f12";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.65);
      ctx.quadraticCurveTo(-r * 0.08, r * 0.82, -r * 0.05, r * 0.98);
      ctx.stroke();
      break;
    }

    case "beech":
    default: {
      // Crimson Beech / Sweetgum - rich wine/ruby elongated foliage
      const grad = ctx.createLinearGradient(0, -r * 0.85, 0, r * 0.85);
      if (isUnderside) {
        grad.addColorStop(0, "#fb7185");
        grad.addColorStop(0.4, "#e11d48");
        grad.addColorStop(0.8, "#9f1239");
        grad.addColorStop(1, "#4c0519");
      } else {
        grad.addColorStop(0, "#f43f5e");
        grad.addColorStop(0.3, "#be123c");
        grad.addColorStop(0.7, "#881337");
        grad.addColorStop(1, "#4c0519");
      }

      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.bezierCurveTo(r * 0.5, -r * 0.6, r * 0.65, -r * 0.1, r * 0.5, r * 0.35);
      ctx.bezierCurveTo(r * 0.4, r * 0.55, r * 0.2, r * 0.68, 0, r * 0.7);
      ctx.bezierCurveTo(-r * 0.2, r * 0.68, -r * 0.4, r * 0.55, -r * 0.5, r * 0.35);
      ctx.bezierCurveTo(-r * 0.65, -r * 0.1, -r * 0.5, -r * 0.6, 0, -r * 0.9);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Veins
      ctx.strokeStyle = isUnderside ? "rgba(254, 205, 211, 0.6)" : "rgba(254, 205, 211, 0.35)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.7);
      ctx.lineTo(0, -r * 0.85);
      [-0.55, -0.3, -0.05, 0.2, 0.45].forEach((pos) => {
        ctx.moveTo(0, r * pos);
        ctx.lineTo(r * 0.35, r * (pos - 0.16));
        ctx.moveTo(0, r * pos);
        ctx.lineTo(-r * 0.35, r * (pos - 0.16));
      });
      ctx.stroke();

      // Stem
      ctx.strokeStyle = "#4c0519";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.7);
      ctx.lineTo(0, r * 0.95);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
  return canvas;
}

export function FallingLeavesAmbient({ enabled = true }: FallingLeavesAmbientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number; active: boolean }>({ x: -999, y: -999, active: false });

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Pre-render botanical sprite bank (both topside and underside)
    const speciesList: LeafSpecies[] = ["maple", "oak", "ginkgo", "birch", "beech"];
    const spriteBank: Record<LeafSpecies, LeafSpritePair[]> = {
      maple: [
        { topside: createBotanicalSprite("maple", false, 0), underside: createBotanicalSprite("maple", true, 0) },
        { topside: createBotanicalSprite("maple", false, 1), underside: createBotanicalSprite("maple", true, 1) },
      ],
      oak: [
        { topside: createBotanicalSprite("oak", false, 0), underside: createBotanicalSprite("oak", true, 0) },
      ],
      ginkgo: [
        { topside: createBotanicalSprite("ginkgo", false, 0), underside: createBotanicalSprite("ginkgo", true, 0) },
      ],
      birch: [
        { topside: createBotanicalSprite("birch", false, 0), underside: createBotanicalSprite("birch", true, 0) },
      ],
      beech: [
        { topside: createBotanicalSprite("beech", false, 0), underside: createBotanicalSprite("beech", true, 0) },
      ],
    };

    const isMobile = width < 768;
    const particleCount = isMobile ? 22 : 36;
    const particles: LeafParticle[] = [];

    const initParticle = (p?: Partial<LeafParticle>, startRandomY: boolean = false): LeafParticle => {
      const species = speciesList[Math.floor(Math.random() * speciesList.length)];
      const pairs = spriteBank[species];
      const spriteIndex = Math.floor(Math.random() * pairs.length);
      const depth = 0.3 + Math.random() * 0.7; // 0.3 background, 1.0 foreground

      // Species-specific aerodynamics
      let swayAmp = 1.2 + Math.random() * 1.6;
      let pitchSpeed = 0.015 + Math.random() * 0.02;
      let rollSpeed = 0.018 + Math.random() * 0.025;
      let baseFallSpeed = 0.9 + Math.random() * 1.3;

      if (species === "ginkgo" || species === "birch") {
        // Lighter leaves flutter faster with wider drift
        swayAmp *= 1.4;
        pitchSpeed *= 1.3;
        rollSpeed *= 1.4;
        baseFallSpeed *= 0.85;
      } else if (species === "oak") {
        // Heavy oak leaves have higher inertia and slower tumble
        swayAmp *= 0.85;
        pitchSpeed *= 0.7;
        rollSpeed *= 0.8;
        baseFallSpeed *= 1.2;
      }

      return {
        x: Math.random() * width,
        y: startRandomY ? Math.random() * height : -60 - Math.random() * 100,
        depth,
        baseSize: isMobile ? 26 + Math.random() * 16 : 34 + Math.random() * 22,
        species,
        spriteIndex,
        pitch: Math.random() * Math.PI * 2,
        roll: Math.random() * Math.PI * 2,
        yaw: Math.random() * Math.PI * 2,
        tilt: 0,
        pitchSpeed,
        rollSpeed,
        yawSpeed: (Math.random() - 0.5) * 0.018,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.015 + Math.random() * 0.02,
        swayAmp,
        baseFallSpeed,
        vx: 0,
        vy: 0,
        opacity: 0.7 + depth * 0.28,
        ...p,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(initParticle({}, true));
    }

    // Pointer wind interaction
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = -999;
      let clientY = -999;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      pointerPosRef.current = { x: clientX, y: clientY, active: true };
    };

    const handlePointerLeave = () => {
      pointerPosRef.current.active = false;
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("touchend", handlePointerLeave);

    let lastTime = performance.now();
    let globalWindTime = 0;

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      globalWindTime += dt;

      // Natural gusting wind harmonics (gentle breeze that ebbs and flows)
      const windGust =
        0.25 +
        Math.sin(globalWindTime * 0.35) * 0.45 +
        Math.cos(globalWindTime * 0.85) * 0.2 +
        Math.sin(globalWindTime * 1.4) * 0.15;

      ctx.clearRect(0, 0, width, height);

      const pointer = pointerPosRef.current;

      // Sort particles by depth so foreground leaves render on top of background leaves
      particles.sort((a, b) => a.depth - b.depth);

      for (const p of particles) {
        // Aerodynamic flight angles
        p.pitch += p.pitchSpeed;
        p.roll += p.rollSpeed;
        p.yaw += p.yawSpeed;
        p.swayPhase += p.swaySpeed;

        // Lift factor: flat leaves encounter air resistance and glide slower; vertical leaves slice down faster
        const liftFactor = 0.55 + 0.45 * Math.abs(Math.sin(p.pitch));
        const gravity = p.baseFallSpeed * (0.6 + 0.5 * p.depth) * liftFactor * 42 * dt;

        // Lateral sway with bank tilt
        const swayForce = Math.cos(p.swayPhase) * p.swayAmp * 24 * dt;
        const totalWind = (windGust * 28 + swayForce) * p.depth * dt;

        p.y += gravity + p.vy;
        p.x += totalWind + p.vx;

        // Bank tilt: leaf tilts in the direction of its lateral velocity (like a real glider)
        p.tilt = (totalWind / (gravity + 0.1)) * 0.4;

        // Interactive cursor breeze impulse
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 130;
          if (distSq < maxDist * maxDist && distSq > 4) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / maxDist) * 3.5;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force * 0.5;
            p.rollSpeed += (Math.random() - 0.5) * 0.08;
          }
        }

        // Dampen transient velocities
        p.vx *= 0.92;
        p.vy *= 0.92;

        // 3D Projection & Aspect Ratio
        const scaleX = Math.cos(p.roll);
        const scaleY = Math.cos(p.pitch);
        const isUnderside = scaleX < 0;

        const effectiveScaleX = Math.abs(scaleX);
        const effectiveScaleY = 0.45 + 0.55 * Math.abs(scaleY);

        const currentSize = p.baseSize * (0.55 + 0.55 * p.depth);
        const spritePair = spriteBank[p.species][p.spriteIndex];
        const activeSprite = isUnderside ? spritePair.underside : spritePair.topside;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.yaw + p.tilt);
        ctx.scale(effectiveScaleX, effectiveScaleY);

        // Soft natural drop shadow for foreground foliage
        if (p.depth > 0.65) {
          ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
          ctx.shadowBlur = 6 * p.depth;
          ctx.shadowOffsetY = 3 * p.depth;
        }

        ctx.globalAlpha = p.opacity * (isUnderside ? 0.92 : 1.0);
        ctx.drawImage(activeSprite, -currentSize / 2, -currentSize / 2, currentSize, currentSize);
        ctx.restore();

        // Screen boundary wrapping
        if (p.y > height + 60) {
          Object.assign(p, initParticle({ y: -50, x: Math.random() * width }, false));
        } else if (p.x < -60) {
          p.x = width + 50;
        } else if (p.x > width + 60) {
          p.x = -50;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
      } else {
        lastTime = performance.now();
        if (!animFrameIdRef.current) {
          animFrameIdRef.current = requestAnimationFrame(renderLoop);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("touchend", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[35] w-full h-full select-none"
      aria-hidden="true"
    />
  );
}
