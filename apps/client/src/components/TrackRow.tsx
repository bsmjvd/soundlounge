"use client";

import React from "react";
import { Play, Plus, ArrowRight, Heart } from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { TrackArtwork } from "./TrackArtwork";

export interface TrackRowProps {
  track: Track;
  index: number;
  isCurrent: boolean;
  liked: boolean;
  onPlay: () => void;
  onLike: () => void;
  onPlayNext: () => void;
  onAddToQueue: () => void;
}

// Shared tracklist row: active-track equalizer, hover play, like / play-next / queue actions
export function TrackRow({
  track,
  index,
  isCurrent,
  liked,
  onPlay,
  onLike,
  onPlayNext,
  onAddToQueue,
}: TrackRowProps) {
  return (
    <div
      className={`group grid grid-cols-[44px_1fr_auto] sm:grid-cols-[36px_1fr_90px_110px] items-center px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-colors ${
        isCurrent ? "bg-surface-raised" : "hover:bg-surface-raised"
      }`}
    >
      {/* Index / Play on Hover */}
      <div className="relative flex h-11 w-11 items-center justify-center text-xs font-mono text-ink-subtle sm:h-8 sm:w-8">
        {isCurrent ? (
          <span className="text-accent inline-flex items-end gap-0.5 h-3.5">
            <span className="w-0.5 h-2 origin-bottom bg-accent animate-sound-wave-1" />
            <span className="w-0.5 h-3.5 origin-bottom bg-accent animate-sound-wave-2" />
            <span className="w-0.5 h-2.5 origin-bottom bg-accent animate-sound-wave-3" />
          </span>
        ) : (
          <>
            <span className="hidden sm:inline group-hover:opacity-0">{index + 1}</span>
            <button
              onClick={onPlay}
              aria-label={`Play ${track.title}`}
              className="absolute inset-0 flex items-center justify-center text-accent opacity-100 transition-opacity hover:scale-110 cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              title="Play Track"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </>
        )}
      </div>

      {/* Artwork + Details */}
      <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
        <TrackArtwork
          coverUrl={track.coverUrl}
          trackId={track.id}
          title={track.title}
          className="w-10 h-10 rounded-lg flex-shrink-0"
          iconClassName="w-4 h-4 text-accent"
        />
        <div className="truncate">
          <p
            className={`text-xs font-semibold truncate transition-colors ${
              isCurrent ? "text-accent font-bold" : "text-ink group-hover:text-accent"
            }`}
          >
            {track.title}
          </p>
          <p className="text-[11px] text-ink-subtle truncate">{track.artist}</p>
        </div>
      </div>

      {/* Duration */}
      <div className="hidden sm:block text-right text-xs font-mono tabular-nums text-ink-subtle">
        {`${Math.floor(track.durationMs / 60000)}:${String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2, "0")}`}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={onLike}
          aria-label={liked ? `Unlike ${track.title}` : `Like ${track.title}`}
          title={liked ? "Liked" : "Like Song"}
          className={`min-h-11 min-w-11 flex items-center justify-center rounded-control transition-colors cursor-pointer ${
            liked ? "text-like" : "text-ink-subtle hover:text-ink"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
        </button>

        <button
          onClick={onPlayNext}
          aria-label={`Play ${track.title} next`}
          title="Play Next"
          className="min-h-11 min-w-11 flex items-center justify-center rounded-control text-ink-subtle hover:text-accent transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onAddToQueue}
          aria-label={`Add ${track.title} to queue`}
          title="Add to Queue"
          className="min-h-11 min-w-11 flex items-center justify-center rounded-control text-ink-subtle hover:text-ink transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
