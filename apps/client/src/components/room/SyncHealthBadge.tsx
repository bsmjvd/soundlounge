"use client";

import React from "react";
import { Activity, ShieldCheck, Wifi } from "lucide-react";

interface SyncHealthBadgeProps {
  pingMs: number;
  mode: "solo" | "synced";
  className?: string;
}

export function SyncHealthBadge({ pingMs, mode, className = "" }: SyncHealthBadgeProps) {
  if (mode === "solo") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-300 ${className}`}
        title="Solo Playback: Zero network latency, instant local response"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
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
    ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
    : isCompensated
      ? "border-amber-500/40 text-amber-400 bg-amber-950/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
      : "border-rose-500/40 text-rose-400 bg-rose-950/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]";

  const dotColor = isOptimal ? "bg-emerald-400" : isCompensated ? "bg-amber-400" : "bg-rose-400";
  const label = isOptimal ? "Studio Sync" : isCompensated ? "Compensated" : "Syncing";

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono select-none transition-all ${badgeColor} ${className}`}
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
      <span className="text-[10px] opacity-75 font-mono">({Math.round(pingMs)}ms)</span>
    </div>
  );
}
