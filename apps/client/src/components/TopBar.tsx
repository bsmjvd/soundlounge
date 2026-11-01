"use client";

import React, { useEffect, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Wifi,
  Share2,
  X,
  UploadCloud,
  Menu,
  Music2,
} from "lucide-react";
import type { PlaybackMode } from "../lib/player";

interface TopBarProps {
  mode: PlaybackMode;
  onModeChange: (mode: PlaybackMode) => void;
  roomId: string;
  participantsCount: number;
  pingMs: number;
  onOpenInvite: () => void;
  onToggleMobileMenu?: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNavBack?: () => void;
  onNavForward?: () => void;
  onOpenUpload?: () => void;
}

export function TopBar({
  mode,
  onModeChange,
  roomId,
  participantsCount,
  pingMs,
  onOpenInvite,
  onToggleMobileMenu,
  onSearch,
  searchQuery,
  setSearchQuery,
  onNavBack,
  onNavForward,
  onOpenUpload,
}: TopBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Cmd+K / Ctrl+K focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#14232c] bg-[#081014]/90 backdrop-blur-xl px-4 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Mobile Menu Trigger & History Navigation */}
        <div className="flex items-center gap-2">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-[#7d8f9c] hover:text-white rounded-lg hover:bg-[#122028] transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={onNavBack}
              aria-label="Go back"
              className="w-8 h-8 rounded-full bg-[#0d181e] hover:bg-[#15252f] border border-[#1c2e38] flex items-center justify-center text-[#7d8f9c] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNavForward}
              aria-label="Go forward"
              className="w-8 h-8 rounded-full bg-[#0d181e] hover:bg-[#15252f] border border-[#1c2e38] flex items-center justify-center text-[#7d8f9c] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Rounded Pill Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-xl mx-auto"
        >
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5c707d]">
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search songs, artists, or podcasts..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            className="w-full h-10 bg-[#0d181e] hover:bg-[#101e26] focus:bg-[#12212a] border border-[#1c2e38] focus:border-[#00e5c9] rounded-full pl-10 pr-20 text-xs text-white placeholder-[#5c707d] outline-none transition-all shadow-inner"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  onSearch("");
                }}
                className="p-1 text-[#6b7e8b] hover:text-white rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center rounded border border-[#203440] bg-[#14222a] px-1.5 py-0.5 text-[10px] font-mono text-[#718593]">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Right: Real Soundlounge Actions (Upload Audio, Mode Switch, Room Sync) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              title="Upload Audio to Cloud"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d181e] hover:bg-[#14232c] border border-[#1c2e38] text-xs font-medium text-[#7d8f9c] hover:text-[#00e5c9] transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Audio</span>
            </button>
          )}

          {/* Sync Lounge Status Pill */}
          {mode === "synced" ? (
            <div className="flex items-center gap-2 bg-[#0e1920] border border-[#1a323e] px-3 py-1.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-[#00e5c9] animate-pulse" />
              <span className="text-[#8da0ad] font-mono tabular-nums">{pingMs}ms</span>
              <button
                onClick={onOpenInvite}
                title="Invite to Room"
                className="text-[#00e5c9] font-medium hover:underline cursor-pointer flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                <span>Invite</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onModeChange("synced")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d181e] hover:bg-[#14232c] border border-[#1c2e38] text-xs font-medium text-[#7d8f9c] hover:text-[#00e5c9] transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sync Lounge</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
