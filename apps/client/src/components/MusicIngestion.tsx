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
} from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { useLibraryStore } from "../lib/store/useLibraryStore";

interface MusicIngestionProps {
  onAddTrack: (track: Track, playNext?: boolean) => void;
  onPlayDirect?: (track: Track) => void;
  roomId: string;
  workerHttpUrl?: string;
}

export function MusicIngestion({
  onAddTrack,
  onPlayDirect,
  roomId,
  workerHttpUrl = process.env.NEXT_PUBLIC_WORKER_HTTP_URL || "http://localhost:8787",
}: MusicIngestionProps) {
  const [activeMode, setActiveMode] = useState<"search" | "upload">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isLiked, toggleLike } = useLibraryStore();

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setActiveMode("search");
      }
      if (e.key === "Escape") {
        setSearchResults([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    setUploadProgress(15);

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

      setUploadProgress(100);

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
        setUploadProgress(0);
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
    <div className="bg-[#131722]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
      {/* Top Controls: Search vs File Upload Mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode("search")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === "search"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-gray-400 hover:text-white bg-white/5 border border-white/5"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Direct Search
          </button>
          <button
            onClick={() => setActiveMode("upload")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === "upload"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-gray-400 hover:text-white bg-white/5 border border-white/5"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Audio
          </button>
        </div>

        <span className="text-[11px] text-gray-500 hidden sm:inline-block">
          Direct search powered by YouTube & edge streaming
        </span>
      </div>

      {activeMode === "search" ? (
        <div className="space-y-3">
          {/* Main Search Bar */}
          <form onSubmit={handleManualSearch} className="relative flex items-center">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>

            <input
              ref={searchInputRef}
              type="text"
              placeholder="What do you want to play? Search songs, artists, or paste a link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-indigo-500 rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all shadow-inner backdrop-blur-md"
            />

            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="p-1 text-gray-500 hover:text-white rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
                ⌘K
              </kbd>
            </div>
          </form>

          {/* Search Results Dropdown / List */}
          {searchResults.length > 0 && (
            <div className="bg-black/50 border border-white/10 rounded-2xl p-2.5 max-h-[420px] overflow-y-auto space-y-1.5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-gray-400 border-b border-white/10 pb-2">
                <span className="font-semibold text-gray-300">Top Results ({searchResults.length})</span>
                <span className="text-[10px] text-gray-400">Click to play or add to queue</span>
              </div>

              {searchResults.map((track) => {
                const added = recentlyAddedId === track.id;

                return (
                  <div
                    key={track.id}
                    className="group flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden flex-1 min-w-0 pr-3">
                      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden flex-shrink-0 shadow-md">
                        {track.coverUrl ? (
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Music2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-sky-300 transition-colors">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] font-mono tabular-nums text-gray-400">
                        {formatDuration(track.durationMs)}
                      </span>

                      {added ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                          <Check className="w-3.5 h-3.5" /> Added
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSelectTrack(track, true, false)}
                            title="Play Now"
                            className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-black px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Play
                          </button>
                          <button
                            onClick={() => handleSelectTrack(track, false, true)}
                            title="Play Next"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-sky-400 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSelectTrack(track, false, false)}
                            title="Add to Queue"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasSearched && !isSearching && searchResults.length === 0 && searchQuery && (
            <p className="text-center py-4 text-xs text-gray-500">
              No matching tracks found. Try different keywords.
            </p>
          )}
        </div>
      ) : (
        /* File Upload Mode */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          className="border-2 border-dashed border-white/10 hover:border-indigo-400/50 rounded-2xl p-8 text-center cursor-pointer transition-all bg-black/40 backdrop-blur-xl group hover:bg-black/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-gray-200 font-semibold">
                Uploading audio to edge storage... {uploadProgress}%
              </p>
              <div className="w-48 bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/10">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-200 font-semibold">
                Drag & drop audio files here, or <span className="text-indigo-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-gray-400">
                MP3, WAV, FLAC, AAC, M4A · Presigned direct R2 upload with zero CPU bottlenecks
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
