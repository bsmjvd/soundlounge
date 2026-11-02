"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { POPULAR_ARTISTS_MOCKUP, type DisplayArtist } from "../lib/data/mockupData";
import { ARTISTS_CATALOG, type ArtistProfileData } from "../lib/data/artistsCatalog";

interface PopularArtistsRowProps {
  onSelectArtist: (artist: ArtistProfileData) => void;
}

export function PopularArtistsRow({ onSelectArtist }: PopularArtistsRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Combine mockup artists with top catalog artists
  const combinedArtists = React.useMemo(() => {
    return [
      ...POPULAR_ARTISTS_MOCKUP,
      ...ARTISTS_CATALOG.filter(
        (a) => !POPULAR_ARTISTS_MOCKUP.some((m) => m.name.toLowerCase() === a.name.toLowerCase())
      ).map((a) => ({
        id: a.id,
        name: a.name,
        avatarUrl: a.avatarUrl,
        genre: a.genre,
        listeners: a.monthlyListeners,
      })),
    ];
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: "smooth" });
    }
  };

  const handleArtistClick = (artist: DisplayArtist) => {
    // Check if artist is in ARTISTS_CATALOG
    const catalogMatch = ARTISTS_CATALOG.find(
      (a) => a.id === artist.id || a.name.toLowerCase() === artist.name.toLowerCase()
    );

    if (catalogMatch) {
      onSelectArtist(catalogMatch);
    } else {
      // Build an ephemeral ArtistProfileData so detail view opens smoothly
      const fallbackProfile: ArtistProfileData = {
        id: artist.id,
        name: artist.name,
        realName: artist.name,
        genre: artist.genre,
        region: "global",
        regionLabel: "Global / Trending",
        avatarUrl: artist.avatarUrl,
        bannerUrl: artist.avatarUrl,
        monthlyListeners: artist.listeners || "10M+",
        bio: `${artist.name} is one of the world's premier recording artists and performers.`,
        topTracks: [
          {
            id: `yt_${artist.id}_top1`,
            title: `Best of ${artist.name}`,
            artist: artist.name,
            durationMs: 210000,
            coverUrl: artist.avatarUrl,
            url: `/api/stream/youtube?title=${encodeURIComponent(artist.name + " best song")}&artist=${encodeURIComponent(artist.name)}`,
            source: "youtube",
            createdAt: 0,
          },
        ],
      };
      onSelectArtist(fallbackProfile);
    }
  };

  return (
    <section className="w-full">
      {/* Header with Title and Minimalist Pagination Arrows */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">Popular Artists</h2>

        <div className="flex items-center gap-3">
          <button
            onClick={scrollLeft}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollRight}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal List of Circular Artist Avatars */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x snap-mandatory"
      >
        {combinedArtists.map((artist) => (
          <div
            key={artist.id}
            onClick={() => handleArtistClick(artist)}
            className="group flex-shrink-0 flex flex-col items-center w-[74px] snap-start cursor-pointer"
          >
            {/* Circular Avatar */}
            <div className="relative w-[74px] h-[74px] rounded-full overflow-hidden bg-slate-800 ring-2 ring-slate-800/80 group-hover:ring-[#00e5ff] shadow-md transition-all duration-300 group-hover:scale-105">
              <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" loading="lazy" />
            </div>

            {/* Centered Name */}
            <span className="text-xs font-medium text-slate-300 group-hover:text-white mt-2 text-center truncate w-full transition-colors">
              {artist.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
