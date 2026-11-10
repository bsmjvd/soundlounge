"use client";

import React, { useRef } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Disc3, Sparkles, Clock, Music } from "lucide-react";
import type { Track, Album } from "@soundlounge/shared";
import { useTasteProfile } from "../lib/recommendation/useTasteProfile";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { type DisplayAlbum } from "../lib/data/mockupData";

interface DynamicTasteHomeSectionsProps {
  onPlayTrack: (track: Track) => void;
  onPlayMix?: (tracks: Track[]) => void;
  onSelectArtist?: (artistName: string) => void;
  onSelectAlbum?: (album: Album | DisplayAlbum) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  historyTracks?: Track[];
  isOverHero?: boolean;
}

export function DynamicTasteHomeSections({
  onPlayTrack,
  onPlayMix,
  onSelectArtist,
  onSelectAlbum,
  currentTrack,
  isPlaying,
  historyTracks = [],
  isOverHero = false,
}: DynamicTasteHomeSectionsProps) {
  const { hasTaste, dominantArtist, dominantGenre, getBecauseYouListenedSection } = useTasteProfile();
  const jumpBackScrollRef = useRef<HTMLDivElement>(null);
  const becauseScrollRef = useRef<HTMLDivElement>(null);

  const becauseSection = getBecauseYouListenedSection();

  const scrollJumpBack = (direction: "left" | "right") => {
    if (jumpBackScrollRef.current) {
      jumpBackScrollRef.current.scrollBy({
        left: direction === "left" ? -320 : 320,
        behavior: "smooth",
      });
    }
  };

  const scrollBecause = (direction: "left" | "right") => {
    if (becauseScrollRef.current) {
      becauseScrollRef.current.scrollBy({
        left: direction === "left" ? -320 : 320,
        behavior: "smooth",
      });
    }
  };

  const recentList = React.useMemo(() => {
    const seen = new Set<string>();
    const res: Track[] = [];
    for (const t of historyTracks) {
      if (!t) continue;
      const key = `${t.id}::${(t.title || "").toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        res.push(t);
      }
      if (res.length >= 10) break;
    }
    return res;
  }, [historyTracks]);

  // If the user has zero history and zero taste yet, don't show empty boxes
  if (!hasTaste && recentList.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10">
      {/* 1. "Jump Back In" / "Continue Listening" (Recent History) */}
      {recentList.length > 0 && (
        <section className="w-full">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-ink font-display">
                Jump Back In
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => scrollJumpBack("left")}
                className="text-ink-muted hover:text-ink transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-raised/50"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollJumpBack("right")}
                className="text-ink-muted hover:text-ink transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-raised/50"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={jumpBackScrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch]"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {recentList.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isItemPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className={`group flex-shrink-0 flex items-center gap-2.5 sm:gap-3 w-[210px] xs:w-[240px] sm:w-[280px] p-2 sm:p-2.5 rounded-control transition duration-200 cursor-pointer snap-start focus-visible:ring-2 focus-visible:ring-accent ${
                    isOverHero
                      ? "bg-surface-raised/80 hover:bg-surface-raised border border-ink/15 hover:border-accent/50 shadow-lg shadow-black/40"
                      : "bg-surface-raised/80 hover:bg-surface-overlay border border-line/80 hover:border-line"
                  } ${
                    isCurrent
                      ? "!border-accent shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                      : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPlayTrack(track);
                    }
                  }}
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-raised shadow-md">
                    <ImageWithFallback
                      src={track.coverUrl || "/albums/rockstar.webp"}
                      alt={track.title}
                      fallbackTitle={track.title}
                      fallbackType="album"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isItemPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-md">
                        {isItemPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold truncate transition-colors ${
                        isCurrent ? "text-accent" : "text-ink group-hover:text-accent"
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-ink-muted truncate mt-0.5">{track.artist}</p>
                    <span className="inline-block text-[11px] text-ink-muted bg-surface-raised/60 px-1.5 py-0.5 rounded mt-1.5 font-medium">
                      Recent
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. "Because You Listened To [Artist]" / "Made For You" Row */}
      {becauseSection && becauseSection.tracks.length > 0 && (
        <section className="w-full">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-ink font-display">
                  {becauseSection.title}
                </h2>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">{becauseSection.subtitle}</p>
            </div>

            <div className="flex items-center gap-2.5">
              {onPlayMix && (
                <button
                  onClick={() => onPlayMix(becauseSection.tracks)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 hover:bg-accent/25 text-accent text-xs font-semibold border border-accent/30 transition cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play Mix</span>
                </button>
              )}
              <button
                onClick={() => scrollBecause("left")}
                className="text-ink-muted hover:text-ink transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-raised/50"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollBecause("right")}
                className="text-ink-muted hover:text-ink transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-raised/50"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={becauseScrollRef}
            className="flex gap-3.5 sm:gap-5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch]"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {becauseSection.tracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isItemPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className="group flex-shrink-0 flex flex-col w-[130px] xs:w-[150px] sm:w-[170px] snap-start cursor-pointer rounded-card focus-visible:ring-2 focus-visible:ring-accent"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPlayTrack(track);
                    }
                  }}
                >
                  <div
                    className={`relative aspect-square w-full rounded-xl overflow-hidden shadow-md group-hover:shadow-2xl transition duration-300 group-hover:scale-[1.03] ${
                      isOverHero
                        ? "bg-surface-raised/70 ring-1 ring-ink/15 group-hover:ring-accent/60"
                        : "bg-surface-raised/80 ring-1 ring-line/60"
                    }`}
                  >
                    <ImageWithFallback
                      src={track.coverUrl || "/albums/rockstar.webp"}
                      alt={track.title}
                      fallbackTitle={track.title}
                      fallbackType="album"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Play button overlay */}
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isItemPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-lg group-hover:scale-110 transition-transform">
                        {isItemPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  <p
                    className={`text-sm font-semibold truncate mt-2 transition-colors ${
                      isCurrent ? "text-accent" : "text-ink group-hover:text-accent"
                    }`}
                  >
                    {track.title}
                  </p>
                  <p className="text-xs text-ink-muted truncate mt-0.5">{track.artist}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
