"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Radio,
  Sparkles,
  Music2,
  Volume2,
  VolumeX,
  Disc3,
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
}: NowPlayingHeroProps) {
  const [hoverSeekPos, setHoverSeekPos] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/40 via-[#121622]/60 to-sky-950/30 border border-white/10 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl transition-all">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Soundlounge Studio
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready for Synchronized Sound
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-lg leading-relaxed">
              Search for any song or artist above to start streaming in sub-30ms sync with your friends, or enjoy instant solo listening.
            </p>
          </div>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl shadow-indigo-600/30 flex-shrink-0 animate-pulse">
            <Radio className="w-10 h-10" />
          </div>
        </div>
      </div>
    );
  }

  const isPlaying = status === "playing";
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const rawId = currentTrack.id.startsWith("yt_") ? currentTrack.id.slice(3) : currentTrack.id;
  const squareCover = currentTrack.coverUrl?.includes("googleusercontent.com")
    ? currentTrack.coverUrl.replace(/=w\d+-h\d+[^"]*/, "=w800-h800-l90-rj")
    : (/^[A-Za-z0-9_-]{11}$/.test(rawId)
        ? `https://i.ytimg.com/vi/${rawId}/maxresdefault.jpg`
        : currentTrack.coverUrl?.replace("hqdefault.jpg", "maxresdefault.jpg") || currentTrack.coverUrl);

  const highResCover =
    /^[A-Za-z0-9_-]{11}$/.test(rawId)
      ? `https://i.ytimg.com/vi/${rawId}/maxresdefault.jpg`
      : currentTrack.coverUrl?.replace("hqdefault.jpg", "maxresdefault.jpg") || currentTrack.coverUrl;

  const effectiveDuration = durationMs || currentTrack.durationMs || 1;
  const progressPercent = Math.min(100, Math.max(0, (positionMs / effectiveDuration) * 100));

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
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl transition-all duration-500">
      {/* Subtle Inner Glow from Track Artwork */}
      {highResCover && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 filter blur-3xl scale-125 pointer-events-none transition-all duration-1000"
          style={{ backgroundImage: `url(${highResCover})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/30 pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
        {/* Album Artwork + Physical Vinyl LP Peek Effect */}
        <div className="relative flex-shrink-0 group">
          {/* Spinning Vinyl Record behind album cover */}
          <div
            className={`absolute top-0 right-[-24px] sm:right-[-32px] w-36 h-36 sm:w-44 sm:h-44 rounded-full vinyl-grooves border-2 border-white/10 flex items-center justify-center transition-transform duration-700 pointer-events-none ${
              isPlaying
                ? "translate-x-4 sm:translate-x-6 animate-[spin_12s_linear_infinite]"
                : "translate-x-0 opacity-60"
            }`}
          >
            {/* Vinyl Center Hole & Label */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-600/60 border border-white/20 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/40" />
            </div>
          </div>

          {/* Front Album Jacket Cover */}
          <div
            className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-black/60 border border-white/20 shadow-2xl flex-shrink-0 transition-all duration-500 ${
              isPlaying
                ? "shadow-[0_16px_50px_rgba(99,102,241,0.35)] ring-2 ring-indigo-500/40"
                : "shadow-black/90"
            }`}
          >
            {squareCover ? (
              <img
                src={squareCover}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <Music2 className="w-12 h-12" />
              </div>
            )}

            {/* Quick Play/Pause Center Overlay */}
            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pause track" : "Play track"}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform">
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Track Metadata & Tactile Controls */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4 text-center md:text-left w-full">
          <div>
            {/* Status Badges & Live Equalizer */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2.5">
              {mode === "synced" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-semibold shadow-sm shadow-sky-500/20">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  Synced Lounge · {pingMs}ms
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold shadow-sm shadow-indigo-500/20">
                  <Music2 className="w-3.5 h-3.5" />
                  Solo Streaming
                </span>
              )}

              {/* Dynamic 5-bar Waveform Equalizer */}
              <div className="flex items-end gap-1 h-5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
                <span className={`w-1 bg-emerald-400 rounded-full ${isPlaying ? "animate-eq-1" : "h-1"}`} />
                <span className={`w-1 bg-emerald-400 rounded-full ${isPlaying ? "animate-eq-2" : "h-1.5"}`} />
                <span className={`w-1 bg-emerald-400 rounded-full ${isPlaying ? "animate-eq-3" : "h-2"}`} />
                <span className={`w-1 bg-emerald-400 rounded-full ${isPlaying ? "animate-eq-4" : "h-1"}`} />
                <span className={`w-1 bg-emerald-400 rounded-full ${isPlaying ? "animate-eq-5" : "h-1.5"}`} />
                <span className="ml-1.5 text-[11px] font-semibold tracking-wide uppercase">
                  {isPlaying ? "Playing" : "Paused"}
                </span>
              </div>
            </div>

            {/* Song Title with Crisp Typography */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight line-clamp-1 drop-shadow-md">
              {currentTrack.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 font-medium line-clamp-1 mt-1 drop-shadow-sm">
              {currentTrack.artist}
            </p>
          </div>

          {/* Interactive Progress Timeline with Hover Seeking */}
          <div className="space-y-1.5">
            <div
              ref={progressBarRef}
              onClick={handleProgressBarClick}
              onMouseMove={handleProgressBarMouseMove}
              onMouseLeave={() => setHoverSeekPos(null)}
              className="relative w-full bg-white/10 hover:bg-white/15 h-2 rounded-full cursor-pointer overflow-hidden backdrop-blur-sm group transition-all"
            >
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-200 shadow-sm shadow-sky-400/50"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Hover Position Marker */}
              {hoverSeekPos !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                  style={{ left: `${(hoverSeekPos / effectiveDuration) * 100}%` }}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-gray-400">
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
                className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pause track" : "Play track"}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-7 py-2.5 rounded-xl font-bold text-xs shadow-xl shadow-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Play
                </>
              )}
            </button>

            <button
              onClick={onNext}
              aria-label="Next track"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" /> Next
            </button>

            <button
              onClick={() => onToggleLike(currentTrack)}
              aria-label={isLiked ? "Unlike track" : "Like track"}
              className={`p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer ${
                isLiked ? "text-rose-400 border-rose-500/40 shadow-rose-500/20" : "text-gray-400 hover:text-white"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
