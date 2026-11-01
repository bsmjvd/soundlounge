"use client";

import React from "react";
import { Radio, Users, Wifi, Share2, Music2 } from "lucide-react";
import type { PlaybackMode } from "../lib/player";

interface HeaderProps {
  mode: PlaybackMode;
  onModeChange: (mode: PlaybackMode) => void;
  roomId: string;
  participantsCount: number;
  pingMs: number;
  onOpenInvite: () => void;
}

export function Header({
  mode,
  onModeChange,
  roomId,
  participantsCount,
  pingMs,
  onOpenInvite,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/40 backdrop-blur-2xl px-6 py-3.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-100 to-sky-200 bg-clip-text text-transparent">
              Soundlounge
            </h1>
            <p className="text-xs text-gray-400">Precision Sync & Solo Streamer</p>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex items-center bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10">
          <button
            onClick={() => onModeChange("solo")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "solo"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            Solo Stream
          </button>
          <button
            onClick={() => onModeChange("synced")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === "synced"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Sync Lounge
          </button>
        </div>

        {/* Sync Room Status Indicators */}
        <div className="flex items-center gap-3">
          {mode === "synced" && (
            <>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md">
                <Wifi className={`w-3.5 h-3.5 ${pingMs < 40 ? "text-emerald-400" : "text-amber-400"}`} />
                <span className="text-gray-300 font-mono tabular-nums">{pingMs}ms</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-gray-300 font-medium">{participantsCount} online</span>
              </div>
              <button
                onClick={onOpenInvite}
                aria-label="Invite friends to room"
                className="flex items-center gap-1.5 bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                Invite Friends
              </button>
            </>
          )}

          {mode === "solo" && (
            <div className="text-xs text-gray-500 hidden sm:block">
              Instant playback · No network delay
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
