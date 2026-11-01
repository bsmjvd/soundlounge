"use client";

import React from "react";
import {
  Play,
  Pause,
  SkipForward,
  Heart,
  Radio,
  Sparkles,
  Music2,
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
}: NowPlayingHeroProps) {
  if (!currentTrack) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/30 via-[#131722]/50 to-sky-950/20 border border-white/10 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome to Soundlounge
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready for Synchronized Sound
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-lg">
              Search for any song or artist above to start streaming in sub-30ms sync with your friends, or enjoy instant solo listening.
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-600/20 flex-shrink-0">
            <Radio className="w-8 h-8 animate-pulse" />
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

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-2xl shadow-2xl transition-all duration-500">
      {/* Subtle Inner Glow from Track Artwork */}
      {highResCover && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-2xl scale-110 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${highResCover})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/20 pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
        {/* Cover Art Artwork with Vinyl Shadow & Playing Glow */}
        <div className={`relative group w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-black/50 border border-white/20 shadow-2xl flex-shrink-0 transition-all duration-500 ${
          isPlaying ? "shadow-indigo-500/25 ring-2 ring-indigo-500/30" : "shadow-black/80"
        }`}>
          {squareCover ? (
            <img
              src={squareCover}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <Music2 className="w-12 h-12" />
            </div>
          )}

          {/* Quick Play/Pause overlay */}
          <button
            onClick={onTogglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </div>
          </button>
        </div>

        {/* Track Metadata & Controls */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4 text-center md:text-left w-full">
          <div>
            {/* Status Badges */}
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
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

              {isPlaying && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
                  {/* Real-time Animated Equalizer bars */}
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="ml-1 text-[11px] font-semibold">Playing</span>
                </div>
              )}
            </div>

            {/* Song Title with Glowing text */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight line-clamp-1 drop-shadow-md">
              {currentTrack.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 font-medium line-clamp-1 mt-1 drop-shadow-sm">
              {currentTrack.artist}
            </p>
          </div>

          {/* Progress Timeline */}
          <div className="space-y-1.5">
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-400 rounded-full transition-all duration-300 shadow-sm shadow-sky-400/50"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>{formatTime(positionMs)}</span>
              <span>{formatTime(effectiveDuration)}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
            <button
              onClick={onTogglePlay}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-6 py-2.5 rounded-xl font-bold text-xs shadow-xl shadow-white/20 hover:scale-105 active:scale-95 transition-all"
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
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all hover:scale-105 active:scale-95"
            >
              <SkipForward className="w-4 h-4" /> Next
            </button>

            <button
              onClick={() => onToggleLike(currentTrack)}
              className={`p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all ${
                isLiked ? "text-rose-400 border-rose-500/40" : "text-gray-400 hover:text-white"
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
