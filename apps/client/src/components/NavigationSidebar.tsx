"use client";

import React, { useState, useEffect } from "react";
import {
  Music2,
  Play,
  Pause,
  MoreVertical,
  X,
  Share2,
  Compass,
  Heart,
  ListMusic,
  Clock,
  Radio,
  Users,
  Disc3,
} from "lucide-react";
import type { PlaybackMode } from "../lib/player";
import { type LastSessionSnapshot, useLibraryStore } from "../lib/store/useLibraryStore";
import type { Track } from "@soundlounge/shared";
import { MOCKUP_SIDEBAR_TRACKS } from "../lib/data/mockupData";
import { TrackArtwork } from "./TrackArtwork";
import { hapticLight } from "../lib/haptics";
import { useTasteProfile } from "../lib/recommendation/useTasteProfile";

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

export type PlaylistSidebarFilter = "my_playlist" | "last_listening" | "recommended";

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
  currentTrack?: Track | null;
  isPlaying?: boolean;
  onPlayTrack?: (track: Track) => void;
  queue?: Track[];
  historyTracks?: Track[];
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
  currentTrack,
  isPlaying = false,
  onPlayTrack,
  queue = [],
  historyTracks = [],
}: NavigationSidebarProps) {
  const [sidebarFilter, setSidebarFilter] = useState<PlaylistSidebarFilter>("my_playlist");

  // Prevent background scrolling on mobile when navigation drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpenMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpenMobile]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpenMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseMobile?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  const { getSidebarRecommendedTracks } = useTasteProfile();
  const likedTracks = useLibraryStore((s) => s.likedTracks);

  // Determine which track list to render in the sidebar based on active filter
  const displayedTracks: Track[] = React.useMemo(() => {
    if (sidebarFilter === "last_listening") {
      if (historyTracks && historyTracks.length > 0) {
        return historyTracks.slice(0, 15);
      }
      return getSidebarRecommendedTracks().slice().reverse();
    }
    if (sidebarFilter === "recommended") {
      return getSidebarRecommendedTracks();
    }
    // "my_playlist": show user's liked tracks or personalized recommendations
    if (likedTracks && likedTracks.length > 0) {
      return likedTracks.slice(0, 15);
    }
    return getSidebarRecommendedTracks();
  }, [sidebarFilter, historyTracks, likedTracks, getSidebarRecommendedTracks]);

  const handleTrackClick = (track: Track) => {
    hapticLight();
    if (onPlayTrack) {
      onPlayTrack(track);
    }
  };

  const handleNavClick = (tab: NavTab) => {
    hapticLight();
    onTabChange(tab);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile High-Z-Index Backdrop with Smooth Blur */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md lg:hidden transition-opacity duration-300 animate-fadeIn"
          onClick={() => {
            hapticLight();
            onCloseMobile?.();
          }}
          aria-hidden="true"
        />
      )}

      {/* Responsive Left Sidebar Drawer: Fixed & Elevated on Mobile, Static Column on Desktop */}
      <aside
        role="dialog"
        aria-modal={isOpenMobile}
        aria-label="Navigation & Playlist Sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-[130] lg:z-30 w-[86vw] max-w-[340px] sm:max-w-[360px] lg:w-80 flex-shrink-0 bg-[#0c121e] border-r border-[#152033] shadow-2xl shadow-black/80 lg:shadow-none flex flex-col justify-between px-4 sm:px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:py-6 transition-transform duration-300 ease-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header & Mobile Close */}
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800/80 lg:border-none lg:pb-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_12px_rgba(0,229,255,0.4)]">
                SL
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans leading-tight">
                  Playlist
                </h1>
                <span className="text-[10px] text-slate-400 lg:hidden font-mono">
                  {mode === "synced" ? `Synced Room #${roomId}` : "Solo Player"}
                </span>
              </div>
            </div>

            {isOpenMobile && (
              <button
                onClick={() => {
                  hapticLight();
                  onCloseMobile?.();
                }}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* MOBILE ONLY: Quick Exploration & Library Navigation Hub */}
          <div className="lg:hidden mb-4 pb-3 border-b border-slate-800/80">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Navigate
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleNavClick("home")}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "home"
                    ? "bg-[#00e5ff]/15 text-[#00e5ff] font-bold ring-1 ring-[#00e5ff]/30"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Discover</span>
              </button>

              <button
                onClick={() => handleNavClick("liked")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "liked"
                    ? "bg-[#00e5ff]/15 text-[#00e5ff] font-bold ring-1 ring-[#00e5ff]/30"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Heart className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                  <span className="truncate">Liked</span>
                </div>
                {likedCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {likedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick("queue")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "queue"
                    ? "bg-[#00e5ff]/15 text-[#00e5ff] font-bold ring-1 ring-[#00e5ff]/30"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ListMusic className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
                  <span className="truncate">Queue</span>
                </div>
                {queueCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff]">
                    {queueCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick("history")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "history"
                    ? "bg-[#00e5ff]/15 text-[#00e5ff] font-bold ring-1 ring-[#00e5ff]/30"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                  <span className="truncate">History</span>
                </div>
                {historyCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {historyCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick("genres")}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "genres" || activeTab === "radio"
                    ? "bg-[#00e5ff]/15 text-[#00e5ff] font-bold ring-1 ring-[#00e5ff]/30"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Radio className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                <span className="truncate">Radio</span>
              </button>

              <button
                onClick={() => handleNavClick("artists")}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "artists"
                    ? "bg-[#00e5ff]/15 text-[#00e5ff] font-bold ring-1 ring-[#00e5ff]/30"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                <span className="truncate">Artists</span>
              </button>
            </div>
          </div>

          {/* Sub-navigation Filters: My Playlist, Last Listening, Recommended */}
          <nav className="space-y-1 mb-3 pb-2.5 border-b border-slate-800/80">
            <button
              onClick={() => {
                hapticLight();
                setSidebarFilter("my_playlist");
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer min-h-[38px] ${
                sidebarFilter === "my_playlist"
                  ? "text-[#00e5ff] bg-[#00e5ff]/10 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Music2
                  className={`w-3.5 h-3.5 ${sidebarFilter === "my_playlist" ? "text-[#00e5ff]" : "text-slate-400"}`}
                />
                <span>My Playlist</span>
              </div>
              {queueCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff]">
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                hapticLight();
                setSidebarFilter("last_listening");
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer min-h-[38px] ${
                sidebarFilter === "last_listening"
                  ? "text-[#00e5ff] bg-[#00e5ff]/10 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full border ${
                    sidebarFilter === "last_listening"
                      ? "border-[#00e5ff] bg-[#00e5ff]"
                      : "border-slate-500 bg-transparent"
                  }`}
                />
                <span>Last Listening</span>
              </div>
              {historyCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                hapticLight();
                setSidebarFilter("recommended");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer min-h-[38px] ${
                sidebarFilter === "recommended"
                  ? "text-[#00e5ff] bg-[#00e5ff]/10 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full border ${
                  sidebarFilter === "recommended" ? "border-[#00e5ff] bg-[#00e5ff]" : "border-slate-500 bg-transparent"
                }`}
              />
              <span>Recommended</span>
            </button>
          </nav>

          {/* Numbered Tracks List (01, 02, 03...) with Touch Optimization */}
          <div
            className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {displayedTracks.map((track, idx) => {
              const trackNum = (idx + 1).toString().padStart(2, "0");
              const isCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
              const isTrackPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => handleTrackClick(track)}
                  className={`group relative flex items-center justify-between px-2.5 py-2.5 rounded-xl transition-all cursor-pointer select-none active:scale-[0.98] ${
                    isCurrent
                      ? "bg-[#182338] text-white shadow-md ring-1 ring-cyan-500/40"
                      : "hover:bg-slate-800/50 text-slate-300"
                  }`}
                >
                  {/* Left: Track Index / Touch-Friendly Play Indicator */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Number label on desktop; on mobile, clear touch icon */}
                    <span className="w-5 text-[11px] font-mono text-slate-400 text-center flex-shrink-0 group-hover:hidden hidden sm:inline-block">
                      {trackNum}
                    </span>

                    {/* Play/Pause Button (visible on mobile touch, visible on desktop hover) */}
                    <div
                      className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-transform ${
                        isTrackPlaying
                          ? "bg-[#00e5ff] text-[#0a0e17] shadow-[0_0_8px_rgba(0,229,255,0.5)]"
                          : isCurrent
                            ? "bg-[#00e5ff]/20 text-[#00e5ff]"
                            : "text-slate-400 group-hover:text-[#00e5ff] sm:hidden sm:group-hover:flex"
                      }`}
                    >
                      {isTrackPlaying ? (
                        <Pause className="w-3 h-3 fill-current" />
                      ) : (
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      )}
                    </div>

                    {/* Equalizer animation indicator for active / current track */}
                    {isTrackPlaying && (
                      <div className="hidden sm:flex items-end gap-0.5 h-3 flex-shrink-0">
                        <span className="w-0.5 h-3 bg-[#00e5ff] animate-[sound-wave-1_1s_ease-in-out_infinite]" />
                        <span className="w-0.5 h-2 bg-[#00e5ff] animate-[sound-wave-2_1.2s_ease-in-out_infinite]" />
                        <span className="w-0.5 h-3.5 bg-[#00e5ff] animate-[sound-wave-3_0.9s_ease-in-out_infinite]" />
                      </div>
                    )}

                    {/* Artwork Thumbnail */}
                    <div className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 shadow-sm relative">
                      <TrackArtwork
                        coverUrl={track.coverUrl}
                        trackId={track.id}
                        title={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Song Title & Artist */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs sm:text-[13px] font-semibold truncate leading-tight ${
                          isCurrent ? "text-white" : "text-slate-200 group-hover:text-white"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Active Indicator or Touch Button */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackClick(track);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity cursor-pointer hidden sm:block"
                        title="Play"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Room Sync status pill */}
        <div className="pt-3.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                mode === "synced" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-600"
              }`}
            />
            <span className="font-mono text-[11px] text-slate-300">
              {mode === "synced" ? `Room: ${roomId}` : "Solo Player"}
            </span>
          </div>

          <button
            onClick={() => {
              hapticLight();
              if (mode === "solo") {
                onModeChange("synced");
              } else {
                onOpenInvite();
              }
            }}
            className="text-[11px] font-semibold text-[#00e5ff] hover:underline cursor-pointer flex items-center gap-1 py-1 px-1.5 rounded hover:bg-[#00e5ff]/10"
          >
            {mode === "synced" ? (
              <>
                <Share2 className="w-3 h-3" />
                <span>Invite ({participantsCount})</span>
              </>
            ) : (
              <span>Sync Room</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
