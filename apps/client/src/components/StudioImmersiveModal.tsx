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
  Minimize2,
  Radio,
  Music2,
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
    : /^[A-Za-z0-9_-]{11}$/.test(rawId)
      ? `https://i.ytimg.com/vi/${rawId}/maxresdefault.jpg`
      : currentTrack.coverUrl?.replace("hqdefault.jpg", "maxresdefault.jpg") || currentTrack.coverUrl;

  const bannerUrl = /^[A-Za-z0-9_-]{11}$/.test(rawId)
    ? `https://i.ytimg.com/vi/${rawId}/maxresdefault.jpg`
    : currentTrack.coverUrl?.includes("googleusercontent.com")
      ? currentTrack.coverUrl.replace(/=w\d+-h\d+[^"]*/, "=w1920-h1080-l90-rj")
      : currentTrack.coverUrl;

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
              <span className="text-xs uppercase tracking-widest font-bold text-sky-400">Studio Immersion</span>
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
        {/* Centerpiece: Audiophile Gatefold Sleeve, Slideout Vinyl Record & Tonearm */}
        <div className="relative flex items-center justify-center py-4">
          <div
            className={`relative w-64 h-64 sm:w-80 sm:h-80 md:w-88 md:h-88 lg:w-96 lg:h-96 flex items-center justify-center transition-transform duration-1000 ease-out ${
              isPlaying ? "-translate-x-6 sm:-translate-x-12 md:-translate-x-16" : "translate-x-0"
            }`}
          >
            {/* 1. The Audiophile Vinyl LP Record (emerges from jacket slot on the right) */}
            <div
              className={`absolute inset-0 z-10 transition-all duration-1000 ease-[cubic-bezier(0.34,1.25,0.64,1)] ${
                isPlaying
                  ? "translate-x-[48%] sm:translate-x-[52%] opacity-100 scale-100"
                  : "translate-x-[6%] opacity-75 scale-[0.98]"
              }`}
            >
              <div
                className={`w-full h-full rounded-full audiophile-vinyl-disc relative flex items-center justify-center ${
                  isPlaying ? "spin-vinyl-running" : "spin-vinyl-paused"
                }`}
              >
                {/* Physical Song Separation Bands */}
                <div className="absolute inset-[16%] rounded-full border border-white/[0.07] pointer-events-none" />
                <div className="absolute inset-[26%] rounded-full border border-white/[0.07] pointer-events-none" />
                <div className="absolute inset-[35%] rounded-full border border-white/[0.07] pointer-events-none" />

                {/* Dead Wax Run-Out Zone with Etched Matrix Code */}
                <div className="w-[44%] h-[44%] rounded-full bg-[radial-gradient(circle,#131722_0%,#090c12_100%)] border border-white/10 shadow-[inset_0_0_12px_rgba(0,0,0,0.9)] flex items-center justify-center relative">
                  <span className="absolute font-mono text-[5px] sm:text-[6px] tracking-[2px] text-white/20 uppercase -rotate-45 select-none pointer-events-none">
                    SL-2026-HI-FI • SOUNDLOUNGE
                  </span>

                  {/* Center Record Label Badge */}
                  <div className="w-[76%] h-[76%] rounded-full overflow-hidden relative shadow-[0_0_14px_rgba(0,0,0,0.95),0_0_0_1.5px_rgba(217,119,6,0.45)] flex items-center justify-center bg-[#0f172a]">
                    {squareCover && (
                      <img
                        src={squareCover}
                        alt="Vinyl Center Label"
                        className="absolute inset-0 w-full h-full object-cover brightness-[0.65] contrast-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.25)_20%,rgba(0,0,0,0.85)_100%)]" />

                    <div className="relative z-10 flex flex-col items-center text-center pointer-events-none px-1">
                      <span className="text-[5px] sm:text-[6px] font-black tracking-widest text-amber-200 font-mono uppercase">
                        SOUNDLOUNGE
                      </span>
                      <span className="text-[5px] sm:text-[6px] font-bold text-white max-w-[55px] sm:max-w-[70px] truncate leading-tight mt-0.5">
                        {currentTrack.title}
                      </span>
                      <span className="text-[4px] sm:text-[5px] font-mono text-amber-300/80 mt-0.5 tracking-wider">
                        33⅓ RPM • SIDE A
                      </span>
                    </div>

                    {/* Brass Center Spindle Eyelet */}
                    <div className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#050608] border-2 border-amber-300/80 shadow-[0_0_4px_rgba(0,0,0,0.9),inset_0_0_3px_rgba(0,0,0,0.95)] z-20" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Audiophile Gatefold Album Jacket Cover */}
            <div
              className={`relative z-20 w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black/80 border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.95)] transition-all duration-700 ${
                isPlaying
                  ? "shadow-[0_25px_80px_rgba(99,102,241,0.35),0_0_0_1px_rgba(0,229,255,0.35)]"
                  : "shadow-black/95"
              }`}
            >
              {/* Left Spine Fold Highlight & Crease */}
              <div className="absolute top-0 left-0 bottom-0 w-3 bg-gradient-to-r from-white/20 via-white/5 to-transparent pointer-events-none z-10" />
              {/* Right Jacket Mouth Inner Slot Shadow */}
              <div className="absolute top-0 right-0 bottom-0 w-4 sm:w-5 bg-gradient-to-l from-black/95 to-transparent pointer-events-none z-10" />

              {squareCover ? (
                <img src={squareCover} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <Music2 className="w-24 h-24" />
                </div>
              )}
            </div>

            {/* 3. Audiophile Turntable Stylus Tone Arm (Pivots onto groove when playing) */}
            <div
              className={`hidden sm:block absolute -top-6 -right-44 md:-right-48 w-32 h-48 pointer-events-none z-30 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                isPlaying ? "rotate-[-14deg] opacity-100" : "rotate-[-46deg] opacity-40"
              }`}
              style={{ transformOrigin: "70px 22px" }}
            >
              {/* Pivot Base & Bearing Assembly */}
              <div className="absolute top-2 left-14 w-10 h-10 rounded-full bg-[radial-gradient(circle,#64748b_0%,#1e293b_80%,#0f172a_100%)] border border-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.85)] flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#0f172a] border border-slate-400 shadow-[inset_0_0_3px_rgba(0,0,0,0.9)]" />
              </div>

              {/* Brushed Metallic Tone Arm Shaft */}
              <div
                className="absolute top-7 left-18 w-1 h-36 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-500 rounded-full shadow-[-2px_2px_8px_rgba(0,0,0,0.7)] rotate-[26deg]"
                style={{ transformOrigin: "top center" }}
              />

              {/* Cartridge Headshell & Cyan Stylus Tip */}
              <div className="absolute bottom-5 left-3 w-4.5 h-8 bg-gradient-to-b from-slate-700 to-slate-900 border border-white/30 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.95)] flex flex-col items-center justify-end pb-1 rotate-[10deg]">
                <div className="w-1 h-2 bg-cyan-400 rounded-xs shadow-[0_0_8px_#00e5ff,0_0_16px_#00e5ff]" />
              </div>
            </div>
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
              isLiked
                ? "text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/20"
                : "text-gray-400 hover:text-white"
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
              {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
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
