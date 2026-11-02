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
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-[#0e1626] border border-cyan-500/20 group">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#03343f] via-[#092235] to-[#0e1626] opacity-95" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#00e5ff]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Artist Portrait Image with Mask / Feathering on the right */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/5 lg:w-1/2 pointer-events-none overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center transition-all duration-700 ease-out scale-100 group-hover:scale-105"
          style={{
            backgroundImage: `url(${spotlight.heroImageUrl})`,
            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,1) 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,1) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1626] via-transparent to-transparent opacity-80" />
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col justify-center min-h-[280px] sm:min-h-[320px] max-w-xl">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
          {spotlight.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-8 max-w-md">{spotlight.description}</p>

        {/* Action Buttons: PLAY and FOLLOW */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayHero}
            className="flex items-center gap-2 bg-[#00e5ff] hover:bg-[#00d0e6] text-[#0a0e17] font-bold text-xs uppercase tracking-wider px-8 py-3 rounded-full shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_28px_rgba(0,229,255,0.6)] transition-all cursor-pointer active:scale-95"
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
            className={`flex items-center gap-2 border font-bold text-xs uppercase tracking-wider px-8 py-3 rounded-full transition-all cursor-pointer active:scale-95 ${
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
