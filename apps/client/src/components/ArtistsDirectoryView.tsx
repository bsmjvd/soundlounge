"use client";

import React, { useState, useMemo } from "react";
import { Users, Search, Play, CheckCircle2 } from "lucide-react";
import { ARTISTS_CATALOG, type ArtistProfileData, type RegionKey } from "../lib/data/artistsCatalog";

interface ArtistsDirectoryViewProps {
  onSelectArtist: (artist: ArtistProfileData) => void;
  onPlayArtistTopSongs?: (artist: ArtistProfileData) => void;
}

const ALPHABET = [
  "ALL",
  "#",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const REGION_TABS: { id: RegionKey; label: string }[] = [
  { id: "all", label: "All Artists" },
  { id: "bollywood", label: "Bollywood & Hindi" },
  { id: "ghazal", label: "Ghazal & Sufi" },
  { id: "punjabi", label: "Punjabi & Desi" },
  { id: "retro", label: "Classic Retro (60s–80s)" },
  { id: "rock", label: "Rock & Bands" },
  { id: "global", label: "Pop & Global" },
  { id: "hiphop", label: "Hip-Hop & Rap" },
  { id: "electronic", label: "Electronic & EDM" },
];

export function ArtistsDirectoryView({ onSelectArtist, onPlayArtistTopSongs }: ArtistsDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("ALL");
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("all");

  const filteredArtists = useMemo(() => {
    return ARTISTS_CATALOG.filter((artist) => {
      // 1. Region filter
      if (selectedRegion !== "all" && artist.region !== selectedRegion) {
        return false;
      }

      // 2. Letter filter
      if (selectedLetter !== "ALL") {
        if (selectedLetter === "#") {
          if (/^[A-Za-z]/.test(artist.name)) return false;
        } else {
          if (!artist.name.toUpperCase().startsWith(selectedLetter)) return false;
        }
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = artist.name.toLowerCase().includes(q);
        const matchRealName = artist.realName.toLowerCase().includes(q);
        const matchGenre = artist.genre.toLowerCase().includes(q);
        const matchRegion = artist.regionLabel.toLowerCase().includes(q);
        const matchRole = artist.roles?.some((r) => r.toLowerCase().includes(q));

        if (!matchName && !matchRealName && !matchGenre && !matchRegion && !matchRole) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedLetter, selectedRegion]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header with Stats & Live Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00e5c9]" />
            <span>Artists & Vocalists Directory</span>
          </h1>
          <p className="text-xs text-[#718492] mt-1">
            Browse verified playback vocalists, composers, bands, and producers across genres and eras.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5c707d]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by artist, legal name, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-[#0d181e] border border-[#1b313f] focus:border-[#00e5c9] rounded-xl pl-10 pr-4 text-xs text-white placeholder-[#5c707d] outline-none transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* 2. A–Z Alphabetical Quick Jump Bar */}
      <div className="bg-[#0b1419] p-2 rounded-2xl border border-[#162732] overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[10px] font-semibold text-[#5c707d] uppercase tracking-wider px-2 flex-shrink-0">
            Jump to:
          </span>
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
                selectedLetter === letter
                  ? "bg-[#00e5c9] text-[#081014] shadow-sm shadow-[#00e5c9]/40"
                  : "text-[#718593] hover:text-white hover:bg-[#12232c]"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Musical Region / Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {REGION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedRegion(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedRegion === tab.id
                ? "bg-[#00e5c9] text-[#081014] font-semibold shadow-sm shadow-[#00e5c9]/30"
                : "bg-[#0d181e] hover:bg-[#142631] text-[#7d909d] hover:text-white border border-[#1a2d39]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Results Header & Count */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">
            {selectedRegion === "all" ? "All Catalog Artists" : REGION_TABS.find((t) => t.id === selectedRegion)?.label}
          </span>
          <span className="text-xs text-[#718593]">
            ({filteredArtists.length} {filteredArtists.length === 1 ? "artist" : "artists"})
          </span>
        </div>

        {selectedLetter !== "ALL" && (
          <button
            onClick={() => setSelectedLetter("ALL")}
            className="text-xs text-[#00e5c9] hover:underline cursor-pointer"
          >
            Clear letter filter ({selectedLetter})
          </button>
        )}
      </div>

      {/* 5. High-Density Responsive Artist Cards Grid */}
      {filteredArtists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => onSelectArtist(artist)}
              className="group relative flex flex-col p-3 rounded-2xl bg-[#0c161d] hover:bg-[#101f28] border border-[#182b36] hover:border-[#00e5c9]/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-[#00e5c9]/5"
            >
              {/* Circular / Rounded Face Portrait */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#14232c] mb-3">
                <img
                  src={artist.avatarUrl}
                  alt={artist.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80";
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />

                {/* Subtle scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#081014]/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Verified Badge */}
                <div className="absolute top-2 right-2 p-1 rounded-full bg-[#081014]/80 backdrop-blur-md border border-[#1b313f] text-[#00e5c9]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>

                {/* Hover Play Button */}
                {onPlayArtistTopSongs && artist.topTracks.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayArtistTopSongs(artist);
                    }}
                    title={`Play ${artist.name} Top Songs`}
                    className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#00e5c9] text-[#081014] flex items-center justify-center shadow-lg shadow-[#00e5c9]/40 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-10"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                )}
              </div>

              {/* Artist Meta */}
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white truncate group-hover:text-[#00e5c9] transition-colors">
                  {artist.name}
                </h3>

                <p className="text-[11px] text-[#718593] truncate font-medium">
                  {artist.roles?.[0] || artist.genre.split("/")[0].trim()}
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#5c707d] pt-1">
                  <span className="font-mono tabular-nums text-[#8ca0ad]">{artist.monthlyListeners} monthly</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#13242e] text-[#718593]">
                    {artist.topTracks.length} hits
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Zero Results & Discovery fallback */
        <div className="text-center py-16 rounded-2xl border border-[#182b36] bg-[#0c161d] space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#13242e] border border-[#1b3442] flex items-center justify-center mx-auto text-[#00e5c9]">
            <Users className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              No catalog artists found matching &ldquo;{searchQuery || selectedLetter}&rdquo;
            </p>
            <p className="text-xs text-[#718593] max-w-md mx-auto">
              Soundlounge indexes thousands of vocalists. Try clearing filters or use the global music search to stream
              songs from any artist worldwide.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedLetter("ALL");
                setSelectedRegion("all");
              }}
              className="px-4 py-2 rounded-xl bg-[#12222b] hover:bg-[#1a313e] border border-[#1b313f] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
