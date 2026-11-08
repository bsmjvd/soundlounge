"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { Album, Track } from "@soundlounge/shared";
import { POPULAR_ALBUMS_MOCKUP, type DisplayAlbum } from "../lib/data/mockupData";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { useTasteProfile } from "../lib/recommendation/useTasteProfile";

interface PopularAlbumsRowProps {
  onSelectAlbum?: (album: Album | DisplayAlbum) => void;
  onPlayAlbum?: (tracks: Track[]) => void;
  onPlayTrack?: (track: Track) => void;
}

export function PopularAlbumsRow({ onSelectAlbum, onPlayAlbum, onPlayTrack }: PopularAlbumsRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { rankAlbums, dominantGenre, hasTaste } = useTasteProfile();

  // Combine catalog albums with popular releases and dynamically rank by taste
  const combinedAlbums = React.useMemo(() => {
    const seen = new Set<string>();
    const list: DisplayAlbum[] = [];

    // Prioritized 2026 & iconic catalog albums for the top carousel
    const priorityIds = [
      "short_n_sweet_sabrina_carpenter",
      "gnx_kendrick_lamar",
      "hurry_up_tomorrow_the_weeknd",
      "hit_me_hard_and_soft_2024",
      "the_train_2007_mithoon",
      "train_2009_save_me_san_francisco",
      "train_2001_drops_of_jupiter",
      "the_unforgettables_1976",
      "starboy_2016",
      "discovery_2001_daft_punk",
    ];

    // 1. Add prioritized albums first
    for (const id of priorityIds) {
      const match = ALBUMS_CATALOG.find((a) => a.id === id);
      if (match) {
        const titleKey = match.title.toLowerCase().trim();
        seen.add(match.id);
        seen.add(titleKey);
        list.push({
          id: match.id,
          title: match.title,
          artist: match.primaryArtist,
          subtitle: match.primaryArtist,
          coverUrl: match.coverUrl || "/albums/rockstar.webp",
          tracksCount: match.tracks.length,
          tracks: match.tracks,
        });
      }
    }

    // 2. Add remaining authentic catalog albums
    for (const a of ALBUMS_CATALOG) {
      const titleKey = a.title.toLowerCase().trim();
      if (!seen.has(a.id) && !seen.has(titleKey)) {
        seen.add(a.id);
        seen.add(titleKey);
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

    // 3. Add additional mockup releases if not already present
    for (const alb of POPULAR_ALBUMS_MOCKUP) {
      const titleKey = alb.title.toLowerCase().trim();
      if (!seen.has(alb.id) && !seen.has(titleKey)) {
        seen.add(alb.id);
        seen.add(titleKey);
        list.push(alb);
      }
    }

    return rankAlbums(list);
  }, [rankAlbums]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      return;
    }
    const progress = Math.min(1, Math.max(0, el.scrollLeft / maxScroll));
    setScrollProgress(progress);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
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
      {/* Header with Title and Minimalist Pagination Arrows matching mockup */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
            {hasTaste ? "Albums Tailored To Your Vibe" : "Popular Albums"}
          </h2>
          {hasTaste && dominantGenre && (
            <p className="text-xs text-slate-400 mt-0.5">
              Highlighting releases in {dominantGenre.toUpperCase()} & related artists
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={scrollLeft}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-800/50"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollRight}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-800/50"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel with exact 1:1 aspect ratio and rounded card styling matching reference mockup */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3.5 sm:gap-4.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {combinedAlbums.map((album) => (
          <div
            key={album.id}
            onClick={() => handleAlbumClick(album)}
            className="group flex-shrink-0 w-[114px] min-w-[114px] sm:w-[128px] sm:min-w-[128px] md:w-[136px] md:min-w-[136px] lg:w-[140px] lg:min-w-[140px] snap-start cursor-pointer transition-all duration-200 hover:-translate-y-1 focus:outline-none"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleAlbumClick(album);
              }
            }}
          >
            {/* Album Cover Card: 1:1 Square with image filling card completely and smooth rounded corners matching mockup */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 shadow-md shadow-black/50 ring-1 ring-white/10 group-hover:ring-[#00e5ff]/50 transition-all duration-300">
              <ImageWithFallback
                src={album.coverUrl}
                alt={album.title}
                fallbackTitle={album.title}
                fallbackType="album"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Subtle bottom gradient scrim matching mockup card depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Hover Play Button Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#00e5ff] text-[#0a0e17] flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.7)] transform scale-75 group-hover:scale-100 transition-transform">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Album Title & Artist matching mockup typography */}
            <h3 className="text-xs sm:text-[13px] font-semibold text-white truncate mt-2 group-hover:text-[#00e5ff] transition-colors leading-tight">
              {album.title}
            </h3>
            <p className="text-[11px] text-[#7888a5] truncate mt-0.5 font-normal">
              {album.subtitle || album.artist}
            </p>
          </div>
        ))}
      </div>

      {/* Sleek horizontal scroll progress bar matching mockup */}
      <div className="w-44 sm:w-56 h-[3px] bg-[#0c222c] rounded-full overflow-hidden mt-3.5 relative">
        <div
          className="h-full bg-teal-400 rounded-full transition-transform duration-150 ease-out"
          style={{
            width: "35%",
            transform: `translateX(${scrollProgress * (100 / 0.35 - 100)}%)`,
          }}
        />
      </div>
    </section>
  );
}
