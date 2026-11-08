"use client";

import React, { useEffect, useRef } from "react";

interface FallingLeavesAmbientProps {
  enabled?: boolean;
}

export type MapleLeafStyle =
  | "maple_open_gold"
  | "maple_open_orange"
  | "maple_folded_3d"
  | "maple_side_glide";

interface MapleSpritePair {
  topside: HTMLCanvasElement;
  underside: HTMLCanvasElement;
}

interface MapleParticle {
  x: number;
  y: number;
  depth: number; // 0.35 (background) to 1.0 (foreground)
  baseSize: number;
  style: MapleLeafStyle;
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
 * Procedural Vector Autumn Maple Leaf Sprites
 * Accurately reproduces the stylized autumn foliage from the reference illustrations:
 * - 5-lobed Canadian Sugar Maple silhouette with sharp trident tips and deep sinuses
 * - Distinct, curved dark espresso/charcoal stem (petiole) at the base
 * - Delicate pale-cream/white radial venation branching to each lobe
 * - 3D folded leaves with dual-tone curl shading (golden amber exterior with rich burnt-orange curl flap)
 */
function createMapleSprite(style: MapleLeafStyle, isUnderside: boolean): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.save();
  // Center is at (128, 128)
  const cx = 128;
  const cy = 128;
  ctx.translate(cx, cy);

  // If underside, horizontally flip for authentic reverse perspective
  if (isUnderside) {
    ctx.scale(-1, 1);
  }

  // Draw stem at base: starts at (0, 60), curves gracefully downwards to (-20, 110)
  ctx.beginPath();
  ctx.moveTo(0, 60);
  ctx.quadraticCurveTo(-14, 85, -22, 112);
  ctx.strokeStyle = "#1c1917"; // Dark charcoal espresso
  ctx.lineWidth = 4.2;
  ctx.lineCap = "round";
  ctx.stroke();

  if (style === "maple_folded_3d") {
    // -------------------------------------------------------------------------
    // Style: 3D Folded Maple Leaf (Signature IconScout curl)
    // One half is golden-yellow; the folded curled flap is deep pumpkin orange
    // -------------------------------------------------------------------------

    // 1. Right / Center Blade (Luminous Golden Amber)
    const goldGrad = ctx.createLinearGradient(-30, -70, 70, 60);
    goldGrad.addColorStop(0, "#fde047"); // Bright yellow highlight
    goldGrad.addColorStop(0.35, "#f59e0b"); // Warm amber
    goldGrad.addColorStop(0.85, "#ea580c"); // Autumn orange at base
    goldGrad.addColorStop(1, "#c2410c");

    ctx.beginPath();
    ctx.moveTo(0, 60);
    // Right basal lobe
    ctx.bezierCurveTo(24, 55, 48, 50, 60, 40);
    ctx.lineTo(54, 32);
    ctx.bezierCurveTo(68, 25, 84, 15, 94, 2); // Right lateral tip
    ctx.lineTo(82, -8);
    // Right middle lobe
    ctx.bezierCurveTo(70, -4, 54, -2, 44, -8);
    ctx.bezierCurveTo(58, -26, 75, -45, 78, -58);
    ctx.lineTo(65, -54);
    ctx.bezierCurveTo(60, -68, 52, -78, 44, -84);
    ctx.lineTo(38, -70);
    // Central lobe right half
    ctx.bezierCurveTo(32, -58, 24, -48, 18, -52);
    ctx.bezierCurveTo(20, -72, 18, -88, 14, -100);
    ctx.lineTo(6, -94);
    ctx.bezierCurveTo(4, -108, 0, -118, 0, -120); // Peak
    // Midline down
    ctx.lineTo(0, 60);
    ctx.closePath();
    ctx.fillStyle = isUnderside ? "#d97706" : goldGrad;
    ctx.fill();

    // White delicate veins on the golden side
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(0, -115); // Main midrib
    ctx.moveTo(0, 45);
    ctx.lineTo(76, -56); // Mid right
    ctx.moveTo(0, 52);
    ctx.lineTo(90, 4); // Basal right
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Secondary vein twigs
    ctx.beginPath();
    ctx.moveTo(35, -5);
    ctx.lineTo(52, -22);
    ctx.moveTo(40, -50);
    ctx.lineTo(44, -82);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. Left Curled Overlapping Flap (Deep Rich Pumpkin Orange)
    const orangeGrad = ctx.createLinearGradient(0, -80, -70, 40);
    orangeGrad.addColorStop(0, "#ea580c"); // Rich orange
    orangeGrad.addColorStop(0.5, "#c2410c"); // Deep burnt orange
    orangeGrad.addColorStop(1, "#9a3412"); // Russet shadow

    // Crease drop shadow under the fold
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(-4, -115);
    ctx.lineTo(-24, -40);
    ctx.lineTo(-65, 0);
    ctx.lineTo(0, 60);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(0, 60);
    // Curled left flap profile
    ctx.bezierCurveTo(-18, 55, -42, 45, -56, 32);
    ctx.lineTo(-48, 24);
    ctx.bezierCurveTo(-62, 16, -75, 4, -82, -10); // Left tip
    ctx.lineTo(-70, -18);
    ctx.bezierCurveTo(-58, -14, -44, -12, -35, -18);
    ctx.bezierCurveTo(-46, -35, -58, -50, -60, -62);
    ctx.lineTo(-50, -58);
    ctx.bezierCurveTo(-45, -70, -38, -78, -32, -84);
    ctx.lineTo(-26, -72);
    ctx.bezierCurveTo(-20, -60, -14, -52, -10, -56);
    ctx.bezierCurveTo(-12, -74, -10, -90, -8, -102);
    ctx.lineTo(0, -120); // Join apex
    ctx.closePath();
    ctx.fillStyle = isUnderside ? goldGrad : orangeGrad;
    ctx.fill();

    // Delicate highlights on the fold crease
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(0, -120);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  } else if (style === "maple_side_glide") {
    // -------------------------------------------------------------------------
    // Style: Side-Angle Drifting Maple Leaf
    // Dynamic aerodynamic sweep in wind
    // -------------------------------------------------------------------------
    const sideGrad = ctx.createLinearGradient(-50, -80, 50, 60);
    if (isUnderside) {
      sideGrad.addColorStop(0, "#ea580c");
      sideGrad.addColorStop(1, "#9a3412");
    } else {
      sideGrad.addColorStop(0, "#fde047");
      sideGrad.addColorStop(0.4, "#f59e0b");
      sideGrad.addColorStop(0.85, "#ea580c");
      sideGrad.addColorStop(1, "#c2410c");
    }

    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.bezierCurveTo(20, 48, 42, 38, 54, 25);
    ctx.lineTo(46, 18);
    ctx.bezierCurveTo(62, 10, 78, -2, 85, -18);
    ctx.lineTo(72, -24);
    ctx.bezierCurveTo(60, -20, 46, -18, 38, -24);
    ctx.bezierCurveTo(52, -42, 68, -60, 72, -74);
    ctx.lineTo(58, -68);
    ctx.bezierCurveTo(52, -80, 42, -90, 32, -96);
    ctx.lineTo(26, -82);
    ctx.bezierCurveTo(18, -68, 12, -58, 8, -62);
    ctx.bezierCurveTo(6, -82, 4, -98, 0, -114);
    ctx.bezierCurveTo(-14, -85, -28, -60, -36, -35);
    ctx.bezierCurveTo(-48, -22, -62, -8, -68, 8);
    ctx.bezierCurveTo(-54, 25, -30, 45, 0, 60);
    ctx.closePath();
    ctx.fillStyle = sideGrad;
    ctx.fill();

    // Curved white vein
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.quadraticCurveTo(8, -20, 0, -110);
    ctx.moveTo(4, 20);
    ctx.lineTo(82, -16);
    ctx.moveTo(6, -20);
    ctx.lineTo(70, -72);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 1.8;
    ctx.stroke();
  } else {
    // -------------------------------------------------------------------------
    // Style: Full Open Autumn Maple Leaf (Gold or Red-Orange)
    // Textbook 5-lobed Sugar Maple with sharp serrations and radiant venation
    // -------------------------------------------------------------------------
    const isGold = style === "maple_open_gold";
    const openGrad = ctx.createRadialGradient(0, 20, 10, 0, -20, 130);

    if (isGold) {
      if (isUnderside) {
        openGrad.addColorStop(0, "#fbbf24");
        openGrad.addColorStop(0.5, "#f59e0b");
        openGrad.addColorStop(0.9, "#d97706");
        openGrad.addColorStop(1, "#b45309");
      } else {
        openGrad.addColorStop(0, "#fef08a"); // Sunny yellow center
        openGrad.addColorStop(0.25, "#fde047");
        openGrad.addColorStop(0.65, "#f59e0b"); // Golden amber
        openGrad.addColorStop(0.9, "#ea580c"); // Autumn orange tips
        openGrad.addColorStop(1, "#c2410c");
      }
    } else {
      // Fiery Orange-Red Maple
      if (isUnderside) {
        openGrad.addColorStop(0, "#f97316");
        openGrad.addColorStop(0.5, "#ea580c");
        openGrad.addColorStop(0.9, "#c2410c");
        openGrad.addColorStop(1, "#991b1b");
      } else {
        openGrad.addColorStop(0, "#fde047"); // Golden highlight at center
        openGrad.addColorStop(0.25, "#fb923c"); // Bright orange
        openGrad.addColorStop(0.6, "#ea580c"); // Rich vermilion
        openGrad.addColorStop(0.88, "#dc2626"); // Scarlet flame
        openGrad.addColorStop(1, "#7f1d1d"); // Deep wine border
      }
    }

    ctx.beginPath();
    ctx.moveTo(0, 60);

    // 1. Lower Left Lobe
    ctx.bezierCurveTo(-22, 54, -44, 46, -58, 35);
    ctx.lineTo(-50, 28);
    ctx.bezierCurveTo(-65, 20, -80, 8, -90, -6); // Left lateral tip
    ctx.lineTo(-78, -15);

    // 2. Sinus to Mid Left Lobe
    ctx.bezierCurveTo(-66, -11, -50, -8, -42, -14); // Deep sinus
    ctx.bezierCurveTo(-56, -32, -72, -50, -78, -64);
    ctx.lineTo(-65, -60);
    ctx.bezierCurveTo(-60, -72, -52, -82, -44, -90); // Mid-left tooth
    ctx.lineTo(-38, -76);

    // 3. Sinus to Central Tallest Lobe
    ctx.bezierCurveTo(-32, -62, -24, -52, -18, -56); // Deep notch
    ctx.bezierCurveTo(-22, -75, -20, -96, -15, -108); // Center left tooth
    ctx.lineTo(-6, -102);
    ctx.bezierCurveTo(-4, -116, 0, -128, 0, -132); // Main Central Peak!
    ctx.bezierCurveTo(0, -128, 4, -116, 6, -102);
    ctx.lineTo(15, -108); // Center right tooth
    ctx.bezierCurveTo(20, -96, 22, -75, 18, -56);

    // 4. Sinus to Mid Right Lobe
    ctx.bezierCurveTo(24, -52, 32, -62, 38, -76);
    ctx.lineTo(44, -90); // Mid-right tooth
    ctx.bezierCurveTo(52, -82, 60, -72, 65, -60);
    ctx.lineTo(78, -64);
    ctx.bezierCurveTo(72, -50, 56, -32, 42, -14); // Deep sinus

    // 5. Sinus to Lower Right Lobe
    ctx.bezierCurveTo(50, -8, 66, -11, 78, -15);
    ctx.lineTo(90, -6); // Right lateral tip
    ctx.bezierCurveTo(80, 8, 65, 20, 50, 28);
    ctx.lineTo(58, 35);
    ctx.bezierCurveTo(44, 46, 22, 54, 0, 60);

    ctx.closePath();
    ctx.fillStyle = openGrad;
    ctx.fill();

    // Botanical delicate white branching venation
    ctx.strokeStyle = isUnderside ? "rgba(254, 240, 138, 0.6)" : "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 1.9;
    ctx.lineCap = "round";

    // Main 5 Primary Veins
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(0, -125); // Center peak
    ctx.moveTo(0, 48);
    ctx.lineTo(-74, -62); // Mid-left
    ctx.moveTo(0, 48);
    ctx.lineTo(74, -62); // Mid-right
    ctx.moveTo(0, 54);
    ctx.lineTo(-86, -4); // Lower-left
    ctx.moveTo(0, 54);
    ctx.lineTo(86, -4); // Lower-right
    ctx.stroke();

    // Fine secondary branching twigs
    ctx.strokeStyle = isUnderside ? "rgba(254, 240, 138, 0.4)" : "rgba(255, 255, 255, 0.52)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // Center branch twigs
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, -18);
    ctx.moveTo(0, -35);
    ctx.lineTo(14, -54);
    ctx.moveTo(0, -70);
    ctx.lineTo(-14, -88);
    // Left branch twigs
    ctx.moveTo(-35, -5);
    ctx.lineTo(-44, -30);
    ctx.moveTo(-50, -38);
    ctx.lineTo(-62, -50);
    // Right branch twigs
    ctx.moveTo(35, -5);
    ctx.lineTo(44, -30);
    ctx.moveTo(50, -38);
    ctx.lineTo(62, -50);
    ctx.stroke();
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

    // Pre-render the 4 iconic Maple leaf styles (both topside and underside)
    const styleList: MapleLeafStyle[] = [
      "maple_open_gold",
      "maple_open_orange",
      "maple_folded_3d",
      "maple_side_glide",
    ];

    const spriteBank: Record<MapleLeafStyle, MapleSpritePair> = {
      maple_open_gold: {
        topside: createMapleSprite("maple_open_gold", false),
        underside: createMapleSprite("maple_open_gold", true),
      },
      maple_open_orange: {
        topside: createMapleSprite("maple_open_orange", false),
        underside: createMapleSprite("maple_open_orange", true),
      },
      maple_folded_3d: {
        topside: createMapleSprite("maple_folded_3d", false),
        underside: createMapleSprite("maple_folded_3d", true),
      },
      maple_side_glide: {
        topside: createMapleSprite("maple_side_glide", false),
        underside: createMapleSprite("maple_side_glide", true),
      },
    };

    const isMobile = width < 768;
    // Elegant, tranquil count: visible and magnificent, not a storm of tiny flecks
    const particleCount = isMobile ? 14 : 22;
    const particles: MapleParticle[] = [];

    const initParticle = (p?: Partial<MapleParticle>, startRandomY: boolean = false): MapleParticle => {
      const style = styleList[Math.floor(Math.random() * styleList.length)];
      const depth = 0.4 + Math.random() * 0.6; // 0.4 distant, 1.0 foreground

      // Natural aerodynamic parameters
      let swayAmp = 1.3 + Math.random() * 1.5;
      let pitchSpeed = 0.012 + Math.random() * 0.018;
      let rollSpeed = 0.014 + Math.random() * 0.022;
      let baseFallSpeed = 0.85 + Math.random() * 1.15;

      if (style === "maple_folded_3d") {
        // Folded leaves tumble with a slightly more pronounced helical sway
        swayAmp *= 1.25;
        pitchSpeed *= 1.15;
      }

      // Base sizes: clearly visible maple leaves with stems and veins
      // Desktop: 44px to 68px. Mobile: 32px to 48px.
      const baseSize = isMobile ? 32 + Math.random() * 16 : 46 + Math.random() * 24;

      return {
        x: Math.random() * width,
        y: startRandomY ? Math.random() * height : -80 - Math.random() * 120,
        depth,
        baseSize,
        style,
        pitch: Math.random() * Math.PI * 2,
        roll: Math.random() * Math.PI * 2,
        yaw: Math.random() * Math.PI * 2,
        tilt: 0,
        pitchSpeed,
        rollSpeed,
        yawSpeed: 0.008 + Math.random() * 0.014,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.025,
        swayAmp,
        baseFallSpeed,
        vx: 0,
        vy: 0,
        opacity: 0.75 + Math.random() * 0.25,
        ...p,
      };
    };

    // Initialize initial particles distributed across viewport
    for (let i = 0; i < particleCount; i++) {
      particles.push(initParticle({}, true));
    }

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
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

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Smooth ambient breeze oscillation
      const windGust = Math.sin(time * 0.0006) * 0.5 + Math.cos(time * 0.0014) * 0.25;
      const pointer = pointerPosRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 3D Rotational physics
        p.pitch += p.pitchSpeed;
        p.roll += p.rollSpeed;
        p.yaw += p.yawSpeed;
        p.swayPhase += p.swaySpeed;

        // Aerodynamic lift: flat leaves glide slower, vertical leaves cut downward faster
        const liftFactor = 0.55 + 0.45 * Math.abs(Math.sin(p.pitch));
        const gravity = p.baseFallSpeed * (0.6 + 0.5 * p.depth) * liftFactor * 42 * dt;

        // Lateral breeze & sway
        const swayForce = Math.cos(p.swayPhase) * p.swayAmp * 26 * dt;
        const totalWind = (windGust * 32 + swayForce) * p.depth * dt;

        p.y += gravity + p.vy;
        p.x += totalWind + p.vx;

        // Bank tilt: leaf naturally leans into the direction of drift
        p.tilt = (totalWind / (gravity + 0.1)) * 0.38;

        // Interactive air wake when pointer passes near
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 140;
          if (distSq < maxDist * maxDist && distSq > 4) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / maxDist) * 3.8;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force * 0.5;
            p.rollSpeed += (Math.random() - 0.5) * 0.08;
          }
        }

        // Dampen transient impulses
        p.vx *= 0.92;
        p.vy *= 0.92;

        // 3D Perspective Projection
        const scaleX = Math.cos(p.roll);
        const scaleY = Math.cos(p.pitch);
        const isUnderside = scaleX < 0;

        // Keep leaves visible without collapsing to needle-thin lines
        const effectiveScaleX = 0.35 + 0.65 * Math.abs(scaleX);
        const effectiveScaleY = 0.5 + 0.5 * Math.abs(scaleY);

        const currentSize = p.baseSize * (0.65 + 0.45 * p.depth);
        const spritePair = spriteBank[p.style];
        const activeSprite = isUnderside ? spritePair.underside : spritePair.topside;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.yaw + p.tilt);
        ctx.scale(effectiveScaleX, effectiveScaleY);

        // Soft ambient shadow for foreground foliage
        if (p.depth > 0.6) {
          ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
          ctx.shadowBlur = 8 * p.depth;
          ctx.shadowOffsetY = 4 * p.depth;
        }

        ctx.globalAlpha = p.opacity * (isUnderside ? 0.94 : 1.0);
        ctx.drawImage(activeSprite, -currentSize / 2, -currentSize / 2, currentSize, currentSize);
        ctx.restore();

        // Wrap around screen boundaries
        if (p.y > height + 80) {
          Object.assign(p, initParticle({ y: -70, x: Math.random() * width }, false));
        } else if (p.x < -80) {
          p.x = width + 70;
        } else if (p.x > width + 80) {
          p.x = -70;
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

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[15] transition-opacity duration-700 ${
        enabled ? "opacity-100" : "opacity-0"
      }`}
      style={{ willChange: "transform" }}
      aria-hidden="true"
    />
  );
}
