"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { TrackArtwork } from "./TrackArtwork";

interface CoverflowHeroProps {
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onOpenStudio?: () => void;
}

export interface FeaturedHeroItem {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  durationMs: number;
  source: Track["source"];
}

const FEATURED_ITEMS: FeaturedHeroItem[] = [
  {
    id: "yt_34Na4j8AVgA",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    durationMs: 230000,
    source: "youtube",
  },
  {
    id: "yt_QYvfY4MtLAI",
    title: "295",
    artist: "Sidhu Moose Wala",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    durationMs: 270000,
    source: "youtube",
  },
  {
    id: "yt_fHI8X4OXluQ",
    title: "Blinding Lights",
    artist: "The Weeknd",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    durationMs: 200000,
    source: "youtube",
  },
  {
    id: "yt_5NV6Rdv1a3I",
    title: "Get Lucky",
    artist: "Daft Punk ft. Pharrell Williams",
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    durationMs: 248000,
    source: "youtube",
  },
  {
    id: "yt_TUVcZfQe-Kw",
    title: "Levitating",
    artist: "Dua Lipa",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
    durationMs: 203000,
    source: "youtube",
  },
];

export function CoverflowHero({
  onPlayTrack,
  currentTrack,
  isPlaying,
  onOpenStudio,
}: CoverflowHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate every 7 seconds unless hovered
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FEATURED_ITEMS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + FEATURED_ITEMS.length) % FEATURED_ITEMS.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % FEATURED_ITEMS.length);
  };

  const activeItem = FEATURED_ITEMS[activeIndex];
  const isCurrentActivePlaying =
    currentTrack?.id === activeItem.id && isPlaying;

  const handlePlayCurrent = (item: FeaturedHeroItem) => {
    const track: Track = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      coverUrl: item.coverUrl,
      durationMs: item.durationMs,
      url: `/api/stream/youtube?id=${item.id.replace("yt_", "")}`,
      source: item.source,
      createdAt: Date.now(),
    };
    onPlayTrack(track);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden pt-2 pb-4 select-none isolate"
    >
      {/* 3D Coverflow Container */}
      <div className="relative h-64 sm:h-72 w-full flex items-center justify-center perspective-1000">
        {FEATURED_ITEMS.map((item, idx) => {
          const count = FEATURED_ITEMS.length;
          // Calculate relative position: -2, -1, 0 (active), 1, 2
          let offset = (idx - activeIndex + count) % count;
          if (offset > count / 2) offset -= count;

          const isCenter = offset === 0;
          const isLeft = offset === -1 || (offset < -1 && offset === -(count - 1));
          const isRight = offset === 1 || (offset > 1 && offset === count - 1);
          const isVisible = isCenter || isLeft || isRight;

          if (!isVisible) return null;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isCenter) {
                  handlePlayCurrent(item);
                } else {
                  setActiveIndex(idx);
                }
              }}
              style={{
                transform: isCenter
                  ? "translateX(0) scale(1) translateZ(50px)"
                  : isLeft
                  ? "translateX(-48%) scale(0.82) rotateY(18deg) translateZ(-40px)"
                  : "translateX(48%) scale(0.82) rotateY(-18deg) translateZ(-40px)",
                zIndex: isCenter ? 30 : 10,
                opacity: isCenter ? 1 : 0.65,
              }}
              className="absolute w-[75%] max-w-sm sm:max-w-md h-52 sm:h-60 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out preserve-3d shadow-2xl border border-[#20343f] bg-[#0c161c]"
            >
              {/* Background Art */}
              <img
                src={item.coverUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />

              {/* Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#081014]/95 via-[#081014]/40 to-transparent" />

              {/* Center Play Button Overlay on Active Card */}
              {isCenter && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayCurrent(item);
                    }}
                    className="w-14 h-14 rounded-full bg-[#00e5c9] text-[#081014] flex items-center justify-center shadow-lg shadow-[#00e5c9]/40 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  >
                    {isCurrentActivePlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-1" />
                    )}
                  </button>
                </div>
              )}

              {/* Song Title & Artist Card Footer */}
              <div className="absolute bottom-0 inset-x-0 p-4 text-center">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-[#95a8b4] font-medium mt-0.5 truncate drop-shadow">
                  {item.artist}
                </p>
              </div>
            </div>
          );
        })}

        {/* Carousel Navigation Arrows */}
        <button
          onClick={handlePrev}
          aria-label="Previous featured track"
          className="absolute left-2 sm:left-4 z-40 p-2 rounded-full bg-[#0d181e]/80 hover:bg-[#162731] border border-[#1d313c] text-white hover:text-[#00e5c9] transition-all cursor-pointer backdrop-blur-md shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          aria-label="Next featured track"
          className="absolute right-2 sm:right-4 z-40 p-2 rounded-full bg-[#0d181e]/80 hover:bg-[#162731] border border-[#1d313c] text-white hover:text-[#00e5c9] transition-all cursor-pointer backdrop-blur-md shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-1">
        {FEATURED_ITEMS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`transition-all rounded-full cursor-pointer ${
              idx === activeIndex
                ? "w-6 h-2 bg-[#00e5c9] shadow-sm shadow-[#00e5c9]/50"
                : "w-2 h-2 bg-[#1b2d37] hover:bg-[#2b4452]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
