"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { POPULAR_ARTISTS_MOCKUP, type DisplayArtist } from "../lib/data/mockupData";
import { ARTISTS_CATALOG, type ArtistProfileData } from "../lib/data/artistsCatalog";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { useTasteProfile } from "../lib/recommendation/useTasteProfile";

interface PopularArtistsRowProps {
  onSelectArtist: (artist: ArtistProfileData) => void;
}

export function PopularArtistsRow({ onSelectArtist }: PopularArtistsRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { rankDisplayArtists, dominantArtist, dominantGenre, hasTaste } = useTasteProfile();

  // Combine mockup artists with top catalog artists and dynamically rank by taste
  const combinedArtists = React.useMemo(() => {
    const rawList: DisplayArtist[] = [
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
    return rankDisplayArtists(rawList);
  }, [rankDisplayArtists]);

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
    const catalogMatch = ARTISTS_CATALOG.find(
      (a) => a.id === artist.id || a.name.toLowerCase() === artist.name.toLowerCase()
    );

    if (catalogMatch) {
      onSelectArtist(catalogMatch);
    } else {
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
      {/* Header with Title and Minimalist Pagination Arrows matching mockup */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-ink font-display">
            {hasTaste ? "Artists You Love & Similar" : "Popular Artists"}
          </h2>
          {hasTaste && dominantGenre && (
            <p className="text-xs text-ink-muted mt-0.5">
              Ranked dynamically by your listening in {dominantGenre.toUpperCase()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={scrollLeft}
            className="text-ink-muted hover:text-ink transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-raised/50"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollRight}
            className="text-ink-muted hover:text-ink transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-raised/50"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal List of Circular Artist Avatars */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {combinedArtists.map((artist) => (
          <div
            key={artist.id}
            onClick={() => handleArtistClick(artist)}
            className="group flex-shrink-0 flex flex-col items-center w-[68px] sm:w-[84px] snap-start cursor-pointer rounded-control focus-visible:ring-2 focus-visible:ring-accent"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleArtistClick(artist);
              }
            }}
          >
            {/* Circular Avatar with Glowing Ambient Halo on Hover */}
            <div className="relative w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-full overflow-hidden bg-surface-raised/80 ring-2 ring-ink/15 group-hover:ring-accent shadow-xl shadow-black/50 transition duration-300 group-hover:scale-105 group-hover:shadow-glow">
              <ImageWithFallback
                src={artist.avatarUrl}
                alt={artist.name}
                fallbackTitle={artist.name}
                fallbackType="artist"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* Verified Badge icon on hover */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-accent rounded-full flex items-center justify-center text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </div>

            {/* Centered Name */}
            <span className="text-xs font-medium text-ink-secondary group-hover:text-ink mt-2.5 text-center truncate w-full transition-colors leading-tight">
              {artist.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
