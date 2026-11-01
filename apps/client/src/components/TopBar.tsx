"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Share2,
  X,
  UploadCloud,
  Menu,
  Music2,
  Play,
  Plus,
  Check,
  Disc,
  User,
  Loader2,
  ArrowRight,
} from "lucide-react";
import type { PlaybackMode } from "../lib/player";
import type { Track, Album } from "@soundlounge/shared";
import { ARTISTS_CATALOG, type ArtistProfileData } from "../lib/data/artistsCatalog";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import { TrackArtwork } from "./TrackArtwork";

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

  // Combine local catalog tracks and live search tracks
  const displayedTracks = useMemo(() => {
    const list = [...matchingLocalTracks];
    const seenTitles = new Set(list.map((t) => t.title.toLowerCase().trim()));

    for (const t of liveTracks) {
      const key = t.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        list.push(t);
      }
      if (list.length >= 6) break;
    }
    return list;
  }, [matchingLocalTracks, liveTracks]);

  const hasAnyResults = matchingArtists.length > 0 || matchingAlbums.length > 0 || displayedTracks.length > 0;

  const handleSelectTrackPlay = (track: Track) => {
    if (onPlayTrack) {
      onPlayTrack(track);
    }
    setIsDropdownOpen(false);
  };

  const handleAddTrackQueue = (e: React.MouseEvent, track: Track, playNext: boolean = false) => {
    e.stopPropagation();
    if (onAddTrack) {
      onAddTrack(track, playNext);
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

  const formatDuration = (ms?: number) => {
    if (!ms) return "3:30";
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-[#14232c] bg-[#081014] px-4 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Mobile Menu Trigger & History Navigation */}
        <div className="flex items-center gap-2">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-[#7d8f9c] hover:text-white rounded-lg hover:bg-[#122028] transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={onNavBack}
              aria-label="Go back"
              className="w-8 h-8 rounded-full bg-[#0d181e] hover:bg-[#15252f] border border-[#1c2e38] flex items-center justify-center text-[#7d8f9c] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNavForward}
              aria-label="Go forward"
              className="w-8 h-8 rounded-full bg-[#0d181e] hover:bg-[#15252f] border border-[#1c2e38] flex items-center justify-center text-[#7d8f9c] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Rounded Pill Search Input Bar + Instant Live Dropdown */}
        <div className="relative flex-1 max-w-xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5c707d]">
              <Search className="w-4 h-4" />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search songs, artists, or albums..."
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
              className="w-full h-10 bg-[#0d181e] hover:bg-[#101e26] focus:bg-[#12212a] border border-[#1c2e38] focus:border-[#00e5c9] rounded-full pl-10 pr-20 text-xs text-white placeholder-[#5c707d] outline-none transition-all shadow-inner"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsDropdownOpen(false);
                  }}
                  className="p-1 text-[#6b7e8b] hover:text-white rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center rounded border border-[#203440] bg-[#14222a] px-1.5 py-0.5 text-[10px] font-mono text-[#718593]">
                ⌘K
              </kbd>
            </div>
          </form>

          {/* Instant Live Search Results Popover */}
          {isDropdownOpen && searchQuery.trim().length > 0 && (
            <div
              ref={dropdownRef}
              style={{ backgroundColor: "#091217" }}
              className="absolute left-0 right-0 top-full mt-2 bg-[#091217] border border-[#203644] rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,1)] overflow-hidden z-[120] animate-in fade-in zoom-in-95 duration-150 max-h-[75vh] flex flex-col"
            >
              {/* Scrollable Results Stage */}
              <div className="p-3 overflow-y-auto space-y-4 flex-1">
                {/* 1. ARTISTS SECTION */}
                {matchingArtists.length > 0 && (
                  <div>
                    <div className="px-2 pb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-[#00e5c9] uppercase">
                      <User className="w-3 h-3" />
                      <span>Artists</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {matchingArtists.map((artist) => (
                        <button
                          key={artist.id}
                          onClick={() => handleSelectArtistClick(artist)}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-[#101d26] hover:bg-[#162a37] border border-[#1b313f] hover:border-[#00e5c9]/40 transition-all text-left cursor-pointer group"
                        >
                          <img
                            src={artist.avatarUrl}
                            alt={artist.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80";
                            }}
                            className="w-9 h-9 rounded-full object-cover border border-[#203440] flex-shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate group-hover:text-[#00e5c9] transition-colors">
                              {artist.name}
                            </p>
                            <p className="text-[10px] text-[#718492] truncate capitalize">{artist.genre}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. ALBUMS SECTION */}
                {matchingAlbums.length > 0 && (
                  <div>
                    <div className="px-2 pb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-[#00e5c9] uppercase">
                      <Disc className="w-3 h-3" />
                      <span>Albums & Soundtracks</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {matchingAlbums.map((album) => (
                        <button
                          key={album.id}
                          onClick={() => handleSelectAlbumClick(album)}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-[#101d26] hover:bg-[#162a37] border border-[#1b313f] hover:border-[#00e5c9]/40 transition-all text-left cursor-pointer group"
                        >
                          <img
                            src={album.coverUrl}
                            alt={album.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80";
                            }}
                            className="w-9 h-9 rounded-lg object-cover border border-[#203440] flex-shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate group-hover:text-[#00e5c9] transition-colors">
                              {album.title}
                            </p>
                            <p className="text-[10px] text-[#718492] truncate">
                              {album.releaseYear} ·{" "}
                              {album.movieDetails?.movieTitle || album.primaryArtist || "Original"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. SONGS SECTION */}
                {displayedTracks.length > 0 && (
                  <div>
                    <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold tracking-wider text-[#00e5c9] uppercase">
                      <div className="flex items-center gap-1.5">
                        <Music2 className="w-3 h-3" />
                        <span>Songs</span>
                      </div>
                      {isLoadingLive && (
                        <span className="flex items-center gap-1 text-[10px] text-[#718492] lowercase">
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-[#00e5c9]" />
                          loading more...
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {displayedTracks.map((track) => (
                        <div
                          key={track.id}
                          onClick={() => handleSelectTrackPlay(track)}
                          className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-[#132530] border border-transparent hover:border-[#1e3746] transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative flex-shrink-0">
                              <TrackArtwork
                                coverUrl={track.coverUrl}
                                trackId={track.id}
                                title={track.title}
                                className="w-10 h-10 rounded-lg"
                                iconClassName="w-4 h-4"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                              </div>
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate group-hover:text-[#00e5c9] transition-colors">
                                {track.title}
                              </p>
                              <p className="text-[11px] text-[#718492] truncate">{track.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] font-mono text-[#5c707d]">
                              {formatDuration(track.durationMs)}
                            </span>

                            <button
                              onClick={(e) => handleAddTrackQueue(e, track, true)}
                              title="Play Next"
                              className="p-1.5 text-[#5c707d] hover:text-[#00e5c9] rounded-lg hover:bg-[#1a2d39] transition-colors cursor-pointer"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => handleAddTrackQueue(e, track, false)}
                              title="Add to Playing Queue"
                              className="p-1.5 text-[#5c707d] hover:text-white rounded-lg hover:bg-[#1a2d39] transition-colors cursor-pointer"
                            >
                              {addedTrackId === track.id ? (
                                <Check className="w-3.5 h-3.5 text-[#00e5c9]" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. LOADING STATE (when no items matched yet) */}
                {isLoadingLive && !hasAnyResults && (
                  <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-[#718492]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#00e5c9]" />
                    <p className="text-xs">Searching songs, artists, and albums...</p>
                  </div>
                )}

                {/* 5. NO RESULTS STATE */}
                {!isLoadingLive && !hasAnyResults && searchQuery.trim().length >= 2 && (
                  <div className="py-6 text-center text-[#718492] space-y-2">
                    <p className="text-xs">No quick matches found for &ldquo;{searchQuery}&rdquo;.</p>
                    <button
                      onClick={handleSearchSubmit}
                      className="inline-flex items-center gap-1.5 text-xs text-[#00e5c9] font-medium hover:underline cursor-pointer"
                    >
                      <span>Search on YouTube Ingestion</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Footer Actions */}
              <div className="p-2.5 bg-[#081014] border-t border-[#14232c] flex items-center justify-between text-[11px] text-[#6b7e8c] px-4">
                <span className="hidden sm:inline">
                  Click any song to play instantly · Press <kbd className="font-mono text-[#00e5c9]">ESC</kbd> to close
                </span>
                <button
                  onClick={handleSearchSubmit}
                  className="flex items-center gap-1 text-[#00e5c9] hover:underline font-medium cursor-pointer ml-auto"
                >
                  <span>See full search results</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Real Soundlounge Actions (Upload Audio, Mode Switch, Room Sync) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              title="Upload Audio to Cloud"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d181e] hover:bg-[#14232c] border border-[#1c2e38] text-xs font-medium text-[#7d8f9c] hover:text-[#00e5c9] transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Audio</span>
            </button>
          )}

          {/* Sync Lounge Status Pill */}
          {mode === "synced" ? (
            <div className="flex items-center gap-2 bg-[#0e1920] border border-[#1a323e] px-3 py-1.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-[#00e5c9] animate-pulse" />
              <span className="text-[#8da0ad] font-mono tabular-nums">{pingMs}ms</span>
              <button
                onClick={onOpenInvite}
                title="Invite to Room"
                className="text-[#00e5c9] font-medium hover:underline cursor-pointer flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                <span>Invite</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onModeChange("synced")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d181e] hover:bg-[#14232c] border border-[#1c2e38] text-xs font-medium text-[#7d8f9c] hover:text-[#00e5c9] transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sync Lounge</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
