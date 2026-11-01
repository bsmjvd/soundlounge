"use client";

import React, { useState } from "react";
import {
  Disc3,
  Search,
  Clapperboard,
  Play,
  Calendar,
  Sparkles,
  Info,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import type { Album } from "@soundlounge/shared";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import { getDisambiguationCounterparts } from "../lib/services/metadataService";
import { TrackArtwork } from "./TrackArtwork";

interface AlbumsDirectoryViewProps {
  onSelectAlbum: (album: Album) => void;
  onPlayAlbumQuick: (album: Album) => void;
}

type AlbumFilterTab =
  | "all"
  | "movie_soundtrack"
  | "retro_classics"
  | "studio_album"
  | "bollywood"
  | "punjabi"
  | "rock_pop"
  | "electronic";

export function AlbumsDirectoryView({ onSelectAlbum, onPlayAlbumQuick }: AlbumsDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<AlbumFilterTab>("all");

  const filteredAlbums = ALBUMS_CATALOG.filter((album) => {
    // 1. Tab filter
    if (activeFilter === "movie_soundtrack" && album.type !== "movie_soundtrack") {
      return false;
    }
    if (activeFilter === "studio_album" && album.type !== "studio_album") {
      return false;
    }
    if (
      activeFilter === "retro_classics" &&
      !album.genres.some((g) => {
        const gl = g.toLowerCase();
        return gl.includes("retro") || gl.includes("golden era") || gl.includes("ghazal");
      }) &&
      album.releaseYear > 1999
    ) {
      return false;
    }
    if (activeFilter === "bollywood" && !album.genres.some((g) => g.toLowerCase().includes("bollywood"))) {
      return false;
    }
    if (activeFilter === "punjabi" && !album.genres.some((g) => g.toLowerCase().includes("punjabi"))) {
      return false;
    }
    if (
      activeFilter === "rock_pop" &&
      !album.genres.some((g) => {
        const gl = g.toLowerCase();
        return gl.includes("rock") || gl.includes("pop");
      })
    ) {
      return false;
    }
    if (
      activeFilter === "electronic" &&
      !album.genres.some((g) => {
        const gl = g.toLowerCase();
        return gl.includes("electronic") || gl.includes("french touch") || gl.includes("synthwave");
      })
    ) {
      return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = album.title.toLowerCase().includes(q);
      const matchArtist = album.primaryArtist.toLowerCase().includes(q);
      const matchSingers = album.featuredSingers.some((s) => s.toLowerCase().includes(q));
      const matchYear = album.releaseYear.toString().includes(q);
      const matchCast = album.movieDetails?.starCast.some((star) => star.toLowerCase().includes(q));
      const matchDirector = album.movieDetails?.musicDirectors.some((md) => md.toLowerCase().includes(q));
      const matchGenres = album.genres.some((g) => g.toLowerCase().includes(q));

      if (!matchTitle && !matchArtist && !matchSingers && !matchYear && !matchCast && !matchDirector && !matchGenres) {
        return false;
      }
    }

    return true;
  });

  // Spotlight releases for the Disambiguation Showcase
  const train2007 = ALBUMS_CATALOG.find((a) => a.id === "the_train_2007_mithoon");
  const train1970 = ALBUMS_CATALOG.find((a) => a.id === "the_train_1970_rd_burman");
  const trainBand = ALBUMS_CATALOG.find((a) => a.id === "train_2009_save_me_san_francisco");

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-[#00e5c9]" />
            <span>Albums & Movie Soundtracks</span>
          </h1>
          <p className="text-xs text-[#718096] mt-1">
            Complete original tracklists with star cast, director credits, and cross-era disambiguation.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search movie, album, actor, year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d121c] border border-[#1b2230] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#586379] outline-none focus:border-[#00e5c9]/60 transition-colors"
          />
        </div>
      </div>

      {/* Disambiguation Showcase Banner */}
      {!searchQuery && activeFilter === "all" && train2007 && train1970 && trainBand && (
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-[#0e1320] to-teal-950/30 p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#00e5c9]/15 text-[#00e5c9]">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Disambiguation Engine in Action</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#00e5c9]/20 text-[#00e5c9] font-mono">
                    3 Identical / Overlapping Entities
                  </span>
                </span>
                <p className="text-[11px] text-[#8c94aa] mt-0.5">
                  Soundlounge accurately separates identical titles across eras, film soundtracks, and bands:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSelectAlbum(train2007)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b2b] hover:bg-[#1b2438] text-white border border-[#25324d] text-xs font-semibold transition-all cursor-pointer group"
              >
                <Clapperboard className="w-3 h-3 text-[#00e5c9]" />
                <span>The Train (2007)</span>
                <span className="text-[10px] text-[#718096]">Mithoon</span>
                <ArrowRight className="w-3 h-3 text-[#00e5c9] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onSelectAlbum(train1970)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b2b] hover:bg-[#1b2438] text-white border border-[#25324d] text-xs font-semibold transition-all cursor-pointer group"
              >
                <Clapperboard className="w-3 h-3 text-amber-400" />
                <span>The Train (1970)</span>
                <span className="text-[10px] text-[#718096]">R.D. Burman</span>
                <ArrowRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onSelectAlbum(trainBand)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b2b] hover:bg-[#1b2438] text-white border border-[#25324d] text-xs font-semibold transition-all cursor-pointer group"
              >
                <Disc3 className="w-3 h-3 text-cyan-400" />
                <span>Train (Rock Band)</span>
                <span className="text-[10px] text-[#718096]">Hey Soul Sister</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "All Releases" },
          { id: "movie_soundtrack", label: "Movie Soundtracks" },
          { id: "retro_classics", label: "Classic Retro (60s–90s)" },
          { id: "studio_album", label: "Studio Albums" },
          { id: "bollywood", label: "Bollywood" },
          { id: "punjabi", label: "Punjabi" },
          { id: "rock_pop", label: "Pop & Rock" },
          { id: "electronic", label: "Electronic" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as AlbumFilterTab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === tab.id
                ? "bg-[#00e5c9] text-[#081014] shadow-sm shadow-[#00e5c9]/30"
                : "bg-[#0f1420] text-[#718096] hover:text-white border border-[#1c2436] hover:bg-[#151c2d]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredAlbums.length === 0 && (
        <div className="rounded-2xl border border-[#182030] bg-[#0c101a] p-12 text-center space-y-3">
          <Disc3 className="w-10 h-10 text-[#586379] mx-auto animate-spin" />
          <p className="text-sm font-semibold text-white">No albums or soundtracks match your query.</p>
          <p className="text-xs text-[#718096]">
            Try searching for &quot;The Train&quot;, &quot;Emraan Hashmi&quot;, &quot;Rajesh Khanna&quot;, or &quot;Daft Punk&quot;.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("all");
            }}
            className="px-4 py-2 rounded-xl bg-[#141b2b] text-white hover:bg-[#1d263b] text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Album Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlbums.map((album) => {
          const counterparts = getDisambiguationCounterparts(album.id);
          const hasDisambiguation = counterparts.length > 0;

          return (
            <div
              key={album.id}
              className="group relative rounded-2xl bg-[#0c101a] border border-[#182030] hover:border-[#00e5c9]/50 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-[#00e5c9]/5 flex flex-col justify-between"
            >
              <div>
                {/* Cover & Badges */}
                <div
                  onClick={() => onSelectAlbum(album)}
                  className="relative rounded-xl overflow-hidden aspect-square mb-3 cursor-pointer"
                >
                  <TrackArtwork
                    coverUrl={album.coverUrl}
                    trackId={album.id}
                    title={album.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    iconClassName="w-12 h-12"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-black/60 backdrop-blur-md text-[#00e5c9] border border-white/10">
                      {album.type === "movie_soundtrack" ? (
                        <>
                          <Clapperboard className="w-2.5 h-2.5" />
                          <span>Movie</span>
                        </>
                      ) : (
                        <>
                          <Disc3 className="w-2.5 h-2.5" />
                          <span>Album</span>
                        </>
                      )}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {hasDisambiguation && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/80 backdrop-blur-md text-black border border-amber-300/40">
                          <Info className="w-2.5 h-2.5" />
                          <span>Disambiguated</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/10">
                        <Calendar className="w-2.5 h-2.5 text-[#a0aec0]" />
                        <span>{album.releaseYear}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quick Play Hover Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayAlbumQuick(album);
                    }}
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#00e5c9] text-[#081014] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg cursor-pointer"
                    title="Play Entire Album"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>

                {/* Title & Disambiguation info */}
                <div onClick={() => onSelectAlbum(album)} className="cursor-pointer space-y-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#00e5c9] transition-colors truncate">
                    {album.title}
                  </h3>
                  <p className="text-[11px] text-[#718096] truncate">{album.disambiguationLabel}</p>

                  {album.movieDetails?.starCast && (
                    <p className="text-[10px] text-[#9ba5b9] truncate">
                      <span className="text-[#586379]">Cast: </span>
                      {album.movieDetails.starCast.join(", ")}
                    </p>
                  )}
                  {album.movieDetails?.musicDirectors && (
                    <p className="text-[10px] text-indigo-400/90 truncate">
                      <span className="text-[#586379]">Music: </span>
                      {album.movieDetails.musicDirectors.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom info */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#151c2a] text-[11px] text-[#586379]">
                <span>{album.tracks.length} original tracks</span>
                <button
                  onClick={() => onSelectAlbum(album)}
                  className="text-[11px] font-semibold text-[#00e5c9] hover:underline cursor-pointer"
                >
                  View Tracklist →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
