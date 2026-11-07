"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, SkipBack, Heart, Volume2, VolumeX, Minimize2, Radio, Music2, Disc } from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { AudioFrequencyVisualizer } from "./studio/AudioFrequencyVisualizer";

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
  const [rpmSpeed, setRpmSpeed] = useState<33 | 45>(33);
  const [isMuted, setIsMuted] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const vinylRef = useRef<HTMLDivElement>(null);

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

  // Needle drop seek on vinyl grooves
  const handleVinylClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!vinylRef.current) return;
    const rect = vinylRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = rect.width / 2;
    // Deadwax inner radius ~35%, Outer edge ~98%
    const normalized = Math.max(0, Math.min(1, (dist - radius * 0.35) / (radius * 0.63)));
    // Grooves run outside-in: outside is start (0%), inner is end (100%)
    const seekPercent = 1 - normalized;
    onSeek(Math.floor(seekPercent * effectiveDuration));
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

      {/* 2. Top Header Bar with Turntable Speed Controls */}
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

        {/* Center RPM Speed Selector Pill */}
        <div className="hidden sm:flex items-center gap-1 bg-black/40 border border-white/10 rounded-full p-1 backdrop-blur-md shadow-inner">
          <button
            onClick={() => setRpmSpeed(33)}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
              rpmSpeed === 33
                ? "bg-[#00e5ff] text-[#07090e] shadow-[0_0_12px_rgba(0,229,255,0.6)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            33⅓ RPM
          </button>
          <button
            onClick={() => setRpmSpeed(45)}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
              rpmSpeed === 45
                ? "bg-[#00e5ff] text-[#07090e] shadow-[0_0_12px_rgba(0,229,255,0.6)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            45 RPM
          </button>
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
      <div className="relative z-10 max-w-5xl w-full mx-auto px-6 py-4 flex flex-col items-center justify-center text-center space-y-6 flex-1">
        {/* Centerpiece: Audiophile Gatefold Sleeve, Slideout Vinyl Record & Tonearm */}
        <div className="relative flex items-center justify-center py-4">
          <div
            className={`relative w-64 h-64 sm:w-80 sm:h-80 md:w-88 md:h-88 lg:w-96 lg:h-96 flex items-center justify-center transition-transform duration-1000 ease-out ${
              isPlaying ? "-translate-x-6 sm:-translate-x-12 md:-translate-x-16" : "translate-x-0"
            }`}
          >
            {/* 1. The Audiophile Vinyl LP Record (emerges from jacket slot on the right) */}
            <div
              ref={vinylRef}
              onClick={handleVinylClick}
              title="Click grooves to drop needle and seek"
              className={`absolute inset-0 z-10 cursor-pointer transition-all duration-1000 ease-[cubic-bezier(0.34,1.25,0.64,1)] ${
                isPlaying
                  ? "translate-x-[52%] sm:translate-x-[56%] opacity-100 scale-100"
                  : "translate-x-[36%] sm:translate-x-[40%] opacity-90 scale-[0.98]"
              }`}
            >
              <div
                className={`w-full h-full rounded-full audiophile-vinyl-disc relative flex items-center justify-center ${
                  isPlaying
                    ? rpmSpeed === 33
                      ? "spin-vinyl-running-33"
                      : "spin-vinyl-running-45"
                    : "spin-vinyl-paused"
                }`}
              >
                {/* Physical Song Separation Bands */}
                <div className="absolute inset-[15%] rounded-full border border-white/[0.08] pointer-events-none" />
                <div className="absolute inset-[24%] rounded-full border border-white/[0.08] pointer-events-none" />
                <div className="absolute inset-[33%] rounded-full border border-white/[0.08] pointer-events-none" />

                {/* Dead Wax Run-Out Zone with Hand-Etched Matrix Code */}
                <div className="w-[44%] h-[44%] rounded-full bg-[radial-gradient(circle,#141923_0%,#080a0f_100%)] border border-white/15 shadow-[inset_0_0_15px_rgba(0,0,0,0.95)] flex items-center justify-center relative">
                  <span className="absolute font-mono text-[5px] sm:text-[6.5px] tracking-[2.5px] text-white/30 uppercase -rotate-45 select-none pointer-events-none">
                    SL-2026-HI-FI • SOUNDLOUNGE LATHE CUT
                  </span>

                  {/* Center Record Label Badge with Gold Foil Stamp */}
                  <div className="w-[74%] h-[74%] rounded-full overflow-hidden relative shadow-[0_0_16px_rgba(0,0,0,0.95),0_0_0_1.5px_rgba(217,119,6,0.6)] flex items-center justify-center bg-[#0c1322]">
                    {squareCover && (
                      <img
                        src={squareCover}
                        alt="Vinyl Center Label"
                        className="absolute inset-0 w-full h-full object-cover brightness-[0.55] contrast-125"
                      />
                    )}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.3)_15%,rgba(0,0,0,0.85)_100%)]" />

                    <div className="relative z-10 flex flex-col items-center text-center pointer-events-none px-1">
                      <span className="text-[5.5px] sm:text-[6.5px] font-black tracking-widest text-amber-200 font-mono uppercase drop-shadow-sm">
                        SOUNDLOUNGE
                      </span>
                      <span className="text-[5px] sm:text-[6px] font-bold text-white max-w-[60px] sm:max-w-[75px] truncate leading-tight mt-0.5">
                        {currentTrack.title}
                      </span>
                      <span className="text-[4px] sm:text-[5px] font-mono text-amber-300 mt-0.5 tracking-wider font-semibold">
                        {rpmSpeed}⅓ RPM • STEREO
                      </span>
                    </div>

                    {/* Brass Center Spindle Grommet */}
                    <div className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#050608] border-2 border-amber-300 shadow-[0_0_6px_rgba(0,0,0,0.9),inset_0_0_4px_rgba(0,0,0,0.95)] z-20" />
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
              <div className="absolute top-0 left-0 bottom-0 w-3.5 bg-gradient-to-r from-white/25 via-white/10 to-transparent pointer-events-none z-10" />
              {/* Right Jacket Mouth Inner Slot Shadow */}
              <div className="absolute top-0 right-0 bottom-0 w-5 sm:w-6 bg-gradient-to-l from-black/95 to-transparent pointer-events-none z-10" />

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

        {/* Track Title & Artist Metadata with Real Audio Spectrum Visualizer */}
        <div className="space-y-3 max-w-2xl flex flex-col items-center">
          {/* Responsive Audio Frequency Spectrum Visualizer */}
          <AudioFrequencyVisualizer isPlaying={isPlaying} />

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
          </div>

          <div className="flex justify-between text-xs font-mono text-gray-400">
            <span>{formatTime(hoverSeekPos !== null ? hoverSeekPos : positionMs)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        {/* Playback Button Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onToggleLike(currentTrack)}
            aria-label="Toggle Like Track"
            className={`p-3 rounded-full transition-all cursor-pointer ${
              isLiked ? "text-rose-500 bg-rose-500/10 scale-110" : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
          </button>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={onPrevious}
              aria-label="Previous Track"
              className="p-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer hover:scale-110 active:scale-95"
            >
              <SkipBack className="w-7 h-7" />
            </button>

            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pause Track" : "Play Track"}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={onNext}
              aria-label="Next Track"
              className="p-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer hover:scale-110 active:scale-95"
            >
              <SkipForward className="w-7 h-7" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isMuted) {
                  onVolumeChange(volume || 0.4);
                  setIsMuted(false);
                } else {
                  onVolumeChange(0);
                  setIsMuted(true);
                }
              }}
              className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setIsMuted(false);
                onVolumeChange(parseFloat(e.target.value));
              }}
              className="w-20 sm:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#00e5ff]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
