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
  ArrowRight,
  Info,
} from "lucide-react";
import type { Album, Track } from "@soundlounge/shared";
import { TrackArtwork } from "./TrackArtwork";
import { getDisambiguationCounterparts } from "../lib/services/metadataService";

interface AlbumDetailViewProps {
  album: Album;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onAddTrack: (track: Track) => void;
  onPlayAlbum: (tracks: Track[]) => void;
  onAddAlbumToQueue: (tracks: Track[]) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectAlbum?: (album: Album) => void;
  onSelectActor?: (actor: string) => void;
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
  onSelectAlbum,
  onSelectActor,
}: AlbumDetailViewProps) {
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isCurrentTrack = (trackId: string) => currentTrack?.id === trackId;

  // Find disambiguation counterparts for identical or easily confused releases
  const disambiguationCounterparts = getDisambiguationCounterparts(album.id);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Albums Directory</span>
        </button>

        <span className="text-[11px] font-mono text-ink-subtle">ID: {album.id}</span>
      </div>

      {/* Disambiguation Switcher Banner (Milestone 3 Requirement) */}
      {disambiguationCounterparts.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-gradient-to-r from-warning/10 via-surface-raised to-warning/5 p-4 backdrop-blur-md shadow-lg shadow-black/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20 text-warning shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-warning">
                  Looking for another release named &ldquo;{album.title}&rdquo;?
                </p>
                <p className="text-[11px] text-warning/70">
                  Soundlounge detected {disambiguationCounterparts.length} distinct release
                  {disambiguationCounterparts.length > 1 ? "s" : ""} sharing this title or artist across eras.
                </p>
              </div>
            </div>

            {/* Counterpart Switcher Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {disambiguationCounterparts.map((cp) => (
                <button
                  key={cp.id}
                  onClick={() => onSelectAlbum?.(cp)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-overlay text-ink border border-line-strong hover:border-warning/50 text-xs font-medium transition group cursor-pointer shadow-sm"
                  title={`Switch to ${cp.title} (${cp.releaseYear}) - ${cp.disambiguationLabel}`}
                >
                  {cp.type === "movie_soundtrack" ? (
                    <Clapperboard className="w-3.5 h-3.5 text-warning" />
                  ) : (
                    <Disc3 className="w-3.5 h-3.5 text-accent" />
                  )}
                  <span className="font-semibold text-ink group-hover:text-warning transition-colors">
                    {cp.title}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/40 text-ink-secondary font-mono">
                    {cp.releaseYear}
                  </span>
                  <span className="text-[11px] text-ink-muted max-w-[150px] truncate hidden sm:inline">
                    {cp.primaryArtist}
                  </span>
                  <ArrowRight className="w-3 h-3 text-warning/70 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Album / Movie Soundtrack Hero Card */}
      <div className="relative rounded-2xl bg-gradient-to-b from-surface-raised/90 to-canvas/95 border border-line p-6 lg:p-8 overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Ambient Blur Backdrop */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-25"
          style={{
            backgroundImage: `radial-gradient(circle, rgb(var(--accent-rgb)), rgb(var(--ember-rgb)) 70%, transparent)`,
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
          {/* High-res Album Artwork */}
          <div className="relative group shrink-0">
            <TrackArtwork
              coverUrl={album.coverUrl}
              trackId={album.id}
              title={album.title}
              className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-card shadow-2xl shadow-black/80 ring-1 ring-ink/10"
              iconClassName="w-16 h-16"
            />
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => onPlayAlbum(album.tracks)}
                className="w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
                title="Play Entire Album"
              >
                <Play className="w-6 h-6 fill-current ml-1" />
              </button>
            </div>
          </div>

          {/* Album & Movie Metadata */}
          <div className="flex-1 min-w-0 text-center md:text-left space-y-3">
            {/* Badges & Entity Classification */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/30">
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

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-raised text-ink-secondary border border-line-strong">
                {album.releaseYear || "2024"}
              </span>

              {(album.genres || []).slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-raised text-ink-muted border border-line"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Title & Disambiguation Description */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
                {album.title}
              </h1>
              <p className="text-xs sm:text-sm text-accent font-medium mt-1">
                {album.disambiguationLabel || album.primaryArtist || album.title}
              </p>
            </div>

            {/* Movie Star Cast & Directors (if Movie Soundtrack) */}
            {album.movieDetails && (
              <div className="bg-surface/70 border border-line rounded-xl p-3 text-xs space-y-2 text-ink-secondary max-w-xl text-left">
                {album.movieDetails.starCast.length > 0 && (
                  <div>
                    <span className="text-ink-muted text-[11px] flex items-center gap-1.5 mb-1.5">
                      <Users className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Star Cast:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {album.movieDetails.starCast.map((star) => (
                        <button
                          key={star}
                          onClick={() => onSelectActor?.(star)}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-raised hover:bg-surface-overlay text-ink border border-line-strong hover:border-accent/50 text-[11px] transition-colors cursor-pointer"
                          title={`Find soundtracks starring ${star}`}
                        >
                          {star}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {album.movieDetails.musicDirectors.length > 0 && (
                  <p className="flex items-center gap-2 pt-0.5">
                    <Music className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="text-ink-muted">Music Director:</span>
                    <strong className="text-ink font-medium">{album.movieDetails.musicDirectors.join(", ")}</strong>
                  </p>
                )}

                {album.movieDetails.lyricists && album.movieDetails.lyricists.length > 0 && (
                  <p className="flex items-center gap-2 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-warning shrink-0" />
                    <span className="text-ink-muted">Lyrics:</span>
                    <span className="text-ink-secondary">{album.movieDetails.lyricists.join(", ")}</span>
                  </p>
                )}
              </div>
            )}

            {/* Quick Metrics */}
            <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-ink-muted pt-1">
              <span>{(album.tracks || []).length} original tracks</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {Math.round((album.totalDurationMs || 1200000) / 60000)} mins
              </span>
              <span>•</span>
              <span className="text-ink-secondary">{album.primaryArtist || "Various Artists"}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
              <button
                onClick={() => onPlayAlbum(album.tracks || [])}
                className="flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-control bg-accent hover:bg-accent-strong text-accent-foreground font-bold text-xs tracking-wide transition shadow-lg shadow-accent/25 hover:scale-[1.02] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Full Album</span>
              </button>

              <button
                onClick={() => onAddAlbumToQueue(album.tracks || [])}
                className="flex min-h-11 items-center gap-2 px-4 py-2.5 rounded-control bg-surface-raised hover:bg-surface-overlay text-ink border border-line-strong text-xs font-semibold transition-colors cursor-pointer"
              >
                <ListPlus className="w-4 h-4 text-accent" />
                <span>Add to Queue</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Original Tracklist Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-ink tracking-tight flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-accent" />
            <span>Complete Original Tracklist</span>
          </h2>
          <span className="text-xs text-ink-muted">Accurate sequence as originally released</span>
        </div>

        <div className="rounded-xl border border-line bg-surface-sunken overflow-hidden divide-y divide-line">
          {(album.tracks || []).map((track, idx) => {
            const active = isCurrentTrack(track.id);

            return (
              <div
                key={track.id}
                className={`group grid grid-cols-[36px_1fr_auto] sm:grid-cols-[44px_1fr_80px_90px] items-center px-3 sm:px-4 py-2.5 sm:py-3 transition-colors ${
                  active ? "bg-surface-raised" : "hover:bg-surface"
                }`}
              >
                {/* Track Number / Equalizer Indicator */}
                <div className="text-xs font-mono text-ink-subtle flex items-center">
                  {active && isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3.5 w-4 justify-center" title="Now Playing">
                      <span className="w-1 h-3 origin-bottom rounded-full bg-accent animate-sound-wave-1" />
                      <span className="w-1 h-3.5 origin-bottom rounded-full bg-accent animate-sound-wave-2" />
                      <span className="w-1 h-2 origin-bottom rounded-full bg-accent animate-sound-wave-3" />
                    </div>
                  ) : (
                    <>
                      <span className="group-hover:hidden">{idx + 1}</span>
                      <button
                        onClick={() => onPlayTrack(track)}
                        className="hidden group-hover:inline-flex text-accent cursor-pointer"
                        title="Play Track"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </>
                  )}
                </div>

                {/* Track Details & Singer Breakdown */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2 sm:pr-4">
                  <TrackArtwork
                    coverUrl={track.coverUrl || album.coverUrl}
                    trackId={track.id}
                    title={track.title}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg shrink-0"
                    iconClassName="w-4 h-4"
                  />
                  <div className="truncate">
                    <p
                      className={`text-xs font-semibold truncate transition-colors ${
                        active ? "text-accent" : "text-ink group-hover:text-accent"
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate mt-0.5">{track.artist}</p>
                  </div>
                </div>

                {/* Duration */}
                <div className="hidden sm:block text-right text-xs font-mono text-ink-muted tabular-nums">
                  {formatTime(track.durationMs)}
                </div>

                {/* Row Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink-muted hover:text-accent transition-colors cursor-pointer sm:min-h-0 sm:min-w-0 sm:p-1.5"
                    aria-label={`Play ${track.title}`}
                    title="Play Now"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => onAddTrack(track)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink-muted hover:text-ink transition-colors cursor-pointer sm:min-h-0 sm:min-w-0 sm:p-1.5"
                    aria-label={`Add ${track.title} to queue`}
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
