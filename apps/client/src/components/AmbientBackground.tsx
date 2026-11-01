"use client";

import React, { useEffect, useState } from "react";
import type { Track } from "@soundlounge/shared";

interface AmbientBackgroundProps {
  currentTrack: Track | null;
  isPlaying: boolean;
}

export function AmbientBackground({ currentTrack, isPlaying }: AmbientBackgroundProps) {
  const [activeCover, setActiveCover] = useState<string | null>(null);
  const [prevCover, setPrevCover] = useState<string | null>(null);
  const [isCrossFading, setIsCrossFading] = useState(false);

  useEffect(() => {
    const rawCover = currentTrack?.coverUrl;
    // Upgrade YouTube cover to high-res maxresdefault if possible
    let highResCover = rawCover;
    if (rawCover && rawCover.includes("i.ytimg.com/vi/")) {
      highResCover = rawCover.replace("hqdefault.jpg", "maxresdefault.jpg");
    }

    if (highResCover !== activeCover) {
      setPrevCover(activeCover);
      setActiveCover(highResCover || null);
      setIsCrossFading(true);
      const timer = setTimeout(() => {
        setIsCrossFading(false);
        setPrevCover(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTrack?.coverUrl, activeCover]);

  if (!activeCover && !prevCover) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        {/* Subtle default ambient glows */}
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/15 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-sky-900/15 blur-[120px]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none">
      {/* Previous cover cross-fade out */}
      {prevCover && isCrossFading && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-0 scale-110 filter blur-[90px] saturate-[170%] brightness-[0.3]"
          style={{ backgroundImage: `url(${prevCover})` }}
        />
      )}

      {/* Active cover background */}
      {activeCover && (
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-110 filter blur-[85px] saturate-[180%] ${
            isPlaying ? "opacity-35 brightness-[0.38] animate-pulse" : "opacity-20 brightness-[0.25]"
          }`}
          style={{
            backgroundImage: `url(${activeCover})`,
            animationDuration: "8s",
          }}
        />
      )}

      {/* Deep contrast vignette and gradient overlays so text & UI are 100% crisp */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d13] via-[#0b0d13]/70 to-[#0b0d13]/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-[#0b0d13]/60 to-[#0b0d13]" />
    </div>
  );
}
