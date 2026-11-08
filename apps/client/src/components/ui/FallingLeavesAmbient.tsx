"use client";

import React, { useEffect, useRef } from "react";

interface FallingLeavesAmbientProps {
  enabled?: boolean;
}

export type MapleLeafStyle =
  | "maple_open_orange"
  | "maple_two_tone_curl"
  | "maple_folded_wing"
  | "maple_open_gold";

interface MapleSpritePair {
  topside: HTMLCanvasElement;
  underside: HTMLCanvasElement;
}

interface MapleParticle {
  x: number;
  y: number;
  depth: number; // 0.4 (distant) to 1.0 (foreground)
  baseSize: number;
  style: MapleLeafStyle;
  rotation: number;
  rotationSpeed: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  fallSpeed: number;
  wobblePhase: number;
  wobbleSpeed: number;
  vx: number;
  vy: number;
  opacity: number;
}

/**
 * Procedural Vector Autumn Maple Leaf Sprites
 * Precisely matched to the reference vector artwork by Maryna Lytkina (IconScout):
 * 1. maple_open_orange: 5-lobed Sugar Maple with sharp trident serrations, crisp white branching venation, and curved stem
 * 2. maple_two_tone_curl: The signature 3D curled leaf with bright golden-yellow blade, white veins, and deep pumpkin orange folded top flap
 * 3. maple_folded_wing: Aerodynamic side-profile tumbling leaf with delicate veins and distinctive curved dark charcoal stem
 * 4. maple_open_gold: Radiant golden-amber 5-lobed Sugar Maple with bright sunny center and fine white veins
 */
function createMapleSprite(style: MapleLeafStyle, isUnderside: boolean): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.save();
  // Safe center with ample 25px breathing margin on all sides (no clipping)
  const cx = 128;
  const cy = 136;
  ctx.translate(cx, cy);

  if (isUnderside) {
    ctx.scale(-1, 1);
  }

  if (style === "maple_two_tone_curl") {
    // -------------------------------------------------------------------------
    // Style 2: Two-Tone 3D Curled Maple Leaf (Signature IconScout Center Leaf)
    // Golden-yellow hanging blade + deep pumpkin orange folded top flap + stem
    // -------------------------------------------------------------------------

    // 1. Curved dark petiole / stem at the top fold
    ctx.beginPath();
    ctx.moveTo(8, -58);
    ctx.quadraticCurveTo(28, -74, 44, -66);
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 4.4;
    ctx.lineCap = "round";
    ctx.stroke();

    // 2. Hanging Main Golden Blade (points facing down)
    const goldGrad = ctx.createLinearGradient(0, -50, 0, 75);
    goldGrad.addColorStop(0, "#fde047");
    goldGrad.addColorStop(0.35, "#f59e0b");
    goldGrad.addColorStop(0.85, "#ea580c");
    goldGrad.addColorStop(1, "#c2410c");

    ctx.beginPath();
    // Starts under top fold on the left
    ctx.moveTo(-68, -14);
    // Left basal lobe hanging down
    ctx.bezierCurveTo(-76, 6, -82, 22, -68, 38);
    ctx.lineTo(-58, 30);
    // Mid left lobe
    ctx.bezierCurveTo(-54, 45, -42, 58, -32, 68);
    ctx.lineTo(-24, 56);
    // Central lobe pointing down (trident apex)
    ctx.bezierCurveTo(-18, 68, -8, 82, 0, 88);
    ctx.bezierCurveTo(8, 82, 18, 68, 24, 56);
    ctx.lineTo(32, 68);
    // Mid right lobe
    ctx.bezierCurveTo(42, 58, 54, 45, 58, 30);
    ctx.lineTo(68, 38);
    // Right basal lobe
    ctx.bezierCurveTo(82, 22, 76, 6, 68, -14);
    // Upper curve under fold
    ctx.quadraticCurveTo(0, -26, -68, -14);
    ctx.closePath();
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // Crisp white primary veins on the golden blade
    ctx.beginPath();
    ctx.moveTo(0, -20); ctx.lineTo(0, 84); // Central midrib
    ctx.moveTo(0, -10); ctx.lineTo(-30, 64);
    ctx.moveTo(0, -10); ctx.lineTo(30, 64);
    ctx.moveTo(0, 6); ctx.lineTo(-64, 34);
    ctx.moveTo(0, 6); ctx.lineTo(64, 34);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.stroke();

    // Secondary vein twigs
    ctx.beginPath();
    ctx.moveTo(0, 16); ctx.lineTo(-12, 32);
    ctx.moveTo(0, 16); ctx.lineTo(12, 32);
    ctx.moveTo(0, 44); ctx.lineTo(-10, 60);
    ctx.moveTo(0, 44); ctx.lineTo(10, 60);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // 3. Crease Drop Shadow under the top fold
    ctx.beginPath();
    ctx.moveTo(-74, -18);
    ctx.quadraticCurveTo(0, -28, 74, -18);
    ctx.quadraticCurveTo(0, -16, -74, -18);
    ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
    ctx.fill();

    // 4. Top Curled Flap (Vibrant Pumpkin Orange)
    const orangeGrad = ctx.createLinearGradient(0, -70, 0, -10);
    orangeGrad.addColorStop(0, "#fb923c");
    orangeGrad.addColorStop(0.5, "#ea580c");
    orangeGrad.addColorStop(1, "#c2410c");

    ctx.beginPath();
    // Lower crease edge
    ctx.moveTo(-74, -18);
    ctx.quadraticCurveTo(0, -26, 74, -18);
    // Outer folded profile
    ctx.bezierCurveTo(70, -38, 55, -55, 40, -62);
    ctx.bezierCurveTo(25, -68, 5, -72, -15, -68);
    ctx.bezierCurveTo(-38, -65, -58, -50, -74, -18);
    ctx.closePath();
    ctx.fillStyle = orangeGrad;
    ctx.fill();

    // Subtle highlight on the upper curved fold rim
    ctx.beginPath();
    ctx.moveTo(-74, -18);
    ctx.bezierCurveTo(-58, -50, -38, -65, -15, -68);
    ctx.bezierCurveTo(5, -72, 25, -68, 40, -62);
    ctx.bezierCurveTo(55, -55, 70, -38, 74, -18);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

  } else if (style === "maple_folded_wing") {
    // -------------------------------------------------------------------------
    // Style 3: Side-Profile Folded Leaf (Left Leaf in IconScout Image 2)
    // Dynamic aerodynamic sweep with distinctive curved black stem
    // -------------------------------------------------------------------------

    // Curved black/dark charcoal stem arching out gracefully
    ctx.beginPath();
    ctx.moveTo(-8, 22);
    ctx.quadraticCurveTo(-26, -4, -34, -38);
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 4.4;
    ctx.lineCap = "round";
    ctx.stroke();

    // Inner fold / underside shadow in burnt russet
    ctx.beginPath();
    ctx.moveTo(-8, 22);
    ctx.bezierCurveTo(-20, 10, -28, -6, -30, -22);
    ctx.quadraticCurveTo(-10, -8, 8, 2);
    ctx.lineTo(-8, 22);
    ctx.fillStyle = "#9a3412";
    ctx.fill();

    // Main Orange Folded Blade
    const wingGrad = ctx.createLinearGradient(-30, -20, 60, 60);
    wingGrad.addColorStop(0, "#fb923c");
    wingGrad.addColorStop(0.4, "#ea580c");
    wingGrad.addColorStop(1, "#c2410c");

    ctx.beginPath();
    ctx.moveTo(-8, 22);
    // Lower tooth
    ctx.bezierCurveTo(6, 28, 24, 34, 38, 28);
    ctx.lineTo(32, 20);
    // Lateral sharp tooth
    ctx.bezierCurveTo(46, 18, 62, 10, 70, -2);
    ctx.lineTo(58, -8);
    // Central apex tooth
    ctx.bezierCurveTo(64, -20, 68, -36, 62, -50);
    ctx.lineTo(48, -42);
    // Back edge curve returning to base
    ctx.bezierCurveTo(34, -48, 18, -40, 5, -26);
    ctx.bezierCurveTo(-6, -12, -14, 6, -8, 22);
    ctx.closePath();
    ctx.fillStyle = wingGrad;
    ctx.fill();

    // Crisp white veins on the wing
    ctx.beginPath();
    ctx.moveTo(-4, 18);
    ctx.quadraticCurveTo(24, -10, 60, -48);
    ctx.moveTo(10, 8);
    ctx.lineTo(66, -1);
    ctx.moveTo(18, 16);
    ctx.lineTo(36, 26);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.stroke();

    // Secondary vein twigs
    ctx.beginPath();
    ctx.moveTo(22, -8); ctx.lineTo(32, -24);
    ctx.moveTo(35, -22); ctx.lineTo(48, -38);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.52)";
    ctx.lineWidth = 1.3;
    ctx.stroke();

  } else {
    // -------------------------------------------------------------------------
    // Style 1 & 4: Classic 5-Lobed Autumn Sugar Maple (Orange or Gold)
    // Iconic Canadian Sugar Maple silhouette with sharp trident tips, deep sinuses,
    // radiant white branching veins, and curved stem
    // -------------------------------------------------------------------------
    const isGold = style === "maple_open_gold";

    // Curved petiole / stem at the base
    ctx.beginPath();
    ctx.moveTo(0, 45);
    ctx.quadraticCurveTo(-14, 72, -18, 95);
    ctx.strokeStyle = isGold ? "#1c1917" : "#c2410c";
    ctx.lineWidth = 4.4;
    ctx.lineCap = "round";
    ctx.stroke();

    // Leaf Body Gradient
    const openGrad = ctx.createRadialGradient(0, 15, 8, 0, -20, 115);
    if (isGold) {
      openGrad.addColorStop(0, "#fef08a"); // Bright sunny center
      openGrad.addColorStop(0.25, "#fde047");
      openGrad.addColorStop(0.65, "#f59e0b"); // Golden amber
      openGrad.addColorStop(0.9, "#ea580c"); // Autumn orange tips
      openGrad.addColorStop(1, "#c2410c");
    } else {
      openGrad.addColorStop(0, "#fed7aa"); // Warm golden center
      openGrad.addColorStop(0.2, "#fb923c"); // Radiant orange
      openGrad.addColorStop(0.65, "#ea580c"); // Rich vermilion
      openGrad.addColorStop(0.92, "#dc2626"); // Scarlet flame tips
      openGrad.addColorStop(1, "#991b1b");
    }

    ctx.beginPath();
    ctx.moveTo(0, 45);

    // 1. Lower Left Lobe (2 small teeth)
    ctx.bezierCurveTo(-20, 40, -40, 34, -52, 24);
    ctx.lineTo(-44, 18);
    ctx.bezierCurveTo(-58, 12, -72, 2, -80, -10); // Basal left tip
    ctx.lineTo(-68, -18);

    // 2. Sinus to Mid Left Lobe (3 sharp teeth)
    ctx.bezierCurveTo(-58, -14, -45, -12, -38, -18); // Deep sinus notch
    ctx.bezierCurveTo(-50, -32, -64, -48, -70, -60);
    ctx.lineTo(-58, -56);
    ctx.bezierCurveTo(-54, -68, -46, -78, -38, -84); // Mid-left tip
    ctx.lineTo(-32, -72);

    // 3. Sinus to Central Tallest Lobe (Trident: 3 sharp points)
    ctx.bezierCurveTo(-26, -58, -18, -48, -14, -52); // Deep sinus notch
    ctx.bezierCurveTo(-18, -70, -16, -88, -12, -98); // Left trident tooth
    ctx.lineTo(-4, -94);
    ctx.bezierCurveTo(-2, -106, 0, -114, 0, -118); // Central Tallest Peak!
    ctx.bezierCurveTo(0, -114, 2, -106, 4, -94);
    ctx.lineTo(12, -98); // Right trident tooth
    ctx.bezierCurveTo(16, -88, 18, -70, 14, -52);

    // 4. Sinus to Mid Right Lobe (3 sharp teeth)
    ctx.bezierCurveTo(18, -48, 26, -58, 32, -72);
    ctx.lineTo(38, -84); // Mid-right tip
    ctx.bezierCurveTo(46, -78, 54, -68, 58, -56);
    ctx.lineTo(70, -60);
    ctx.bezierCurveTo(64, -48, 50, -32, 38, -18); // Deep sinus notch

    // 5. Sinus to Lower Right Lobe (2 small teeth)
    ctx.bezierCurveTo(45, -12, 58, -14, 68, -18);
    ctx.lineTo(80, -10); // Basal right tip
    ctx.bezierCurveTo(72, 2, 58, 12, 44, 18);
    ctx.lineTo(52, 24);
    ctx.bezierCurveTo(40, 34, 20, 40, 0, 45); // Return to base

    ctx.closePath();
    ctx.fillStyle = openGrad;
    ctx.fill();

    // Crisp White Radiant Venation
    ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";

    // Primary 5 Veins
    ctx.beginPath();
    ctx.moveTo(0, 45); ctx.lineTo(0, -112); // Center apex
    ctx.moveTo(0, 34); ctx.lineTo(-66, -58); // Mid-left
    ctx.moveTo(0, 34); ctx.lineTo(66, -58); // Mid-right
    ctx.moveTo(0, 40); ctx.lineTo(-76, -8); // Lower-left
    ctx.moveTo(0, 40); ctx.lineTo(76, -8); // Lower-right
    ctx.stroke();

    // Secondary Branchlet Veins
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    // Central branch twigs
    ctx.moveTo(0, 5); ctx.lineTo(-12, -10);
    ctx.moveTo(0, 5); ctx.lineTo(12, -10);
    ctx.moveTo(0, -28); ctx.lineTo(-14, -45);
    ctx.moveTo(0, -28); ctx.lineTo(14, -45);
    ctx.moveTo(0, -60); ctx.lineTo(-10, -78);
    ctx.moveTo(0, -60); ctx.lineTo(10, -78);
    // Left branch twigs
    ctx.moveTo(-30, -8); ctx.lineTo(-38, -26);
    ctx.moveTo(-45, -30); ctx.lineTo(-54, -46);
    // Right branch twigs
    ctx.moveTo(30, -8); ctx.lineTo(38, -26);
    ctx.moveTo(45, -30); ctx.lineTo(54, -46);
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
      "maple_open_orange",
      "maple_two_tone_curl",
      "maple_folded_wing",
      "maple_open_gold",
    ];

    const spriteBank: Record<MapleLeafStyle, MapleSpritePair> = {
      maple_open_orange: {
        topside: createMapleSprite("maple_open_orange", false),
        underside: createMapleSprite("maple_open_orange", true),
      },
      maple_two_tone_curl: {
        topside: createMapleSprite("maple_two_tone_curl", false),
        underside: createMapleSprite("maple_two_tone_curl", true),
      },
      maple_folded_wing: {
        topside: createMapleSprite("maple_folded_wing", false),
        underside: createMapleSprite("maple_folded_wing", true),
      },
      maple_open_gold: {
        topside: createMapleSprite("maple_open_gold", false),
        underside: createMapleSprite("maple_open_gold", true),
      },
    };

    const isMobile = width < 768;
    // Serene, majestic count matching reference art: clearly visible foliage with presence, never crowded or distracting
    const particleCount = isMobile ? 8 : 12;
    const particles: MapleParticle[] = [];

    const initParticle = (p?: Partial<MapleParticle>, startRandomY: boolean = false): MapleParticle => {
      const style = styleList[Math.floor(Math.random() * styleList.length)];
      const depth = 0.5 + Math.random() * 0.5; // 0.5 background to 1.0 foreground

      // Natural aerodynamic sway parameters
      let swayAmp = 1.2 + Math.random() * 1.4;
      let fallSpeed = 0.85 + Math.random() * 1.15;
      let swaySpeed = 1.5 + Math.random() * 1.2;

      if (style === "maple_two_tone_curl" || style === "maple_folded_wing") {
        // Folded leaves glide with a slightly wider, more aerodynamic sway
        swayAmp *= 1.25;
        swaySpeed *= 1.1;
      }

      // Clearly visible maple leaves with crisp white veins & stems matching reference art:
      // Desktop: 56px to 82px. Mobile: 38px to 52px.
      const baseSize = isMobile ? 38 + Math.random() * 14 : 56 + Math.random() * 26;

      return {
        x: Math.random() * width,
        y: startRandomY ? Math.random() * height : -80 - Math.random() * 100,
        depth,
        baseSize,
        style,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.024,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed,
        swayAmp,
        fallSpeed,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 1.2 + Math.random() * 1.5,
        vx: 0,
        vy: 0,
        opacity: 0.82 + Math.random() * 0.18,
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
      // Robust delta time calculation preventing frozen or skipping frames
      const dt = Math.max(0.001, Math.min((time - lastTime) / 1000, 0.05));
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Gentle oscillating autumn breeze
      const windGust = Math.sin(time * 0.0006) * 0.4 + Math.cos(time * 0.0014) * 0.2;
      const pointer = pointerPosRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics updates
        p.swayPhase += p.swaySpeed * dt;
        p.wobblePhase += p.wobbleSpeed * dt;
        p.rotation += p.rotationSpeed;

        // Downward fall speed modulated by air resistance
        const gravity = p.fallSpeed * (0.65 + 0.45 * p.depth) * 50 * dt;

        // Aerodynamic horizontal sway & ambient breeze
        const swayForce = Math.cos(p.swayPhase) * p.swayAmp * 28 * dt;
        const totalWind = (windGust * 36 + swayForce) * p.depth * dt;

        p.y += gravity + p.vy;
        p.x += totalWind + p.vx;

        // Pointer breeze interaction: leaves flutter away softly from cursor / finger
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 140;
          if (distSq < maxDist * maxDist && distSq > 4) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / maxDist) * 3.6;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force * 0.4;
            p.rotationSpeed += (Math.random() - 0.5) * 0.04;
          }
        }

        // Dampen transient pointer impulses
        p.vx *= 0.93;
        p.vy *= 0.93;

        // Subtle 3D perspective wobble (maintains crisp vector shape without collapsing to needle-thin lines)
        const scaleX = 0.72 + 0.28 * Math.cos(p.wobblePhase);
        const scaleY = 0.85 + 0.15 * Math.sin(p.wobblePhase * 0.8);
        const isUnderside = Math.sin(p.wobblePhase) < -0.65;

        // Pendulum bank tilt: leaf leans naturally into direction of lateral sway
        const bankTilt = Math.sin(p.swayPhase) * 0.22;

        const currentSize = p.baseSize * (0.7 + 0.4 * p.depth);
        const spritePair = spriteBank[p.style];
        const activeSprite = isUnderside ? spritePair.underside : spritePair.topside;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation + bankTilt);
        ctx.scale(scaleX, scaleY);

        // Soft ambient shadow for depth
        if (p.depth > 0.6) {
          ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
          ctx.shadowBlur = 9 * p.depth;
          ctx.shadowOffsetY = 5 * p.depth;
        }

        ctx.globalAlpha = p.opacity;
        ctx.drawImage(activeSprite, -currentSize / 2, -currentSize / 2, currentSize, currentSize);
        ctx.restore();

        // Screen boundary wrap around
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
