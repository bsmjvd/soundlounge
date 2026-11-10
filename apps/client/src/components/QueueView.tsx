"use client";

import React, { useState } from "react";
import {
  ListMusic,
  Play,
  Trash2,
  ArrowRight,
  BookmarkPlus,
  Music2,
  X,
  Volume2,
  Sparkles,
} from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { TrackArtwork } from "./TrackArtwork";

interface QueueViewProps {
  queue: Track[];
  currentIndex: number;
  isAutoplayEnabled?: boolean;
  onToggleAutoplay?: () => void;
  autoQueueReasons?: Record<string, string>;
  onPlayTrack: (track: Track, index: number) => void;
  onRemoveTrack: (trackId: string) => void;
  onPlayNext: (track: Track) => void;
  onClearQueue: () => void;
  onSavePlaylist: (name: string) => void;
}

export function QueueView({
  queue,
  currentIndex,
  isAutoplayEnabled = true,
  onToggleAutoplay,
  autoQueueReasons = {},
  onPlayTrack,
  onRemoveTrack,
  onPlayNext,
  onClearQueue,
  onSavePlaylist,
}: QueueViewProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistError, setPlaylistError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const playlistInputRef = React.useRef<HTMLInputElement>(null);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) {
      setPlaylistError("Enter a playlist name.");
      requestAnimationFrame(() => playlistInputRef.current?.focus());
      return;
    }
    onSavePlaylist(playlistName.trim());
    setPlaylistName("");
    setPlaylistError("");
    setShowSaveModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Queue Header & Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-ink tracking-tight flex items-center gap-2 font-display">
            <ListMusic className="w-4 h-4 text-accent" />
            Playing Queue
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            {queue.length} track{queue.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onToggleAutoplay && (
            <button
              onClick={onToggleAutoplay}
              className={`flex min-h-11 items-center gap-1.5 text-xs px-3 py-1.5 rounded-control border transition cursor-pointer ${
                isAutoplayEnabled
                  ? "bg-accent/15 text-accent border-accent/40 shadow-sm shadow-accent/20 font-semibold"
                  : "bg-surface-sunken hover:bg-surface-raised text-ink-muted border-line"
              }`}
              title="Automatically queue similar songs matching artist and genre"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autoplay: {isAutoplayEnabled ? "ON" : "OFF"}</span>
            </button>
          )}

          {queue.length > 0 && (
            <>
              <button
                onClick={() => {
                  setPlaylistError("");
                  setShowSaveModal(true);
                }}
                className="flex min-h-11 items-center gap-1.5 text-xs text-ink-muted hover:text-ink px-3 py-1.5 rounded-control bg-surface-sunken hover:bg-surface-raised border border-line-strong transition-colors cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-accent" />
                Save Playlist
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirmClear) {
                    setConfirmClear(true);
                    window.setTimeout(() => setConfirmClear(false), 4000);
                    return;
                  }
                  setConfirmClear(false);
                  onClearQueue();
                }}
                aria-label={confirmClear ? "Confirm clear queue" : "Clear queue"}
                className={`flex min-h-11 items-center gap-1.5 text-xs px-3 py-1.5 rounded-control border border-line-strong transition-colors cursor-pointer ${
                  confirmClear
                    ? "border-danger/50 bg-danger/10 text-danger hover:bg-danger/15"
                    : "bg-surface-sunken hover:bg-surface-raised text-ink-muted hover:text-danger"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmClear ? "Confirm clear" : "Clear"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save Queue Modal Inline Form */}
      {showSaveModal && (
        <form
          onSubmit={handleSaveSubmit}
          className="animate-view-in p-3 rounded-xl bg-surface-sunken border border-accent/40 flex flex-wrap items-center gap-2"
        >
          <label htmlFor="queue-playlist-name" className="sr-only">
            Playlist name
          </label>
          <input
            ref={playlistInputRef}
            id="queue-playlist-name"
            type="text"
            name="playlist-name"
            autoComplete="off"
            enterKeyHint="done"
            placeholder="Name your new playlist..."
            value={playlistName}
            onChange={(e) => {
              setPlaylistName(e.target.value);
              if (playlistError) setPlaylistError("");
            }}
            aria-invalid={!!playlistError}
            aria-describedby={playlistError ? "queue-playlist-error" : undefined}
            autoFocus
            className="flex-1 min-h-11 bg-transparent text-base sm:text-xs text-ink placeholder-ink-subtle outline-none px-2"
          />
          <button
            type="submit"
            className="bg-accent hover:bg-accent-strong text-accent-foreground px-3 min-h-11 rounded-control text-xs font-semibold transition-colors cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSaveModal(false);
              setPlaylistError("");
            }}
            className="min-h-11 min-w-11 flex items-center justify-center text-ink-muted hover:text-ink rounded-control cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          {playlistError && (
            <p id="queue-playlist-error" role="alert" className="w-full text-[11px] text-danger">
              {playlistError}
            </p>
          )}
        </form>
      )}

      {/* Queue Data Table */}
      {queue.length > 0 ? (
        <div className="rounded-xl border border-line bg-surface-sunken overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[36px_1fr_80px_100px] items-center px-4 py-2.5 border-b border-line text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
            <span>#</span>
            <span>Title & Artist</span>
            <span className="text-right">Duration</span>
            <span className="text-right pr-2">Actions</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-line">
            {queue.map((track, idx) => {
              const isPlaying = idx === currentIndex;

              return (
                <div
                  key={`${track.id}_${idx}`}
                  className={`group grid grid-cols-[44px_1fr_auto] sm:grid-cols-[36px_1fr_80px_100px] items-center px-3 sm:px-4 py-2 sm:py-2.5 transition-colors ${
                    isPlaying ? "bg-surface-raised" : "hover:bg-surface-raised"
                  }`}
                >
                  {/* Status / Index */}
                  <div className="relative flex h-11 w-11 items-center justify-center text-xs font-mono text-ink-subtle sm:h-8 sm:w-8">
                    {isPlaying ? (
                      <Volume2 className="w-4 h-4 text-accent animate-pulse" />
                    ) : (
                      <>
                        <span className="hidden sm:inline group-hover:opacity-0">{idx + 1}</span>
                        <button
                          onClick={() => onPlayTrack(track, idx)}
                          aria-label={`Play ${track.title}`}
                          className="absolute inset-0 flex items-center justify-center text-ink opacity-100 transition-opacity hover:text-accent cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                          title="Play Track"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Artwork & Info */}
                  <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                    <TrackArtwork
                      coverUrl={track.coverUrl}
                      trackId={track.id}
                      title={track.title}
                      className="w-10 h-10 rounded-lg"
                      iconClassName="w-4 h-4"
                    />
                    <div className="truncate">
                      <p
                        className={`text-xs font-semibold truncate transition-colors ${
                          isPlaying
                            ? "text-accent"
                            : "text-ink group-hover:text-accent"
                        }`}
                      >
                        {track.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-ink-muted truncate">
                          {track.artist}
                        </p>
                        {autoQueueReasons[track.id] && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/25 shrink-0">
                            <Sparkles className="w-2.5 h-2.5" />
                            {autoQueueReasons[track.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="hidden sm:block text-right text-xs font-mono tabular-nums text-ink-muted">
                    {formatTime(track.durationMs)}
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center justify-end gap-1">
                    {!isPlaying && (
                      <button
                        onClick={() => onPlayNext(track)}
                        aria-label={`Move ${track.title} to play next`}
                        title="Move to Play Next"
                        className="min-h-11 min-w-11 flex items-center justify-center rounded-control text-ink-subtle hover:text-accent transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveTrack(track.id)}
                      aria-label={`Remove ${track.title} from queue`}
                      title="Remove from Queue"
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-control text-ink-subtle hover:text-danger transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-line bg-surface-sunken space-y-2">
          <ListMusic className="w-8 h-8 text-ink-subtle mx-auto" />
          <p className="text-xs text-ink-muted font-medium">Your queue is empty</p>
          <p className="text-[11px] text-ink-subtle">
            Search for songs or artists in the Discover tab to add them to your queue.
          </p>
        </div>
      )}
    </div>
  );
}
