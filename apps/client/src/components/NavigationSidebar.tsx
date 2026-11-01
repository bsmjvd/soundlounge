"use client";

import React from "react";
import {
  Home,
  Mic2,
  Disc,
  LayoutGrid,
  Radio,
  Headphones,
  Heart,
  History,
  ListMusic,
  DownloadCloud,
  Users,
  Music2,
  Share2,
  Play,
  Wifi,
  Sparkles,
} from "lucide-react";
import type { PlaybackMode } from "../lib/player";
import type { LastSessionSnapshot } from "../lib/store/useLibraryStore";
import { TrackArtwork } from "./TrackArtwork";

export type NavTab =
  | "home"
  | "artists"
  | "albums"
  | "genres"
  | "radio"
  | "podcasts"
  | "liked"
  | "history"
  | "queue"
  | "downloaded"
  | "search";

interface NavigationSidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  mode: PlaybackMode;
  onModeChange: (mode: PlaybackMode) => void;
  queueCount: number;
  likedCount: number;
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

  const mainNavItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <Home className="w-4 h-4" /> },
    { id: "artists", label: "Artists", icon: <Mic2 className="w-4 h-4" /> },
    { id: "albums", label: "Albums", icon: <Disc className="w-4 h-4" /> },
    { id: "genres", label: "Genres", icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "radio", label: "Radio", icon: <Radio className="w-4 h-4" /> },
    { id: "podcasts", label: "Podcasts", icon: <Headphones className="w-4 h-4" /> },
  ];

  const libraryNavItems: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      id: "liked",
      label: "Favorites",
      icon: <Heart className="w-4 h-4" />,
      count: likedCount,
    },
    {
      id: "history",
      label: "Recently Played",
      icon: <History className="w-4 h-4" />,
      count: historyCount,
    },
    {
      id: "queue",
      label: "Playing Queue",
      icon: <ListMusic className="w-4 h-4" />,
      count: queueCount,
    },
    {
      id: "downloaded",
      label: "Downloaded",
      icon: <DownloadCloud className="w-4 h-4" />,
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
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 md:z-30 w-64 bg-[#081014] border-r border-[#15232c] flex flex-col justify-between py-5 px-3.5 transition-transform duration-300 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } h-screen overflow-y-auto`}
      >
        <div className="space-y-5">
          {/* Brand Logo with Cyan Soundwave */}
          <div
            onClick={() => onTabChange("home")}
            className="flex items-center gap-3 px-2 cursor-pointer group"
          >
            <div className="flex items-center gap-0.5 h-6">
              <span className="w-1 h-3.5 bg-[#00e5c9] rounded-full group-hover:h-5 transition-all" />
              <span className="w-1 h-5 bg-[#00e5c9] rounded-full group-hover:h-3 transition-all" />
              <span className="w-1 h-6 bg-[#00e5c9] rounded-full group-hover:h-6 transition-all" />
              <span className="w-1 h-4 bg-[#00e5c9] rounded-full group-hover:h-5 transition-all" />
              <span className="w-1 h-2.5 bg-[#00e5c9] rounded-full group-hover:h-4 transition-all" />
            </div>
            <div className="truncate">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Soundlounge
              </h1>
              <p className="text-[10px] text-[#637785] font-medium tracking-wide">
                Studio Streaming
              </p>
            </div>
          </div>

          {/* Mode Segmented Control: Solo vs Sync Lounge */}
          <div className="p-1 rounded-xl bg-[#0d181e] border border-[#1b2c35] flex items-center">
            <button
              onClick={() => onModeChange("solo")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === "solo"
                  ? "bg-[#182833] text-white shadow-sm"
                  : "text-[#697d8a] hover:text-white"
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              Solo
            </button>
            <button
              onClick={() => onModeChange("synced")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === "synced"
                  ? "bg-[#00e5c9] text-[#081014] font-semibold shadow-sm shadow-[#00e5c9]/30"
                  : "text-[#697d8a] hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Sync Lounge
            </button>
          </div>

          {/* 1. Main Navigation Items */}
          <nav className="space-y-0.5">
            {mainNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#0f1f28] text-[#00e5c9] font-semibold border-l-2 border-[#00e5c9]"
                      : "text-[#7b8f9d] hover:text-white hover:bg-[#0c1820]"
                  }`}
                >
                  <span className={isActive ? "text-[#00e5c9]" : "text-[#586e7c]"}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 2. Personal Library Section */}
          <nav className="space-y-0.5 pt-2 border-t border-[#13222a]">
            {libraryNavItems.map((item) => {
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
                      ? "bg-[#0f1f28] text-[#00e5c9] font-semibold border-l-2 border-[#00e5c9]"
                      : "text-[#7b8f9d] hover:text-white hover:bg-[#0c1820]"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className={isActive ? "text-[#00e5c9]" : "text-[#586e7c]"}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? "bg-[#00e5c9]/20 text-[#00e5c9]"
                          : "bg-[#122028] text-[#637684]"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sync Lounge Room Status Card (when in Synced Mode) */}
          {mode === "synced" && (
            <div className="p-3 rounded-xl bg-[#0c1820] border border-[#1a2d38] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#00e5c9] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e5c9] animate-pulse" />
                  Room: {roomId}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-emerald-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  {pingMs}ms
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#7d909d]">
                <span>{participantsCount} online</span>
                <button
                  onClick={onOpenInvite}
                  aria-label="Invite friends"
                  className="text-[11px] font-medium text-[#00e5c9] hover:underline cursor-pointer"
                >
                  Invite Friends
                </button>
              </div>
            </div>
          )}

          {/* Continue Listening Mini Card */}
          {lastSession && (
            <div className="p-2.5 rounded-xl bg-[#0c171e] border border-[#192b35] flex items-center justify-between gap-2.5 group hover:border-[#00e5c9]/40 transition-colors">
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
                  <p className="text-[10px] text-[#667a88] font-mono tabular-nums">
                    Resume {formatTime(lastSession.positionMs)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onResumeSession(lastSession)}
                title="Resume playback"
                className="w-7 h-7 rounded-lg bg-[#00e5c9] text-[#081014] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform flex-shrink-0 cursor-pointer shadow-sm"
              >
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions: Download Application + Keyboard Shortcuts */}
        <div className="pt-3 border-t border-[#13222a] space-y-2">
          {/* Download App Action */}
          <button
            onClick={() => alert("Soundlounge Desktop & Mobile client is ready for install.")}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#0c171e] hover:bg-[#12222b] border border-[#192b35] text-xs font-semibold text-[#8ca0ae] hover:text-[#00e5c9] transition-colors cursor-pointer"
          >
            <DownloadCloud className="w-4 h-4 text-[#00e5c9]" />
            <span>Download Desktop App</span>
          </button>

          {/* Keyboard Shortcuts */}
          <div className="px-2 pt-1 text-[10px] text-[#556976] flex items-center justify-between">
            <span>Play/Pause: Space</span>
            <span>Studio: F</span>
          </div>
        </div>
      </aside>
    </>
  );
}
