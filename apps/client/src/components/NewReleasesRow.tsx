"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Plus, ArrowRight, Sparkles } from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { useTasteProfile } from "../lib/recommendation/useTasteProfile";
import { useLibraryStore } from "../lib/store/useLibraryStore";
import { normalizeSongTitle } from "../lib/recommendation/normalizeTitle";
import { ImageWithFallback } from "./ui/ImageWithFallback";

interface NewReleasesRowProps {
  onPlayTrack?: (track: Track) => void;
  onAddTrack?: (track: Track, playNext?: boolean) => void;
  /** Current queue contents — queued songs are not "unheard" anymore. */
  queueTracks?: Track[];
}

interface GenreFreshness {
  genre: string;
  tracks: Track[];
}

// "New For You": freshly released songs in the listener's top genres, filtered
// down to anything absent from their listening history and current queue.
export function NewReleasesRow({ onPlayTrack, onAddTrack, queueTracks = [] }: NewReleasesRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { topGenres, hasTaste } = useTasteProfile();
  const history = useLibraryStore((s) => s.history);
  const [releases, setReleases] = useState<GenreFreshness[]>([]);
  const [loading, setLoading] = useState(false);

  const genres = topGenres
    .map((g) => g.genre)
    .filter((g) => g && g !== "other")
    .slice(0, 2);

  useEffect(() => {
    if (genres.length === 0) return;
    let cancelled = false;
    setLoading(true);

    Promise.all(
      genres.map((genre) =>
        fetch(`/api/new-releases?genre=${encodeURIComponent(genre)}&limit=12`)
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
          .then((data: { tracks?: Track[] }) => ({ genre, tracks: data.tracks || [] }))
          .catch(() => ({ genre, tracks: [] as Track[] }))
      )
    ).then((results) => {
      if (cancelled) return;
      setReleases(results.filter((r) => r.tracks.length > 0));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genres.join("|")]);

  // Drop anything the listener has already heard or queued
  const unheardByGenre = React.useMemo(() => {
    const heardIds = new Set(history.map((t) => t.id));
    const heardTitles = new Set(history.map((t) => normalizeSongTitle(t.title, t.artist)));
    const queuedIds = new Set(queueTracks.map((t) => t.id));

    return releases
      .map(({ genre, tracks }) => ({
        genre,
        tracks: tracks.filter(
          (t) =>
            !heardIds.has(t.id) &&
            !queuedIds.has(t.id) &&
            !heardTitles.has(normalizeSongTitle(t.title, t.artist))
        ),
      }))
      .filter((r) => r.tracks.length > 0);
  }, [releases, history, queueTracks]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  if (!hasTaste || loading || unheardByGenre.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-ink font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>New For You</span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Fresh releases in {unheardByGenre.map((r) => r.genre).join(" & ")} you haven't heard yet
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={scrollLeft}
            className="text-ink-muted hover:text-ink transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-raised/50"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollRight}
            className="text-ink-muted hover:text-ink transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-raised/50"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-3 sm:gap-4.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {unheardByGenre.map(({ genre, tracks }) =>
          tracks.map((track) => (
            <div
              key={`${genre}-${track.id}`}
              className="group flex-shrink-0 w-[128px] min-w-[128px] sm:w-[140px] sm:min-w-[140px] snap-start rounded-card p-2 bg-surface border border-line hover:border-accent/50 transition cursor-pointer hover:-translate-y-1"
              role="button"
              tabIndex={0}
              onClick={() => onPlayTrack?.(track)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPlayTrack?.(track);
                }
              }}
            >
              <div className="relative w-full aspect-square rounded-card overflow-hidden bg-surface-raised/80 shadow-lg shadow-black/50 ring-1 ring-ink/15 group-hover:ring-accent/60 transition duration-300">
                <ImageWithFallback
                  src={track.coverUrl || ""}
                  alt={track.title}
                  fallbackTitle={track.title}
                  fallbackType="album"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-canvas/90 backdrop-blur-md border border-line text-[9px] font-bold uppercase tracking-wide text-accent">
                  New
                </span>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack?.(track);
                    }}
                    className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.7)] transform scale-75 group-hover:scale-100 transition-transform cursor-pointer"
                    aria-label={`Play ${track.title}`}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                  {onAddTrack && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddTrack(track, true);
                        }}
                        className="w-8 h-8 rounded-full bg-canvas/90 text-ink flex items-center justify-center hover:text-accent transition cursor-pointer"
                        aria-label={`Play ${track.title} next`}
                        title="Play Next"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddTrack(track, false);
                        }}
                        className="w-8 h-8 rounded-full bg-canvas/90 text-ink flex items-center justify-center hover:text-accent transition cursor-pointer"
                        aria-label={`Add ${track.title} to queue`}
                        title="Add to Queue"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-xs sm:text-[13px] font-semibold text-ink truncate mt-2 group-hover:text-accent transition-colors leading-tight">
                {track.title}
              </h3>
              <p className="text-[11px] text-ink-muted truncate mt-0.5 font-normal">{track.artist}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
