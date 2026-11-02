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

  // Combine popular mockup albums with catalog albums with de-duplication
  const combinedAlbums = React.useMemo(() => {
    const seen = new Set<string>();
    const list: DisplayAlbum[] = [];

    // 1. First add the curated popular albums
    for (const alb of POPULAR_ALBUMS_MOCKUP) {
      const key = alb.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        // If there is a matching catalog album with more tracks, attach them
        const catalogMatch = ALBUMS_CATALOG.find((c) => c.title.toLowerCase().trim() === key || c.id === alb.id);
        if (catalogMatch && catalogMatch.tracks && catalogMatch.tracks.length > 0) {
          list.push({
            ...alb,
            tracksCount: Math.max(alb.tracksCount || 0, catalogMatch.tracks.length),
            tracks: catalogMatch.tracks,
          });
        } else {
          list.push(alb);
        }
      }
    }

    // 2. Add remaining rich catalog albums
    for (const a of ALBUMS_CATALOG) {
      const key = a.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: a.id,
          title: a.title,
          artist: a.primaryArtist,
          subtitle: a.primaryArtist,
          coverUrl: a.coverUrl || "/albums/rockstar.webp",
          tracksCount: a.tracks.length,
          tracks: a.tracks,
        });
      }
    }

    return list;
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
    // Find matching catalog album if available
    const catalogMatch = ALBUMS_CATALOG.find(
      (a) => a.id === album.id || a.title.toLowerCase() === album.title.toLowerCase()
    );
    if (catalogMatch) {
      if (catalogMatch.tracks && catalogMatch.tracks.length > 0) {
        if (onPlayAlbum) onPlayAlbum(catalogMatch.tracks);
        else if (onPlayTrack) onPlayTrack(catalogMatch.tracks[0]);
      }
      if (onSelectAlbum) onSelectAlbum(catalogMatch);
    } else {
      const fullAlbum: Album = {
        id: album.id,
        title: album.title,
        releaseYear: 2024,
        type: "studio_album",
        primaryArtist: album.artist || album.subtitle || "Various Artists",
        featuredSingers: [],
        coverUrl: album.coverUrl,
        disambiguationLabel: `${album.artist || album.subtitle || "Various Artists"} • Popular Release`,
        genres: ["Pop", "Rock", "Alternative"],
        tracks:
          album.tracks && album.tracks.length > 0
            ? album.tracks
            : [
                {
                  id: `yt_${album.id}_1`,
                  title: `${album.title}`,
                  artist: album.artist || album.subtitle || "Popular Artist",
                  durationMs: 215000,
                  coverUrl: album.coverUrl,
                  url: `/api/stream/youtube?title=${encodeURIComponent(album.title)}&artist=${encodeURIComponent(
                    album.artist || album.subtitle || ""
                  )}`,
                  source: "youtube",
                  createdAt: 0,
                },
              ],
        totalDurationMs: 1800000,
        createdAt: 0,
      };

      if (fullAlbum.tracks.length > 0) {
        if (onPlayAlbum) onPlayAlbum(fullAlbum.tracks);
        else if (onPlayTrack) onPlayTrack(fullAlbum.tracks[0]);
      }
      if (onSelectAlbum) onSelectAlbum(fullAlbum);
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
        className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x snap-mandatory"
      >
        {combinedAlbums.map((album) => (
          <div
            key={album.id}
            onClick={() => handleAlbumClick(album)}
            className="group flex-shrink-0 w-[107px] min-w-[107px] max-w-[107px] snap-start cursor-pointer transition-transform duration-200 hover:-translate-y-1"
          >
            {/* Album Cover Art: clean square with subtle rounded corners matching mockup */}
            <div className="relative w-[107px] h-[107px] rounded-xl overflow-hidden bg-slate-900 shadow-md shadow-black/50 ring-1 ring-white/5">
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Hover Play Button Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#00e5ff] text-[#0a0e17] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.5)] transform scale-75 group-hover:scale-100 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Album Title & Artist */}
            <h3 className="text-xs font-semibold text-white truncate mt-2 group-hover:text-[#00e5ff] transition-colors leading-tight">
              {album.title}
            </h3>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{album.subtitle || album.artist}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
