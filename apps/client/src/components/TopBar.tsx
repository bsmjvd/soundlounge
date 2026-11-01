"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Users,
  Wifi,
  Share2,
  X,
  Loader2,
  Menu,
} from "lucide-react";
import type { PlaybackMode } from "../lib/player";
import type { Track } from "@soundlounge/shared";

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
            placeholder="Search song, artist, or podcast... (جستجو آهنگ، خواننده و یا پادکست)"
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

        {/* Right: Notifications, Sync Status, & User Profile Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Icon */}
          <button
            title="Notifications"
            className="hidden sm:flex p-2 rounded-full bg-[#0d181e] hover:bg-[#15252f] border border-[#1c2e38] text-[#7d8f9c] hover:text-white transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* Sync Lounge Pill */}
          {mode === "synced" ? (
            <div className="flex items-center gap-2 bg-[#0e1920] border border-[#1a323e] px-2.5 py-1 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-[#00e5c9] animate-pulse" />
              <span className="text-[#8da0ad] font-mono tabular-nums">{pingMs}ms</span>
              <button
                onClick={onOpenInvite}
                title="Invite to Room"
                className="text-[#00e5c9] hover:underline cursor-pointer"
              >
                Invite
              </button>
            </div>
          ) : (
            <button
              onClick={() => onModeChange("synced")}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0d181e] hover:bg-[#14232c] border border-[#1c2e38] text-xs font-medium text-[#7d8f9c] hover:text-[#00e5c9] transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Sync Lounge</span>
            </button>
          )}

          {/* User Profile Pill (as seen in the reference: Masoud Honarvar / Avatar) */}
          <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-[#0d181e] border border-[#1c2e38] shadow-sm select-none">
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[#00e5c9]/40 bg-[#162731]">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80"
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#00e5c9] border border-[#081014]" />
            </div>
            <span className="text-xs font-semibold text-white hidden sm:inline-block max-w-[100px] truncate">
              Masoud H.
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
