"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Radio,
  Sparkles,
  Music2,
  Maximize2,
  Wifi,
} from "lucide-react";
import type { Track } from "@soundlounge/shared";
import type { PlaybackMode } from "../lib/player";

interface NowPlayingHeroProps {
  currentTrack: Track | null;
  status: "idle" | "playing" | "paused" | "buffering";
  positionMs: number;
  durationMs: number;
  mode: PlaybackMode;
  pingMs: number;
  isLiked: boolean;
  onToggleLike: (track: Track) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious?: () => void;
  onSeek?: (posMs: number) => void;
  onOpenStudio?: () => void;
}

export function NowPlayingHero({
  currentTrack,
  status,
  positionMs,
  durationMs,
  mode,
  pingMs,
  isLiked,
  onToggleLike,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onOpenStudio,
}: NowPlayingHeroProps) {
  const [hoverSeekPos, setHoverSeekPos] = useState<number | null>(null);
  const [coverImgSrc, setCoverImgSrc] = useState<string | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const rawId = currentTrack?.id.startsWith("yt_")
    ? currentTrack.id.slice(3)
    : currentTrack?.id;

  // Resolve authentic front cover art with robust fallbacks
  useEffect(() => {
    if (!currentTrack) {
      setCoverImgSrc(null);
      return;
    }

    if (currentTrack.coverUrl?.includes("googleusercontent.com")) {
      setCoverImgSrc(currentTrack.coverUrl.replace(/=w\d+-h\d+[^"]*/, "=w800-h800-l90-rj"));
    } else if (currentTrack.coverUrl) {
      setCoverImgSrc(currentTrack.coverUrl);
    } else if (rawId && /^[A-Za-z0-9_-]{11}$/.test(rawId)) {
      setCoverImgSrc(`https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`);
    } else {
      setCoverImgSrc(null);
    }
  }, [currentTrack?.id, currentTrack?.coverUrl, rawId]);

  const handleImageError = () => {
    if (rawId && /^[A-Za-z0-9_-]{11}$/.test(rawId)) {
      if (coverImgSrc?.includes("maxresdefault.jpg")) {
        setCoverImgSrc(`https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`);
      } else if (coverImgSrc?.includes("hqdefault.jpg")) {
        setCoverImgSrc(`https://i.ytimg.com/vi/${rawId}/mqdefault.jpg`);
      } else {
        setCoverImgSrc(null);
      }
    } else {
      setCoverImgSrc(null);
    }
  };

  if (!currentTrack) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-[#0f1117] border border-[#1a1d26] p-8 sm:p-10 shadow-xl transition-all">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Soundlounge Studio
            </h2>
            <p className="text-sm text-[#949bb0] max-w-lg leading-relaxed">
              Search for any song or artist in the search bar above to stream solo or in sub-30ms sync with friends.
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[#171a23] border border-[#232736] flex items-center justify-center text-sky-400 shadow-lg flex-shrink-0">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const isPlaying = status === "playing";
  const effectiveDuration = durationMs || currentTrack.durationMs || 1;
  const progressPercent = Math.min(100, Math.max(0, (positionMs / effectiveDuration) * 100));

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !onSeek) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(Math.floor(percent * effectiveDuration));
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverSeekPos(Math.floor(percent * effectiveDuration));
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0d0f15] border border-[#191d28] p-6 sm:p-8 shadow-2xl transition-all duration-300">
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
        {/* Physical Album Cover + Spinning Vinyl Disc */}
        <div className="relative flex-shrink-0 group">
          {/* Vinyl Disc that slides out and spins during playback */}
          <div
            className={`absolute top-0 right-[-24px] sm:right-[-32px] w-36 h-36 sm:w-44 sm:h-44 rounded-full vinyl-grooves border-2 border-white/10 flex items-center justify-center transition-transform duration-700 pointer-events-none ${
              isPlaying
                ? "translate-x-5 sm:translate-x-7 animate-[spin_12s_linear_infinite]"
                : "translate-x-0 opacity-60"
            }`}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-600/60 border border-white/20 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/40" />
            </div>
          </div>

          {/* Front Album Jacket Cover */}
          <div
            className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-[#131722] border border-white/15 shadow-2xl flex-shrink-0 transition-all duration-300 ${
              isPlaying ? "shadow-indigo-500/25 ring-2 ring-indigo-500/30" : "shadow-black/80"
            }`}
          >
            {coverImgSrc ? (
              <img
                src={coverImgSrc}
                alt={currentTrack.title}
                onError={handleImageError}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 bg-[#161922]">
                <Music2 className="w-12 h-12" />
              </div>
            )}

            {/* Quick Play/Pause Center Overlay */}
            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pause track" : "Play track"}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform">
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Track Metadata & Controls */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4 text-center md:text-left w-full">
          <div>
            {/* Status & Equalizer Line */}
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              {mode === "synced" ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-sky-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  Sync Lounge · {pingMs}ms
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  Solo Stream
                </span>
              )}

              {/* Dynamic 5-bar Waveform Equalizer */}
              <div className="flex items-end gap-1 h-4 text-emerald-400">
                <span className={`w-1 bg-emerald-400 rounded-full ${isPlaying ? "animate-eq-1" : "h-1"}`} />
                <span className={`w-1 bg-emerald-400 rounded-full ${isPlaying ? "animate-eq-2" : "h-1.5"}`} />
                <span className={`w-1 bg-emerald-400 rounded-full ${isPlaying ? "animate-eq-3" : "h-2"}`} />
                <span className={`w-1 bg-emerald-400 rounded-full ${isPlaying ? "animate-eq-4" : "h-1"}`} />
                <span className={`w-1 bg-emerald-400 rounded-full ${isPlaying ? "animate-eq-5" : "h-1.5"}`} />
              </div>
            </div>

            {/* Song Title (Crisp, High Contrast, Non-Slop) */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight line-clamp-1">
              {currentTrack.title}
            </h1>
            <p className="text-sm sm:text-base text-[#949bb0] font-medium line-clamp-1 mt-1">
              {currentTrack.artist}
            </p>
          </div>

          {/* Interactive Timeline Scrubber */}
          <div className="space-y-1.5">
            <div
              ref={progressBarRef}
              onClick={handleProgressBarClick}
              onMouseMove={handleProgressBarMouseMove}
              onMouseLeave={() => setHoverSeekPos(null)}
              className="relative w-full bg-[#1b1f2b] hover:bg-[#252a3a] h-2 rounded-full cursor-pointer overflow-hidden transition-all group"
            >
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
              {hoverSeekPos !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
                  style={{ left: `${(hoverSeekPos / effectiveDuration) * 100}%` }}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[#6f778d]">
              <span>{formatTime(positionMs)}</span>
              {hoverSeekPos !== null ? (
                <span className="text-sky-300 font-semibold">Seek: {formatTime(hoverSeekPos)}</span>
              ) : (
                <span>{formatTime(effectiveDuration)}</span>
              )}
            </div>
          </div>

          {/* Tactile Action Transport Controls */}
          <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
            {onPrevious && (
              <button
                onClick={onPrevious}
                aria-label="Previous track"
                className="p-2.5 rounded-xl bg-[#151822] hover:bg-[#1e2230] text-gray-300 hover:text-white transition-all cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pause track" : "Play track"}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-7 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" /> Play
                </>
              )}
            </button>

            <button
              onClick={onNext}
              aria-label="Next track"
              className="flex items-center gap-1.5 bg-[#151822] hover:bg-[#1e2230] text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" /> Next
            </button>

            <button
              onClick={() => onToggleLike(currentTrack)}
              aria-label={isLiked ? "Unlike track" : "Like track"}
              className={`p-2.5 rounded-xl bg-[#151822] hover:bg-[#1e2230] transition-all cursor-pointer ${
                isLiked ? "text-rose-400" : "text-gray-400 hover:text-white"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </button>

            {onOpenStudio && (
              <button
                onClick={onOpenStudio}
                title="Enter Studio Mode (F)"
                aria-label="Enter Studio Mode"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#151822] hover:bg-[#1e2230] text-sky-400 hover:text-white transition-all cursor-pointer ml-auto"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="text-xs font-semibold hidden sm:inline">Studio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
