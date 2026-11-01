"use client";

import React, { useState, useMemo } from "react";
import {
  Play,
  ArrowLeft,
  CheckCircle2,
  Users,
  Plus,
  ArrowRight,
  Heart,
  Globe,
  Disc3,
  Music2,
  Sparkles,
  Clapperboard,
} from "lucide-react";
import type { Track, Album } from "@soundlounge/shared";
import type { ArtistProfileData } from "../lib/data/artistsCatalog";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import { useLibraryStore } from "../lib/store/useLibraryStore";
import { TrackArtwork } from "./TrackArtwork";

interface ArtistDetailViewProps {
  artist: ArtistProfileData;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onAddTrack: (track: Track, playNext?: boolean) => void;
  onPlayAll: (tracks: Track[]) => void;
  onSelectAlbum?: (album: Album) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

type DiscographyTab = "top_tracks" | "soundtracks_albums" | "collaborations";

export function ArtistDetailView({
  artist,
  onBack,
  onPlayTrack,
  onAddTrack,
  onPlayAll,
  onSelectAlbum,
  currentTrack,
  isPlaying,
}: ArtistDetailViewProps) {
  const { isLiked, toggleLike } = useLibraryStore();
  const [activeTab, setActiveTab] = useState<DiscographyTab>("top_tracks");

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Find all albums from ALBUMS_CATALOG that match this artist
  const artistAlbums = useMemo(() => {
    const artistClean = artist.name.toLowerCase().trim();
    const matches: Album[] = [];
    const seenIds = new Set<string>();

    for (const alb of ALBUMS_CATALOG) {
      const isPrimary = alb.primaryArtist.toLowerCase().includes(artistClean);
      const isSinger = alb.featuredSingers.some((s) => s.toLowerCase().includes(artistClean));
      const isDirector = alb.movieDetails?.musicDirectors.some((m) => m.toLowerCase().includes(artistClean));

      if (isPrimary || isSinger || isDirector) {
        if (!seenIds.has(alb.id)) {
          seenIds.add(alb.id);
          matches.push(alb);
        }
      }
    }

    return matches;
  }, [artist.name]);

  // All songs by the artist across top tracks and albums
  const allDiscographyTracks = useMemo(() => {
    const list: Track[] = [...artist.topTracks];
    const seenIds = new Set(list.map((t) => t.id));

    for (const alb of artistAlbums) {
      for (const t of alb.tracks) {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          list.push(t);
        }
      }
    }
    return list;
  }, [artist.topTracks, artistAlbums]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-medium text-[#738896] hover:text-[#00e5c9] transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Artists Directory</span>
      </button>

      {/* Artist Profile Header Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-[#0d181e] border border-[#1a2c35] p-6 sm:p-8 shadow-2xl">
        {/* Subtle Backdrop Scrim */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-xl scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${artist.avatarUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081014] via-[#081014]/60 to-transparent" />

        {/* Artist Profile Details */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          {/* Verified High-Res Face Portrait */}
          <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-[#00e5c9]/40 shadow-2xl flex-shrink-0 bg-[#0f1f28]">
            <img
              src={artist.avatarUrl}
              alt={artist.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80";
              }}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Name & Bio */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#00e5c9] bg-[#00e5c9]/10 px-2 py-0.5 rounded-full border border-[#00e5c9]/20">
                <CheckCircle2 className="w-3 h-3" /> Verified Artist
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#718593] font-medium">
                <Globe className="w-3 h-3" /> {artist.regionLabel}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{artist.name}</h1>
            <p className="text-xs text-[#6e828f] font-mono">Legal / Registered Name: {artist.realName}</p>

            <p className="text-xs text-[#8c9fae] max-w-xl line-clamp-3 leading-relaxed">{artist.bio}</p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-mono tabular-nums text-[#8c9fae]">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#00e5c9]" />
                <strong className="text-white">{artist.monthlyListeners}</strong> monthly listeners
              </span>
              <span className="px-2 py-0.5 rounded bg-[#13222a] text-[#718593]">{artist.genre}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
            <button
              onClick={() => onPlayAll(artist.topTracks)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00e5c9] hover:bg-[#1cebd2] text-[#081014] text-xs font-bold shadow-lg shadow-[#00e5c9]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play Top Tracks</span>
            </button>

            {allDiscographyTracks.length > artist.topTracks.length && (
              <button
                onClick={() => onPlayAll(allDiscographyTracks)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#12222b] hover:bg-[#192f3c] border border-[#1b3444] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Music2 className="w-3.5 h-3.5 text-[#00e5c9]" />
                <span>Play Discography ({allDiscographyTracks.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Discography Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#152530] pb-2">
        <button
          onClick={() => setActiveTab("top_tracks")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "top_tracks"
              ? "bg-[#00e5c9] text-[#081014] font-semibold shadow-sm"
              : "text-[#718492] hover:text-white hover:bg-[#101e26]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Top Hits ({artist.topTracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("soundtracks_albums")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "soundtracks_albums"
              ? "bg-[#00e5c9] text-[#081014] font-semibold shadow-sm"
              : "text-[#718492] hover:text-white hover:bg-[#101e26]"
          }`}
        >
          <Clapperboard className="w-3.5 h-3.5" />
          <span>Soundtracks & Albums ({artistAlbums.length})</span>
        </button>
      </div>

      {/* TAB 1: TOP TRACKS TABLE */}
      {activeTab === "top_tracks" && (
        <div className="rounded-2xl bg-[#0d181e] border border-[#1a2c35] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#14232c]">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Popular Tracks by {artist.name}</span>
              <span className="text-xs text-[#6e828f] font-normal">({artist.topTracks.length} tracks)</span>
            </h2>
            <span className="text-[11px] text-[#6e828f]">Direct Edge Audio</span>
          </div>

          {/* Track Table Header */}
          <div className="grid grid-cols-[36px_1fr_90px_110px] items-center px-3 py-2 text-[10px] font-semibold text-[#5c707d] uppercase tracking-wider border-b border-[#132129]">
            <span>#</span>
            <span>Title & Artist</span>
            <span className="text-right">Duration</span>
            <span className="text-right pr-2">Actions</span>
          </div>

          {/* Track Rows */}
          <div className="divide-y divide-[#132129]">
            {artist.topTracks.map((track, idx) => {
              const isThisTrack = currentTrack?.id === track.id;
              const liked = isLiked(track.id);

              return (
                <div
                  key={track.id}
                  className={`group grid grid-cols-[36px_1fr_90px_110px] items-center px-3 py-2.5 rounded-xl transition-colors ${
                    isThisTrack ? "bg-[#112129]" : "hover:bg-[#101e25]"
                  }`}
                >
                  {/* Index / Play on Hover */}
                  <div className="text-xs font-mono text-[#5c707d]">
                    {isThisTrack && isPlaying ? (
                      <span className="text-[#00e5c9] inline-flex items-end gap-0.5 h-3.5">
                        <span className="w-0.5 h-2 bg-[#00e5c9] animate-pulse" />
                        <span className="w-0.5 h-3.5 bg-[#00e5c9] animate-pulse" style={{ animationDelay: "150ms" }} />
                        <span className="w-0.5 h-2.5 bg-[#00e5c9] animate-pulse" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : (
                      <span className="group-hover:hidden">{idx + 1}</span>
                    )}
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="hidden group-hover:inline-flex text-[#00e5c9] hover:scale-110 transition-transform cursor-pointer"
                      title="Play Track"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  {/* Track Artwork + Details */}
                  <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                    <TrackArtwork
                      coverUrl={track.coverUrl}
                      trackId={track.id}
                      title={track.title}
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                      iconClassName="w-4 h-4 text-[#00e5c9]"
                    />
                    <div className="truncate">
                      <p
                        className={`text-xs font-semibold truncate transition-colors ${
                          isThisTrack ? "text-[#00e5c9] font-bold" : "text-white group-hover:text-[#00e5c9]"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[#697d8b] truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-right text-xs font-mono tabular-nums text-[#697d8b]">
                    {formatTime(track.durationMs)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => toggleLike(track)}
                      title={liked ? "Liked" : "Like Song"}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        liked ? "text-[#f43f5e]" : "text-[#586d79] hover:text-white"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                    </button>

                    <button
                      onClick={() => onAddTrack(track, true)}
                      title="Play Next"
                      className="p-1.5 rounded text-[#586d79] hover:text-[#00e5c9] transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onAddTrack(track, false)}
                      title="Add to Queue"
                      className="p-1.5 rounded text-[#586d79] hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SOUNDTRACKS & ALBUMS GRID */}
      {activeTab === "soundtracks_albums" && (
        <div className="space-y-4">
          {artistAlbums.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {artistAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => onSelectAlbum?.(album)}
                  className="group p-4 rounded-2xl bg-[#0c161d] hover:bg-[#101f28] border border-[#182b36] hover:border-[#00e5c9]/50 transition-all cursor-pointer shadow-lg space-y-3"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#14232c]">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#081014]/90 backdrop-blur-md border border-[#1b313f] text-[10px] font-mono text-[#00e5c9]">
                      {album.releaseYear}
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#081014]/90 backdrop-blur-md border border-[#1b313f] text-[10px] uppercase font-semibold text-[#8ca0ad]">
                      {album.type === "movie_soundtrack" ? "Movie OST" : "Album"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#00e5c9] transition-colors truncate">
                      {album.title}
                    </h3>
                    <p className="text-xs text-[#718492] line-clamp-1">
                      {album.movieDetails?.starCast?.join(", ") || album.primaryArtist}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-[#5c707d] pt-1">
                      <span>{album.tracks.length} original tracks</span>
                      <span className="text-[#00e5c9] group-hover:underline flex items-center gap-0.5">
                        View Album <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl border border-[#182b36] bg-[#0c161d] space-y-2">
              <Disc3 className="w-8 h-8 text-[#5c707d] mx-auto" />
              <p className="text-xs font-semibold text-white">
                No dedicated movie soundtracks or studio albums listed yet.
              </p>
              <p className="text-[11px] text-[#718492]">
                All available hit songs by {artist.name} can be played from Top Hits above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
