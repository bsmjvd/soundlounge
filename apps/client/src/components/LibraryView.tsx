"use client";

import React, { useState, useMemo } from "react";
import {
  Heart,
  Library,
  History,
  Play,
  Trash2,
  Plus,
  Music2,
  X,
  Clock,
  Download,
  Upload,
  Search,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import type { Track, Playlist } from "@soundlounge/shared";
import type { LastSessionSnapshot } from "../lib/store/useLibraryStore";
import { TrackArtwork } from "./TrackArtwork";

interface LibraryViewProps {
  likedTracks: Track[];
  playlists: Playlist[];
  history: Track[];
  lastSession: LastSessionSnapshot | null;
  onPlayTrack: (track: Track) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onResumeSession: (session: LastSessionSnapshot) => void;
  activeSection?: "liked" | "playlists" | "history";
}

export function LibraryView({
  likedTracks,
  playlists,
  history,
  onPlayTrack,
  onPlayPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  activeSection = "liked",
}: LibraryViewProps) {
  const [internalTab, setInternalTab] = useState<"liked" | "playlists" | "history">(activeSection);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistError, setPlaylistError] = useState("");
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [likedSearch, setLikedSearch] = useState("");
  const [likedSort, setLikedSort] = useState<"date" | "title" | "artist" | "duration">("date");
  const fileImportRef = React.useRef<HTMLInputElement>(null);
  const playlistInputRef = React.useRef<HTMLInputElement>(null);

  // Sync with prop if it changes
  React.useEffect(() => {
    if (activeSection) {
      setInternalTab(activeSection);
    }
  }, [activeSection]);

  const currentTab = internalTab;

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Compute Listening Insights
  const insights = useMemo(() => {
    const allTracks = [...likedTracks, ...history];
    const totalDurationMs = allTracks.reduce((acc, t) => acc + (t.durationMs || 0), 0);
    const totalMinutes = Math.round(totalDurationMs / 60000);

    const artistCount: Record<string, number> = {};
    allTracks.forEach((t) => {
      const art = t.artist || "Unknown";
      artistCount[art] = (artistCount[art] || 0) + 1;
    });

    let topArtist = "None";
    let maxCount = 0;
    Object.entries(artistCount).forEach(([art, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topArtist = art;
      }
    });

    return {
      totalLiked: likedTracks.length,
      totalMinutes,
      topArtist,
      totalHistory: history.length,
    };
  }, [likedTracks, history]);

  // Filter and sort liked tracks
  const processedLikedTracks = useMemo(() => {
    let result = [...likedTracks];

    if (likedSearch.trim()) {
      const q = likedSearch.toLowerCase().trim();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.artist && t.artist.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (likedSort === "title") return a.title.localeCompare(b.title);
      if (likedSort === "artist") return (a.artist || "").localeCompare(b.artist || "");
      if (likedSort === "duration") return (b.durationMs || 0) - (a.durationMs || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return result;
  }, [likedTracks, likedSearch, likedSort]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) {
      setPlaylistError("Enter a playlist name.");
      requestAnimationFrame(() => playlistInputRef.current?.focus());
      return;
    }
    onCreatePlaylist(newPlaylistName.trim());
    setNewPlaylistName("");
    setPlaylistError("");
    setShowCreateInput(false);
  };

  const handleExportPlaylists = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(playlists, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `soundlounge-playlists-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) {
          setImportStatus({ type: "error", message: "That file isn't a playlist export." });
          return;
        }
        const valid = imported.filter(
          (pl) => pl && typeof pl.name === "string" && pl.name.trim().length > 0
        );
        if (valid.length === 0) {
          setImportStatus({ type: "error", message: "No playlists found in that file." });
          return;
        }
        valid.forEach((pl) => onCreatePlaylist(pl.name.trim()));
        setImportStatus({
          type: "success",
          message: `Imported ${valid.length} playlist${valid.length === 1 ? "" : "s"}.`,
        });
      } catch (err) {
        console.warn("Failed to parse imported playlist JSON", err);
        setImportStatus({ type: "error", message: "That file isn't valid JSON." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div className="space-y-6">
      {/* Listening Insights Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-card surface-panel">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase font-bold tracking-wider text-ink-muted">Total Liked</span>
          <span className="text-xl sm:text-2xl font-black text-like mt-0.5">{insights.totalLiked}</span>
          <span className="text-[11px] text-ink-subtle">tracks saved</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase font-bold tracking-wider text-ink-muted">Listening Time</span>
          <span className="text-xl sm:text-2xl font-black text-accent mt-0.5">{insights.totalMinutes}m</span>
          <span className="text-[11px] text-ink-subtle">approx listening</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase font-bold tracking-wider text-ink-muted">Top Artist</span>
          <span className="text-sm sm:text-base font-bold text-ink mt-1 truncate">{insights.topArtist}</span>
          <span className="text-[11px] text-ink-subtle">most played</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase font-bold tracking-wider text-ink-muted">Session History</span>
          <span className="text-xl sm:text-2xl font-black text-accent mt-0.5">{insights.totalHistory}</span>
          <span className="text-[11px] text-ink-subtle">recent plays</span>
        </div>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line/80">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setInternalTab("liked")}
            aria-pressed={currentTab === "liked"}
            className={`flex min-h-11 items-center gap-2 px-3.5 py-1.5 rounded-control text-xs font-semibold transition cursor-pointer ${
              currentTab === "liked"
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised/50"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 text-like ${currentTab === "liked" ? "fill-current" : ""}`} />
            <span>Liked Songs ({likedTracks.length})</span>
          </button>

          <button
            onClick={() => setInternalTab("playlists")}
            aria-pressed={currentTab === "playlists"}
            className={`flex min-h-11 items-center gap-2 px-3.5 py-1.5 rounded-control text-xs font-semibold transition cursor-pointer ${
              currentTab === "playlists"
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised/50"
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Playlists ({playlists.length})</span>
          </button>

          <button
            onClick={() => setInternalTab("history")}
            aria-pressed={currentTab === "history"}
            className={`flex min-h-11 items-center gap-2 px-3.5 py-1.5 rounded-control text-xs font-semibold transition cursor-pointer ${
              currentTab === "history"
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised/50"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>
        </div>

        {currentTab === "playlists" && (
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" ref={fileImportRef} onChange={handleImportFile} accept=".json" className="hidden" />
            <button
              onClick={() => fileImportRef.current?.click()}
              title="Import playlists from JSON"
              className="flex min-h-11 items-center gap-1.5 text-xs text-ink-muted hover:text-ink px-2.5 py-1.5 rounded-control bg-surface-raised/60 hover:bg-surface-raised transition-colors cursor-pointer border border-line-strong"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
            <button
              onClick={handleExportPlaylists}
              disabled={playlists.length === 0}
              title="Export playlists to JSON"
              className="flex min-h-11 items-center gap-1.5 text-xs text-ink-muted hover:text-ink px-2.5 py-1.5 rounded-control bg-surface-raised/60 hover:bg-surface-raised transition-colors cursor-pointer border border-line-strong disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            {!showCreateInput && (
              <button
                onClick={() => {
                  setPlaylistError("");
                  setShowCreateInput(true);
                }}
                className="flex min-h-11 items-center gap-1.5 text-xs text-accent hover:text-ink px-3 py-1.5 rounded-control bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-accent" />
                New Playlist
              </button>
            )}
          </div>
        )}
      </div>

      {currentTab === "playlists" && importStatus && (
        <p
          role={importStatus.type === "error" ? "alert" : "status"}
          className={`text-xs ${importStatus.type === "error" ? "text-danger" : "text-positive"}`}
        >
          {importStatus.message}
        </p>
      )}

      {/* Playlist Creation Inline Form */}
      {showCreateInput && (
        <form
          onSubmit={handleCreateSubmit}
          className="animate-view-in p-3 rounded-control bg-surface-sunken border border-accent/40 flex flex-wrap items-center gap-2"
        >
          <label htmlFor="library-playlist-name" className="sr-only">
            Playlist name
          </label>
          <input
            ref={playlistInputRef}
            id="library-playlist-name"
            type="text"
            name="playlist-name"
            autoComplete="off"
            enterKeyHint="done"
            placeholder="Playlist name..."
            value={newPlaylistName}
            onChange={(e) => {
              setNewPlaylistName(e.target.value);
              if (playlistError) setPlaylistError("");
            }}
            aria-invalid={!!playlistError}
            aria-describedby={playlistError ? "library-playlist-error" : undefined}
            autoFocus
            className="flex-1 min-h-11 bg-transparent text-base sm:text-xs text-ink placeholder-ink-subtle outline-none px-2"
          />
          <button
            type="submit"
            className="bg-accent hover:bg-accent-strong text-accent-foreground px-3 min-h-11 rounded-control text-xs font-semibold transition-colors cursor-pointer"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreateInput(false);
              setPlaylistError("");
            }}
            className="min-h-11 min-w-11 flex items-center justify-center text-ink-muted hover:text-ink rounded-control cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          {playlistError && (
            <p id="library-playlist-error" role="alert" className="w-full text-[11px] text-danger">
              {playlistError}
            </p>
          )}
        </form>
      )}

      {/* 1. LIKED SONGS VIEW */}
      {currentTab === "liked" && (
        <>
          {likedTracks.length > 0 ? (
            <div className="animate-view-in space-y-3">
              {/* Filter and Sort Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-sunken/40 p-2.5 rounded-control border border-line-strong">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    name="filter-liked-tracks"
                    aria-label="Filter saved tracks"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    placeholder="Filter saved tracks..."
                    value={likedSearch}
                    onChange={(e) => setLikedSearch(e.target.value)}
                    className="w-full min-h-11 bg-surface-raised/60 border border-line-strong rounded-control pl-8 pr-3 py-1 text-base sm:text-xs text-ink placeholder-ink-subtle outline-none focus:border-accent"
                  />
                  {likedSearch && (
                    <button
                      type="button"
                      onClick={() => setLikedSearch("")}
                      aria-label="Clear filter"
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-ink-subtle hover:text-ink"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-ink-muted" />
                  <select
                    aria-label="Sort saved tracks"
                    value={likedSort}
                    onChange={(e) => setLikedSort(e.target.value as "date" | "title" | "artist" | "duration")}
                    className="min-h-11 bg-surface-raised/80 border border-line-strong text-base sm:text-xs text-ink-secondary rounded-control px-2.5 py-1 outline-none cursor-pointer hover:border-line-strong"
                  >
                    <option value="date">Recently Added</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="artist">Artist</option>
                    <option value="duration">Longest Duration</option>
                  </select>
                </div>
              </div>

              <div className="animate-view-in rounded-card border border-line bg-surface-sunken overflow-hidden">
                <div className="hidden sm:grid grid-cols-[36px_1fr_80px_60px] items-center px-4 py-2.5 border-b border-line text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
                  <span>#</span>
                  <span>Title & Artist</span>
                  <span className="text-right">Duration</span>
                  <span className="text-right pr-2">Play</span>
                </div>
                <div className="divide-y divide-line">
                  {processedLikedTracks.map((track, idx) => (
                    <div
                      key={track.id}
                      className="group grid grid-cols-[28px_1fr_auto] sm:grid-cols-[36px_1fr_80px_60px] items-center px-3 sm:px-4 py-2.5 hover:bg-surface-raised transition-colors"
                    >
                      <div className="text-xs font-mono text-ink-subtle">
                        <span className="group-hover:hidden">{idx + 1}</span>
                        <button
                          onClick={() => onPlayTrack(track)}
                          className="hidden group-hover:inline-flex text-ink hover:text-accent cursor-pointer"
                          aria-label={`Play ${track.title}`} title="Play Track"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-2 sm:pr-4">
                        <TrackArtwork
                          coverUrl={track.coverUrl}
                          trackId={track.id}
                          title={track.title}
                          className="w-10 h-10 rounded-lg"
                          iconClassName="w-4 h-4"
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-ink truncate group-hover:text-accent transition-colors">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-ink-muted truncate mt-0.5">{track.artist}</p>
                        </div>
                      </div>

                      <div className="hidden sm:block text-right text-xs font-mono tabular-nums text-ink-muted">
                        {formatTime(track.durationMs)}
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => onPlayTrack(track)}
                          aria-label={`Play ${track.title}`} title="Play Track"
                          className="min-h-11 min-w-11 flex items-center justify-center rounded-control text-ink-subtle hover:text-ink transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-line bg-surface-sunken space-y-2">
              <Heart className="w-8 h-8 text-ink-subtle mx-auto" />
              <p className="text-xs text-ink-muted font-medium">No liked songs yet</p>
              <p className="text-[11px] text-ink-subtle">
                Click the heart icon on any playing track or search result to save it here.
              </p>
            </div>
          )}
        </>
      )}

      {/* 2. PLAYLISTS VIEW */}
      {currentTab === "playlists" && (
        <div className="animate-view-in space-y-4">
          {playlists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-4 rounded-xl border border-line bg-surface-sunken hover:border-line transition-colors group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-surface-raised border border-line flex items-center justify-center text-accent flex-shrink-0">
                        <Library className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <h3 className="text-xs font-semibold text-ink truncate group-hover:text-accent transition-colors">
                          {pl.name}
                        </h3>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {pl.tracks.length} track{pl.tracks.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirmDeleteId === pl.id) {
                          onDeletePlaylist(pl.id);
                          setConfirmDeleteId(null);
                          return;
                        }
                        setConfirmDeleteId(pl.id);
                        window.setTimeout(() => setConfirmDeleteId(null), 3000);
                      }}
                      title={confirmDeleteId === pl.id ? "Confirm delete" : "Delete playlist"}
                      aria-label={
                        confirmDeleteId === pl.id ? `Confirm delete ${pl.name}` : `Delete ${pl.name}`
                      }
                      className={`flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors cursor-pointer sm:min-h-0 sm:min-w-0 sm:p-1.5 ${
                        confirmDeleteId === pl.id
                          ? "bg-danger/10 text-danger"
                          : "text-ink-subtle hover:text-danger"
                      }`}
                    >
                      {confirmDeleteId === pl.id ? (
                        <span className="text-[11px] font-bold">Delete?</span>
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPlaylistId(selectedPlaylistId === pl.id ? null : pl.id)}
                      className="min-h-11 text-[11px] text-ink-muted hover:text-ink transition-colors cursor-pointer"
                    >
                      {selectedPlaylistId === pl.id ? "Hide Tracks" : "View Tracks"}
                    </button>

                    <button
                      onClick={() => onPlayPlaylist(pl)}
                      disabled={pl.tracks.length === 0}
                      className="flex min-h-11 items-center gap-1.5 px-3 py-1 rounded-control bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent-strong transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Play All
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-line bg-surface-sunken space-y-2">
              <Library className="w-8 h-8 text-ink-subtle mx-auto" />
              <p className="text-xs text-ink-muted font-medium">No playlists created</p>
              <p className="text-[11px] text-ink-subtle">
                Create a playlist or save your current queue to build your audio collection.
              </p>
            </div>
          )}

          {/* Expanded Playlist Tracks View */}
          {selectedPlaylist && (
            <div className="animate-view-in mt-4 rounded-xl border border-line bg-surface-sunken p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                  <span>{selectedPlaylist.name} Tracks</span>
                  <span className="text-[11px] text-ink-muted font-normal">({selectedPlaylist.tracks.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedPlaylistId(null)}
                  aria-label="Hide playlist tracks"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink-muted hover:text-ink cursor-pointer sm:min-h-0 sm:min-w-0 sm:p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedPlaylist.tracks.length > 0 ? (
                <div className="divide-y divide-line">
                  {selectedPlaylist.tracks.map((track, idx) => (
                    <div
                      key={`${track.id}_${idx}`}
                      className="group flex items-center justify-between py-2 hover:bg-surface-raised px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                        <TrackArtwork
                          coverUrl={track.coverUrl}
                          trackId={track.id}
                          title={track.title}
                          className="w-9 h-9 rounded-lg"
                          iconClassName="w-4 h-4"
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-ink truncate">{track.title}</p>
                          <p className="text-[11px] text-ink-muted truncate">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono tabular-nums text-ink-muted">
                          {formatTime(track.durationMs)}
                        </span>
                        <button
                          onClick={() => onPlayTrack(track)}
                          aria-label={`Play ${track.title}`} title="Play Track"
                          className="min-h-11 min-w-11 flex items-center justify-center rounded-control text-ink-subtle hover:text-ink transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-subtle py-4 text-center">This playlist is empty.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. HISTORY VIEW */}
      {currentTab === "history" && (
        <>
          {history.length > 0 ? (
            <div className="animate-view-in rounded-card border border-line bg-surface-sunken overflow-hidden">
              <div className="hidden sm:grid grid-cols-[36px_1fr_80px_60px] items-center px-4 py-2.5 border-b border-line text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
                <span>#</span>
                <span>Title & Artist</span>
                <span className="text-right">Duration</span>
                <span className="text-right pr-2">Replay</span>
              </div>
              <div className="divide-y divide-line">
                {history.map((track, idx) => (
                  <div
                    key={`${track.id}_${idx}`}
                    className="group grid grid-cols-[28px_1fr_auto] sm:grid-cols-[36px_1fr_80px_60px] items-center px-3 sm:px-4 py-2.5 hover:bg-surface-raised transition-colors"
                  >
                    <div className="text-xs font-mono text-ink-subtle">
                      <span className="group-hover:hidden">{idx + 1}</span>
                      <button
                        onClick={() => onPlayTrack(track)}
                        className="hidden group-hover:inline-flex text-ink hover:text-accent cursor-pointer"
                        aria-label={`Replay ${track.title}`} title="Replay Track"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-2 sm:pr-4">
                      <TrackArtwork
                        coverUrl={track.coverUrl}
                        trackId={track.id}
                        title={track.title}
                        className="w-10 h-10 rounded-lg"
                        iconClassName="w-4 h-4"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-ink truncate group-hover:text-accent transition-colors">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-ink-muted truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="hidden sm:block text-right text-xs font-mono tabular-nums text-ink-muted">
                      {formatTime(track.durationMs)}
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => onPlayTrack(track)}
                        aria-label={`Replay ${track.title}`} title="Replay Track"
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink-subtle hover:text-ink transition-colors cursor-pointer sm:min-h-0 sm:min-w-0 sm:p-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-line bg-surface-sunken space-y-2">
              <Clock className="w-8 h-8 text-ink-subtle mx-auto" />
              <p className="text-xs text-ink-muted font-medium">No listening history yet</p>
              <p className="text-[11px] text-ink-subtle">Tracks you play will be cataloged here automatically.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
