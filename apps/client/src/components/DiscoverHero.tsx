"use client";

import React, { useState } from "react";
import { Play, Pause, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { FEATURED_SPOTLIGHTS } from "../lib/data/mockupData";

interface DiscoverHeroProps {
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

export function DiscoverHero({ onPlayTrack, currentTrack, isPlaying }: DiscoverHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const spotlight = FEATURED_SPOTLIGHTS[activeIndex] || FEATURED_SPOTLIGHTS[0];
  const isCurrentSpotlightTrack = currentTrack?.id === spotlight.mainTrack.id;
  const isTrackPlaying = isCurrentSpotlightTrack && isPlaying;

  const handlePlayHero = () => {
    onPlayTrack(spotlight.mainTrack);
  };

  const handleNextSpotlight = () => {
    setActiveIndex((prev) => (prev + 1) % FEATURED_SPOTLIGHTS.length);
  };

  const handlePrevSpotlight = () => {
    setActiveIndex((prev) => (prev - 1 + FEATURED_SPOTLIGHTS.length) % FEATURED_SPOTLIGHTS.length);
  };

  return (
    <div className="relative w-full overflow-visible pt-2 pb-10 sm:pb-14 group">
      {/* Seamless Ambient Background Glow: rich teal to dark midnight canvas (no box border) */}
      <div className="absolute -top-24 -left-12 -right-12 bottom-0 bg-[radial-gradient(ellipse_90%_75%_at_20%_20%,#1c6e7a_0%,#114050_45%,#0d1a29_80%,transparent_100%)] pointer-events-none" />
      <div className="absolute -top-28 -left-24 w-[520px] h-[520px] bg-[#00e5ff]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Artist Portrait Image: seamlessly blending with feathered edges on the right (NOT inside a box) */}
      <div className="absolute right-0 sm:right-4 lg:right-10 top-0 bottom-0 w-full sm:w-1/2 max-w-xl pointer-events-none flex items-center justify-end overflow-visible">
        <img
          src={spotlight.heroImageUrl}
          alt={spotlight.title}
          className="max-h-[380px] sm:max-h-[420px] lg:max-h-[460px] w-auto object-contain select-none transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>

      {/* Hero Content: display typography & action buttons */}
      <div className="relative z-10 px-2 sm:px-4 flex flex-col justify-center min-h-[260px] sm:min-h-[300px] max-w-xl">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-3">
          {spotlight.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-8 max-w-md">{spotlight.description}</p>

        {/* Action Buttons: PLAY and FOLLOW */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayHero}
            className="flex items-center gap-2 bg-[#00e5ff] hover:bg-[#00d0e6] text-[#0a0e17] font-bold text-xs uppercase tracking-widest px-9 py-3.5 rounded-full shadow-[0_0_24px_rgba(0,229,255,0.45)] hover:shadow-[0_0_35px_rgba(0,229,255,0.65)] transition-all cursor-pointer active:scale-95"
          >
            {isTrackPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsFollowing((f) => !f)}
            className={`flex items-center gap-2 border-2 font-bold text-xs uppercase tracking-widest px-9 py-3.5 rounded-full transition-all cursor-pointer active:scale-95 ${
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

      {/* Spotlights Carousel Controls (Next / Prev) */}
      {FEATURED_SPOTLIGHTS.length > 1 && (
        <div className="absolute bottom-5 right-6 z-20 flex items-center gap-2">
          <button
            onClick={handlePrevSpotlight}
            className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            aria-label="Previous featured spotlight"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextSpotlight}
            className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            aria-label="Next featured spotlight"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
