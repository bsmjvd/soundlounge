"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ListMusic, Play, Search, Loader2 } from "lucide-react";
import { CURATED_PLAYLISTS, type CuratedPlaylist } from "../lib/data/curatedPlaylists";
import { ImageWithFallback } from "./ui/ImageWithFallback";

export interface PlaylistRef {
  id?: string;
  query?: string;
  fallbackTitle?: string;
  fallbackCover?: string;
}

interface PlaylistCardData extends CuratedPlaylist {
  resolvedId?: string;
  resolvedCover?: string;
  resolvedTrackCount?: number | null;
}

interface SearchPlaylistCard {
  id: string;
  title: string;
  author: string;
  trackCount: number | null;
  coverUrl: string;
}

interface PlaylistsViewProps {
  onOpenPlaylist: (ref: PlaylistRef) => void;
}

// Playlists hub: curated baked-in playlists (resolved live from YouTube Music by
// query) plus free-text playlist search.
export function PlaylistsView({ onOpenPlaylist }: PlaylistsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cards, setCards] = useState<PlaylistCardData[]>(() => CURATED_PLAYLISTS.map((c) => ({ ...c })));
  const [searchResults, setSearchResults] = useState<SearchPlaylistCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  // Debounce the free-text search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Lazily resolve each curated playlist's live cover + track count (server caches these)
  useEffect(() => {
    let cancelled = false;
    CURATED_PLAYLISTS.forEach((curated) => {
      fetch(`/api/playlist?q=${encodeURIComponent(curated.query)}&resolve=1`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data: { playlist?: SearchPlaylistCard | null }) => {
          if (cancelled || !data.playlist) return;
          setCards((prev) =>
            prev.map((card) =>
              card.id === curated.id
                ? {
                    ...card,
                    resolvedId: data.playlist!.id,
                    resolvedCover: data.playlist!.coverUrl,
                    resolvedTrackCount: data.playlist!.trackCount,
                  }
                : card
            )
          );
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setSearching(false);
      setSearchError(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError(false);

    fetch(`/api/playlist?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { playlists?: SearchPlaylistCard[] }) => {
        if (cancelled) return;
        setSearchResults(data.playlists || []);
        setSearching(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSearchError(true);
        setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const openCurated = (card: PlaylistCardData) => {
    onOpenPlaylist({
      id: card.resolvedId,
      query: card.query,
      fallbackTitle: card.title,
      fallbackCover: card.resolvedCover || card.coverUrl,
    });
  };

  const openSearchResult = (card: SearchPlaylistCard) => {
    onOpenPlaylist({ id: card.id, fallbackTitle: card.title, fallbackCover: card.coverUrl });
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-accent" />
            <span>Playlists from YouTube Music</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Curated collections and any playlist on YouTube Music — streamed through your player.
          </p>
        </div>

        {/* Playlist search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search playlists — try 'Top Hindi 2026'…"
            className="w-full min-h-11 pl-9 pr-4 rounded-control bg-surface border border-line focus:border-accent/60 text-xs text-ink placeholder:text-ink-subtle outline-none transition-colors"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent animate-spin" />
          )}
        </div>
      </div>

      {/* Search results */}
      {debouncedQuery && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-ink tracking-tight">Search results</h2>
          {searchError && (
            <p className="text-xs text-ink-muted py-4">Search failed — try again in a moment.</p>
          )}
          {!searching && !searchError && searchResults.length === 0 && (
            <p className="text-xs text-ink-muted py-4">No playlists found for "{debouncedQuery}".</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchResults.map((card) => (
              <PlaylistCard
                key={card.id}
                coverUrl={card.coverUrl}
                title={card.title}
                subtitle={card.author}
                badge={card.trackCount ? `${card.trackCount} tracks` : undefined}
                onClick={() => openSearchResult(card)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Curated playlists */}
      {!debouncedQuery && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-ink tracking-tight">Curated for you</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <PlaylistCard
                key={card.id}
                coverUrl={card.resolvedCover || card.coverUrl}
                title={card.title}
                subtitle={card.description}
                badge={
                  card.resolvedTrackCount
                    ? `${card.resolvedTrackCount} tracks`
                    : card.resolvedId
                      ? "YouTube Music"
                      : undefined
                }
                onClick={() => openCurated(card)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PlaylistCardProps {
  coverUrl: string;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}

function PlaylistCard({ coverUrl, title, subtitle, badge, onClick }: PlaylistCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer rounded-card overflow-hidden bg-surface border border-line hover:border-accent/50 transition hover:-translate-y-1 shadow-lg space-y-0 focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-raised">
        <ImageWithFallback
          src={coverUrl}
          alt={title}
          fallbackTitle={title}
          fallbackType="album"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.7)] transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
        {badge && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-canvas/90 backdrop-blur-md border border-line text-[11px] font-mono text-accent">
            {badge}
          </div>
        )}
      </div>

      <div className="p-3 space-y-1">
        <h3 className="text-sm font-bold text-ink group-hover:text-accent transition-colors truncate">{title}</h3>
        <p className="text-[11px] text-ink-muted line-clamp-2">{subtitle}</p>
      </div>
    </div>
  );
}
