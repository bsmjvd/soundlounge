"use client";

import React, { useEffect, useState } from "react";
import type { Track } from "@soundlounge/shared";

interface AmbientBackgroundProps {
  currentTrack: Track | null;
  isPlaying: boolean;
}

export function AmbientBackground({ currentTrack, isPlaying }: AmbientBackgroundProps) {
  const [activeAura, setActiveAura] = useState<string | null>(null);
  const [prevAura, setPrevAura] = useState<string | null>(null);
  const [isCrossFading, setIsCrossFading] = useState(false);

  useEffect(() => {
    if (!currentTrack) {
      setActiveAura(null);
      setPrevAura(null);
      return;
    }

    const rawId = currentTrack.id.startsWith("yt_") ? currentTrack.id.slice(3) : currentTrack.id;

    // Use coverUrl or YouTube thumbnail
    let targetUrl = currentTrack.coverUrl || null;
    if (currentTrack.coverUrl?.includes("googleusercontent.com")) {
      targetUrl = currentTrack.coverUrl.replace(/=w\d+-h\d+[^"]*/, "=w800-h800-l90-rj");
    } else if (/^[A-Za-z0-9_-]{11}$/.test(rawId)) {
      targetUrl = `https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`;
    }

    if (!targetUrl || targetUrl === activeAura) return;

    // Preload image for seamless aura transition
    const img = new Image();
    img.src = targetUrl;
    img.onload = () => {
      setPrevAura(activeAura);
      setActiveAura(targetUrl);
      setIsCrossFading(true);
      setTimeout(() => {
        setIsCrossFading(false);
        setPrevAura(null);
      }, 800);
    };
    img.onerror = () => {
      // Fallback
      if (rawId) {
        const fb = `https://i.ytimg.com/vi/${rawId}/mqdefault.jpg`;
        setActiveAura(fb);
      }
    };

    if (!activeAura) {
      setActiveAura(targetUrl);
    }
  }, [currentTrack?.id, currentTrack?.coverUrl, activeAura]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#080f14]">
      {/* 1. Fading Previous Track Aura */}
      {prevAura && isCrossFading && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-0 scale-125 filter blur-[110px] saturate-[200%]"
          style={{ backgroundImage: `url(${prevAura})` }}
        />
      )}

      {/* 2. Active Track Dynamic Color Aura (Organic, no hard cuts or seams) */}
      {activeAura && (
        <div
          className={`absolute -top-[10%] left-0 right-0 h-[85vh] bg-cover bg-center transition-all duration-1000 scale-110 filter blur-[110px] saturate-[220%] ${
            isPlaying ? "opacity-40 animate-pulse" : "opacity-25"
          }`}
          style={{
            backgroundImage: `url(${activeAura})`,
            animationDuration: "10s",
          }}
        />
      )}

      {/* 3. Smooth Radial & Vertical Darkening Scrims (Guarantees zero harsh edges) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-[#080f14]/60 to-[#080f14]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#080f14]/30 via-[#080f14]/80 to-[#080f14]" />
    </div>
  );
}
