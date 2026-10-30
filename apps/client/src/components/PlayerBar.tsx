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
  Youtube,
  Music,
  UploadCloud,
  Radio,
} from "lucide-react";
import type { Track } from "@soundlounge/shared";
import type { PlaybackMode } from "../lib/player";

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
}: PlayerBarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const effectiveDuration = durationMs || currentTrack?.durationMs || 1;
  const progressPercent = Math.min(100, Math.max(0, (positionMs / effectiveDuration) * 100));

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume || 1.0);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case "youtube":
        return (
          <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
            <Youtube className="w-2.5 h-2.5" /> YouTube
          </span>
        );
      case "soundcloud":
        return (
          <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
            <Music className="w-2.5 h-2.5" /> SoundCloud
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded">
            <UploadCloud className="w-2.5 h-2.5" /> Direct R2
          </span>
        );
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b0d13]/95 backdrop-blur-lg border-t border-[#1f2638] px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Track Info */}
        <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
          {currentTrack ? (
            <>
              <div className="w-12 h-12 rounded-xl bg-[#131722] border border-[#1f2638] flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                {currentTrack.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Radio className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentTrack.title}
                  </p>
                  {getSourceBadge(currentTrack.source)}
                </div>
                <p className="text-[11px] text-gray-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
              <button
                onClick={() => onToggleLike(currentTrack)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLiked ? "text-rose-500" : "text-gray-500 hover:text-white"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              </button>
            </>
          ) : (
            <div className="text-xs text-gray-500">No track selected</div>
          )}
        </div>

        {/* Center Controls & Timeline */}
        <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevious}
              disabled={!currentTrack}
              className="p-1.5 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={onTogglePlay}
              disabled={!currentTrack}
              className="w-9 h-9 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center shadow-lg shadow-white/10 disabled:opacity-40 transition-all hover:scale-105"
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
              className="p-1.5 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
              {formatTime(positionMs)}
            </span>
            <div className="relative flex-1 group flex items-center">
              <input
                type="range"
                min="0"
                max={effectiveDuration}
                value={positionMs}
                onChange={(e) => onSeek(Number(e.target.value))}
                disabled={!currentTrack}
                className="w-full h-1 bg-[#1f2638] rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all"
              />
            </div>
            <span className="text-[10px] font-mono text-gray-400 w-8">
              {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>

        {/* Right Volume & Mode Status */}
        <div className="flex items-center justify-end gap-4 w-1/4 min-w-[200px]">
          <div className="hidden lg:flex items-center gap-1.5">
            {mode === "synced" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                Synced · {pingMs}ms
              </span>
            ) : (
              <span className="text-[11px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                Solo Stream
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
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
              className="w-16 sm:w-24 h-1 bg-[#1f2638] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
