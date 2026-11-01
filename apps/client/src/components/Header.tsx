"use client";

import React from "react";
import { Radio, Users, Wifi, Share2, Music2, Menu } from "lucide-react";
import type { PlaybackMode } from "../lib/player";

interface HeaderProps {
  mode: PlaybackMode;
  onModeChange: (mode: PlaybackMode) => void;
  roomId: string;
  participantsCount: number;
  pingMs: number;
  onOpenInvite: () => void;
  onToggleMobileMenu?: () => void;
}

export function Header({
  mode,
  onModeChange,
  roomId,
  participantsCount,
  pingMs,
  onOpenInvite,
  onToggleMobileMenu,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#141724] bg-[#07090e]/80 backdrop-blur-xl px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Menu Trigger + Brand for small screens */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-[#7d869e] hover:text-white rounded-lg hover:bg-[#121520] transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Soundlounge</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-[#636c82]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Studio Engine Connected</span>
          </div>
        </div>

        {/* Center: Mode Segmented Control (Solo vs Synced) */}
        <div className="hidden sm:flex items-center p-1 rounded-xl bg-[#0d1017] border border-[#181d2a]">
          <button
            onClick={() => onModeChange("solo")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === "solo"
                ? "bg-[#1d2334] text-white shadow-sm"
                : "text-[#6b738a] hover:text-white"
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            Solo Stream
          </button>
          <button
            onClick={() => onModeChange("synced")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === "synced"
                ? "bg-sky-600 text-white shadow-sm shadow-sky-600/30"
                : "text-[#6b738a] hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Sync Lounge
          </button>
        </div>

        {/* Right: Room status & Invite Button */}
        <div className="flex items-center gap-2.5">
          {mode === "synced" ? (
            <>
              <div className="flex items-center gap-2 bg-[#0e121c] border border-[#1b2234] px-2.5 py-1 rounded-lg text-xs">
                <Wifi className={`w-3 h-3 ${pingMs < 40 ? "text-emerald-400" : "text-amber-400"}`} />
                <span className="text-[#8e97af] font-mono tabular-nums">{pingMs}ms</span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 bg-[#0e121c] border border-[#1b2234] px-2.5 py-1 rounded-lg text-xs text-[#8e97af]">
                <Users className="w-3 h-3 text-sky-400" />
                <span>{participantsCount} online</span>
              </div>

              <button
                onClick={onOpenInvite}
                aria-label="Invite friends to room"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                <span>Invite</span>
              </button>
            </>
          ) : (
            <div className="text-xs text-[#636c82] hidden sm:block">
              Solo Listening · Edge Native
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
