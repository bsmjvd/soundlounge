"use client";

import React from "react";

interface SyncHealthBadgeProps {
  pingMs: number;
  mode: "solo" | "synced";
  className?: string;
}

export function SyncHealthBadge({ pingMs, mode, className = "" }: SyncHealthBadgeProps) {
  if (mode === "solo") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-raised/80 border border-line-strong text-[11px] font-mono text-ink-secondary ${className}`}
        title="Solo Playback: Zero network latency, instant local response"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span>Solo Hi-Fi</span>
      </div>
    );
  }

  // Precision thresholds:
  // Green: < 20ms (Studio precision sync)
  // Yellow: 20ms - 80ms (Compensated jitter)
  // Red: > 80ms (Catching up)
  const isOptimal = pingMs < 20;
  const isCompensated = pingMs >= 20 && pingMs <= 80;

  const badgeColor = isOptimal
    ? "border-positive/40 text-positive bg-positive/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
    : isCompensated
      ? "border-warning/40 text-warning bg-warning/10"
      : "border-danger/40 text-danger bg-danger/10";

  const dotColor = isOptimal ? "bg-positive" : isCompensated ? "bg-warning" : "bg-danger";
  const label = isOptimal ? "Studio Sync" : isCompensated ? "Compensated" : "Syncing";

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono select-none transition ${badgeColor} ${className}`}
      title={`NTP Sync Health: ${pingMs}ms offset. ${
        isOptimal
          ? "Perfect sub-20ms studio phase alignment across all listeners."
          : isCompensated
            ? "Audio frame interpolation active."
            : "Re-synchronizing clock drift."
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-ping`} />
      <span className="font-semibold">{label}</span>
      <span className="text-[11px] opacity-75 font-mono">({Math.round(pingMs)}ms)</span>
    </div>
  );
}
