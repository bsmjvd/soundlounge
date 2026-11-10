"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Menu, Music2, Play, Plus, Check, Disc, User, Loader2, History, Trash2 } from "lucide-react";
import type { PlaybackMode } from "../lib/player";
import type { Track, Album } from "@soundlounge/shared";
import { ARTISTS_CATALOG, type ArtistProfileData } from "../lib/data/artistsCatalog";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import { TrackArtwork } from "./TrackArtwork";
import { SyncHealthBadge } from "./room/SyncHealthBadge";
import { hapticLight } from "../lib/haptics";
import { prefetchTrack } from "../lib/prefetch";

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
  isLeavesEnabled?: boolean;
  onToggleLeaves?: () => void;
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
  isLeavesEnabled = true,
  onToggleLeaves,
}: TopBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<"all" | "tracks" | "artists" | "albums">("all");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("soundlounge_recent_searches");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return ["Kendrick Lamar", "Die With A Smile", "The Weeknd", "Flume"];
  });
  const [liveTracks, setLiveTracks] = useState<Track[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState(false);
  const [addedTrackId, setAddedTrackId] = useState<string | null>(null);

  const saveRecentSearch = (query: string) => {
    const clean = query.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("soundlounge_recent_searches", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("soundlounge_recent_searches");
      } catch {}
    }
  };

  const removeRecentSearch = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== query);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("soundlounge_recent_searches", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // The mobile search sheet must clear the real header, including the nav row and safe area
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setHeaderHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
        searchInputRef.current?.focus();
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
      setLiveError(false);
      return;
    }

    setIsLoadingLive(true);
    setLiveError(false);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) {
          setLiveError(true);
          return;
        }
        const data = await res.json();
        setLiveTracks(data.tracks?.slice(0, 6) || []);
        // Only the top hit: this list changes as you type, and each warm-up is a real download
        prefetchTrack(data.tracks?.[0]);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.warn("TopBar live search error:", err);
          setLiveError(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingLive(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
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
    <header
      ref={headerRef}
      className="sticky top-0 z-[100] w-full bg-canvas/90 backdrop-blur-md px-3 sm:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 sm:pb-3.5 transition-colors border-b border-line/40"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Trigger & Desktop Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
          {onToggleMobileMenu && (
            <button
              onClick={() => {
                hapticLight();
                onToggleMobileMenu();
              }}
              className="lg:hidden h-11 w-11 -ml-1 flex items-center justify-center text-ink-muted hover:text-ink rounded-control hover:bg-surface-raised transition-colors cursor-pointer"
              aria-label="Open playlist menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <button
              onClick={() => {
                hapticLight();
                onTopTabChange && onTopTabChange("discover");
              }}
              aria-current={activeTopTab === "discover" ? "page" : undefined}
              className={`text-xs font-bold uppercase tracking-wider py-1 border-b-2 transition cursor-pointer ${
                activeTopTab === "discover"
                  ? "text-accent border-accent"
                  : "text-ink-muted border-transparent hover:text-ink"
              }`}
            >
              Discover
            </button>

            <button
              onClick={() => {
                hapticLight();
                onTopTabChange && onTopTabChange("library");
              }}
              aria-current={activeTopTab === "library" ? "page" : undefined}
              className={`text-xs font-bold uppercase tracking-wider py-1 border-b-2 transition cursor-pointer ${
                activeTopTab === "library"
                  ? "text-accent border-accent"
                  : "text-ink-muted border-transparent hover:text-ink"
              }`}
            >
              My Library
            </button>

            <button
              onClick={() => {
                hapticLight();
                onTopTabChange && onTopTabChange("radio");
              }}
              aria-current={activeTopTab === "radio" ? "page" : undefined}
              className={`text-xs font-bold uppercase tracking-wider py-1 border-b-2 transition cursor-pointer ${
                activeTopTab === "radio"
                  ? "text-accent border-accent"
                  : "text-ink-muted border-transparent hover:text-ink"
              }`}
            >
              Radio
            </button>
          </nav>

          <SyncHealthBadge pingMs={pingMs} mode={mode} className="hidden md:inline-flex" />
        </div>

        {/* Center/Right: Fluid Responsive Pill Search Input + Dropdown */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end min-w-0 max-w-full md:max-w-md lg:max-w-lg">
          <div className="relative w-full min-w-0">
            <form onSubmit={handleSearchSubmit} role="search" aria-label="Search music" className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              <input
                ref={searchInputRef}
                type="text"
                name="search"
                aria-label="Search songs, artists, and albums"
                aria-expanded={isDropdownOpen}
                aria-controls="global-search-results"
                aria-autocomplete="list"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsDropdownOpen(true);
                }}
                className="w-full h-11 sm:h-9 bg-surface-raised/60 hover:bg-surface-raised focus:bg-surface-raised/90 border border-line-strong focus:border-accent rounded-full pl-8 sm:pl-9 pr-8 sm:pr-14 text-base sm:text-xs text-ink placeholder-ink-muted outline-none transition shadow-inner"
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="flex h-9 w-9 items-center justify-center text-ink-muted hover:text-ink rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center rounded border border-line bg-surface-sunken/60 px-1 py-0.5 text-[11px] font-mono text-ink-muted">
                  ⌘K
                </kbd>
              </div>
            </form>

            {/* Instant Search Results Dropdown - Fixed full-width on mobile, absolute on desktop */}
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                id="global-search-results"
                style={{ "--header-h": `${headerHeight}px` } as React.CSSProperties}
                className="animate-popover-in fixed inset-x-3 top-[calc(var(--header-h,7.5rem)+0.5rem)] md:absolute md:inset-x-0 md:top-full md:mt-2 bg-surface border border-line rounded-card shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden z-[120] max-h-[75vh] flex flex-col"
              >
                <span className="sr-only" role="status">
                  {addedTrackId ? "Added to queue" : ""}
                </span>
                {/* 1. Category Filter Segmented Chips (Visible when searching) */}
                {searchQuery.trim().length > 0 && (
                  <div className="flex items-center gap-1 px-3 py-2 bg-surface-sunken/70 border-b border-line/80">
                    {(["all", "tracks", "artists", "albums"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setSearchFilter(filter)}
                        aria-pressed={searchFilter === filter}
                        className={`min-h-10 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                          searchFilter === filter
                            ? "bg-accent text-accent-foreground shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                            : "text-ink-muted hover:text-ink hover:bg-surface-raised"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Recent Searches (When input is empty) */}
                {searchQuery.trim().length === 0 && (
                  <div className="p-3">
                    <div className="flex items-center justify-between pb-2 px-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
                        <History className="w-3.5 h-3.5 text-accent" />
                        <span>Recent Searches</span>
                      </div>
                      {recentSearches.length > 0 && (
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="min-h-10 text-[11px] text-ink-subtle hover:text-danger flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>

                    {recentSearches.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {recentSearches.map((item) => (
                          <div
                            key={item}
                            className="group flex min-h-10 items-center rounded-full bg-surface-raised/80 hover:bg-surface-overlay/80 border border-line-strong hover:border-accent/50 transition"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(item);
                                onSearch(item);
                                setIsDropdownOpen(false);
                              }}
                              className="min-h-10 max-w-[220px] truncate pl-2.5 pr-1 text-xs text-ink-secondary hover:text-ink cursor-pointer"
                            >
                              {item}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(item, e)}
                              aria-label={`Remove ${item} from recent searches`}
                              className="flex h-10 w-7 items-center justify-center pr-1 text-ink-subtle hover:text-ink cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-ink-subtle px-1 py-2">No recent searches</p>
                    )}
                  </div>
                )}

                {/* 3. Search Results */}
                {searchQuery.trim().length > 0 && (
                  <div className="p-3 overflow-y-auto space-y-4 flex-1 scrollbar-none">
                    {/* ARTISTS */}
                    {(searchFilter === "all" || searchFilter === "artists") && matchingArtists.length > 0 && (
                      <div>
                        <div className="px-2 pb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-accent uppercase">
                          <User className="w-3 h-3" />
                          <span>Artists</span>
                        </div>
                        <div className="space-y-1">
                          {matchingArtists.map((artist) => (
                            <button
                              key={artist.id}
                              onClick={() => {
                                saveRecentSearch(artist.name);
                                handleSelectArtistClick(artist);
                              }}
                              className="w-full min-h-12 flex items-center gap-2.5 p-1.5 rounded-control hover:bg-surface-raised/70 text-left transition-colors cursor-pointer"
                            >
                              <img
                                src={artist.avatarUrl}
                                alt={artist.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-ink truncate">{artist.name}</p>
                                <p className="text-[11px] text-ink-muted truncate">{artist.genre}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ALBUMS */}
                    {(searchFilter === "all" || searchFilter === "albums") && matchingAlbums.length > 0 && (
                      <div>
                        <div className="px-2 pb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-accent uppercase">
                          <Disc className="w-3 h-3" />
                          <span>Albums</span>
                        </div>
                        <div className="space-y-1">
                          {matchingAlbums.map((album) => (
                            <button
                              key={album.id}
                              onClick={() => {
                                saveRecentSearch(album.title);
                                handleSelectAlbumClick(album);
                              }}
                              className="w-full min-h-12 flex items-center gap-2.5 p-1.5 rounded-control hover:bg-surface-raised/70 text-left transition-colors cursor-pointer"
                            >
                              <img src={album.coverUrl} alt={album.title} className="w-8 h-8 rounded-lg object-cover" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-ink truncate">{album.title}</p>
                                <p className="text-[11px] text-ink-muted truncate">
                                  {album.primaryArtist} • {album.releaseYear}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {liveError && (searchFilter === "all" || searchFilter === "tracks") && (
                      <p role="status" className="px-2 pb-1 text-[11px] text-danger">
                        Live results are unavailable. Showing saved catalog matches.
                      </p>
                    )}

                    {/* SONGS (Local + Live YouTube) */}
                    {(searchFilter === "all" || searchFilter === "tracks") &&
                      (matchingLocalTracks.length > 0 || liveTracks.length > 0) && (
                        <div>
                          <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-bold tracking-wider text-accent uppercase">
                            <div className="flex items-center gap-1.5">
                              <Music2 className="w-3 h-3" />
                              <span>Songs</span>
                            </div>
                            {isLoadingLive && <Loader2 className="w-3 h-3 animate-spin text-ink-muted" />}
                          </div>

                          <div className="space-y-1">
                            {[...matchingLocalTracks, ...liveTracks].slice(0, 6).map((track) => (
                              <div
                                key={track.id}
                                onClick={() => {
                                  saveRecentSearch(track.title);
                                  handlePlayDirect(track);
                                }}
                                className="group min-h-12 flex items-center justify-between p-1.5 rounded-control hover:bg-surface-raised/70 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-raised flex-shrink-0">
                                    <TrackArtwork
                                      coverUrl={track.coverUrl}
                                      trackId={track.id}
                                      title={track.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-ink truncate group-hover:text-accent">
                                      {track.title}
                                    </p>
                                    <p className="text-[11px] text-ink-muted truncate">{track.artist}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 ml-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddDirect(track);
                                    }}
                                    className="p-2 rounded-full hover:bg-surface-overlay text-ink-secondary opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity"
                                    aria-label={`Add ${track.title} to queue`}
                                    title="Add to queue"
                                  >
                                    {addedTrackId === track.id ? (
                                      <Check className="w-3 h-3 text-positive" />
                                    ) : (
                                      <Plus className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      saveRecentSearch(track.title);
                                      handlePlayDirect(track);
                                    }}
                                    className="p-2 rounded-full bg-accent text-accent-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-opacity"
                                    aria-label={`Play ${track.title}`}
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
                )}

                {searchQuery.trim().length > 0 && (
                  <div className="p-2 border-t border-line/80 bg-surface-sunken/40 text-center">
                    <button
                      onClick={(e) => {
                        saveRecentSearch(searchQuery);
                        handleSearchSubmit(e);
                      }}
                      className="text-xs text-accent hover:underline font-semibold cursor-pointer"
                    >
                      View all results for &ldquo;{searchQuery}&rdquo; →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Avatar with subtle cyan halo (matching reference image) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Seasonal Autumn Leaves Ambient Toggle */}
            {onToggleLeaves && (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  onToggleLeaves();
                }}
                title={isLeavesEnabled ? "Disable falling autumn leaves" : "Enable falling autumn leaves"}
                aria-label={isLeavesEnabled ? "Disable falling leaves" : "Enable falling leaves"}
                className={`w-11 h-11 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm transition cursor-pointer border ${
                  isLeavesEnabled
                    ? "bg-ember/20 border-ember/40 text-ember shadow-[0_0_12px_rgba(245,179,107,0.35)] scale-105"
                    : "bg-surface-raised/60 border-line/60 text-ink-muted hover:text-ink"
                }`}
              >
                🍂
              </button>
            )}

            <button
              onClick={() => onTopTabChange && onTopTabChange("library")}
              title="My Library & Profile"
              aria-label="Open my library"
              className="w-11 h-11 sm:w-8 sm:h-8 rounded-full overflow-hidden ring-2 ring-accent/40 shadow-[0_0_12px_rgba(0,229,255,0.25)] flex-shrink-0 hover:ring-accent transition cursor-pointer hover:scale-105 active:scale-95"
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
