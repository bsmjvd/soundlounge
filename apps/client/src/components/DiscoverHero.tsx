"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { FEATURED_SPOTLIGHTS, type FeaturedSpotlight } from "../lib/data/mockupData";
import { HeroCarouselIndicators } from "./ui/HeroCarouselIndicators";

interface DiscoverHeroProps {
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  spotlights?: FeaturedSpotlight[];
}

export function DiscoverHero({
  onPlayTrack,
  currentTrack,
  isPlaying,
  activeIndex: externalIndex,
  onActiveIndexChange,
  spotlights,
}: DiscoverHeroProps) {
  const activeSpotlights = spotlights && spotlights.length > 0 ? spotlights : FEATURED_SPOTLIGHTS;
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

  const safeIndex = activeIndex >= 0 && activeIndex < activeSpotlights.length ? activeIndex : 0;
  const spotlight = activeSpotlights[safeIndex] || activeSpotlights[0];
  const isCurrentSpotlightTrack = currentTrack?.id === spotlight.mainTrack.id;
  const isTrackPlaying = isCurrentSpotlightTrack && isPlaying;

  const handleNextSpotlight = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % activeSpotlights.length);
  }, [setActiveIndex, activeSpotlights.length]);

  const handlePrevSpotlight = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + activeSpotlights.length) % activeSpotlights.length);
  }, [setActiveIndex, activeSpotlights.length]);

  // Ambient Auto-Rotation (8 seconds, paused on hover)
  useEffect(() => {
    if (isHovered || activeSpotlights.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      handleNextSpotlight();
    }, 8000);
    return () => clearInterval(timer);
  }, [isHovered, handleNextSpotlight, activeSpotlights.length]);

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
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={() => setIsHovered(false)}
      className="relative w-full overflow-visible pt-2 pb-10 sm:pb-8 group select-none outline-none focus-visible:ring-1 focus-visible:ring-accent/50 rounded-2xl"
    >
      {/* Hero Content: display typography & action buttons */}
      <div
        key={spotlight.id}
        className="animate-hero-copy-in relative z-10 px-1 sm:px-4 flex flex-col justify-center min-h-[180px] sm:min-h-[260px] max-w-xl"
      >
        <h1 className="text-[clamp(1.75rem,4.4vw,3.75rem)] font-extrabold text-ink tracking-tight leading-[1.05] mb-2.5 sm:mb-3 drop-shadow-sm font-display transition duration-300">
          {spotlight.title}
        </h1>

        <p className="text-xs sm:text-sm text-ink leading-relaxed mb-5 sm:mb-8 max-w-md line-clamp-3 sm:line-clamp-none transition-opacity duration-300">
          {spotlight.description}
        </p>

        {/* Action Buttons: PLAY and FOLLOW */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          <button
            onClick={handlePlayHero}
            aria-label={isTrackPlaying ? "Pause featured track" : "Play featured track"}
            className="flex items-center gap-2.5 bg-accent hover:bg-accent-strong text-accent-foreground font-bold text-xs uppercase tracking-wider sm:tracking-widest px-5 sm:px-9 py-2.5 sm:py-3.5 rounded-full shadow-[0_0_24px_rgba(0,229,255,0.45)] hover:shadow-[0_0_35px_rgba(0,229,255,0.65)] transition cursor-pointer active:scale-95 min-h-[44px]"
          >
            {isTrackPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
                {/* Live soundwave equalizer bars */}
                <span className="flex items-center gap-0.5 ml-1 h-3">
                  <span className="w-0.5 h-full origin-bottom rounded-full bg-black animate-sound-wave-1" />
                  <span className="w-0.5 h-2 origin-bottom rounded-full bg-black animate-sound-wave-2" />
                  <span className="w-0.5 h-3 origin-bottom rounded-full bg-black animate-sound-wave-3" />
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
            className={`flex items-center gap-2 border-2 font-bold text-xs uppercase tracking-wider sm:tracking-widest px-5 sm:px-9 py-2.5 sm:py-3.5 rounded-full transition cursor-pointer active:scale-95 min-h-[44px] ${
              isFollowing
                ? "border-ember text-ember bg-ember/10"
                : "border-accent text-accent hover:bg-accent/10"
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
      {activeSpotlights.length > 1 && (
        <div className="relative sm:absolute sm:bottom-2 sm:right-6 z-20 flex items-center justify-between sm:justify-end gap-3 mt-5 sm:mt-0 pt-1 sm:pt-0">
          <HeroCarouselIndicators
            total={activeSpotlights.length}
            activeIndex={safeIndex}
            onChange={(idx) => setActiveIndex(idx)}
          />

          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={handlePrevSpotlight}
              className="w-8 h-8 rounded-full bg-surface-sunken/60 hover:bg-surface-raised text-ink-secondary hover:text-ink flex items-center justify-center transition-colors cursor-pointer border border-ink/10 active:scale-95"
              aria-label="Previous featured spotlight"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextSpotlight}
              className="w-8 h-8 rounded-full bg-surface-sunken/60 hover:bg-surface-raised text-ink-secondary hover:text-ink flex items-center justify-center transition-colors cursor-pointer border border-ink/10 active:scale-95"
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
