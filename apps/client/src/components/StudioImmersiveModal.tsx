"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  Radio,
  Music2,
  Disc3,
} from "lucide-react";
import type { Track } from "@soundlounge/shared";

interface StudioImmersiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  status: "idle" | "playing" | "paused" | "buffering";
  positionMs: number;
  durationMs: number;
  volume: number;
  isLiked: boolean;
  onToggleLike: (track: Track) => void;
  onTogglePlay: () => void;
  onSeek: (posMs: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (vol: number) => void;
}

export function StudioImmersiveModal({
  isOpen,
  onClose,
  currentTrack,
  status,
  positionMs,
  durationMs,
  volume,
  isLiked,
  onToggleLike,
  onTogglePlay,
  onSeek,
  onNext,
  onPrevious,
  onVolumeChange,
}: StudioImmersiveModalProps) {
  const [hoverSeekPos, setHoverSeekPos] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentTrack) return null;

  const isPlaying = status === "playing";
  const effectiveDuration = durationMs || currentTrack.durationMs || 1;
  const progressPercent = Math.min(100, Math.max(0, (positionMs / effectiveDuration) * 100));

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const rawId = currentTrack.id.startsWith("yt_") ? currentTrack.id.slice(3) : currentTrack.id;
  const squareCover = currentTrack.coverUrl?.includes("googleusercontent.com")
    ? currentTrack.coverUrl.replace(/=w\d+-h\d+[^"]*/, "=w1200-h1200-l90-rj")
    : (/^[A-Za-z0-9_-]{11}$/.test(rawId)
        ? `https://i.ytimg.com/vi/${rawId}/maxresdefault.jpg`
        : currentTrack.coverUrl?.replace("hqdefault.jpg", "maxresdefault.jpg") || currentTrack.coverUrl);

  const bannerUrl =
    /^[A-Za-z0-9_-]{11}$/.test(rawId)
      ? `https://i.ytimg.com/vi/${rawId}/maxresdefault.jpg`
      : (currentTrack.coverUrl?.includes("googleusercontent.com")
          ? currentTrack.coverUrl.replace(/=w\d+-h\d+[^"]*/, "=w1920-h1080-l90-rj")
          : currentTrack.coverUrl);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
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
    <div className="fixed inset-0 z-50 bg-[#07090e] text-[#f8fafc] flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300">
      {/* 1. Full-Screen Cinematic Backdrop */}
      {bannerUrl && (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Saturated atmospheric glow */}
          <div
            className={`absolute inset-0 bg-cover bg-center filter blur-[120px] saturate-[240%] transition-all duration-1000 scale-125 ${
              isPlaying ? "opacity-50 brightness-75" : "opacity-30 brightness-50"
            }`}
            style={{ backgroundImage: `url(${bannerUrl})` }}
          />

          {/* Panoramic Widescreen Image */}
          <div
            className={`absolute inset-0 bg-cover bg-center transition-transform duration-10000 ${
              isPlaying ? "scale-105 opacity-60" : "scale-100 opacity-40"
            }`}
            style={{ backgroundImage: `url(${bannerUrl})` }}
          />

          {/* Deep Cinematic Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-[#07090e]/80" />
        </div>
      )}

      {/* 2. Top Header Bar */}
      <div className="relative z-10 max-w-7xl w-full mx-auto p-6 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-600/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-sky-400">
                Studio Immersion
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-300 font-mono">
                Hi-Fi AAC 256kbps
              </span>
            </div>
            <p className="text-sm font-bold text-white tracking-tight">Soundlounge</p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Exit Studio Mode"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold backdrop-blur-xl transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xl"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Studio</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono text-gray-400">
            ESC
          </kbd>
        </button>
      </div>

      {/* 3. Center Stage: Spinning Vinyl & High-Res Album Cover */}
      <div className="relative z-10 max-w-5xl w-full mx-auto px-6 py-4 flex flex-col items-center justify-center text-center space-y-8 flex-1">
        {/* Album Artwork + Physical Vinyl LP Slideout */}
        <div className="relative flex items-center justify-center">
          {/* Spinning Vinyl Record Disc */}
          <div
            className={`w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full vinyl-grooves border-4 border-white/15 flex items-center justify-center shadow-2xl transition-all duration-1000 ${
              isPlaying
                ? "translate-x-12 sm:translate-x-20 md:translate-x-28 animate-[spin_12s_linear_infinite]"
                : "translate-x-0 opacity-70"
            }`}
          >
            {/* Center Spindle Label with Track Glow */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-indigo-600/70 border-2 border-white/30 flex items-center justify-center shadow-inner">
              <div className="w-6 h-6 rounded-full bg-black border-2 border-white/50" />
            </div>
          </div>

          {/* Front Album Jacket Cover */}
          <div
            className={`relative z-20 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden bg-black/70 border-2 border-white/20 shadow-2xl transition-all duration-700 ${
              isPlaying
                ? "shadow-[0_25px_80px_rgba(99,102,241,0.45)] ring-4 ring-indigo-500/30"
                : "shadow-black/95"
            }`}
          >
            {squareCover ? (
              <img
                src={squareCover}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <Music2 className="w-24 h-24" />
              </div>
            )}
          </div>
        </div>

        {/* Track Title & Artist Metadata */}
        <div className="space-y-3 max-w-2xl">
          {/* Dynamic Frequency Equalizer Waveform */}
          <div className="flex items-center justify-center gap-1.5 h-6 mb-2">
            <span className={`w-1.5 bg-sky-400 rounded-full ${isPlaying ? "animate-eq-1" : "h-1"}`} />
            <span className={`w-1.5 bg-sky-400 rounded-full ${isPlaying ? "animate-eq-2" : "h-2"}`} />
            <span className={`w-1.5 bg-sky-400 rounded-full ${isPlaying ? "animate-eq-3" : "h-3"}`} />
            <span className={`w-1.5 bg-indigo-400 rounded-full ${isPlaying ? "animate-eq-4" : "h-1"}`} />
            <span className={`w-1.5 bg-indigo-400 rounded-full ${isPlaying ? "animate-eq-5" : "h-2.5"}`} />
            <span className={`w-1.5 bg-indigo-400 rounded-full ${isPlaying ? "animate-eq-1" : "h-1"}`} />
            <span className={`w-1.5 bg-sky-400 rounded-full ${isPlaying ? "animate-eq-2" : "h-3"}`} />
            <span className={`w-1.5 bg-sky-400 rounded-full ${isPlaying ? "animate-eq-3" : "h-2"}`} />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-xl line-clamp-1">
            {currentTrack.title}
          </h1>
          <p className="text-base sm:text-xl text-gray-300 font-medium drop-shadow-md line-clamp-1">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* 4. Bottom Controls & Scrubber */}
      <div className="relative z-10 max-w-4xl w-full mx-auto p-6 sm:p-8 space-y-5">
        {/* Full-width Timeline Scrubber */}
        <div className="space-y-2">
          <div
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            onMouseMove={handleProgressBarMouseMove}
            onMouseLeave={() => setHoverSeekPos(null)}
            className="relative w-full bg-white/15 hover:bg-white/25 h-3 rounded-full cursor-pointer overflow-hidden backdrop-blur-md transition-all group"
          >
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-200 shadow-md shadow-sky-400/50"
              style={{ width: `${progressPercent}%` }}
            />
            {hoverSeekPos !== null && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-xl pointer-events-none"
                style={{ left: `${(hoverSeekPos / effectiveDuration) * 100}%` }}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono tabular-nums text-gray-400">
            <span>{formatTime(positionMs)}</span>
            {hoverSeekPos !== null ? (
              <span className="text-sky-300 font-bold">Seek to {formatTime(hoverSeekPos)}</span>
            ) : (
              <span>{formatTime(effectiveDuration)}</span>
            )}
          </div>
        </div>

        {/* Transport Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Like button */}
          <button
            onClick={() => onToggleLike(currentTrack)}
            aria-label={isLiked ? "Unlike track" : "Like track"}
            className={`p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer hover:scale-110 active:scale-95 ${
              isLiked ? "text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          </button>

          {/* Central Transport Buttons */}
          <div className="flex items-center gap-6">
            <button
              onClick={onPrevious}
              aria-label="Previous track"
              className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black flex items-center justify-center shadow-2xl shadow-white/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={onNext}
              aria-label="Next track"
              className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                  onVolumeChange(volume || 0.8);
                } else {
                  setIsMuted(true);
                  onVolumeChange(0);
                }
              }}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5" />
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
              className="w-20 sm:w-28 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
