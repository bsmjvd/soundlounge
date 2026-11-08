"use client";

import { useEffect, useRef } from "react";
import { FallingLeaves } from "falling-leaves";

interface FallingLeavesAmbientProps {
  enabled?: boolean;
}

export function FallingLeavesAmbient({ enabled = true }: FallingLeavesAmbientProps) {
  const leavesRef = useRef<FallingLeaves | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    try {
      const isMobile = window.innerWidth < 768;
      // Initialize full-page continuous falling leaves with authentic autumn foliage
      const leaves = new FallingLeaves({
        count: isMobile ? 24 : 38,
        size: isMobile ? [24, 42] : [32, 54], // Generous visible leaves, not tiny specks
        speed: [1.4, 2.8], // Continuous natural floating descent
        wind: [-0.4, 0.8],
        sway: [1.3, 2.6],
        rotationSpeed: [-2.0, 2.0],
        shapes: ["maple", "oak", "ginkgo", "birch"],
        colors: [
          "#d9480f",
          "#e8590c",
          "#f08c00",
          "#c92a2a",
          "#a61e4d",
          "#b5651d",
          "#e0a800",
          "#f59f00",
          "#d47a2a",
        ],
        opacity: 0.85,
        zIndex: 35,
        respectReducedMotion: false, // Ensures continuous animation without freezing
        autoStart: true,
      });

      leavesRef.current = leaves;

      const handleVisibilityChange = () => {
        if (!document.hidden && leavesRef.current) {
          leavesRef.current.start();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        try {
          leaves.destroy();
        } catch {}
        leavesRef.current = null;
      };
    } catch (err) {
      console.warn("FallingLeaves initialization:", err);
    }
  }, [enabled]);

  return null;
}
