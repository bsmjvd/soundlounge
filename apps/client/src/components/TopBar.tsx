"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Menu, Music2, Play, Plus, Check, Disc, User, Loader2 } from "lucide-react";
import type { PlaybackMode } from "../lib/player";
import type { Track, Album } from "@soundlounge/shared";
import { ARTISTS_CATALOG, type ArtistProfileData } from "../lib/data/artistsCatalog";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import { TrackArtwork } from "./TrackArtwork";

export type TopNavTab = "discover" | "library" | "radio";

interface TopBarProps {
  mode: PlaybackMode;
  onModeChange: (mode: PlaybackMode) => void;
  roomId: string;
  participantsCount: number;
  pingMs: number;
  onOpenInvite: () => void;
  onToggleMobileMenu?: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNavBack?: () => void;
  onNavForward?: () => void;
  onOpenUpload?: () => void;
  onPlayTrack?: (track: Track) => void;
  onAddTrack?: (track: Track, playNext?: boolean) => void;
  onSelectArtist?: (artist: ArtistProfileData) => void;
  onSelectAlbum?: (album: Album) => void;
  activeTopTab?: TopNavTab;
  onTopTabChange?: (tab: TopNavTab) => void;
}

export function TopBar({
  mode,
  onModeChange,
  roomId,
  participantsCount,
  pingMs,
  onOpenInvite,
  onToggleMobileMenu,
  onSearch,
  searchQuery,
  setSearchQuery,
  onNavBack,
  onNavForward,
  onOpenUpload,
  onPlayTrack,
  onAddTrack,
  onSelectArtist,
  onSelectAlbum,
  activeTopTab = "discover",
  onTopTabChange,
}: TopBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [liveTracks, setLiveTracks] = useState<Track[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [addedTrackId, setAddedTrackId] = useState<string | null>(null);

  // Global Cmd+K / Ctrl+K focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (searchQuery.trim().length > 0) {
          setIsDropdownOpen(true);
        }
      }
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  // Click outside to dismiss live search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !searchInputRef.current?.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Instant local catalog matches (0ms response)
  const matchingArtists = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    return ARTISTS_CATALOG.filter(
      (a) => a.name.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q) || a.region.toLowerCase().includes(q)
    ).slice(0, 3);
  }, [searchQuery]);

  const matchingAlbums = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    return ALBUMS_CATALOG.filter(
      (alb) =>
        alb.title.toLowerCase().includes(q) ||
        (alb.movieDetails?.movieTitle && alb.movieDetails.movieTitle.toLowerCase().includes(q)) ||
        (alb.primaryArtist && alb.primaryArtist.toLowerCase().includes(q))
    ).slice(0, 3);
  }, [searchQuery]);

  const matchingLocalTracks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    const tracks: Track[] = [];
    const seenIds = new Set<string>();

    for (const artist of ARTISTS_CATALOG) {
      for (const t of artist.topTracks) {
        if ((t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)) && !seenIds.has(t.id)) {
          seenIds.add(t.id);
          tracks.push(t);
          if (tracks.length >= 3) break;
        }
      }
      if (tracks.length >= 3) break;
    }

    for (const album of ALBUMS_CATALOG) {
      for (const t of album.tracks) {
        if ((t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)) && !seenIds.has(t.id)) {
          seenIds.add(t.id);
          tracks.push(t);
          if (tracks.length >= 4) break;
        }
      }
      if (tracks.length >= 4) break;
    }

    return tracks;
  }, [searchQuery]);

  // Live YouTube music search with 250ms debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setLiveTracks([]);
      setIsLoadingLive(false);
      return;
    }

    setIsLoadingLive(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setLiveTracks(data.tracks?.slice(0, 6) || []);
        }
      } catch (err) {
        console.warn("TopBar live search error:", err);
      } finally {
        setIsLoadingLive(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePlayDirect = (track: Track) => {
    if (onPlayTrack) {
      onPlayTrack(track);
    }
    setIsDropdownOpen(false);
  };

  const handleAddDirect = (track: Track) => {
    if (onAddTrack) {
      onAddTrack(track, false);
      setAddedTrackId(track.id);
      setTimeout(() => setAddedTrackId(null), 1500);
    }
  };

  const handleSelectArtistClick = (artist: ArtistProfileData) => {
    if (onSelectArtist) {
      onSelectArtist(artist);
    }
    setIsDropdownOpen(false);
  };

  const handleSelectAlbumClick = (album: Album) => {
    if (onSelectAlbum) {
      onSelectAlbum(album);
    }
    setIsDropdownOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-gradient-to-b from-[#0b1422]/95 via-[#0b1422]/60 to-transparent backdrop-blur-sm px-4 sm:px-8 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Trigger & Top Navigation Tabs: DISCOVER, MY LIBRARY, RADIO */}
        <div className="flex items-center gap-6">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Open playlist menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <nav className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={() => onTopTabChange && onTopTabChange("discover")}
              className={`text-xs font-bold uppercase tracking-wider py-1 border-b-2 transition-all cursor-pointer ${
                activeTopTab === "discover"
                  ? "text-[#00e5ff] border-[#00e5ff]"
                  : "text-slate-400 border-transparent hover:text-white"
              }`}
            >
              Discover
            </button>

            <button
              onClick={() => onTopTabChange && onTopTabChange("library")}
              className={`text-xs font-bold uppercase tracking-wider py-1 border-b-2 transition-all cursor-pointer ${
                activeTopTab === "library"
                  ? "text-[#00e5ff] border-[#00e5ff]"
                  : "text-slate-400 border-transparent hover:text-white"
              }`}
            >
              My Library
            </button>

            <button
              onClick={() => onTopTabChange && onTopTabChange("radio")}
              className={`text-xs font-bold uppercase tracking-wider py-1 border-b-2 transition-all cursor-pointer ${
                activeTopTab === "radio"
                  ? "text-[#00e5ff] border-[#00e5ff]"
                  : "text-slate-400 border-transparent hover:text-white"
              }`}
            >
              Radio
            </button>
          </nav>
        </div>

        {/* Center/Right: Pill Search Input + Dropdown */}
        <div className="flex items-center gap-4 flex-1 justify-end max-w-lg">
          <div className="relative w-full max-w-xs sm:max-w-sm">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>

              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search artist, albums..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    setIsDropdownOpen(true);
                  } else {
                    setIsDropdownOpen(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) {
                    setIsDropdownOpen(true);
                  }
                }}
                className="w-full h-9 bg-slate-800/60 hover:bg-slate-800 focus:bg-slate-800/90 border border-slate-700/60 focus:border-[#00e5ff] rounded-full pl-9 pr-16 text-xs text-white placeholder-slate-400 outline-none transition-all shadow-inner"
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsDropdownOpen(false);
                    }}
                    className="p-0.5 text-slate-400 hover:text-white rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center rounded border border-slate-700 bg-slate-900/60 px-1 py-0.2 text-[9px] font-mono text-slate-400">
                  ⌘K
                </kbd>
              </div>
            </form>

            {/* Instant Search Results Dropdown */}
            {isDropdownOpen && searchQuery.trim().length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 top-full mt-2 bg-[#0c121e] border border-[#1b273d] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden z-[120] max-h-[70vh] flex flex-col"
              >
                <div className="p-3 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {/* ARTISTS */}
                  {matchingArtists.length > 0 && (
                    <div>
                      <div className="px-2 pb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#00e5ff] uppercase">
                        <User className="w-3 h-3" />
                        <span>Artists</span>
                      </div>
                      <div className="space-y-1">
                        {matchingArtists.map((artist) => (
                          <button
                            key={artist.id}
                            onClick={() => handleSelectArtistClick(artist)}
                            className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/70 text-left transition-colors cursor-pointer"
                          >
                            <img
                              src={artist.avatarUrl}
                              alt={artist.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-white truncate">{artist.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{artist.genre}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ALBUMS */}
                  {matchingAlbums.length > 0 && (
                    <div>
                      <div className="px-2 pb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#00e5ff] uppercase">
                        <Disc className="w-3 h-3" />
                        <span>Albums</span>
                      </div>
                      <div className="space-y-1">
                        {matchingAlbums.map((album) => (
                          <button
                            key={album.id}
                            onClick={() => handleSelectAlbumClick(album)}
                            className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/70 text-left transition-colors cursor-pointer"
                          >
                            <img src={album.coverUrl} alt={album.title} className="w-8 h-8 rounded-lg object-cover" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-white truncate">{album.title}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {album.primaryArtist} • {album.releaseYear}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SONGS (Local + Live YouTube) */}
                  {(matchingLocalTracks.length > 0 || liveTracks.length > 0) && (
                    <div>
                      <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-[#00e5ff] uppercase">
                        <div className="flex items-center gap-1.5">
                          <Music2 className="w-3 h-3" />
                          <span>Songs</span>
                        </div>
                        {isLoadingLive && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                      </div>

                      <div className="space-y-1">
                        {[...matchingLocalTracks, ...liveTracks].slice(0, 6).map((track) => (
                          <div
                            key={track.id}
                            onClick={() => handlePlayDirect(track)}
                            className="group flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                                <TrackArtwork
                                  coverUrl={track.coverUrl}
                                  trackId={track.id}
                                  title={track.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate group-hover:text-[#00e5ff]">
                                  {track.title}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 ml-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddDirect(track);
                                }}
                                className="p-1 rounded-full hover:bg-slate-700 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Add to queue"
                              >
                                {addedTrackId === track.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Plus className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayDirect(track);
                                }}
                                className="p-1.5 rounded-full bg-[#00e5ff] text-[#0a0e17] opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Play song"
                              >
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-slate-800/80 bg-slate-900/40 text-center">
                  <button onClick={handleSearchSubmit} className="text-xs text-[#00e5ff] hover:underline font-semibold">
                    View all results for &ldquo;{searchQuery}&rdquo; →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with subtle cyan halo (matching reference image) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTopTabChange && onTopTabChange("library")}
              title="My Library & Profile"
              className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#00e5ff]/40 shadow-[0_0_12px_rgba(0,229,255,0.25)] flex-shrink-0 hover:ring-[#00e5ff] transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="User Profile"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
