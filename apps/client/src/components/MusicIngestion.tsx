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
} from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { useLibraryStore } from "../lib/store/useLibraryStore";
import { TrackArtwork } from "./TrackArtwork";

interface MusicIngestionProps {
  onAddTrack: (track: Track, playNext?: boolean) => void;
  onPlayDirect?: (track: Track) => void;
  roomId: string;
  workerHttpUrl?: string;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
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
  workerHttpUrl = process.env.NEXT_PUBLIC_WORKER_HTTP_URL || "http://localhost:8787",
  searchInputRef: externalSearchRef,
  initialQuery = "",
  onQueryChange,
}: MusicIngestionProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTracks, setTotalTracks] = useState(0);
  const [sortBy, setSortBy] = useState<"views" | "relevance" | "duration">("views");

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
      if (e.key === "Escape") {
        setSearchResults([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInputRef]);

  // Execute Search query with page and sort options
  const executeSearch = async (
    query: string,
    page: number = 1,
    sort: "views" | "relevance" | "duration" = sortBy
  ) => {
    const clean = query.trim();
    if (!clean || clean.length < 1) {
      setSearchResults([]);
      setTotalTracks(0);
      setTotalPages(1);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(clean)}&page=${page}&limit=${PAGE_SIZE}&sort=${sort}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.tracks || []);
        setTotalTracks(data.totalTracks || (data.tracks?.length || 0));
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.page || page);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
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
      return;
    }

    const timer = setTimeout(() => {
      setCurrentPage(1);
      executeSearch(clean, 1, sortBy);
    }, 250);

    return () => clearTimeout(timer);
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
      const presignRes = await fetch(`${workerHttpUrl}/api/rooms/${roomId}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "audio/mpeg",
        }),
      });

      let publicUrl = URL.createObjectURL(file);
      let key = undefined;

      if (presignRes.ok) {
        const data = await presignRes.json();
        key = data.key;
        if (data.uploadUrl && data.uploadUrl !== data.publicUrl) {
          await fetch(data.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "audio/mpeg" },
            body: file,
          });
          publicUrl = data.publicUrl;
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
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6" ref={resultsContainerRef}>
      {/* Search Input Bar + Quick Upload Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleManualSearch} className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5c707d]">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#00e5c9]" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search songs, artists, or paste a YouTube audio link..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onQueryChange?.(e.target.value);
            }}
            className="w-full h-11 bg-[#0d181e] border border-[#1a2e3a] focus:border-[#00e5c9] rounded-xl pl-10 pr-24 text-xs text-white placeholder-[#5c707d] outline-none transition-colors shadow-inner"
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
                }}
                className="p-1 text-[#6b7e8c] hover:text-white rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[#203440] bg-[#14232c] px-1.5 py-0.5 text-[10px] font-mono text-[#718593]">
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
          className="h-11 px-4 rounded-xl bg-[#0e1920] hover:bg-[#152631] border border-[#1a2d39] text-xs font-medium text-[#8da0ad] hover:text-[#00e5c9] flex items-center justify-center gap-2 transition-colors cursor-pointer flex-shrink-0"
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00e5c9]" />
          ) : (
            <UploadCloud className="w-3.5 h-3.5" />
          )}
          <span>{isUploading ? "Uploading..." : "Upload Audio"}</span>
        </button>
      </div>

      {/* Discovery Tags (when no search query is active) */}
      {!searchQuery && (
        <div className="space-y-3 p-4 rounded-2xl bg-[#0b1419] border border-[#162732]">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-[#00e5c9]">
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
                className="px-3 py-1.5 rounded-lg bg-[#0f1d25] hover:bg-[#162b37] border border-[#1b313f] hover:border-[#00e5c9]/40 text-xs text-[#8ca0ad] hover:text-white transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state when fetching results */}
      {isSearching && searchResults.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-[#182b36] bg-[#0c161d] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#00e5c9]" />
          <p className="text-xs text-[#8da0ad] font-medium">
            Searching tracks, artists, and audio for &ldquo;{searchQuery}&rdquo;...
          </p>
        </div>
      )}

      {/* Results Header: Total Found & Sort Controls */}
      {searchResults.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">
              Search Results:
            </span>
            <span className="text-xs text-[#718593]">
              Found <strong className="text-[#00e5c9]">{totalTracks}</strong> authentic tracks
            </span>
          </div>

          {/* Sort Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-[#0b1419] p-1 rounded-xl border border-[#182a36]">
            <span className="text-[10px] text-[#5c707d] uppercase tracking-wider px-2 font-semibold">
              Sort:
            </span>

            <button
              onClick={() => handleSortChange("views")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                sortBy === "views"
                  ? "bg-[#00e5c9] text-[#081014] font-semibold shadow-sm"
                  : "text-[#7d909d] hover:text-white hover:bg-[#12222b]"
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Most Popular (Views)</span>
            </button>

            <button
              onClick={() => handleSortChange("relevance")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                sortBy === "relevance"
                  ? "bg-[#00e5c9] text-[#081014] font-semibold shadow-sm"
                  : "text-[#7d909d] hover:text-white hover:bg-[#12222b]"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Most Relevant</span>
            </button>

            <button
              onClick={() => handleSortChange("duration")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                sortBy === "duration"
                  ? "bg-[#00e5c9] text-[#081014] font-semibold shadow-sm"
                  : "text-[#7d909d] hover:text-white hover:bg-[#12222b]"
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
        <div className="rounded-2xl border border-[#182b36] bg-[#0c161d] overflow-hidden shadow-xl">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_140px_80px_130px] items-center px-4 py-3 border-b border-[#162732] text-[10px] font-semibold text-[#5c707d] uppercase tracking-wider bg-[#091217]">
            <span>#</span>
            <span>Title & Artist</span>
            <span className="text-center">Popularity</span>
            <span className="text-right">Duration</span>
            <span className="text-right pr-2">Actions</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#13232d]">
            {searchResults.map((track, idx) => {
              const added = recentlyAddedId === track.id;
              const liked = isLiked(track.id);
              const rankNumber = (currentPage - 1) * PAGE_SIZE + idx + 1;

              return (
                <div
                  key={track.id}
                  className="group grid grid-cols-[40px_1fr_140px_80px_130px] items-center px-4 py-3 hover:bg-[#12232e] transition-colors"
                >
                  {/* Number / Quick Play on Hover */}
                  <div className="text-xs font-mono text-[#5c707d]">
                    <span className="group-hover:hidden">{rankNumber}</span>
                    <button
                      onClick={() => handleSelectTrack(track, true, false)}
                      className="hidden group-hover:inline-flex text-[#00e5c9] hover:scale-110 transition-transform cursor-pointer"
                      title="Play Now"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Artwork + Title + Artist */}
                  <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                    <TrackArtwork
                      coverUrl={track.coverUrl}
                      trackId={track.id}
                      title={track.title}
                      className="w-11 h-11 rounded-lg"
                      iconClassName="w-5 h-5"
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-[#00e5c9] transition-colors">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[#718593] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Popularity / Views Badge */}
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10232c] text-[#00e5c9] text-[11px] font-mono font-medium border border-[#1b3a48]">
                      <Flame className="w-3 h-3 text-orange-400 fill-orange-400/20" />
                      <span>{track.viewsFormatted || "Popular"} views</span>
                    </span>
                  </div>

                  {/* Duration (font-mono tabular-nums) */}
                  <div className="text-right text-xs font-mono tabular-nums text-[#718593]">
                    {formatDuration(track.durationMs)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    {added ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00e5c9] bg-[#00e5c9]/10 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" /> Added
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleLike(track)}
                          title={liked ? "Liked" : "Like Track"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            liked
                              ? "text-[#f43f5e]"
                              : "text-[#5c707d] hover:text-white"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleSelectTrack(track, false, true)}
                          title="Play Next"
                          className="p-1.5 rounded-lg text-[#5c707d] hover:text-[#00e5c9] transition-colors cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSelectTrack(track, false, false)}
                          title="Add to Queue"
                          className="p-1.5 rounded-lg text-[#5c707d] hover:text-white transition-colors cursor-pointer"
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#091217] border-t border-[#162732]">
              <span className="text-xs text-[#718593]">
                Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({totalTracks} total tracks)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1 || isSearching}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-3 py-1.5 rounded-lg bg-[#0e1a22] hover:bg-[#162835] disabled:opacity-30 disabled:cursor-not-allowed border border-[#1c303e] text-xs text-white transition-colors cursor-pointer flex items-center gap-1"
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
                      className={`w-7 h-7 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        p === currentPage
                          ? "bg-[#00e5c9] text-[#081014] font-bold shadow-md shadow-[#00e5c9]/20"
                          : "bg-[#0e1a22] hover:bg-[#162835] text-[#8ea0ad] border border-[#1c303e]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage >= totalPages || isSearching}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3 py-1.5 rounded-lg bg-[#0e1a22] hover:bg-[#162835] disabled:opacity-30 disabled:cursor-not-allowed border border-[#1c303e] text-xs text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State when no results found */}
      {hasSearched && !isSearching && searchResults.length === 0 && searchQuery && (
        <div className="text-center py-12 rounded-2xl border border-[#182b36] bg-[#0c161d] space-y-2">
          <p className="text-xs text-[#8da0ad] font-medium">
            No matching tracks found for &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-[11px] text-[#5c707d]">
            Try searching for song titles, artist names, or paste a direct YouTube audio link.
          </p>
        </div>
      )}
    </div>
  );
}
