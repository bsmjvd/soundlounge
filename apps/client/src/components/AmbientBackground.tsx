"use client";

import React, { useEffect, useState } from "react";
import type { Track } from "@soundlounge/shared";

interface AmbientBackgroundProps {
  currentTrack: Track | null;
  isPlaying: boolean;
}

export function AmbientBackground({ currentTrack, isPlaying }: AmbientBackgroundProps) {
  const [activeBanner, setActiveBanner] = useState<string | null>(null);
  const [prevBanner, setPrevBanner] = useState<string | null>(null);
  const [isCrossFading, setIsCrossFading] = useState(false);

  useEffect(() => {
    if (!currentTrack) {
      setActiveBanner(null);
      setPrevBanner(null);
      return;
    }

    const rawId = currentTrack.id.startsWith("yt_") ? currentTrack.id.slice(3) : currentTrack.id;

    // Determine the highest quality banner URL
    let primaryUrl: string | null = null;
    let fallbackUrl: string | null = currentTrack.coverUrl || null;

    if (/^[A-Za-z0-9_-]{11}$/.test(rawId)) {
      primaryUrl = `https://i.ytimg.com/vi/${rawId}/maxresdefault.jpg`;
      fallbackUrl = `https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`;
    } else if (currentTrack.coverUrl?.includes("googleusercontent.com")) {
      primaryUrl = currentTrack.coverUrl.replace(/=w\d+-h\d+[^"]*/, "=w1920-h1080-l90-rj");
      fallbackUrl = currentTrack.coverUrl.replace(/=w\d+-h\d+[^"]*/, "=w800-h800-l90-rj");
    } else if (currentTrack.coverUrl) {
      primaryUrl = currentTrack.coverUrl.replace("hqdefault.jpg", "maxresdefault.jpg");
    }

    const targetUrl = primaryUrl || fallbackUrl;
    if (!targetUrl) return;

    if (targetUrl === activeBanner) return;

    // Fast preload to ensure smooth crossfade and verify status
    const img = new Image();
    img.src = targetUrl;
    img.onload = () => {
      setPrevBanner(activeBanner);
      setActiveBanner(targetUrl);
      setIsCrossFading(true);
      setTimeout(() => {
        setIsCrossFading(false);
        setPrevBanner(null);
      }, 700);
    };
    img.onerror = () => {
      const fb = fallbackUrl || currentTrack.coverUrl || null;
      if (fb && fb !== activeBanner) {
        setPrevBanner(activeBanner);
        setActiveBanner(fb);
        setIsCrossFading(true);
        setTimeout(() => {
          setIsCrossFading(false);
          setPrevBanner(null);
        }, 700);
      }
    };

    // If no active banner yet, set targetUrl immediately so there is no delay
    if (!activeBanner) {
      setActiveBanner(targetUrl);
    }
  }, [currentTrack?.id, currentTrack?.coverUrl, activeBanner]);

  if (!activeBanner && !prevBanner) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-indigo-900/15 blur-[140px]" />
        <div className="absolute top-[30%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-sky-900/15 blur-[140px]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Deep Atmospheric Saturated Glow (bathes entire screen in track colors) */}
      {prevBanner && isCrossFading && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700 opacity-0 scale-125 filter blur-[90px] saturate-[200%] brightness-[0.5]"
          style={{ backgroundImage: `url(${prevBanner})` }}
        />
      )}
      {activeBanner && (
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-125 filter blur-[90px] saturate-[220%] ${
            isPlaying ? "opacity-45 brightness-75 animate-pulse" : "opacity-30 brightness-50"
          }`}
          style={{
            backgroundImage: `url(${activeBanner})`,
            animationDuration: "8s",
          }}
        />
      )}

      {/* 2. Panoramic Widescreen Banner across the upper viewport */}
      {prevBanner && isCrossFading && (
        <div className="absolute top-0 left-0 right-0 h-[680px] overflow-hidden opacity-0 transition-opacity duration-700">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${prevBanner})` }}
          />
        </div>
      )}

      {activeBanner && (
        <div className="absolute top-0 left-0 right-0 h-[680px] overflow-hidden">
          {/* Main banner image with cinematic zoom drift */}
          <div
            className={`w-full h-full bg-cover bg-center transition-all duration-1000 transform ${
              isPlaying ? "scale-105 opacity-80" : "scale-100 opacity-60"
            }`}
            style={{
              backgroundImage: `url(${activeBanner})`,
              transition: "transform 14s ease-out, opacity 1s ease",
            }}
          />

          {/* Cinematic Vignettes and Transitions */}
          {/* Top subtle vignette behind Header */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#080a0f]/80 via-[#080a0f]/40 to-transparent" />
          {/* Side edge fades for ultra-wide displays */}
          <div className="absolute inset-y-0 left-0 w-32 sm:w-64 bg-gradient-to-r from-[#080a0f]/90 via-[#080a0f]/40 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-32 sm:w-64 bg-gradient-to-l from-[#080a0f]/90 via-[#080a0f]/40 to-transparent" />
          {/* Bottom seamless blend into dark page */}
          <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-b from-transparent via-[#080a0f]/60 to-[#080a0f]" />
        </div>
      )}

      {/* 3. Subtle dark radial scrim to ensure text legibility while keeping banner visible */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#080a0f]/20 to-[#080a0f]/80 pointer-events-none" />
    </div>
  );
}
