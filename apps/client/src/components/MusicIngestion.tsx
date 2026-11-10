"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  UploadCloud,
  Play,
  ArrowRight,
  Plus,
  X,
  Loader2,
  Check,
  Heart,
  TrendingUp,
  Flame,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Clapperboard,
  Users,
} from "lucide-react";
import type { Track, Album } from "@soundlounge/shared";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import { useLibraryStore } from "../lib/store/useLibraryStore";
import { prefetchTrack } from "../lib/prefetch";
import { TrackArtwork } from "./TrackArtwork";

interface MusicIngestionProps {
  onAddTrack: (track: Track, playNext?: boolean) => void;
  onPlayDirect?: (track: Track) => void;
  roomId: string;
  inviteToken?: string;
  workerHttpUrl?: string;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  onSelectAlbum?: (album: Album) => void;
}

const DISCOVERY_TAGS = [
  "Sidhu Moose Wala",
  "The Weeknd",
  "Lata Mangeshkar",
  "Jagjit Singh",
  "Daft Punk",
  "A.R. Rahman",
  "The Train",
  "Lofi Beats",
];

const PAGE_SIZE = 10;

export function MusicIngestion({
  onAddTrack,
  onPlayDirect,
  roomId,
  inviteToken,
  workerHttpUrl = process.env.NEXT_PUBLIC_WORKER_HTTP_URL || "http://localhost:8787",
  searchInputRef: externalSearchRef,
  initialQuery = "",
  onQueryChange,
  onSelectAlbum,
}: MusicIngestionProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Matching disambiguated albums from catalog
  const matchingAlbums = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    return ALBUMS_CATALOG.filter((alb) => {
      const matchTitle = alb.title.toLowerCase().includes(q) || q.includes(alb.title.toLowerCase());
      const matchArtist = alb.primaryArtist.toLowerCase().includes(q);
      const matchSingers = alb.featuredSingers.some((s) => s.toLowerCase().includes(q));
      const matchCast = alb.movieDetails?.starCast.some((star) => star.toLowerCase().includes(q));
      const matchMovie = alb.movieDetails?.movieTitle?.toLowerCase().includes(q);
      const matchDisambig = alb.disambiguationLabel?.toLowerCase().includes(q);
      return matchTitle || matchArtist || matchSingers || matchCast || matchMovie || matchDisambig;
    });
  }, [searchQuery]);

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTracks, setTotalTracks] = useState(0);
  const [sortBy, setSortBy] = useState<"views" | "relevance" | "duration">("relevance");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const internalSearchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = externalSearchRef || internalSearchRef;

  const { isLiked, toggleLike } = useLibraryStore();

  // Sync with initialQuery when it changes externally
  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== searchQuery) {
      setSearchQuery(initialQuery);
      setCurrentPage(1);
      if (initialQuery.trim().length > 0) {
        executeSearch(initialQuery.trim(), 1, sortBy);
      }
    }
  }, [initialQuery]);

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInputRef]);

  // Execute Search query with page and sort options; a newer search aborts the one in flight
  const searchAbortRef = useRef<AbortController | null>(null);
  const executeSearch = async (query: string, page: number = 1, sort: "views" | "relevance" | "duration" = sortBy) => {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const clean = query.trim();
    if (!clean || clean.length < 1) {
      setSearchResults([]);
      setTotalTracks(0);
      setTotalPages(1);
      setIsSearching(false);
      setSearchError("");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(clean)}&page=${page}&limit=${PAGE_SIZE}&sort=${sort}`,
        { signal: controller.signal }
      );
      if (!res.ok) {
        setSearchResults([]);
        setTotalTracks(0);
        setSearchError("Search is unavailable right now. Check your connection and retry.");
        return;
      }
      const data = await res.json();
      setSearchResults(data.tracks || []);
      (data.tracks || []).slice(0, 2).forEach(prefetchTrack);
      setTotalTracks(data.totalTracks || data.tracks?.length || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.page || page);
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("Search error:", err);
        setSearchResults([]);
        setTotalTracks(0);
        setSearchError("Search didn't complete. Check your connection and retry.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
        setHasSearched(true);
      }
    }
  };

  // Debounced search when query changes
  useEffect(() => {
    const clean = searchQuery.trim();
    if (!clean || clean.length < 1) {
      setSearchResults([]);
      setTotalTracks(0);
      setTotalPages(1);
      setIsSearching(false);
      setSearchError("");
      return;
    }

    const timer = setTimeout(() => {
      setCurrentPage(1);
      executeSearch(clean, 1, sortBy);
    }, 250);

    return () => {
      clearTimeout(timer);
      searchAbortRef.current?.abort();
    };
  }, [searchQuery, sortBy]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentPage(1);
      executeSearch(searchQuery.trim(), 1, sortBy);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    executeSearch(searchQuery, newPage, sortBy);
    resultsContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSortChange = (newSort: "views" | "relevance" | "duration") => {
    if (newSort === sortBy) return;
    setSortBy(newSort);
    setCurrentPage(1);
    executeSearch(searchQuery, 1, newSort);
  };

  const handleSelectTrack = (track: Track, playNow: boolean = false, playNext: boolean = false) => {
    setRecentlyAddedId(track.id);
    setTimeout(() => setRecentlyAddedId(null), 1800);

    if (playNow && onPlayDirect) {
      onPlayDirect(track);
    } else {
      onAddTrack(track, playNext);
    }
  };

  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Direct Audio File Upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const tokenParam = inviteToken ? `?invite=${encodeURIComponent(inviteToken)}` : "";
      const presignRes = await fetch(`${workerHttpUrl}/api/rooms/${roomId}/upload-url${tokenParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "audio/mpeg",
          size: file.size,
        }),
      });

      let publicUrl = URL.createObjectURL(file);
      let key = undefined;

      if (presignRes.ok) {
        const data = await presignRes.json();
        key = data.key;
        if (data.uploadUrl && data.uploadUrl !== data.publicUrl) {
          const putRes = await fetch(data.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "audio/mpeg" },
            body: file,
          });
          // On failure keep the local object URL: it still plays here, and rooms refuse blob: tracks
          if (putRes.ok) publicUrl = data.publicUrl;
        }
      }

      const track: Track = {
        id: `upl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local Upload",
        durationMs: 210000,
        url: publicUrl,
        source: "upload",
        r2Key: key,
        createdAt: Date.now(),
        views: 1,
        viewsFormatted: "Uploaded",
      };

      onAddTrack(track, false);
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    } catch (err) {
      console.error("Upload error", err);
      const track: Track = {
        id: `upl_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local Upload",
        durationMs: 180000,
        url: URL.createObjectURL(file),
        source: "upload",
        createdAt: Date.now(),
      };
      onAddTrack(track, false);
      setIsUploading(false);
    }
  };

  // Generate pagination page numbers (e.g. 1, 2, 3, 4, 5)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6" ref={resultsContainerRef} aria-busy={isSearching}>
      {/* Search Input Bar + Quick Upload Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleManualSearch} role="search" aria-label="Search music" className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-subtle">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Search className="w-4 h-4" />}
          </div>

          <input
            ref={searchInputRef}
            type="text"
            name="search"
            aria-label="Search songs, artists, or paste a YouTube link"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search songs, artists, or paste a YouTube audio link..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onQueryChange?.(e.target.value);
            }}
            className="w-full h-11 bg-surface border border-line-strong focus:border-accent rounded-control pl-10 pr-24 text-base sm:text-xs text-ink placeholder-ink-subtle outline-none transition-colors shadow-inner"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  onQueryChange?.("");
                  setSearchResults([]);
                  setTotalTracks(0);
                  setSearchError("");
                }}
                aria-label="Clear search"
                className="flex h-9 w-9 items-center justify-center text-ink-subtle hover:text-ink rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-line bg-surface-raised px-1.5 py-0.5 text-[11px] font-mono text-ink-muted">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Hidden File Input & Upload Audio Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-busy={isUploading}
          className="h-11 px-4 rounded-control bg-surface hover:bg-surface-raised border border-line-strong text-xs font-medium text-ink-muted hover:text-accent flex items-center justify-center gap-2 transition-colors cursor-pointer flex-shrink-0"
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
          ) : (
            <UploadCloud className="w-3.5 h-3.5" />
          )}
          <span>Upload Audio</span>
        </button>
      </div>

      {/* Discovery Tags (when no search query is active) */}
      {!searchQuery && (
        <div className="space-y-3 p-4 rounded-2xl bg-surface-sunken border border-line">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-accent">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Popular Artists & Soundtracks</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DISCOVERY_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  onQueryChange?.(tag);
                }}
                className="min-h-10 px-3 py-1.5 rounded-control bg-surface-raised hover:bg-surface-overlay border border-line hover:border-accent/40 text-xs text-ink-muted hover:text-ink transition cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state when fetching results */}
      {isSearching && searchResults.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-line bg-surface flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <p className="text-xs text-ink-muted font-medium">
            Searching tracks, artists, and audio for &ldquo;{searchQuery}&rdquo;...
          </p>
        </div>
      )}

      {/* Matching Disambiguated Albums & Movie Soundtracks */}
      {matchingAlbums.length > 0 && (
        <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-r from-surface via-surface-sunken to-surface border border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider">
              <Disc3 className="w-4 h-4 text-accent" />
              <span>Matching Soundtracks & Albums ({matchingAlbums.length})</span>
            </div>
            <span className="text-[11px] text-ink-muted">Disambiguated by release year & cast</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {matchingAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => onSelectAlbum?.(album)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectAlbum?.(album);
                  }
                }}
                className="group p-3 rounded-xl bg-canvas hover:bg-surface-raised border border-line hover:border-accent/50 transition cursor-pointer flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-accent"
              >
                <TrackArtwork
                  coverUrl={album.coverUrl}
                  trackId={album.id}
                  title={album.title}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  iconClassName="w-6 h-6"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold uppercase bg-accent/15 text-accent">
                      {album.type === "movie_soundtrack" ? (
                        <>
                          <Clapperboard className="w-2.5 h-2.5" />
                          <span>Movie</span>
                        </>
                      ) : (
                        <>
                          <Disc3 className="w-2.5 h-2.5" />
                          <span>Album</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-ink-muted font-mono">{album.releaseYear}</span>
                  </div>
                  <p className="text-xs font-bold text-ink group-hover:text-accent transition-colors truncate">
                    {album.title}
                  </p>
                  <p className="text-[11px] text-ink-muted truncate">{album.disambiguationLabel}</p>
                  {album.movieDetails?.starCast && (
                    <p className="text-[11px] text-ink-subtle truncate">
                      Cast: {album.movieDetails.starCast.slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-ink-subtle group-hover:text-accent group-hover:translate-x-0.5 transition flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Header: Total Found & Sort Controls */}
      {searchResults.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink">Search Results:</span>
            <span role="status" className="text-xs text-ink-muted">
              Found <strong className="text-accent">{totalTracks}</strong> authentic tracks
            </span>
          </div>

          {/* Sort Filter Tabs */}
          <div className="flex max-w-full items-center gap-1.5 overflow-x-auto scrollbar-none bg-surface-sunken p-1 rounded-control border border-line">
            <span className="text-[11px] text-ink-subtle uppercase tracking-wider px-2 font-semibold">Sort:</span>

            <button
              onClick={() => handleSortChange("relevance")}
              aria-pressed={sortBy === "relevance"}
              className={`flex min-h-10 shrink-0 items-center gap-1 px-2.5 py-1 rounded-[0.65rem] text-xs font-medium transition cursor-pointer ${
                sortBy === "relevance"
                  ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Most Relevant</span>
            </button>

            <button
              onClick={() => handleSortChange("views")}
              aria-pressed={sortBy === "views"}
              className={`flex min-h-10 shrink-0 items-center gap-1 px-2.5 py-1 rounded-[0.65rem] text-xs font-medium transition cursor-pointer ${
                sortBy === "views"
                  ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised"
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Most Popular (Views)</span>
            </button>

            <button
              onClick={() => handleSortChange("duration")}
              aria-pressed={sortBy === "duration"}
              className={`flex min-h-10 shrink-0 items-center gap-1 px-2.5 py-1 rounded-[0.65rem] text-xs font-medium transition cursor-pointer ${
                sortBy === "duration"
                  ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Duration</span>
            </button>
          </div>
        </div>
      )}

      {/* Track Results Table with Views and Pagination */}
      {searchResults.length > 0 && (
        <div className="animate-view-in rounded-card border border-line bg-surface overflow-hidden shadow-xl">
          {/* Table Header */}
          <div className="grid grid-cols-[28px_1fr_auto] md:grid-cols-[40px_1fr_140px_80px_130px] items-center px-3 sm:px-4 py-2.5 sm:py-3 border-b border-line text-[11px] font-semibold text-ink-subtle uppercase tracking-wider bg-surface-sunken">
            <span>#</span>
            <span>Title & Artist</span>
            <span className="hidden md:inline text-center">Popularity</span>
            <span className="hidden md:inline text-right">Duration</span>
            <span className="text-right pr-2">Actions</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-line">
            {searchResults.map((track, idx) => {
              const added = recentlyAddedId === track.id;
              const liked = isLiked(track.id);
              const rankNumber = (currentPage - 1) * PAGE_SIZE + idx + 1;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track, true, false)}
                  className="group grid grid-cols-[28px_1fr_auto] md:grid-cols-[40px_1fr_140px_80px_130px] items-center px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-surface-raised transition-colors cursor-pointer"
                >
                  {/* Number / Quick Play */}
                  <div className="relative flex h-11 w-7 items-center justify-center text-xs font-mono text-ink-subtle md:h-8 md:w-10">
                    <span className="hidden md:inline group-hover:opacity-0">{rankNumber}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTrack(track, true, false);
                      }}
                      aria-label={`Play ${track.title}`}
                      className="absolute inset-0 flex items-center justify-center text-accent opacity-100 transition-opacity hover:scale-110 cursor-pointer md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                      title="Play Now"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Artwork + Title + Artist */}
                  <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0 pr-2 sm:pr-4">
                    <TrackArtwork
                      coverUrl={track.coverUrl}
                      trackId={track.id}
                      title={track.title}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg shrink-0 shadow-md aspect-square"
                      iconClassName="w-5 h-5"
                    />
                    <div className="truncate min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-ink truncate group-hover:text-accent transition-colors">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5">
                        {track.artist}
                        <span className="md:hidden text-ink-subtle"> • {formatDuration(track.durationMs)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Popularity / Views Badge */}
                  <div className="hidden md:block text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-raised text-accent text-[11px] font-mono font-medium border border-line">
                      <Flame className="w-3 h-3 text-ember fill-ember/20" />
                      <span>{track.viewsFormatted || "Popular"} views</span>
                    </span>
                  </div>

                  {/* Duration (font-mono tabular-nums) */}
                  <div className="hidden md:block text-right text-xs font-mono tabular-nums text-ink-muted">
                    {formatDuration(track.durationMs)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    {added ? (
                      <span role="status" className="animate-icon-swap inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" /> Added
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(track);
                          }}
                          aria-label={liked ? `Unlike ${track.title}` : `Like ${track.title}`}
                          title={liked ? "Liked" : "Like Track"}
                          className={`min-h-11 min-w-11 flex items-center justify-center rounded-control transition-colors cursor-pointer ${
                            liked ? "text-like" : "text-ink-subtle hover:text-ink"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTrack(track, false, true);
                          }}
                          aria-label={`Play ${track.title} next`}
                          title="Play Next"
                          className="min-h-11 min-w-11 flex items-center justify-center rounded-control text-ink-subtle hover:text-accent transition-colors cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTrack(track, false, false);
                          }}
                          aria-label={`Add ${track.title} to queue`}
                          title="Add to Queue"
                          className="min-h-11 min-w-11 flex items-center justify-center rounded-control text-ink-subtle hover:text-ink transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls Footer */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface-sunken border-t border-line">
              <span className="text-xs text-ink-muted">
                Page <strong className="text-ink">{currentPage}</strong> of{" "}
                <strong className="text-ink">{totalPages}</strong> ({totalTracks} total tracks)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1 || isSearching}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-3 min-h-11 rounded-control bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed border border-line-strong text-xs text-ink transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {/* Page Number Pills */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-9 h-9 rounded-[0.65rem] text-xs font-mono transition-colors cursor-pointer ${
                        p === currentPage
                          ? "bg-accent text-accent-foreground font-bold shadow-md shadow-accent/20"
                          : "bg-surface hover:bg-surface-raised text-ink-muted border border-line"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage >= totalPages || isSearching}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3 min-h-11 rounded-control bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed border border-line-strong text-xs text-ink transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State with recovery */}
      {searchError && !isSearching && (
        <div
          role="alert"
          className="animate-view-in flex flex-col items-start gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs font-medium text-danger">{searchError}</p>
          <button
            type="button"
            onClick={() => executeSearch(searchQuery, currentPage, sortBy)}
            className="min-h-11 rounded-control border border-danger/40 px-3 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 cursor-pointer"
          >
            Retry search
          </button>
        </div>
      )}

      {/* Empty State when no results found */}
      {hasSearched && !isSearching && !searchError && searchResults.length === 0 && searchQuery && (
        <div className="text-center py-12 rounded-2xl border border-line bg-surface space-y-2">
          <p className="text-xs text-ink-muted font-medium">No matching tracks found for &ldquo;{searchQuery}&rdquo;</p>
          <p className="text-[11px] text-ink-subtle">
            Try searching for song titles, artist names, or paste a direct YouTube audio link.
          </p>
        </div>
      )}
    </div>
  );
}
