"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Radio,
  Music2,
  Disc,
  Loader2,
} from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { AudioFrequencyVisualizer } from "./studio/AudioFrequencyVisualizer";
import { hapticLight, hapticMedium } from "../lib/haptics";
import { useFocusTrap } from "../hooks/useFocusTrap";

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const handleModalTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only engage drag if touching the top region or drag pill
    if (e.touches[0].clientY < 260) {
      touchStartY.current = e.touches[0].clientY;
      setIsDragging(true);
    }
  };

  const handleModalTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      // Dragging downwards
      setDragY(deltaY);
    }
  };

  const handleExitStudio = () => {
    hapticLight();
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  };

  const handleModalTouchEnd = () => {
    if (dragY > 85) {
      handleExitStudio();
    }
    setDragY(0);
    setIsDragging(false);
    touchStartY.current = null;
  };

  // Lock background window and body scrolling completely while Fullscreen Studio is open
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  const isStudioOpen = isOpen && !!currentTrack;

  useEffect(() => {
    if (!isStudioOpen) return;
    const shell = document.getElementById("app-shell");
    shell?.setAttribute("inert", "");
    return () => shell?.removeAttribute("inert");
  }, [isStudioOpen]);

  useFocusTrap(isStudioOpen, dialogRef, handleExitStudio);

  if (!isOpen || !currentTrack || typeof document === "undefined") return null;

  const isPlaying = status === "playing";
  const isBuffering = status === "buffering";
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

  return createPortal(
    <div
      onTouchStart={handleModalTouchStart}
      onTouchMove={handleModalTouchMove}
      onTouchEnd={handleModalTouchEnd}
      onWheel={(e) => e.stopPropagation()}
      style={{
        transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
        transition: isDragging ? "none" : "transform 0.28s cubic-bezier(0.25, 0.9, 0.3, 1)",
      }}
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Studio immersion player"
      tabIndex={-1}
      className="fixed inset-0 z-[200] w-full h-full h-dvh max-h-screen bg-canvas text-ink flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300 overscroll-none outline-none"
    >
      {/* iOS Modal Pull-Down Grabber Pill */}
      <div className="sm:hidden w-full flex justify-center pt-2 pb-0.5 z-20 cursor-grab active:cursor-grabbing">
        <div className="w-10 h-1 rounded-full bg-ink/25 active:bg-ink/45 transition-colors" />
      </div>

      {/* 1. Full-Screen Ambient Studio Backdrop */}
      {bannerUrl && (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden bg-canvas">
          {/* Ethereal atmospheric glow (Subtle, dark, never pixelated or harsh) */}
          <div
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              isPlaying ? "opacity-20 brightness-75" : "opacity-10 brightness-50"
            }`}
            style={{
              backgroundImage: `url(${bannerUrl})`,
              filter: "blur(60px)",
              WebkitFilter: "blur(60px)",
              transform: "scale(1.2)",
            }}
          />

          {/* Radial & vertical cinematic ambient shading */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(6,8,14,0.75)_60%,rgba(6,8,14,0.98)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 to-canvas/90" />
        </div>
      )}

      {/* 2. Top Header Bar with Turntable Speed Controls */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-8 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/30 border border-accent/30 flex items-center justify-center text-accent shadow-lg shadow-accent/20 shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest font-bold text-accent">
                Studio Immersion
              </span>
              <span className="text-[11px] sm:text-[11px] bg-ink/10 px-1.5 sm:px-2 py-0.5 rounded-full text-ink-secondary font-mono">
                Hi-Fi
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-ink tracking-tight">Soundlounge</p>
          </div>
        </div>

        {/* Center RPM Speed Selector Pill */}
        <div className="hidden sm:flex items-center gap-1 bg-black/40 border border-ink/10 rounded-full p-1 backdrop-blur-md shadow-inner">
          <button
            onClick={() => {
              hapticLight();
              setRpmSpeed(33);
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
              rpmSpeed === 33
                ? "bg-accent text-accent-foreground shadow-[0_0_12px_rgba(0,229,255,0.6)]"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            33⅓ RPM
          </button>
          <button
            onClick={() => {
              hapticLight();
              setRpmSpeed(45);
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer ${
              rpmSpeed === 45
                ? "bg-accent text-accent-foreground shadow-[0_0_12px_rgba(0,229,255,0.6)]"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            45 RPM
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Native Browser Fullscreen Toggle */}
          <button
            onClick={() => {
              hapticLight();
              if (typeof document !== "undefined") {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.().catch(() => {});
                } else {
                  document.exitFullscreen?.().catch(() => {});
                }
              }
            }}
            aria-label="Toggle Browser Fullscreen"
            title="Toggle Browser Fullscreen (F11)"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-2xl bg-ink/10 hover:bg-ink/20 border border-ink/15 text-ink transition cursor-pointer hover:scale-105 active:scale-95 shadow-xl"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleExitStudio}
            aria-label="Exit Studio Mode"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-ink/10 hover:bg-ink/20 border border-ink/15 text-ink text-xs font-semibold backdrop-blur-xl transition cursor-pointer hover:scale-105 active:scale-95 shadow-xl min-h-11"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden xs:inline">Exit Studio</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-black/40 text-[11px] font-mono text-ink-muted">
              ESC
            </kbd>
          </button>
        </div>
      </div>

      {/* 3. Center Stage: Spinning Vinyl & High-Res Album Cover */}
      <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 py-1 sm:py-3 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 flex-1 min-h-0">
        {/* Centerpiece: Audiophile Gatefold Sleeve, Slideout Vinyl Record & Tonearm */}
        <div className="relative flex items-center justify-center py-1 sm:py-2 overflow-visible">
          <div
            className={`relative w-36 h-36 xs:w-44 xs:h-44 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 max-h-[32vh] max-w-[32vh] aspect-square flex items-center justify-center transition-transform duration-1000 ease-out ${
              isPlaying ? "-translate-x-3 sm:-translate-x-10 md:-translate-x-14" : "translate-x-0"
            }`}
          >
            {/* 1. The Audiophile Vinyl LP Record (emerges from jacket slot on the right) */}
            <div
              ref={vinylRef}
              onClick={handleVinylClick}
              title="Click grooves to drop needle and seek"
              className={`absolute inset-0 z-10 cursor-pointer transition duration-1000 ease-[cubic-bezier(0.34,1.25,0.64,1)] ${
                isPlaying
                  ? "translate-x-[36%] sm:translate-x-[56%] opacity-100 scale-100"
                  : "translate-x-[22%] sm:translate-x-[40%] opacity-90 scale-[0.98]"
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
                <div className="absolute inset-[15%] rounded-full border border-ink/[0.08] pointer-events-none" />
                <div className="absolute inset-[24%] rounded-full border border-ink/[0.08] pointer-events-none" />
                <div className="absolute inset-[33%] rounded-full border border-ink/[0.08] pointer-events-none" />

                {/* Dead Wax Run-Out Zone with Hand-Etched Matrix Code */}
                <div className="w-[44%] h-[44%] rounded-full bg-[radial-gradient(circle,#141923_0%,#080a0f_100%)] border border-ink/15 shadow-[inset_0_0_15px_rgba(0,0,0,0.95)] flex items-center justify-center relative">
                  <span className="absolute font-mono text-[5px] sm:text-[6.5px] tracking-[2.5px] text-ink/30 uppercase -rotate-45 select-none pointer-events-none">
                    SL-2026-HI-FI • SOUNDLOUNGE LATHE CUT
                  </span>

                  {/* Center Record Label Badge with Gold Foil Stamp */}
                  <div className="w-[74%] h-[74%] rounded-full overflow-hidden relative shadow-[0_0_16px_rgba(0,0,0,0.95),0_0_0_1.5px_rgba(217,119,6,0.6)] flex items-center justify-center bg-surface">
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
                      <span className="text-[5px] sm:text-[6px] font-bold text-ink max-w-[60px] sm:max-w-[75px] truncate leading-tight mt-0.5">
                        {currentTrack.title}
                      </span>
                      <span className="text-[4px] sm:text-[5px] font-mono text-amber-300 mt-0.5 tracking-wider font-semibold">
                        {rpmSpeed}⅓ RPM • STEREO
                      </span>
                    </div>

                    {/* Brass Center Spindle Grommet */}
                    <div className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-canvas border-2 border-amber-300 shadow-[0_0_6px_rgba(0,0,0,0.9),inset_0_0_4px_rgba(0,0,0,0.95)] z-20" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Audiophile Gatefold Album Jacket Cover */}
            <div
              className={`relative z-20 w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black/80 border border-ink/15 shadow-[0_25px_70px_rgba(0,0,0,0.95)] transition duration-700 ${
                isPlaying
                  ? "shadow-[0_25px_80px_rgba(245,179,107,0.28),0_0_0_1px_rgba(0,229,255,0.35)]"
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
                <div className="w-full h-full flex items-center justify-center text-ink-subtle">
                  <Music2 className="w-24 h-24" />
                </div>
              )}
            </div>

            {/* 3. Audiophile Turntable Stylus Tone Arm (Pivots onto groove when playing) */}
            <div
              className={`hidden sm:block absolute -top-6 -right-44 md:-right-48 w-32 h-48 pointer-events-none z-30 transition duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                isPlaying ? "rotate-[-14deg] opacity-100" : "rotate-[-46deg] opacity-40"
              }`}
              style={{ transformOrigin: "70px 22px" }}
            >
              {/* Pivot Base & Bearing Assembly */}
              <div className="absolute top-2 left-14 w-10 h-10 rounded-full bg-[radial-gradient(circle,#64748b_0%,#1e293b_80%,#0f172a_100%)] border border-ink/30 shadow-[0_8px_24px_rgba(0,0,0,0.85)] flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-canvas border border-slate-400 shadow-[inset_0_0_3px_rgba(0,0,0,0.9)]" />
              </div>

              {/* Brushed Metallic Tone Arm Shaft */}
              <div
                className="absolute top-7 left-18 w-1 h-36 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-500 rounded-full shadow-[-2px_2px_8px_rgba(0,0,0,0.7)] rotate-[26deg]"
                style={{ transformOrigin: "top center" }}
              />

              {/* Cartridge Headshell & Cyan Stylus Tip */}
              <div className="absolute bottom-5 left-3 w-4.5 h-8 bg-gradient-to-b from-slate-700 to-surface-sunken border border-ink/30 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.95)] flex flex-col items-center justify-end pb-1 rotate-[10deg]">
                <div className="w-1 h-2 bg-accent rounded-sm shadow-[0_0_8px_#00e5ff,0_0_16px_#00e5ff]" />
              </div>
            </div>
          </div>
        </div>

        {/* Track Title & Artist Metadata with Real Audio Spectrum Visualizer */}
        <div className="space-y-2 max-w-2xl flex flex-col items-center">
          {/* Responsive Audio Frequency Spectrum Visualizer */}
          <AudioFrequencyVisualizer isPlaying={isPlaying} />

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight drop-shadow-xl line-clamp-1">
            {currentTrack.title}
          </h1>
          <p className="text-sm sm:text-lg text-ink-secondary font-medium drop-shadow-md line-clamp-1">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* 4. Bottom Controls & Scrubber */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-8 py-2 sm:py-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2.5 sm:space-y-3.5">
        {/* Full-width Timeline Scrubber */}
        <div className="space-y-1.5 sm:space-y-2">
          <div
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            onMouseMove={handleProgressBarMouseMove}
            onMouseLeave={() => setHoverSeekPos(null)}
            className="relative w-full bg-ink/15 hover:bg-ink/25 h-2.5 sm:h-3 rounded-full cursor-pointer backdrop-blur-md transition group focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-canvas"
          >
            <div
              className="h-full w-full origin-left bg-gradient-to-r from-accent via-accent to-ember rounded-full transition-transform duration-200 shadow-md shadow-accent/50"
              style={{ transform: `scaleX(${progressPercent / 100})` }}
            />
            <input
              type="range"
              min="0"
              max={effectiveDuration}
              step={1000}
              value={positionMs}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Seek"
              aria-valuetext={formatTime(positionMs)}
              className="absolute inset-x-0 -top-3 -bottom-3 h-auto w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex justify-between text-[11px] sm:text-xs font-mono text-ink-muted">
            <span>{formatTime(hoverSeekPos !== null ? hoverSeekPos : positionMs)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        {/* Playback Button Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              hapticLight();
              onToggleLike(currentTrack);
            }}
            aria-label="Toggle Like Track"
            className={`p-2.5 sm:p-3 rounded-full transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isLiked ? "text-like bg-like/10 scale-110" : "text-ink-muted hover:text-ink hover:bg-ink/10"
            }`}
          >
            <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isLiked ? "fill-current" : ""}`} />
          </button>

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => {
                hapticMedium();
                onPrevious();
              }}
              aria-label="Previous Track"
              className="p-2.5 sm:p-3 text-ink-secondary hover:text-ink hover:bg-ink/10 rounded-full transition cursor-pointer hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <SkipBack className="w-5 h-5 sm:w-7 sm:h-7" />
            </button>

            <button
              onClick={() => {
                hapticMedium();
                onTogglePlay();
              }}
              aria-label={isBuffering ? "Buffering" : isPlaying ? "Pause Track" : "Play Track"}
              aria-busy={isBuffering}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-ink text-canvas flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-[0_0_30px_rgba(255,255,255,0.4)] cursor-pointer"
            >
              <span
                key={isBuffering ? "buffering" : isPlaying ? "pause" : "play"}
                className="animate-icon-swap flex items-center justify-center"
              >
                {isBuffering ? (
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
                ) : (
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-1" />
                )}
              </span>
            </button>

            <button
              onClick={() => {
                hapticMedium();
                onNext();
              }}
              aria-label="Next Track"
              className="p-2.5 sm:p-3 text-ink-secondary hover:text-ink hover:bg-ink/10 rounded-full transition cursor-pointer hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <SkipForward className="w-5 h-5 sm:w-7 sm:h-7" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1 sm:gap-2">
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
              className="p-2.5 text-ink-muted hover:text-ink transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
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
              aria-label="Volume"
              className="hidden sm:block w-20 sm:w-24 h-1.5 bg-ink/20 rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
