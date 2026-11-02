"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Disc } from "lucide-react";
import type { Album, Track } from "@soundlounge/shared";
import { POPULAR_ALBUMS_MOCKUP, type DisplayAlbum } from "../lib/data/mockupData";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";

interface PopularAlbumsRowProps {
  onSelectAlbum?: (album: Album | DisplayAlbum) => void;
  onPlayAlbum?: (tracks: Track[]) => void;
  onPlayTrack?: (track: Track) => void;
}

export function PopularAlbumsRow({ onSelectAlbum, onPlayAlbum, onPlayTrack }: PopularAlbumsRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Combine mockup albums with top catalog albums
  const combinedAlbums = React.useMemo(() => {
    return [
      ...POPULAR_ALBUMS_MOCKUP,
      ...ALBUMS_CATALOG.slice(0, 8).map((a) => ({
        id: a.id,
        title: a.title,
        artist: a.primaryArtist,
        subtitle: a.primaryArtist,
        coverUrl:
          a.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        tracksCount: a.tracks.length,
        tracks: a.tracks,
      })),
    ];
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  const handleAlbumClick = (album: DisplayAlbum) => {
    if (album.tracks && album.tracks.length > 0) {
      if (onPlayAlbum) {
        onPlayAlbum(album.tracks);
      } else if (onPlayTrack) {
        onPlayTrack(album.tracks[0]);
      }
    }
    if (onSelectAlbum) {
      // Find matching catalog album if available
      const catalogMatch = ALBUMS_CATALOG.find((a) => a.id === album.id || a.title === album.title);
      if (catalogMatch) {
        onSelectAlbum(catalogMatch);
      } else {
        onSelectAlbum(album);
      }
    }
  };

  return (
    <section className="w-full">
      {/* Header with Title and Minimalist Pagination Arrows */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">Popular Albums</h2>

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

      {/* Horizontal Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x snap-mandatory"
      >
        {combinedAlbums.map((album) => (
          <div
            key={album.id}
            onClick={() => handleAlbumClick(album)}
            className="group flex-shrink-0 w-32 sm:w-36 lg:w-40 snap-start cursor-pointer transition-transform duration-200 hover:-translate-y-1"
          >
            {/* Album Cover Art: clean square with subtle rounded corners matching mockup */}
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-900 shadow-md shadow-black/50">
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Hover Play Button Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-[#00e5ff] text-[#0a0e17] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.5)] transform scale-75 group-hover:scale-100 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Album Title & Artist */}
            <h3 className="text-xs sm:text-sm font-medium text-white truncate mt-2 group-hover:text-[#00e5ff] transition-colors">
              {album.title}
            </h3>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{album.subtitle || album.artist}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
