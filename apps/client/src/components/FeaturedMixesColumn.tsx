"use client";

import React from "react";
import { Play, Pause, Heart, MoreHorizontal, X, Disc3 } from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { useLibraryStore } from "../lib/store/useLibraryStore";

interface FeaturedMixesColumnProps {
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onClose?: () => void;
}

export interface FeaturedMix {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  durationMs: number;
  tag?: string;
}

const FEATURED_MIXES: FeaturedMix[] = [
  {
    id: "yt_PQ20sKYGjYU",
    title: "Neon Cyber Synthwave",
    artist: "Retro Sunset Drive Sessions",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=700&auto=format&fit=crop&q=80",
    durationMs: 340000,
    tag: "Synthwave",
  },
  {
    id: "yt_m_GoB8SFOeM",
    title: "Deep House & Vocal Sessions",
    artist: "Ibiza Club Sunset Mix",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&auto=format&fit=crop&q=80",
    durationMs: 420000,
    tag: "Deep House",
  },
  {
    id: "yt_rFZHOHl-L8A",
    title: "Lo-Fi Beats to Relax & Code",
    artist: "Midnight Chillhop Radio",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=700&auto=format&fit=crop&q=80",
    durationMs: 310000,
    tag: "Lo-Fi Lounge",
  },
];

export function FeaturedMixesColumn({
  onPlayTrack,
  currentTrack,
  isPlaying,
  onClose,
}: FeaturedMixesColumnProps) {
  const { isLiked, toggleLike } = useLibraryStore();

  const handlePlayMix = (mix: FeaturedMix) => {
    const track: Track = {
      id: mix.id,
      title: mix.title,
      artist: mix.artist,
      coverUrl: mix.coverUrl,
      durationMs: mix.durationMs,
      url: `/api/stream/youtube?id=${mix.id.replace("yt_", "")}`,
      source: "youtube",
      createdAt: Date.now(),
    };
    onPlayTrack(track);
  };

  return (
    <div className="space-y-4">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-[#00e5c9]" />
          <span>Top Remixes & Mixes</span>
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-[#607380] hover:text-white transition-colors cursor-pointer rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3 Tall Vertical Cards */}
      <div className="space-y-4">
        {FEATURED_MIXES.map((mix) => {
          const isThisPlaying = currentTrack?.id === mix.id && isPlaying;
          const liked = isLiked(mix.id);

          return (
            <div
              key={mix.id}
              onClick={() => handlePlayMix(mix)}
              className="group relative rounded-2xl overflow-hidden bg-[#0d181e] border border-[#1a2c35] hover:border-[#00e5c9]/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#00e5c9]/10"
            >
              {/* Image Container with 4:3 Aspect Ratio */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={mix.coverUrl}
                  alt={mix.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#081014] via-[#081014]/20 to-transparent" />

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 backdrop-blur-[1px]">
                  <div className="w-12 h-12 rounded-full bg-[#00e5c9] text-[#081014] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform">
                    {isThisPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Tag Badge */}
                {mix.tag && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#081014]/80 text-[#00e5c9] border border-[#00e5c9]/30 backdrop-blur-md">
                    {mix.tag}
                  </span>
                )}
              </div>

              {/* Card Footer: Metadata and Action Buttons */}
              <div className="p-3.5 flex items-center justify-between gap-2">
                <div className="truncate">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#00e5c9] transition-colors">
                    {mix.title}
                  </h4>
                  <p className="text-[11px] text-[#718490] truncate mt-0.5">{mix.artist}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike({
                        id: mix.id,
                        title: mix.title,
                        artist: mix.artist,
                        coverUrl: mix.coverUrl,
                        durationMs: mix.durationMs,
                        url: `/api/stream/youtube?id=${mix.id.replace("yt_", "")}`,
                        source: "youtube",
                        createdAt: Date.now(),
                      });
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      liked ? "text-[#f43f5e]" : "text-[#586d79] hover:text-white"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-[#586d79] hover:text-white transition-colors cursor-pointer"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
