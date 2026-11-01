"use client";

import React, { useState, useEffect } from "react";
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
  Maximize2,
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
  onOpenStudio?: () => void;
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
}: PlayerBarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [barImgSrc, setBarImgSrc] = useState<string | null>(null);

  const rawId = currentTrack?.id.startsWith("yt_")
    ? currentTrack.id.slice(3)
    : currentTrack?.id;

  useEffect(() => {
    if (!currentTrack) {
      setBarImgSrc(null);
      return;
    }
    if (currentTrack.coverUrl?.includes("googleusercontent.com")) {
      setBarImgSrc(currentTrack.coverUrl.replace(/=w\d+-h\d+[^"]*/, "=w240-h240-l90-rj"));
    } else if (currentTrack.coverUrl) {
      setBarImgSrc(currentTrack.coverUrl);
    } else if (rawId && /^[A-Za-z0-9_-]{11}$/.test(rawId)) {
      setBarImgSrc(`https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`);
    } else {
      setBarImgSrc(null);
    }
  }, [currentTrack?.id, currentTrack?.coverUrl, rawId]);

  const handleBarImgError = () => {
    if (rawId && /^[A-Za-z0-9_-]{11}$/.test(rawId)) {
      if (barImgSrc?.includes("maxresdefault.jpg")) {
        setBarImgSrc(`https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`);
      } else if (barImgSrc?.includes("hqdefault.jpg")) {
        setBarImgSrc(`https://i.ytimg.com/vi/${rawId}/mqdefault.jpg`);
      } else {
        setBarImgSrc(null);
      }
    } else {
      setBarImgSrc(null);
    }
  };

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

  const getSourceBadge = (source: Track["source"]) => {
    switch (source) {
      case "youtube":
        return (
          <span className="flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded">
            <Youtube className="w-2.5 h-2.5" /> YouTube
          </span>
        );
      case "soundcloud":
        return (
          <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
            <Music className="w-2.5 h-2.5" /> SoundCloud
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded">
            <UploadCloud className="w-2.5 h-2.5" /> Direct R2
          </span>
        );
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#090b10] border-t border-[#151821] px-6 h-[76px] flex items-center shadow-2xl">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left Track Info */}
        <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
          {currentTrack ? (
            <>
              <div className="w-12 h-12 rounded-xl bg-[#131620] border border-white/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                {barImgSrc ? (
                  <img
                    src={barImgSrc}
                    alt={currentTrack.title}
                    onError={handleBarImgError}
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
                <p className="text-[11px] text-[#8b92a5] truncate">
                  {currentTrack.artist}
                </p>
              </div>
              <button
                onClick={() => onToggleLike(currentTrack)}
                aria-label={isLiked ? "Unlike track" : "Like track"}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLiked ? "text-rose-500" : "text-[#62697b] hover:text-white"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              </button>
            </>
          ) : (
            <div className="text-xs text-[#62697b]">No track selected</div>
          )}
        </div>

        {/* Center Controls & Timeline */}
        <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
          <div className="flex items-center gap-5">
            <button
              onClick={onPrevious}
              disabled={!currentTrack}
              aria-label="Previous track"
              className="p-1.5 text-gray-400 hover:text-white disabled:opacity-40 transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={onTogglePlay}
              disabled={!currentTrack}
              aria-label={status === "playing" ? "Pause" : "Play"}
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-black flex items-center justify-center shadow-lg shadow-white/20 disabled:opacity-40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
              className="p-1.5 text-gray-400 hover:text-white disabled:opacity-40 transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2.5">
            <span className="text-[10px] font-mono tabular-nums text-[#8b92a5] w-8 text-right">
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
                className="w-full h-1 bg-[#1a1e29] rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all"
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-[#8b92a5] w-8">
              {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>

        {/* Right Volume, Mode Status & Studio Button */}
        <div className="flex items-center justify-end gap-3.5 w-1/4 min-w-[200px]">
          {mode === "synced" ? (
            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Synced · {pingMs}ms
            </span>
          ) : (
            <span className="hidden lg:inline-flex text-xs text-emerald-400 font-medium">
              Solo Stream
            </span>
          )}

          {onOpenStudio && currentTrack && (
            <button
              onClick={onOpenStudio}
              title="Fullscreen Studio Mode (F)"
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
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
              className="w-16 sm:w-24 h-1 bg-[#1a1e29] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
