"use client";

import React, { useState } from "react";
import { Users, Play, Sparkles } from "lucide-react";
import { ARTISTS_CATALOG, type RegionKey, type ArtistProfileData } from "../lib/data/artistsCatalog";

interface RecentArtistsGridProps {
  onSelectArtist: (artist: ArtistProfileData) => void;
}

export function RecentArtistsGrid({ onSelectArtist }: RecentArtistsGridProps) {
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("all");

  const filteredArtists =
    selectedRegion === "all"
      ? ARTISTS_CATALOG
      : ARTISTS_CATALOG.filter((a) => a.region === selectedRegion);

  return (
    <div className="space-y-3.5">
      {/* Header with Title and Count */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Users className="w-4 h-4 text-[#00e5c9]" />
          <span>Popular Artists</span>
        </h3>
        <span className="text-[11px] text-[#697c88] font-medium">Verified Voices</span>
      </div>

      {/* Region Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "All" },
          { id: "global", label: "Global" },
          { id: "punjabi", label: "Punjabi" },
          { id: "ghazal", label: "Ghazal" },
          { id: "hiphop", label: "Hip-Hop" },
          { id: "electronic", label: "EDM" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedRegion(tab.id as RegionKey)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedRegion === tab.id
                ? "bg-[#00e5c9] text-[#081014] shadow-sm shadow-[#00e5c9]/30"
                : "bg-[#0d181e] hover:bg-[#15252f] text-[#718593] hover:text-white border border-[#1a2c35]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2x3 Grid with Authentic Face Portraits */}
      <div className="grid grid-cols-2 gap-3">
        {filteredArtists.slice(0, 6).map((artist) => (
          <div
            key={artist.id}
            onClick={() => onSelectArtist(artist)}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-[#0d181e] border border-[#1a2c35] hover:border-[#00e5c9]/60 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#00e5c9]/10"
          >
            {/* Real Face Portrait from YouTube Verified CDN */}
            <img
              src={artist.avatarUrl}
              alt={artist.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
            />

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#081014]/95 via-[#081014]/30 to-transparent" />

            {/* Hover Play / View Indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 backdrop-blur-[1px]">
              <div className="w-10 h-10 rounded-full bg-[#00e5c9] text-[#081014] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>

            {/* Real Artist Info Footer */}
            <div className="absolute bottom-0 inset-x-0 p-2.5 text-center">
              <p className="text-xs font-semibold text-white truncate drop-shadow group-hover:text-[#00e5c9] transition-colors">
                {artist.name}
              </p>
              <p className="text-[10px] text-[#718490] truncate drop-shadow font-mono tabular-nums">
                {artist.monthlyListeners} monthly
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
