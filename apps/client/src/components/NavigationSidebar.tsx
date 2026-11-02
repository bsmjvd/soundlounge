"use client";

import React, { useState } from "react";
import { Music2, Play, Pause, MoreVertical, X, Share2 } from "lucide-react";
import type { PlaybackMode } from "../lib/player";
import type { LastSessionSnapshot } from "../lib/store/useLibraryStore";
import type { Track } from "@soundlounge/shared";
import { MOCKUP_SIDEBAR_TRACKS } from "../lib/data/mockupData";
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

  // Determine which track list to render in the sidebar based on active filter
  const displayedTracks: Track[] = React.useMemo(() => {
    if (sidebarFilter === "last_listening") {
      if (historyTracks && historyTracks.length > 0) {
        return historyTracks.slice(0, 15);
      }
      return MOCKUP_SIDEBAR_TRACKS.slice().reverse();
    }
    if (sidebarFilter === "recommended") {
      // Show recommended tracks
      return MOCKUP_SIDEBAR_TRACKS.slice(2).concat(MOCKUP_SIDEBAR_TRACKS.slice(0, 2));
    }
    // "my_playlist": show active queue if present, otherwise default mockup tracks
    if (queue && queue.length > 0) {
      return queue;
    }
    return MOCKUP_SIDEBAR_TRACKS;
  }, [sidebarFilter, queue, historyTracks]);

  const handleTrackClick = (track: Track) => {
    if (onPlayTrack) {
      onPlayTrack(track);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Left Sidebar Shell */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 lg:w-80 flex-shrink-0 bg-[#0c121e] border-r border-[#152033] flex flex-col justify-between py-6 px-5 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header & Mobile Close */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Playlist</h1>
            {isOpenMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Sub-navigation Filters: My Playlist, Last Listening, Recommended */}
          <nav className="space-y-1.5 mb-5 pb-3 border-b border-slate-800/80">
            <button
              onClick={() => {
                setSidebarFilter("my_playlist");
                onTabChange("home");
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
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
                setSidebarFilter("last_listening");
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
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
                setSidebarFilter("recommended");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
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

          {/* Numbered Tracks List (01, 02, 03...) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {displayedTracks.map((track, idx) => {
              const trackNum = (idx + 1).toString().padStart(2, "0");
              const isCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
              const isTrackPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => handleTrackClick(track)}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[#182338] text-white shadow-md ring-1 ring-cyan-500/30"
                      : "hover:bg-slate-800/50 text-slate-300"
                  }`}
                >
                  {/* Left: Track Index / Equalizer Indicator */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-5 text-[11px] font-mono text-slate-400 text-center flex-shrink-0 group-hover:hidden">
                      {trackNum}
                    </span>
                    <button
                      className="w-5 text-center flex-shrink-0 hidden group-hover:flex items-center justify-center text-[#00e5ff]"
                      aria-label="Play track"
                    >
                      {isTrackPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>

                    {/* Equalizer animation indicator for active / current track */}
                    {isTrackPlaying && (
                      <div className="flex items-end gap-0.5 h-3 flex-shrink-0">
                        <span className="w-0.5 h-3 bg-[#00e5ff] animate-[sound-wave-1_1s_ease-in-out_infinite]" />
                        <span className="w-0.5 h-2 bg-[#00e5ff] animate-[sound-wave-2_1.2s_ease-in-out_infinite]" />
                        <span className="w-0.5 h-3.5 bg-[#00e5ff] animate-[sound-wave-3_0.9s_ease-in-out_infinite]" />
                      </div>
                    )}

                    {/* Artwork Thumbnail */}
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 shadow-sm">
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
                        className={`text-xs font-semibold truncate leading-tight ${
                          isCurrent ? "text-white" : "text-slate-200 group-hover:text-white"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>

                  {/* Right side: Action icon / Active Play Badge */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-[#00e5ff] text-[#0a0e17] flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                        {isTrackPlaying ? (
                          <Pause className="w-3 h-3 fill-current" />
                        ) : (
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackClick(track);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity cursor-pointer"
                        title="Options"
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
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
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
              if (mode === "solo") {
                onModeChange("synced");
              } else {
                onOpenInvite();
              }
            }}
            className="text-[11px] font-semibold text-[#00e5ff] hover:underline cursor-pointer flex items-center gap-1"
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
