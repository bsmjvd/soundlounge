"use client";

import React from "react";
import {
  Radio,
  Search,
  ListMusic,
  Heart,
  Library,
  History,
  Music2,
  Users,
  Wifi,
  Share2,
  Play,
  RotateCcw,
  Sparkles,
  Command,
} from "lucide-react";
import type { PlaybackMode } from "../lib/player";
import type { LastSessionSnapshot } from "../lib/store/useLibraryStore";
import { TrackArtwork } from "./TrackArtwork";

export type NavTab = "search" | "queue" | "liked" | "playlists" | "history";

interface NavigationSidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  mode: PlaybackMode;
  onModeChange: (mode: PlaybackMode) => void;
  queueCount: number;
  likedCount: number;
  playlistsCount: number;
  historyCount: number;
  roomId: string;
  participantsCount: number;
  pingMs: number;
  onOpenInvite: () => void;
  lastSession: LastSessionSnapshot | null;
  onResumeSession: (session: LastSessionSnapshot) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function NavigationSidebar({
  activeTab,
  onTabChange,
  mode,
  onModeChange,
  queueCount,
  likedCount,
  playlistsCount,
  historyCount,
  roomId,
  participantsCount,
  pingMs,
  onOpenInvite,
  lastSession,
  onResumeSession,
  isOpenMobile = false,
  onCloseMobile,
}: NavigationSidebarProps) {
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "search",
      label: "Discover & Search",
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: "queue",
      label: "Playing Queue",
      icon: <ListMusic className="w-4 h-4" />,
      count: queueCount,
    },
    {
      id: "liked",
      label: "Liked Songs",
      icon: <Heart className="w-4 h-4" />,
      count: likedCount,
    },
    {
      id: "playlists",
      label: "Playlists",
      icon: <Library className="w-4 h-4" />,
      count: playlistsCount,
    },
    {
      id: "history",
      label: "Recent History",
      icon: <History className="w-4 h-4" />,
      count: historyCount,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Main Persistent Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 md:z-30 w-64 bg-[#0a0c12]/95 md:bg-[#0a0c12]/80 backdrop-blur-2xl border-r border-[#151821] flex flex-col justify-between py-5 px-4 transition-transform duration-300 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } h-screen`}
      >
        <div className="space-y-6">
          {/* Logo & Product Identity */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Soundlounge
              </h1>
              <p className="text-[11px] text-[#636b80] font-medium">Studio Audio Streaming</p>
            </div>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="p-1 rounded-xl bg-[#0f121a] border border-[#1a1e2b] flex items-center">
            <button
              onClick={() => onModeChange("solo")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === "solo"
                  ? "bg-[#1f2536] text-white shadow-sm"
                  : "text-[#7a8299] hover:text-white"
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              Solo
            </button>
            <button
              onClick={() => onModeChange("synced")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === "synced"
                  ? "bg-sky-600 text-white shadow-sm shadow-sky-600/30"
                  : "text-[#7a8299] hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Sync Lounge
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider uppercase text-[#4e5569]">
              Library
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#181d2a] text-white font-semibold"
                      : "text-[#8890a5] hover:text-white hover:bg-[#121622]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-indigo-400" : "text-[#6b738a]"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-[#141724] text-[#6b738a]"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sync Lounge Room Status Card (Visible when in Synced Mode) */}
          {mode === "synced" && (
            <div className="p-3 rounded-xl bg-[#0e121c] border border-[#1c2233] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Room: {roomId}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-emerald-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  {pingMs}ms
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#80889f]">
                <span>{participantsCount} online in room</span>
                <button
                  onClick={onOpenInvite}
                  aria-label="Invite friends to room"
                  className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  Invite
                </button>
              </div>
            </div>
          )}

          {/* Continue Listening Mini Card */}
          {lastSession && (
            <div className="p-2.5 rounded-xl bg-[#0e111a] border border-[#191e2b] flex items-center justify-between gap-2.5 group hover:border-[#262c3e] transition-colors">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <TrackArtwork
                  coverUrl={lastSession.track.coverUrl}
                  trackId={lastSession.track.id}
                  title={lastSession.track.title}
                  className="w-9 h-9 rounded-lg"
                  iconClassName="w-4 h-4"
                />
                <div className="truncate">
                  <p className="text-[11px] font-semibold text-white truncate">
                    {lastSession.track.title}
                  </p>
                  <p className="text-[10px] text-[#717990] font-mono tabular-nums">
                    Resume {formatTime(lastSession.positionMs)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onResumeSession(lastSession)}
                title="Resume playback"
                className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform flex-shrink-0 cursor-pointer shadow-sm"
              >
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Keyboard Shortcuts Indicator */}
        <div className="pt-4 border-t border-[#151821] px-2 text-[11px] text-[#555d72] space-y-1.5">
          <div className="flex items-center justify-between">
            <span>Play / Pause</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#131622] border border-[#1f2434] text-[10px] font-mono text-[#8a92a6]">
              Space
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#131622] border border-[#1f2434] text-[10px] font-mono text-[#8a92a6]">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Studio Mode</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#131622] border border-[#1f2434] text-[10px] font-mono text-[#8a92a6]">
              F
            </kbd>
          </div>
        </div>
      </aside>
    </>
  );
}
