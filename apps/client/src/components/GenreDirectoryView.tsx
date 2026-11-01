"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Play,
  Music2,
  Disc3,
  Users,
  Radio,
} from "lucide-react";
import type { Track, Album } from "@soundlounge/shared";
import { GENRE_DEFINITIONS, type MusicGenre } from "../lib/recommendation/genreTaxonomy";
import { ARTISTS_CATALOG, type ArtistProfileData } from "../lib/data/artistsCatalog";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";

interface GenreDirectoryViewProps {
  onPlayGenreRadio: (genre: MusicGenre) => void;
  onSelectArtist: (artist: ArtistProfileData) => void;
  onSelectAlbum: (album: Album) => void;
}

interface GenreCardInfo {
  id: MusicGenre;
  title: string;
  tagline: string;
  gradient: string;
  borderHover: string;
  iconColor: string;
}

const GENRE_CARDS: GenreCardInfo[] = [
  {
    id: "ghazal",
    title: "Ghazal & Sufi",
    tagline: "Timeless poetic verses, soulful harmoniums, and classical mastery",
    gradient: "from-[#382012]/80 to-[#19100a]/90",
    borderHover: "hover:border-[#d97706]/50",
    iconColor: "text-[#f59e0b]",
  },
  {
    id: "bollywood",
    title: "Bollywood & Filmi",
    tagline: "Grand cinematic melodies, romantic strings, and film soundtracks",
    gradient: "from-[#311024]/80 to-[#140810]/90",
    borderHover: "hover:border-[#ec4899]/50",
    iconColor: "text-[#f43f5e]",
  },
  {
    id: "punjabi",
    title: "Punjabi & Desi Hip-Hop",
    tagline: "High-voltage dhol grooves, gangsta rap, and arena folk fusions",
    gradient: "from-[#082a25]/80 to-[#051512]/90",
    borderHover: "hover:border-[#10b981]/50",
    iconColor: "text-[#10b981]",
  },
  {
    id: "pop",
    title: "Pop & Global R&B",
    tagline: "Billboard chart-toppers, modern synth rhythms, and velvet vocals",
    gradient: "from-[#171a3d]/80 to-[#0a0c1a]/90",
    borderHover: "hover:border-[#6366f1]/50",
    iconColor: "text-[#818cf8]",
  },
  {
    id: "hiphop",
    title: "Hip-Hop / Rap",
    tagline: "Heavy basslines, lyrical storytelling, and trap rhythms",
    gradient: "from-[#251528]/80 to-[#110913]/90",
    borderHover: "hover:border-[#a855f7]/50",
    iconColor: "text-[#c084fc]",
  },
  {
    id: "electronic",
    title: "Electronic & Synthwave",
    tagline: "Neon analog synthesizers, French touch house, and club anthems",
    gradient: "from-[#0c2438]/80 to-[#06121c]/90",
    borderHover: "hover:border-[#00e5c9]/50",
    iconColor: "text-[#00e5c9]",
  },
  {
    id: "rock",
    title: "Rock & Alternative",
    tagline: "Electric guitar anthems, driving drums, and raw vocal energy",
    gradient: "from-[#2f1816]/80 to-[#170a09]/90",
    borderHover: "hover:border-[#ef4444]/50",
    iconColor: "text-[#f87171]",
  },
];

export function GenreDirectoryView({
  onPlayGenreRadio,
  onSelectArtist,
  onSelectAlbum,
}: GenreDirectoryViewProps) {
  const [selectedGenre, setSelectedGenre] = useState<MusicGenre | null>(null);

  // Helper to find artists for a genre
  const getArtistsForGenre = (genreId: MusicGenre) => {
    return ARTISTS_CATALOG.filter((a) => {
      if (a.region === genreId) return true;
      const def = GENRE_DEFINITIONS[genreId];
      if (def && def.peerArtists.some((p) => p.toLowerCase().includes(a.name.toLowerCase()))) {
        return true;
      }
      return a.genre.toLowerCase().includes(genreId);
    });
  };

  // Helper to find albums for a genre
  const getAlbumsForGenre = (genreId: MusicGenre) => {
    return ALBUMS_CATALOG.filter((album) =>
      album.genres.some((g) => g.toLowerCase().includes(genreId))
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#00e5c9]" />
            <span>Genre Ecosystem & Similar Soundscapes</span>
          </h1>
          <p className="text-xs text-[#718096] mt-1">
            Browse musical genres, legendary artists, landmark albums, and launch continuous sound-alike mixes.
          </p>
        </div>
      </div>

      {/* Genre Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GENRE_CARDS.map((card) => {
          const artists = getArtistsForGenre(card.id);
          const albums = getAlbumsForGenre(card.id);
          const isSelected = selectedGenre === card.id;

          return (
            <div
              key={card.id}
              className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between bg-gradient-to-br ${
                card.gradient
              } ${
                isSelected
                  ? "border-[#00e5c9] ring-1 ring-[#00e5c9]/50"
                  : `border-[#1b2334] ${card.borderHover}`
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`p-2 rounded-xl bg-black/40 ${card.iconColor}`}>
                    <Music2 className="w-5 h-5" />
                  </span>
                  <button
                    onClick={() => onPlayGenreRadio(card.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e5c9] hover:bg-[#00cbb2] text-[#081014] text-xs font-bold transition-all shadow-md shadow-[#00e5c9]/20 hover:scale-105 cursor-pointer"
                    title={`Start ${card.title} Radio`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Mix</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-[#9ba5b9] mt-1 line-clamp-2">
                    {card.tagline}
                  </p>
                </div>

                {/* Leading Artists in Genre */}
                {artists.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Users className="w-3 h-3 text-[#00e5c9]" />
                      <span>Key Artists</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {artists.slice(0, 4).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => onSelectArtist(a)}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-black/40 hover:bg-black/80 text-white border border-white/10 hover:border-[#00e5c9]/40 transition-colors cursor-pointer"
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Albums in Genre */}
                {albums.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Disc3 className="w-3 h-3 text-indigo-400" />
                      <span>Soundtracks & Albums</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {albums.slice(0, 2).map((alb) => (
                        <button
                          key={alb.id}
                          onClick={() => onSelectAlbum(alb)}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-black/40 hover:bg-black/80 text-white border border-white/10 hover:border-indigo-400/40 transition-colors cursor-pointer truncate max-w-full"
                        >
                          {alb.title} ({alb.releaseYear})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8c94aa]">
                <span>{artists.length} artists cataloged</span>
                <button
                  onClick={() => onPlayGenreRadio(card.id)}
                  className="text-[#00e5c9] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Start Endless Station</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
