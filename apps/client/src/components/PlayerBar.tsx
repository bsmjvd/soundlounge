"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Maximize2,
  ListMusic,
  Loader2,
} from "lucide-react";
import type { Track } from "@soundlounge/shared";
import type { PlaybackMode } from "../lib/player";
import { TrackArtwork } from "./TrackArtwork";
import { hapticLight, hapticMedium } from "../lib/haptics";

interface PlayerBarProps {
  currentTrack: Track | null;
  status: "idle" | "playing" | "paused" | "buffering";
  positionMs: number;
  durationMs: number;
  volume: number;
  mode: PlaybackMode;
  pingMs: number;
  queueCount?: number;
  bufferedPercent?: number;
  isLiked: boolean;
  onToggleLike: (track: Track) => void;
  onTogglePlay: () => void;
  onSeek: (positionMs: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  onOpenStudio?: () => void;
  onOpenQueue?: () => void;
}

export function PlayerBar({
  currentTrack,
  status,
  positionMs,
  durationMs,
  volume,
  mode,
  pingMs,
  queueCount,
  bufferedPercent = 65,
  isLiked,
  onToggleLike,
  onTogglePlay,
  onSeek,
  onNext,
  onPrevious,
  onVolumeChange,
  onOpenStudio,
  onOpenQueue,
}: PlayerBarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [hoverSeekPos, setHoverSeekPos] = useState<number | null>(null);
  const [hoverSeekLeft, setHoverSeekLeft] = useState<number>(0);
  const trackBarRef = React.useRef<HTMLDivElement>(null);
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    // A scrub, tap, or volume drag must not turn into a swipe-to-skip gesture.
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, button, a, select, textarea, [role='slider'], [role='button']")) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    // Horizontal swipe on mini player (Apple Music iOS gesture)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swiped Left -> Skip to Next Track
        hapticMedium();
        onNext();
      } else {
        // Swiped Right -> Skip to Previous Track
        hapticMedium();
        onPrevious();
      }
    } else if (deltaY > 40 && Math.abs(deltaY) > Math.abs(deltaX)) {
      // Swiped Up -> Open Studio Immersion
      hapticLight();
      onOpenStudio?.();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const toggleMute = () => {
    hapticLight();
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(volume || 0.8);
    } else {
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const effectiveDuration = durationMs || currentTrack?.durationMs || 1;
  const progressPercent = Math.min(100, Math.max(0, (positionMs / effectiveDuration) * 100));
  const isPlaying = status === "playing";
  const isBuffering = status === "buffering";

  if (!currentTrack) return null;

  return (
    <footer
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="animate-player-in fixed bottom-[max(0.6rem,env(safe-area-inset-bottom))] left-2.5 right-2.5 sm:left-0 sm:right-0 sm:bottom-0 z-50 bg-canvas/95 backdrop-blur-xl border border-ink/10 sm:border-x-0 sm:border-b-0 sm:border-t sm:border-line rounded-2xl sm:rounded-none px-3 sm:px-8 h-18 sm:h-20 flex items-center shadow-[0_12px_36px_rgba(0,0,0,0.7)] sm:shadow-[0_-10px_30px_rgba(0,0,0,0.5)] select-none transition"
    >
      {/* Mobile Top Edge Timeline Scrubber (Visible only on <sm screens) */}
      <div className="sm:hidden absolute top-0 left-0 right-0 h-1.5 bg-surface-raised/90 z-20 rounded-full focus-within:ring-2 focus-within:ring-accent">
        <div
          className="h-full w-full origin-left bg-accent shadow-glow-soft transition-transform duration-100"
          style={{ transform: `scaleX(${progressPercent / 100})` }}
        />
        <input
          type="range"
          min="0"
          max={effectiveDuration}
          step={1000}
          value={positionMs}
          onChange={(e) => onSeek(Number(e.target.value))}
          disabled={!currentTrack}
          aria-label="Seek"
          aria-valuetext={formatTime(positionMs)}
          className="absolute inset-x-0 top-0 h-6 w-full cursor-pointer opacity-0"
        />
      </div>

      <div className="w-full flex items-center justify-between gap-2 sm:gap-8">
        {/* Left Side: Animated Equalizer + Square Album Art + Track Title & Artist */}
        <div
          onClick={onOpenStudio}
          title="Tap to open Studio Mode"
          className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 sm:flex-initial sm:max-w-[260px] flex-shrink cursor-pointer sm:cursor-default"
        >
          {/* Animated Cyan Equalizer */}
          <div className="hidden xs:flex items-end gap-0.5 h-4 flex-shrink-0">
            <span
              className={`w-0.5 origin-bottom bg-accent rounded-full transition ${
                isPlaying ? "h-4 animate-sound-wave-1" : "h-1.5 opacity-40"
              }`}
            />
            <span
              className={`w-0.5 origin-bottom bg-accent rounded-full transition ${
                isPlaying ? "h-3 animate-sound-wave-2" : "h-3 opacity-40"
              }`}
            />
            <span
              className={`w-0.5 origin-bottom bg-accent rounded-full transition ${
                isPlaying ? "h-4.5 animate-sound-wave-3" : "h-2 opacity-40"
              }`}
            />
          </div>

          {/* Square Album Art */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-surface-raised flex-shrink-0 shadow-md">
            <TrackArtwork
              coverUrl={currentTrack?.coverUrl}
              trackId={currentTrack?.id}
              title={currentTrack?.title}
              className="w-full h-full object-cover"
              iconClassName="w-4 h-4 text-accent"
            />
          </div>

          {/* Track Title and Artist */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-ink truncate hover:text-accent transition-colors leading-tight">
              {currentTrack ? currentTrack.title : "No track playing"}
            </p>
            <p className="text-[11px] text-ink-muted truncate mt-0.5">
              {currentTrack ? currentTrack.artist : "Select a song"}
            </p>
          </div>
        </div>

        {/* Center: Desktop Transport Controls + Timeline with Cyan Glow (Hidden on Mobile) */}
        <div className="hidden sm:flex flex-1 max-w-2xl mx-auto flex-col items-center gap-1.5">
          {/* Transport Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevious}
              disabled={!currentTrack}
              aria-label="Previous track"
              className="p-1.5 text-ink-muted hover:text-ink disabled:opacity-30 transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!currentTrack}
              aria-label={isBuffering ? "Buffering" : isPlaying ? "Pause" : "Play"}
              aria-busy={isBuffering}
              className="w-8 h-8 rounded-full bg-accent hover:bg-accent-strong text-accent-foreground flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)] disabled:opacity-30 transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span
                key={isBuffering ? "buffering" : isPlaying ? "pause" : "play"}
                className="animate-icon-swap flex items-center justify-center"
              >
                {isBuffering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </span>
            </button>

            <button
              onClick={onNext}
              disabled={!currentTrack}
              aria-label="Next track"
              className="p-1.5 text-ink-muted hover:text-ink disabled:opacity-30 transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline Progress Bar (Left Cyan Time, Dual-Layer Buffered Scrubber, Right Gray Time) */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[11px] font-mono tabular-nums text-accent font-semibold w-9 text-right select-none">
              {formatTime(positionMs)}
            </span>

            <div
              ref={trackBarRef}
              onMouseMove={(e) => {
                if (!trackBarRef.current) return;
                const rect = trackBarRef.current.getBoundingClientRect();
                const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const pct = offsetX / rect.width;
                setHoverSeekPos(Math.floor(pct * effectiveDuration));
                setHoverSeekLeft(offsetX);
              }}
              onMouseLeave={() => setHoverSeekPos(null)}
              className="relative flex-1 group flex items-center py-2 cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-canvas"
            >
              {/* Floating Seek Tooltip on Hover */}
              {hoverSeekPos !== null && (
                <div
                  className="absolute -top-7 transform -translate-x-1/2 bg-surface-raised border border-accent/40 text-ink text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none z-30 transition-opacity"
                  style={{ left: `${hoverSeekLeft}px` }}
                >
                  {formatTime(hoverSeekPos)}
                </div>
              )}

              {/* Base Track (Dark Slate) */}
              <div className="relative w-full h-1 bg-surface-raised rounded-full overflow-hidden group-hover:h-1.5 transition">
                {/* Secondary Layer: Loaded Audio Buffer */}
                <div
                  className="absolute inset-y-0 left-0 bg-surface-overlay/60 rounded-full transition duration-300 pointer-events-none"
                  style={{ width: `${Math.min(100, Math.max(progressPercent, bufferedPercent))}%` }}
                />

                {/* Primary Layer: Glowing Cyan Playhead */}
                <div
                  className="relative h-full w-full origin-left bg-accent shadow-glow-soft transition-transform duration-100 rounded-full"
                  style={{ transform: `scaleX(${progressPercent / 100})` }}
                />
              </div>

              {/* Glowing Thumb on hover */}
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-accent shadow-glow-soft pointer-events-none transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercent}%` }}
              />

              {/* Native Input for Scrubbing */}
              <input
                type="range"
                min="0"
                max={effectiveDuration}
                value={positionMs}
                onChange={(e) => onSeek(Number(e.target.value))}
                disabled={!currentTrack}
                aria-label="Seek"
                aria-valuetext={formatTime(positionMs)}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>

            <span className="text-[11px] font-mono tabular-nums text-ink-muted w-9 select-none">
              {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>

        {/* Mobile Compact Controls: Thumb-friendly 44px tap targets */}
        <div className="flex sm:hidden items-center gap-1 flex-shrink-0">
          {currentTrack && (
            <button
              onClick={() => {
                hapticLight();
                onToggleLike(currentTrack);
              }}
              aria-label={isLiked ? "Unlike song" : "Like song"}
              className="w-11 h-11 flex items-center justify-center text-ink-muted hover:text-like active:scale-90 transition cursor-pointer"
            >
              <Heart className={`w-4.5 h-4.5 ${isLiked ? "fill-like text-like" : ""}`} />
            </button>
          )}

          <button
            onClick={() => {
              hapticMedium();
              onTogglePlay();
            }}
            disabled={!currentTrack}
            aria-label={isBuffering ? "Buffering" : isPlaying ? "Pause" : "Play"}
            aria-busy={isBuffering}
            className="w-11 h-11 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.4)] disabled:opacity-30 active:scale-90 transition cursor-pointer"
          >
            <span
              key={isBuffering ? "buffering" : isPlaying ? "pause" : "play"}
              className="animate-icon-swap flex items-center justify-center"
            >
              {isBuffering ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4.5 h-4.5 fill-current" />
              ) : (
                <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
              )}
            </span>
          </button>

          <button
            onClick={() => {
              hapticMedium();
              onNext();
            }}
            disabled={!currentTrack}
            aria-label="Next song"
            className="w-11 h-11 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-30 active:scale-90 transition cursor-pointer"
          >
            <SkipForward className="w-4.5 h-4.5" />
          </button>

          {onOpenStudio && (
            <button
              onClick={() => {
                hapticLight();
                onOpenStudio();
              }}
              aria-label="Open Studio"
              className="w-11 h-11 flex items-center justify-center text-ink-muted hover:text-accent active:scale-90 transition cursor-pointer"
            >
              <Maximize2 className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {/* Right Side: Desktop Queue + Volume + Fullscreen */}
        <div className="hidden sm:flex items-center justify-end gap-3 sm:gap-4 flex-shrink-0 min-w-0 max-w-[240px]">
          {/* Queue Button */}
          {onOpenQueue && (
            <button
              onClick={onOpenQueue}
              title="Playing Queue"
              aria-label={`Playing queue${queueCount ? `, ${queueCount} tracks` : ""}`}
              className="relative p-1.5 text-ink-muted hover:text-accent transition-colors cursor-pointer"
            >
              <ListMusic className="w-4 h-4" />
              {queueCount !== undefined && queueCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[11px] font-bold bg-accent text-accent-foreground px-1 rounded-full min-w-[14px] text-center leading-tight">
                  {queueCount}
                </span>
              )}
            </button>
          )}

          {/* Volume Control with cyan slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
              className="p-1 text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-ink-muted" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              aria-label="Volume"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setIsMuted(false);
                onVolumeChange(Number(e.target.value));
              }}
              className="w-16 sm:w-20 h-1 bg-surface-raised accent-accent rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Fullscreen Studio Trigger */}
          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              title="Fullscreen Studio"
              aria-label="Open fullscreen studio"
              className="p-1.5 text-ink-muted hover:text-accent transition-colors cursor-pointer hidden md:block"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
