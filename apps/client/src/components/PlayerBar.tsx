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
  Shuffle,
  Repeat,
  Maximize2,
  ListPlus,
  UserPlus,
} from "lucide-react";
import type { Track } from "@soundlounge/shared";
import type { PlaybackMode } from "../lib/player";
import { TrackArtwork } from "./TrackArtwork";

interface PlayerBarProps {
  currentTrack: Track | null;
  status: "idle" | "playing" | "paused" | "buffering";
  positionMs: number;
  durationMs: number;
  volume: number;
  mode: PlaybackMode;
  pingMs: number;
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
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const toggleMute = () => {
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
  const remainingMs = Math.max(0, effectiveDuration - positionMs);
  const progressPercent = Math.min(100, Math.max(0, (positionMs / effectiveDuration) * 100));

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#081014] border-t border-[#15232c] px-4 sm:px-6 h-[76px] flex items-center shadow-2xl">
      <div className="w-full flex items-center justify-between gap-3 sm:gap-6">
        {/* Left Side: Fullscreen, Transport Controls (Prev, Play, Next, Shuffle, Repeat) & Volume */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Fullscreen Studio Trigger */}
          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              title="Studio Fullscreen (F)"
              className="p-1.5 text-[#6c808e] hover:text-[#00e5c9] transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Transport Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onPrevious}
              disabled={!currentTrack}
              aria-label="Previous track"
              className="p-1.5 text-[#738795] hover:text-white disabled:opacity-30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!currentTrack}
              aria-label={status === "playing" ? "Pause" : "Play"}
              className="w-9 h-9 rounded-full bg-[#00e5c9] hover:bg-[#1cebd2] text-[#081014] flex items-center justify-center shadow-lg shadow-[#00e5c9]/30 disabled:opacity-30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {status === "playing" ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!currentTrack}
              aria-label="Next track"
              className="p-1.5 text-[#738795] hover:text-white disabled:opacity-30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsShuffle((prev) => !prev)}
              title="Shuffle"
              className={`p-1.5 rounded transition-colors cursor-pointer hidden sm:block ${
                isShuffle ? "text-[#00e5c9]" : "text-[#586d7a] hover:text-white"
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsRepeat((prev) => !prev)}
              title="Repeat"
              className={`p-1.5 rounded transition-colors cursor-pointer hidden sm:block ${
                isRepeat ? "text-[#00e5c9]" : "text-[#586d7a] hover:text-white"
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#16252e]">
            <button
              onClick={toggleMute}
              className="p-1 text-[#6c808e] hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#f43f5e]" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setIsMuted(false);
                onVolumeChange(Number(e.target.value));
              }}
              className="w-16 h-1 bg-[#192b35] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Center: Timeline Scrubber with Cyan Glow */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-6 flex items-center gap-3">
          <span className="text-[11px] font-mono tabular-nums text-[#728593] w-9 text-right select-none">
            {formatTime(positionMs)}
          </span>

          <div className="relative flex-1 group flex items-center">
            {/* Custom glowing cyan progress track */}
            <div className="relative w-full h-1 bg-[#162731] rounded-full overflow-hidden group-hover:h-1.5 transition-all">
              <div
                className="h-full bg-[#00e5c9] shadow-sm shadow-[#00e5c9]/60 transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Hidden native input overlaid for clean scrubbing */}
            <input
              type="range"
              min="0"
              max={effectiveDuration}
              value={positionMs}
              onChange={(e) => onSeek(Number(e.target.value))}
              disabled={!currentTrack}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          <span className="text-[11px] font-mono tabular-nums text-[#728593] w-10 select-none">
            -{formatTime(remainingMs)}
          </span>
        </div>

        {/* Right Side: Track Metadata, Add to Playlist, Like, & Artwork */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0 min-w-0 max-w-[280px]">
          {/* Quick Playlist & Follow Actions */}
          <div className="hidden sm:flex items-center gap-1">
            {onOpenQueue && (
              <button
                onClick={onOpenQueue}
                title="Playing Queue"
                className="p-1.5 text-[#5c707d] hover:text-white transition-colors cursor-pointer"
              >
                <ListPlus className="w-4 h-4" />
              </button>
            )}

            {currentTrack && (
              <button
                onClick={() => onToggleLike(currentTrack)}
                title={isLiked ? "Unlike" : "Like"}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  isLiked ? "text-[#f43f5e]" : "text-[#5c707d] hover:text-white"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              </button>
            )}
          </div>

          {/* Title & Artist info */}
          {currentTrack ? (
            <div className="text-right truncate min-w-0">
              <p className="text-xs font-semibold text-white truncate hover:text-[#00e5c9] transition-colors">
                {currentTrack.title}
              </p>
              <p className="text-[11px] text-[#6e828f] truncate">{currentTrack.artist}</p>
            </div>
          ) : (
            <div className="text-xs text-[#5c707d] truncate">No track selected</div>
          )}

          {/* Album Jacket Cover Thumbnail */}
          <TrackArtwork
            coverUrl={currentTrack?.coverUrl}
            trackId={currentTrack?.id}
            title={currentTrack?.title}
            className="w-11 h-11 rounded-xl border border-[#1d313c] shadow-lg flex-shrink-0"
            iconClassName="w-5 h-5 text-[#00e5c9]"
          />
        </div>
      </div>
    </footer>
  );
}
