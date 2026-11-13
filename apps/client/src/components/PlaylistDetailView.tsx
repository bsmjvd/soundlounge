"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Play, ArrowLeft, CheckCircle2, ListMusic, Loader2, BookmarkPlus, Music2 } from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { useLibraryStore } from "../lib/store/useLibraryStore";
import { TrackRow } from "./TrackRow";

interface PlaylistDetailViewProps {
  /** Either a concrete playlist id or a curated search query to resolve. */
  playlistRef: { id?: string; query?: string; fallbackTitle?: string; fallbackCover?: string };
  onBack: () => void;
  onPlayTracks: (tracks: Track[]) => void;
  onPlayTrack: (track: Track) => void;
  onAddTrack: (track: Track, playNext?: boolean) => void;
  onAddTracksToQueue: (tracks: Track[]) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

interface PlaylistMeta {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  trackCount?: number | null;
}

interface PlaylistResponse {
  playlist?: PlaylistMeta;
  tracks?: Track[];
  error?: string;
}

export function PlaylistDetailView({
  playlistRef,
  onBack,
  onPlayTracks,
  onPlayTrack,
  onAddTrack,
  onAddTracksToQueue,
  currentTrack,
  isPlaying,
}: PlaylistDetailViewProps) {
  const { isLiked, toggleLike, playlists, createPlaylist, addTrackToPlaylist } = useLibraryStore();
  const [meta, setMeta] = useState<PlaylistMeta | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(null);

  const fetchUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (playlistRef.id) {
      params.set("id", playlistRef.id);
    } else {
      params.set("q", playlistRef.query || "");
      params.set("play", "1");
    }
    return `/api/playlist?${params.toString()}`;
  }, [playlistRef.id, playlistRef.query]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setTracks([]);
    setMeta(null);
    setSavedPlaylistId(null);

    fetch(fetchUrl)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: PlaylistResponse) => {
        if (cancelled) return;
        if (!data.playlist || !data.tracks?.length) {
          throw new Error(data.error || "Playlist not found");
        }
        setMeta(data.playlist);
        setTracks(data.tracks);
        setStatus("done");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [fetchUrl]);

  const totalDuration = useMemo(
    () => tracks.reduce((sum, t) => sum + (t.durationMs || 0), 0),
    [tracks]
  );

  const formatTotal = (ms: number) => {
    const mins = Math.round(ms / 60000);
    if (mins >= 60) {
      return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
    }
    return `${mins} min`;
  };

  // Already in the library (by title match) or saved this session
  const alreadySaved =
    savedPlaylistId !== null ||
    playlists.some((p) => meta && p.name.toLowerCase() === meta.title.toLowerCase());

  const handleSaveToLibrary = () => {
    if (!meta || alreadySaved || tracks.length === 0) return;
    const id = createPlaylist(meta.title, `Imported from YouTube Music • ${meta.author}`);
    tracks.forEach((t) => addTrackToPlaylist(id, t));
    setSavedPlaylistId(id);
  };

  const displayTitle = meta?.title || playlistRef.fallbackTitle || "Playlist";
  const displayCover = meta?.coverUrl || playlistRef.fallbackCover || "";

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-accent transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Playlists</span>
      </button>

      {/* Playlist Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-surface border border-line p-6 sm:p-8 shadow-2xl">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-xl scale-125 pointer-events-none"
          style={{ backgroundImage: displayCover ? `url(${displayCover})` : undefined }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border-2 border-accent/40 shadow-2xl flex-shrink-0 bg-surface-raised">
            {displayCover ? (
              <img src={displayCover} alt={displayTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ListMusic className="w-12 h-12 text-ink-subtle" />
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                <Music2 className="w-3 h-3" /> YouTube Music Playlist
              </span>
              {meta?.author && (
                <span className="text-[11px] text-ink-muted font-medium truncate">by {meta.author}</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">{displayTitle}</h1>

            {status === "done" && (
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-mono tabular-nums text-ink-secondary">
                <span className="flex items-center gap-1.5">
                  <ListMusic className="w-3.5 h-3.5 text-accent" />
                  <strong className="text-ink">{tracks.length}</strong> tracks
                </span>
                <span>{formatTotal(totalDuration)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
            <button
              onClick={() => onPlayTracks(tracks)}
              disabled={status !== "done" || tracks.length === 0}
              className="flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-control bg-accent hover:bg-accent-strong text-accent-foreground text-xs font-bold shadow-lg shadow-accent/30 hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play Playlist</span>
            </button>

            <button
              onClick={() => onAddTracksToQueue(tracks)}
              disabled={status !== "done" || tracks.length === 0}
              className="flex min-h-11 items-center justify-center gap-1.5 px-4 py-2.5 rounded-control bg-surface-raised hover:bg-surface-overlay border border-line-strong text-ink text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Music2 className="w-3.5 h-3.5 text-accent" />
              <span>Add to Queue</span>
            </button>

            <button
              onClick={handleSaveToLibrary}
              disabled={status !== "done" || alreadySaved || tracks.length === 0}
              className="flex min-h-11 items-center justify-center gap-1.5 px-4 py-2.5 rounded-control bg-surface-raised hover:bg-surface-overlay border border-line-strong text-ink text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={alreadySaved ? "Already in your library" : "Copy into your playlists"}
            >
              {alreadySaved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              ) : (
                <BookmarkPlus className="w-3.5 h-3.5 text-accent" />
              )}
              <span>{alreadySaved ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      {status === "loading" && (
        <div className="flex items-center gap-2 py-10 justify-center text-xs text-ink-muted rounded-2xl bg-surface border border-line">
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          <span>Loading playlist from YouTube Music…</span>
        </div>
      )}

      {status === "error" && (
        <div className="py-10 text-center rounded-2xl border border-line bg-surface space-y-2">
          <ListMusic className="w-8 h-8 text-ink-subtle mx-auto" />
          <p className="text-xs font-semibold text-ink">Couldn't load this playlist right now.</p>
          <p className="text-[11px] text-ink-muted">Try again in a moment, or pick another playlist.</p>
        </div>
      )}

      {status === "done" && (
        <div className="rounded-2xl bg-surface border border-line p-5 shadow-xl">
          <div className="hidden sm:grid grid-cols-[36px_1fr_90px_110px] items-center px-3 py-2 text-[11px] font-semibold text-ink-subtle uppercase tracking-wider border-b border-line">
            <span>#</span>
            <span>Title & Artist</span>
            <span className="text-right">Duration</span>
            <span className="text-right pr-2">Actions</span>
          </div>
          <div className="divide-y divide-line">
            {tracks.map((track, idx) => {
              const isThisTrack = currentTrack?.id === track.id;
              const liked = isLiked(track.id);
              return (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  isCurrent={isThisTrack && isPlaying}
                  liked={liked}
                  onPlay={() => onPlayTrack(track)}
                  onLike={() => toggleLike(track)}
                  onPlayNext={() => onAddTrack(track, true)}
                  onAddToQueue={() => onAddTrack(track, false)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
