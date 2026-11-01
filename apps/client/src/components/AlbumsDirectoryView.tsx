"use client";

import React, { useState } from "react";
import {
  Disc3,
  Search,
  Clapperboard,
  Play,
  Calendar,
  Sparkles,
} from "lucide-react";
import type { Album } from "@soundlounge/shared";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import { TrackArtwork } from "./TrackArtwork";

interface AlbumsDirectoryViewProps {
  onSelectAlbum: (album: Album) => void;
  onPlayAlbumQuick: (album: Album) => void;
}

type AlbumFilterTab =
  | "all"
  | "movie_soundtrack"
  | "studio_album"
  | "bollywood"
  | "punjabi"
  | "rock_pop";

export function AlbumsDirectoryView({
  onSelectAlbum,
  onPlayAlbumQuick,
}: AlbumsDirectoryViewProps) {
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

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = album.title.toLowerCase().includes(q);
      const matchArtist = album.primaryArtist.toLowerCase().includes(q);
      const matchSingers = album.featuredSingers.some((s) => s.toLowerCase().includes(q));
      const matchYear = album.releaseYear.toString().includes(q);
      const matchCast = album.movieDetails?.starCast.some((star) => star.toLowerCase().includes(q));
      const matchDirector = album.movieDetails?.musicDirectors.some((md) => md.toLowerCase().includes(q));

      if (
        !matchTitle &&
        !matchArtist &&
        !matchSingers &&
        !matchYear &&
        !matchCast &&
        !matchDirector
      ) {
        return false;
      }
    }

    return true;
  });

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
            Explore complete original tracklists, film albums with star cast credits, and studio releases.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search albums, movies, actors, year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d121c] border border-[#1b2230] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#586379] outline-none focus:border-[#00e5c9]/60 transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "All Releases" },
          { id: "movie_soundtrack", label: "Movie Soundtracks" },
          { id: "studio_album", label: "Studio Albums" },
          { id: "bollywood", label: "Bollywood" },
          { id: "punjabi", label: "Punjabi" },
          { id: "rock_pop", label: "Pop & Rock" },
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

      {/* Album Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlbums.map((album) => (
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

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/10">
                    <Calendar className="w-2.5 h-2.5 text-[#a0aec0]" />
                    <span>{album.releaseYear}</span>
                  </span>
                </div>

                {/* Quick Play Hover Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayAlbumQuick(album);
                  }}
                  className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#00e5c9] text-[#081014] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg cursor-pointer"
                  title="Play Album"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>

              {/* Title & Disambiguation info */}
              <div
                onClick={() => onSelectAlbum(album)}
                className="cursor-pointer space-y-1"
              >
                <h3 className="text-sm font-bold text-white group-hover:text-[#00e5c9] transition-colors truncate">
                  {album.title}
                </h3>
                <p className="text-[11px] text-[#718096] truncate">
                  {album.disambiguationLabel}
                </p>

                {album.movieDetails?.starCast && (
                  <p className="text-[10px] text-[#9ba5b9] truncate">
                    <span className="text-[#586379]">Cast: </span>
                    {album.movieDetails.starCast.join(", ")}
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
        ))}
      </div>
    </div>
  );
}
