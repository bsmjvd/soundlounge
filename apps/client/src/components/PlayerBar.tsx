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
  Radio,
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
  const progressPercent = Math.min(100, Math.max(0, (positionMs / effectiveDuration) * 100));
  const isPlaying = status === "playing";

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#090e18]/95 backdrop-blur-md border-t border-[#152033] px-4 sm:px-8 h-20 flex items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="w-full flex items-center justify-between gap-4 sm:gap-8">
        {/* Left Side: Animated Equalizer + Square Album Art + Track Title & Artist */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 max-w-[220px] sm:max-w-[260px] flex-shrink-0">
          {/* Animated Cyan Equalizer */}
          <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
            <span
              className={`w-0.5 bg-[#00e5ff] rounded-full transition-all ${
                isPlaying ? "h-4 animate-[sound-wave-1_1s_ease-in-out_infinite]" : "h-1.5 opacity-40"
              }`}
            />
            <span
              className={`w-0.5 bg-[#00e5ff] rounded-full transition-all ${
                isPlaying ? "h-3 animate-[sound-wave-2_1.2s_ease-in-out_infinite]" : "h-3 opacity-40"
              }`}
            />
            <span
              className={`w-0.5 bg-[#00e5ff] rounded-full transition-all ${
                isPlaying ? "h-4.5 animate-[sound-wave-3_0.9s_ease-in-out_infinite]" : "h-2 opacity-40"
              }`}
            />
          </div>

          {/* Square Album Art */}
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 shadow-md">
            <TrackArtwork
              coverUrl={currentTrack?.coverUrl}
              trackId={currentTrack?.id}
              title={currentTrack?.title}
              className="w-full h-full object-cover"
              iconClassName="w-4 h-4 text-[#00e5ff]"
            />
          </div>

          {/* Track Title and Artist */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate hover:text-[#00e5ff] transition-colors leading-tight">
              {currentTrack ? currentTrack.title : "No track playing"}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {currentTrack ? currentTrack.artist : "Select a song"}
            </p>
          </div>
        </div>

        {/* Center: Transport Controls (Prev, Play, Next) + Timeline with Cyan Glow */}
        <div className="flex-1 max-w-2xl mx-auto flex flex-col items-center gap-1.5">
          {/* Transport Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevious}
              disabled={!currentTrack}
              aria-label="Previous track"
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!currentTrack}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-8 h-8 rounded-full bg-[#00e5ff] hover:bg-[#00d0e6] text-[#0a0e17] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)] disabled:opacity-30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!currentTrack}
              aria-label="Next track"
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline Progress Bar (Left Cyan Time, Glowing Cyan Bar, Right Gray Time) */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[11px] font-mono tabular-nums text-[#00e5ff] font-semibold w-9 text-right select-none">
              {formatTime(positionMs)}
            </span>

            <div className="relative flex-1 group flex items-center">
              {/* Slate Track */}
              <div className="relative w-full h-1 bg-slate-800 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
                {/* Glowing Cyan Fill */}
                <div
                  className="h-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff] transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Glowing Thumb on hover */}
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff] pointer-events-none transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
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
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>

            <span className="text-[11px] font-mono tabular-nums text-slate-400 w-9 select-none">
              {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>

        {/* Right Side: Shuffle + Volume + Fullscreen */}
        <div className="flex items-center justify-end gap-3 sm:gap-4 flex-shrink-0 min-w-0 max-w-[200px]">
          <button
            onClick={() => setIsShuffle((prev) => !prev)}
            title="Shuffle"
            className={`p-1.5 rounded transition-colors cursor-pointer hidden sm:block ${
              isShuffle ? "text-[#00e5ff]" : "text-slate-400 hover:text-white"
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          {/* Volume Control with cyan slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
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
              className="w-16 sm:w-20 h-1 bg-slate-800 accent-[#00e5ff] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Fullscreen Studio Trigger */}
          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              title="Fullscreen Studio"
              className="p-1.5 text-slate-400 hover:text-[#00e5ff] transition-colors cursor-pointer hidden md:block"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
