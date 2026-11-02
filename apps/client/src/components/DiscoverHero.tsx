"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { FEATURED_SPOTLIGHTS } from "../lib/data/mockupData";
import { HeroCarouselIndicators } from "./ui/HeroCarouselIndicators";

interface DiscoverHeroProps {
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

export function DiscoverHero({
  onPlayTrack,
  currentTrack,
  isPlaying,
  activeIndex: externalIndex,
  onActiveIndexChange,
}: DiscoverHeroProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = externalIndex !== undefined ? externalIndex : internalIndex;

  const setActiveIndex = useCallback(
    (updater: number | ((prev: number) => number)) => {
      if (typeof updater === "function") {
        const nextVal = updater(activeIndex);
        if (onActiveIndexChange) onActiveIndexChange(nextVal);
        else setInternalIndex(nextVal);
      } else {
        if (onActiveIndexChange) onActiveIndexChange(updater);
        else setInternalIndex(updater);
      }
    },
    [activeIndex, onActiveIndexChange]
  );

  const [isFollowing, setIsFollowing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const spotlight = FEATURED_SPOTLIGHTS[activeIndex] || FEATURED_SPOTLIGHTS[0];
  const isCurrentSpotlightTrack = currentTrack?.id === spotlight.mainTrack.id;
  const isTrackPlaying = isCurrentSpotlightTrack && isPlaying;

  const handleNextSpotlight = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % FEATURED_SPOTLIGHTS.length);
  }, [setActiveIndex]);

  const handlePrevSpotlight = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + FEATURED_SPOTLIGHTS.length) % FEATURED_SPOTLIGHTS.length);
  }, [setActiveIndex]);

  // Ambient Auto-Rotation (8 seconds, paused on hover)
  useEffect(() => {
    if (isHovered || FEATURED_SPOTLIGHTS.length <= 1) return;
    const timer = setInterval(() => {
      handleNextSpotlight();
    }, 8000);
    return () => clearInterval(timer);
  }, [isHovered, handleNextSpotlight]);

  // Keyboard navigation when user is on the hero
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNextSpotlight();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrevSpotlight();
    }
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX.current - touchEndX;
    if (deltaX > 45) {
      handleNextSpotlight();
    } else if (deltaX < -45) {
      handlePrevSpotlight();
    }
    touchStartX.current = null;
  };

  const handlePlayHero = () => {
    onPlayTrack(spotlight.mainTrack);
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured music spotlights"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full overflow-visible pt-2 pb-6 sm:pb-8 group select-none outline-none focus-visible:ring-1 focus-visible:ring-[#00e5ff]/50 rounded-2xl"
    >
      {/* Hero Content: display typography & action buttons */}
      <div className="relative z-10 px-2 sm:px-4 flex flex-col justify-center min-h-[220px] sm:min-h-[260px] max-w-xl">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-3 drop-shadow-sm font-sans transition-all duration-300">
          {spotlight.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-8 max-w-md transition-opacity duration-300">
          {spotlight.description}
        </p>

        {/* Action Buttons: PLAY and FOLLOW */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayHero}
            aria-label={isTrackPlaying ? "Pause featured track" : "Play featured track"}
            className="flex items-center gap-2.5 bg-[#00e5ff] hover:bg-[#00d0e6] text-[#0a0e17] font-bold text-xs uppercase tracking-widest px-8 sm:px-9 py-3.5 rounded-full shadow-[0_0_24px_rgba(0,229,255,0.45)] hover:shadow-[0_0_35px_rgba(0,229,255,0.65)] transition-all cursor-pointer active:scale-95"
          >
            {isTrackPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
                {/* Live soundwave equalizer bars */}
                <span className="flex items-center gap-0.5 ml-1 h-3">
                  <span className="w-0.5 bg-black animate-pulse h-full rounded-full" />
                  <span className="w-0.5 bg-black animate-pulse h-2 rounded-full delay-75" />
                  <span className="w-0.5 bg-black animate-pulse h-3 rounded-full delay-150" />
                </span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsFollowing((f) => !f)}
            aria-label={isFollowing ? "Following featured artist" : "Follow featured artist"}
            className={`flex items-center gap-2 border-2 font-bold text-xs uppercase tracking-widest px-8 sm:px-9 py-3.5 rounded-full transition-all cursor-pointer active:scale-95 ${
              isFollowing
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/10"
                : "border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff]/10"
            }`}
          >
            {isFollowing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Following</span>
              </>
            ) : (
              <span>Follow</span>
            )}
          </button>
        </div>
      </div>

      {/* Spotlights Carousel Controls & Slide Indicator Pills */}
      {FEATURED_SPOTLIGHTS.length > 1 && (
        <div className="absolute bottom-2 right-4 sm:right-6 z-20 flex items-center gap-3">
          <HeroCarouselIndicators
            total={FEATURED_SPOTLIGHTS.length}
            activeIndex={activeIndex}
            onChange={(idx) => setActiveIndex(idx)}
          />

          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={handlePrevSpotlight}
              className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 active:scale-95"
              aria-label="Previous featured spotlight"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextSpotlight}
              className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 active:scale-95"
              aria-label="Next featured spotlight"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
