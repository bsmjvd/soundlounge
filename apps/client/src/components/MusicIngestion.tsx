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
  Music2,
  Check,
  Heart,
  Sparkles,
  TrendingUp,
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
}

const DISCOVERY_TAGS = [
  "Sidhu Moose Wala",
  "The Weeknd",
  "Daft Punk",
  "A.R. Rahman",
  "Lofi Beats",
  "Electronic Chill",
];

export function MusicIngestion({
  onAddTrack,
  onPlayDirect,
  roomId,
  workerHttpUrl = process.env.NEXT_PUBLIC_WORKER_HTTP_URL || "http://localhost:8787",
  searchInputRef: externalSearchRef,
}: MusicIngestionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const internalSearchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = externalSearchRef || internalSearchRef;

  const { isLiked, toggleLike } = useLibraryStore();

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

  // Debounced live search
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.tracks || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
        setHasSearched(true);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.tracks || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
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

  return (
    <div className="space-y-5">
      {/* Search Input Bar + Quick Upload Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleManualSearch} className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5f677d]">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search songs, artists, or paste a link (sidhu, weeknd, synthwave)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-[#0c0e15] border border-[#1b202d] focus:border-indigo-500 rounded-xl pl-10 pr-24 text-xs text-white placeholder-[#586073] outline-none transition-colors"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-1 text-[#666f85] hover:text-white rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[#202534] bg-[#141722] px-1.5 py-0.5 text-[10px] font-mono text-[#717990]">
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
          className="h-11 px-4 rounded-xl bg-[#0e111a] hover:bg-[#151926] border border-[#1b202d] text-xs font-medium text-[#8c94aa] hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer flex-shrink-0"
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          ) : (
            <UploadCloud className="w-3.5 h-3.5" />
          )}
          <span>{isUploading ? "Uploading..." : "Upload Audio"}</span>
        </button>
      </div>

      {/* Discovery Tags (when no search query is active) */}
      {!searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-[#4e5569]">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Popular Queries</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DISCOVERY_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="px-3 py-1.5 rounded-lg bg-[#0d1017] hover:bg-[#161a25] border border-[#1a1f2c] text-xs text-[#828a9f] hover:text-white transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Track Results Table */}
      {searchResults.length > 0 && (
        <div className="rounded-xl border border-[#171a25] bg-[#090b10] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[36px_1fr_80px_130px] items-center px-4 py-2.5 border-b border-[#141722] text-[10px] font-semibold text-[#545c70] uppercase tracking-wider">
            <span>#</span>
            <span>Title & Artist</span>
            <span className="text-right">Duration</span>
            <span className="text-right pr-2">Actions</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#12151f]">
            {searchResults.map((track, idx) => {
              const added = recentlyAddedId === track.id;
              const liked = isLiked(track.id);

              return (
                <div
                  key={track.id}
                  className="group grid grid-cols-[36px_1fr_80px_130px] items-center px-4 py-2.5 hover:bg-[#10131d] transition-colors"
                >
                  {/* Number / Quick Play on Hover */}
                  <div className="text-xs font-mono text-[#586073]">
                    <span className="group-hover:hidden">{idx + 1}</span>
                    <button
                      onClick={() => handleSelectTrack(track, true, false)}
                      className="hidden group-hover:inline-flex text-white hover:text-indigo-400 cursor-pointer"
                      title="Play Now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  {/* Artwork + Title + Artist */}
                  <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                    <TrackArtwork
                      coverUrl={track.coverUrl}
                      trackId={track.id}
                      title={track.title}
                      className="w-10 h-10 rounded-lg"
                      iconClassName="w-4 h-4"
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-sky-300 transition-colors">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[#71788d] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Duration (font-mono tabular-nums) */}
                  <div className="text-right text-xs font-mono tabular-nums text-[#71788d]">
                    {formatDuration(track.durationMs)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    {added ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" /> Added
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleLike(track)}
                          title={liked ? "Liked" : "Like Track"}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            liked
                              ? "text-rose-500"
                              : "text-[#586073] hover:text-white"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleSelectTrack(track, false, true)}
                          title="Play Next"
                          className="p-1.5 rounded-lg text-[#586073] hover:text-sky-300 transition-colors cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSelectTrack(track, false, false)}
                          title="Add to Queue"
                          className="p-1.5 rounded-lg text-[#586073] hover:text-white transition-colors cursor-pointer"
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
        </div>
      )}

      {hasSearched && !isSearching && searchResults.length === 0 && searchQuery && (
        <div className="text-center py-12 rounded-xl border border-[#171a25] bg-[#090b10] space-y-2">
          <p className="text-xs text-[#8c94aa] font-medium">
            No matching tracks found for &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-[11px] text-[#586073]">
            Try searching for song titles, artist names, or paste a direct YouTube audio link.
          </p>
        </div>
      )}
    </div>
  );
}
