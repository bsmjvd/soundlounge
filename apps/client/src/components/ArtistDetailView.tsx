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
        className="flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-accent transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Artists Directory</span>
      </button>

      {/* Artist Profile Header Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-surface border border-line p-6 sm:p-8 shadow-2xl">
        {/* Subtle Backdrop Scrim */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-xl scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${artist.avatarUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />

        {/* Artist Profile Details */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          {/* Verified High-Res Face Portrait */}
          <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-accent/40 shadow-2xl flex-shrink-0 bg-surface-raised">
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
              <span className="flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                <CheckCircle2 className="w-3 h-3" /> Verified Artist
              </span>
              <span className="flex items-center gap-1 text-[11px] text-ink-muted font-medium">
                <Globe className="w-3 h-3" /> {artist.regionLabel}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">{artist.name}</h1>
            <p className="text-xs text-ink-muted font-mono">Legal / Registered Name: {artist.realName}</p>

            <p className="text-xs text-ink-secondary max-w-xl line-clamp-3 leading-relaxed">{artist.bio}</p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-mono tabular-nums text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-accent" />
                <strong className="text-ink">{artist.monthlyListeners}</strong> monthly listeners
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-raised text-ink-muted">{artist.genre}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
            <button
              onClick={() => onPlayAll(artist.topTracks)}
              className="flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 rounded-control bg-accent hover:bg-accent-strong text-accent-foreground text-xs font-bold shadow-lg shadow-accent/30 hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play Top Tracks</span>
            </button>

            {allDiscographyTracks.length > artist.topTracks.length && (
              <button
                onClick={() => onPlayAll(allDiscographyTracks)}
                className="flex min-h-11 items-center justify-center gap-1.5 px-4 py-2.5 rounded-control bg-surface-raised hover:bg-surface-overlay border border-line-strong text-ink text-xs font-medium transition-colors cursor-pointer"
              >
                <Music2 className="w-3.5 h-3.5 text-accent" />
                <span>Play Discography ({allDiscographyTracks.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Discography Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab("top_tracks")}
          aria-pressed={activeTab === "top_tracks"}
          className={`flex min-h-11 items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "top_tracks"
              ? "bg-accent text-accent-foreground font-semibold shadow-sm"
              : "text-ink-muted hover:text-ink hover:bg-surface-raised"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Top Hits ({artist.topTracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("soundtracks_albums")}
          aria-pressed={activeTab === "soundtracks_albums"}
          className={`flex min-h-11 items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "soundtracks_albums"
              ? "bg-accent text-accent-foreground font-semibold shadow-sm"
              : "text-ink-muted hover:text-ink hover:bg-surface-raised"
          }`}
        >
          <Clapperboard className="w-3.5 h-3.5" />
          <span>Soundtracks & Albums ({artistAlbums.length})</span>
        </button>
      </div>

      {/* TAB 1: TOP TRACKS TABLE */}
      {activeTab === "top_tracks" && (
        <div className="animate-view-in rounded-2xl bg-surface border border-line p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-raised">
            <h2 className="text-sm font-bold text-ink tracking-tight flex items-center gap-2">
              <span>Popular Tracks by {artist.name}</span>
              <span className="text-xs text-ink-muted font-normal">({artist.topTracks.length} tracks)</span>
            </h2>
            <span className="text-[11px] text-ink-muted">Direct Edge Audio</span>
          </div>

          {/* Track Table Header */}
          <div className="hidden sm:grid grid-cols-[36px_1fr_90px_110px] items-center px-3 py-2 text-[11px] font-semibold text-ink-subtle uppercase tracking-wider border-b border-line">
            <span>#</span>
            <span>Title & Artist</span>
            <span className="text-right">Duration</span>
            <span className="text-right pr-2">Actions</span>
          </div>

          {/* Track Rows */}
          <div className="divide-y divide-line">
            {artist.topTracks.map((track, idx) => {
              const isThisTrack = currentTrack?.id === track.id;
              const liked = isLiked(track.id);

              return (
                <div
                  key={track.id}
                  className={`group grid grid-cols-[44px_1fr_auto] sm:grid-cols-[36px_1fr_90px_110px] items-center px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-colors ${
                    isThisTrack ? "bg-surface-raised" : "hover:bg-surface-raised"
                  }`}
                >
                  {/* Index / Play on Hover */}
                  <div className="relative flex h-11 w-11 items-center justify-center text-xs font-mono text-ink-subtle sm:h-8 sm:w-8">
                    {isThisTrack && isPlaying ? (
                      <span className="text-accent inline-flex items-end gap-0.5 h-3.5">
                        <span className="w-0.5 h-2 origin-bottom bg-accent animate-sound-wave-1" />
                        <span className="w-0.5 h-3.5 origin-bottom bg-accent animate-sound-wave-2" />
                        <span className="w-0.5 h-2.5 origin-bottom bg-accent animate-sound-wave-3" />
                      </span>
                    ) : (
                      <>
                        <span className="hidden sm:inline group-hover:opacity-0">{idx + 1}</span>
                        <button
                          onClick={() => onPlayTrack(track)}
                          aria-label={`Play ${track.title}`}
                          className="absolute inset-0 flex items-center justify-center text-accent opacity-100 transition-opacity hover:scale-110 cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                          title="Play Track"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Track Artwork + Details */}
                  <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                    <TrackArtwork
                      coverUrl={track.coverUrl}
                      trackId={track.id}
                      title={track.title}
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                      iconClassName="w-4 h-4 text-accent"
                    />
                    <div className="truncate">
                      <p
                        className={`text-xs font-semibold truncate transition-colors ${
                          isThisTrack ? "text-accent font-bold" : "text-ink group-hover:text-accent"
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[11px] text-ink-subtle truncate">{track.artist}</p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="hidden sm:block text-right text-xs font-mono tabular-nums text-ink-subtle">
                    {formatTime(track.durationMs)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => toggleLike(track)}
                      aria-label={liked ? `Unlike ${track.title}` : `Like ${track.title}`}
                      title={liked ? "Liked" : "Like Song"}
                      className={`min-h-11 min-w-11 flex items-center justify-center rounded-control transition-colors cursor-pointer ${
                        liked ? "text-like" : "text-ink-subtle hover:text-ink"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                    </button>

                    <button
                      onClick={() => onAddTrack(track, true)}
                      aria-label={`Play ${track.title} next`}
                      title="Play Next"
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-control text-ink-subtle hover:text-accent transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onAddTrack(track, false)}
                      aria-label={`Add ${track.title} to queue`}
                      title="Add to Queue"
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-control text-ink-subtle hover:text-ink transition-colors cursor-pointer"
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
            <div className="animate-view-in grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {artistAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => onSelectAlbum?.(album)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectAlbum?.(album);
                    }
                  }}
                  className="group p-4 rounded-2xl bg-surface hover:bg-surface-raised border border-line hover:border-accent/50 transition cursor-pointer shadow-lg space-y-3 focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-surface-raised">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-canvas/90 backdrop-blur-md border border-line text-[11px] font-mono text-accent">
                      {album.releaseYear}
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-canvas/90 backdrop-blur-md border border-line text-[11px] uppercase font-semibold text-ink-muted">
                      {album.type === "movie_soundtrack" ? "Movie OST" : "Album"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-ink group-hover:text-accent transition-colors truncate">
                      {album.title}
                    </h3>
                    <p className="text-xs text-ink-muted line-clamp-1">
                      {album.movieDetails?.starCast?.join(", ") || album.primaryArtist}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-ink-subtle pt-1">
                      <span>{album.tracks.length} original tracks</span>
                      <span className="text-accent group-hover:underline flex items-center gap-0.5">
                        View Album <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl border border-line bg-surface space-y-2">
              <Disc3 className="w-8 h-8 text-ink-subtle mx-auto" />
              <p className="text-xs font-semibold text-ink">
                No dedicated movie soundtracks or studio albums listed yet.
              </p>
              <p className="text-[11px] text-ink-muted">
                All available hit songs by {artist.name} can be played from Top Hits above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
