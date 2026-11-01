"use client";

import React from "react";
import {
  ArrowLeft,
  Play,
  ListPlus,
  Disc3,
  Clapperboard,
  Music,
  Users,
  Clock,
  Sparkles,
  Volume2,
} from "lucide-react";
import type { Album, Track } from "@soundlounge/shared";
import { TrackArtwork } from "./TrackArtwork";

interface AlbumDetailViewProps {
  album: Album;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onAddTrack: (track: Track) => void;
  onPlayAlbum: (tracks: Track[]) => void;
  onAddAlbumToQueue: (tracks: Track[]) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

export function AlbumDetailView({
  album,
  onBack,
  onPlayTrack,
  onAddTrack,
  onPlayAlbum,
  onAddAlbumToQueue,
  currentTrack,
  isPlaying,
}: AlbumDetailViewProps) {
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isCurrentTrack = (trackId: string) => currentTrack?.id === trackId;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#8c94aa] hover:text-white transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Browsing</span>
      </button>

      {/* Album / Movie Soundtrack Hero Card */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#111622]/90 to-[#0c0e17]/95 border border-[#1d2333] p-6 lg:p-8 overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Ambient Blur Backdrop */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-25"
          style={{
            backgroundImage: `radial-gradient(circle, #00e5c9, #6366f1 70%, transparent)`,
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
          {/* High-res Album Artwork */}
          <div className="relative group shrink-0">
            <TrackArtwork
              coverUrl={album.coverUrl}
              trackId={album.id}
              title={album.title}
              className="w-48 h-48 md:w-56 md:h-56 rounded-xl shadow-2xl shadow-black/80 ring-1 ring-white/10"
              iconClassName="w-16 h-16"
            />
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => onPlayAlbum(album.tracks)}
                className="w-14 h-14 rounded-full bg-[#00e5c9] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
                title="Play Entire Album"
              >
                <Play className="w-6 h-6 fill-current ml-1" />
              </button>
            </div>
          </div>

          {/* Album & Movie Metadata */}
          <div className="flex-1 min-w-0 text-center md:text-left space-y-3">
            {/* Disambiguation Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#00e5c9]/15 text-[#00e5c9] border border-[#00e5c9]/30">
                {album.type === "movie_soundtrack" ? (
                  <>
                    <Clapperboard className="w-3 h-3" />
                    <span>Movie Soundtrack</span>
                  </>
                ) : (
                  <>
                    <Disc3 className="w-3 h-3" />
                    <span>Studio Album</span>
                  </>
                )}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1a202c] text-[#a0aec0] border border-[#2d3748]">
                {album.releaseYear}
              </span>

              {album.genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#141824] text-[#8c94aa] border border-[#1f2637]"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                {album.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#00e5c9] font-medium mt-1">
                {album.disambiguationLabel}
              </p>
            </div>

            {/* Movie Star Cast & Credits if Bollywood / Film */}
            {album.movieDetails && (
              <div className="bg-[#0b0e14]/60 border border-[#1b2230] rounded-xl p-3 text-xs space-y-1.5 text-[#9ba5b9] max-w-xl">
                {album.movieDetails.starCast.length > 0 && (
                  <p className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#00e5c9] shrink-0" />
                    <span className="text-[#64748b]">Starring:</span>
                    <strong className="text-white font-medium">
                      {album.movieDetails.starCast.join(", ")}
                    </strong>
                  </p>
                )}
                {album.movieDetails.musicDirectors.length > 0 && (
                  <p className="flex items-center gap-2">
                    <Music className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-[#64748b]">Music Director:</span>
                    <strong className="text-white font-medium">
                      {album.movieDetails.musicDirectors.join(", ")}
                    </strong>
                  </p>
                )}
                {album.movieDetails.lyricists && (
                  <p className="flex items-center gap-2 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[#64748b]">Lyrics:</span>
                    <span className="text-[#cbd5e1]">
                      {album.movieDetails.lyricists.join(", ")}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Quick Metrics */}
            <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-[#718096] pt-1">
              <span>{album.tracks.length} original tracks</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {Math.round((album.totalDurationMs || 1200000) / 60000)} mins
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
              <button
                onClick={() => onPlayAlbum(album.tracks)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00e5c9] hover:bg-[#00cbb2] text-[#081014] font-bold text-xs tracking-wide transition-all shadow-lg shadow-[#00e5c9]/25 hover:scale-[1.02] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Full Album</span>
              </button>

              <button
                onClick={() => onAddAlbumToQueue(album.tracks)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141a27] hover:bg-[#1c2334] text-white border border-[#252f44] text-xs font-semibold transition-colors cursor-pointer"
              >
                <ListPlus className="w-4 h-4 text-[#00e5c9]" />
                <span>Add to Queue</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Original Tracklist Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-[#00e5c9]" />
            <span>Original Tracklist</span>
          </h2>
          <span className="text-xs text-[#64748b]">
            Track order as released originally
          </span>
        </div>

        <div className="rounded-xl border border-[#171c28] bg-[#090b10] overflow-hidden divide-y divide-[#121620]">
          {album.tracks.map((track, idx) => {
            const active = isCurrentTrack(track.id);

            return (
              <div
                key={track.id}
                className={`group grid grid-cols-[40px_1fr_80px_90px] items-center px-4 py-3 transition-colors ${
                  active ? "bg-[#111724]" : "hover:bg-[#0e121b]"
                }`}
              >
                {/* Track Number / Play Indicator */}
                <div className="text-xs font-mono text-[#586379] flex items-center">
                  {active && isPlaying ? (
                    <Volume2 className="w-4 h-4 text-[#00e5c9] animate-pulse" />
                  ) : (
                    <>
                      <span className="group-hover:hidden">{idx + 1}</span>
                      <button
                        onClick={() => onPlayTrack(track)}
                        className="hidden group-hover:inline-flex text-[#00e5c9] cursor-pointer"
                        title="Play Track"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </>
                  )}
                </div>

                {/* Track Details & Singer Breakdown */}
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <TrackArtwork
                    coverUrl={track.coverUrl || album.coverUrl}
                    trackId={track.id}
                    title={track.title}
                    className="w-10 h-10 rounded-lg shrink-0"
                    iconClassName="w-4 h-4"
                  />
                  <div className="truncate">
                    <p
                      className={`text-xs font-semibold truncate transition-colors ${
                        active
                          ? "text-[#00e5c9]"
                          : "text-white group-hover:text-cyan-300"
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[11px] text-[#718096] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="text-right text-xs font-mono text-[#718096] tabular-nums">
                  {formatTime(track.durationMs)}
                </div>

                {/* Row Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-[#00e5c9] transition-colors cursor-pointer"
                    title="Play Now"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => onAddTrack(track)}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-white transition-colors cursor-pointer"
                    title="Add to Queue"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
