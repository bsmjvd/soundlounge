"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Music2,
  Play,
  Pause,
  X,
  Share2,
  Clock,
  Radio,
  Users,
  Disc3,
} from "lucide-react";
import type { PlaybackMode } from "../lib/player";
import { type LastSessionSnapshot, useLibraryStore } from "../lib/store/useLibraryStore";
import type { Track } from "@soundlounge/shared";
import { TrackArtwork } from "./TrackArtwork";
import { hapticLight } from "../lib/haptics";
import { useTasteProfile } from "../lib/recommendation/useTasteProfile";
import { useFocusTrap } from "../hooks/useFocusTrap";

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
  | "playlists"
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
  onPlayTrackFromList?: (tracks: Track[], startIndex: number) => void;
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
  onPlayTrackFromList,
  queue = [],
  historyTracks = [],
}: NavigationSidebarProps) {
  const [sidebarFilter, setSidebarFilter] = useState<PlaylistSidebarFilter>("my_playlist");
  const [isDesktop, setIsDesktop] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  useFocusTrap(isOpenMobile, asideRef, () => onCloseMobile?.());

  // The drawer stays mounted for its slide animation; keep it out of the tab order
  // and the accessibility tree on mobile while it is closed.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

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

  const { getSidebarRecommendedTracks } = useTasteProfile();
  const likedTracks = useLibraryStore((s) => s.likedTracks);

  // Determine which track list to render in the sidebar based on active filter.
  // Each tab shows ONLY its own content — recommendations appear exclusively
  // under the "Recommended" tab.
  const displayedTracks: Track[] = React.useMemo(() => {
    if (sidebarFilter === "last_listening") {
      return (historyTracks || []).slice(0, 15);
    }
    if (sidebarFilter === "recommended") {
      return getSidebarRecommendedTracks();
    }
    // "my_playlist": the user's liked songs only
    return (likedTracks || []).slice(0, 15);
  }, [sidebarFilter, historyTracks, likedTracks, getSidebarRecommendedTracks]);

  const emptyStateCopy =
    sidebarFilter === "my_playlist"
      ? { title: "Nothing here yet", description: "Like a song and it will show up in this list." }
      : sidebarFilter === "last_listening"
        ? { title: "Nothing here yet", description: "Play something and it will show up in this list." }
        : { title: "Nothing here yet", description: "Play a few songs and recommendations will appear here." };

  const handleTrackClick = (track: Track, idx: number) => {
    hapticLight();
    // Play the whole sidebar list starting here, like a playlist
    if (onPlayTrackFromList) {
      onPlayTrackFromList(displayedTracks, idx);
    } else if (onPlayTrack) {
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
        ref={asideRef}
        role={isOpenMobile ? "dialog" : undefined}
        aria-modal={isOpenMobile ? true : undefined}
        aria-label="Navigation & Playlist Sidebar"
        tabIndex={-1}
        inert={!isOpenMobile && !isDesktop ? true : undefined}
        className={`fixed lg:static top-0 bottom-0 left-0 z-[130] lg:z-30 w-[86vw] max-w-[340px] sm:max-w-[360px] lg:w-80 flex-shrink-0 bg-surface border-r border-line shadow-2xl shadow-black/80 lg:shadow-none flex flex-col justify-between px-4 sm:px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:py-6 transition-transform duration-300 ease-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header & Mobile Close */}
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-line/80 lg:border-none lg:pb-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-control bg-accent flex items-center justify-center text-accent-foreground font-black text-sm shadow-glow-soft">
                SL
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-display leading-tight">
                  Playlist
                </h1>
                <span className="text-[11px] text-ink-muted lg:hidden font-mono">
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
                className="w-11 h-11 rounded-full bg-surface-raised/80 hover:bg-surface-overlay text-ink-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* MOBILE ONLY: Secondary destinations. Primary nav lives in the thumb dock. */}
          <div className="lg:hidden mb-4 pb-3 border-b border-line/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2 px-1">
              More
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleNavClick("artists")}
                aria-current={activeTab === "artists" ? "page" : undefined}
                className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-control text-[11px] font-semibold transition cursor-pointer ${
                  activeTab === "artists"
                    ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                    : "text-ink-secondary hover:bg-surface-raised/60 hover:text-ink"
                }`}
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Artists</span>
              </button>

              <button
                onClick={() => handleNavClick("history")}
                aria-current={activeTab === "history" ? "page" : undefined}
                className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-control text-[11px] font-semibold transition cursor-pointer ${
                  activeTab === "history"
                    ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                    : "text-ink-secondary hover:bg-surface-raised/60 hover:text-ink"
                }`}
              >
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">History</span>
              </button>

              <button
                onClick={() => handleNavClick("genres")}
                aria-current={
                  activeTab === "genres" || activeTab === "radio" ? "page" : undefined
                }
                className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-control text-[11px] font-semibold transition cursor-pointer ${
                  activeTab === "genres" || activeTab === "radio"
                    ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                    : "text-ink-secondary hover:bg-surface-raised/60 hover:text-ink"
                }`}
              >
                <Radio className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Genres</span>
              </button>
            </div>
          </div>

          {/* Sub-navigation Filters: My Playlist, Last Listening, Recommended */}
          <nav className="space-y-1 mb-3 pb-2.5 border-b border-line/80">
            <button
              onClick={() => {
                hapticLight();
                setSidebarFilter("my_playlist");
              }}
              aria-pressed={sidebarFilter === "my_playlist"}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-control text-xs font-semibold tracking-wide transition cursor-pointer min-h-11 ${
                sidebarFilter === "my_playlist"
                  ? "text-accent bg-accent/10 font-bold"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Music2
                  className={`w-3.5 h-3.5 ${sidebarFilter === "my_playlist" ? "text-accent" : "text-ink-muted"}`}
                />
                <span>My Playlist</span>
              </div>
              {queueCount > 0 && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                hapticLight();
                setSidebarFilter("last_listening");
              }}
              aria-pressed={sidebarFilter === "last_listening"}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-control text-xs font-semibold tracking-wide transition cursor-pointer min-h-11 ${
                sidebarFilter === "last_listening"
                  ? "text-accent bg-accent/10 font-bold"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full border ${
                    sidebarFilter === "last_listening"
                      ? "border-accent bg-accent"
                      : "border-ink-subtle bg-transparent"
                  }`}
                />
                <span>Last Listening</span>
              </div>
              {historyCount > 0 && (
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-surface-raised text-ink-muted">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                hapticLight();
                setSidebarFilter("recommended");
              }}
              aria-pressed={sidebarFilter === "recommended"}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer min-h-11 ${
                sidebarFilter === "recommended"
                  ? "text-accent bg-accent/10 font-bold"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised/40"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full border ${
                  sidebarFilter === "recommended" ? "border-accent bg-accent" : "border-ink-subtle bg-transparent"
                }`}
              />
              <span>Recommended</span>
            </button>
          </nav>

          {/* Numbered Tracks List (01, 02, 03...) with Touch Optimization */}
          <div
            className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-none overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {displayedTracks.map((track, idx) => {
              const trackNum = (idx + 1).toString().padStart(2, "0");
              const isCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
              const isTrackPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => handleTrackClick(track, idx)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Play ${track.title} by ${track.artist}`}
                  aria-current={isCurrent ? "true" : undefined}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleTrackClick(track, idx);
                    }
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2.5 rounded-xl transition cursor-pointer select-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent ${
                    isCurrent
                      ? "bg-surface-raised text-ink shadow-md ring-1 ring-accent/40"
                      : "hover:bg-surface-raised/50 text-ink-secondary"
                  }`}
                >
                  {/* Left: Track Index / Touch-Friendly Play Indicator */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Number label on desktop; on mobile, clear touch icon */}
                    <span className="w-5 text-[11px] font-mono text-ink-muted text-center flex-shrink-0 group-hover:hidden hidden sm:inline-block">
                      {trackNum}
                    </span>

                    {/* Play/Pause Button (visible on mobile touch, visible on desktop hover) */}
                    <div
                      className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-transform ${
                        isTrackPlaying
                          ? "bg-accent text-accent-foreground shadow-[0_0_8px_rgba(0,229,255,0.5)]"
                          : isCurrent
                            ? "bg-accent/20 text-accent"
                            : "text-ink-muted group-hover:text-accent sm:hidden sm:group-hover:flex"
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
                        <span className="w-0.5 h-3 origin-bottom bg-accent animate-sound-wave-1" />
                        <span className="w-0.5 h-2 origin-bottom bg-accent animate-sound-wave-2" />
                        <span className="w-0.5 h-3.5 origin-bottom bg-accent animate-sound-wave-3" />
                      </div>
                    )}

                    {/* Artwork Thumbnail */}
                    <div className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-lg overflow-hidden bg-surface-raised flex-shrink-0 shadow-sm relative">
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
                          isCurrent ? "text-ink" : "text-ink group-hover:text-ink"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5 font-normal">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Right side: active indicator */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Room Sync status pill */}
        <div className="pt-3.5 mt-2 border-t border-line/80 flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                mode === "synced" ? "bg-positive shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-line-strong"
              }`}
            />
            <span className="font-mono text-[11px] text-ink-secondary">
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
            className="text-[11px] font-semibold text-accent hover:underline cursor-pointer flex items-center gap-1 py-1 px-1.5 rounded hover:bg-accent/10"
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
