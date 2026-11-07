"use client";

import React, { useSyncExternalStore } from "react";
import { FallingLeaves } from "falling-leaves/react";

interface FallingLeavesAmbientProps {
  enabled?: boolean;
}

const emptySubscribe = () => () => {};

export function FallingLeavesAmbient({ enabled = true }: FallingLeavesAmbientProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient || !enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-15 overflow-hidden select-none">
      <FallingLeaves
        fullScreen
        count={24}
        shapes={["maple", "ginkgo", "oak", "birch"]}
        speed={[0.5, 1.2]}
        wind={[-0.2, 0.6]}
        sway={[0.4, 1.2]}
        size={[16, 28]}
        opacity={0.65}
        zIndex={15}
        respectReducedMotion
      />
    </div>
  );
}
