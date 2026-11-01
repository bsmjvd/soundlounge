"use client";

import React from "react";
import {
  Play,
  Pause,
  Heart,
  Headphones,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { useLibraryStore } from "../lib/store/useLibraryStore";
import { TrackArtwork } from "./TrackArtwork";

interface WeeklyTopSongsProps {
  onPlayTrack: (track: Track) => void;
  onAddTrack: (track: Track, playNext?: boolean) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
}

export interface WeeklySongItem {
  id: string;
  title: string;
  artist: string;
  streams: string;
  durationMs: number;
  coverUrl: string;
}

const WEEKLY_SONGS: WeeklySongItem[] = [
  {
    id: "yt_34Na4j8AVgA",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    streams: "845K",
    durationMs: 230000,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "yt_QYvfY4MtLAI",
    title: "295",
    artist: "Sidhu Moose Wala",
    streams: "920K",
    durationMs: 270000,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "yt_fHI8X4OXluQ",
    title: "Blinding Lights",
    artist: "The Weeknd",
    streams: "1.2M",
    durationMs: 200000,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "yt_5NV6Rdv1a3I",
    title: "Get Lucky",
    artist: "Daft Punk ft. Pharrell Williams",
    streams: "670K",
    durationMs: 248000,
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "yt_TUVcZfQe-Kw",
    title: "Levitating",
    artist: "Dua Lipa",
    streams: "780K",
    durationMs: 203000,
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "yt_V9PVRfjEBTI",
    title: "Birds of a Feather",
    artist: "Billie Eilish",
    streams: "890K",
    durationMs: 198000,
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80",
  },
];

export function WeeklyTopSongs({
  onPlayTrack,
  onAddTrack,
  currentTrack,
  isPlaying,
  positionMs,
  durationMs,
}: WeeklyTopSongsProps) {
  const { isLiked, toggleLike } = useLibraryStore();

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const toTrack = (item: WeeklySongItem): Track => ({
    id: item.id,
    title: item.title,
    artist: item.artist,
    coverUrl: item.coverUrl,
    durationMs: item.durationMs,
    url: `/api/stream/youtube?id=${item.id.replace("yt_", "")}`,
    source: "youtube",
    createdAt: Date.now(),
  });

  return (
    <div className="rounded-2xl bg-[#0d181e] border border-[#1a2c35] p-4 sm:p-5 shadow-xl space-y-3">
      {/* Table Title Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#16252e]">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00e5c9]" />
          <span>Weekly Top Charts</span>
        </h3>
        <span className="text-[11px] text-[#697c88]">Weekly Top Charts</span>
      </div>

      {/* Track List Rows */}
      <div className="divide-y divide-[#14222b]">
        {WEEKLY_SONGS.map((song) => {
          const isThisTrack = currentTrack?.id === song.id;
          const isThisPlaying = isThisTrack && isPlaying;
          const liked = isLiked(song.id);

          // Calculate circular progress percentage
          const effectiveDuration = isThisTrack ? durationMs || song.durationMs : song.durationMs;
          const progressPercent = isThisTrack
            ? Math.min(100, Math.max(0, (positionMs / effectiveDuration) * 100))
            : 0;

          // SVG circle parameters (radius: 14, circumference: ~88)
          const radius = 14;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

          return (
            <div
              key={song.id}
              className={`group flex items-center justify-between py-2.5 px-2 rounded-xl transition-colors ${
                isThisTrack ? "bg-[#112129]" : "hover:bg-[#101e25]"
              }`}
            >
              {/* Left: Controls & Play Button (with Circular Progress Ring) */}
              <div className="flex items-center gap-3">
                {/* Circular Play / Progress Button */}
                <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                  {/* SVG Circular Progress Track (visible when this track is selected) */}
                  {isThisTrack && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                      <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        fill="transparent"
                        stroke="#1a323f"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        fill="transparent"
                        stroke="#00e5c9"
                        strokeWidth="2.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-200"
                      />
                    </svg>
                  )}

                  <button
                    onClick={() => onPlayTrack(toTrack(song))}
                    title={isThisPlaying ? "Pause" : "Play"}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                      isThisPlaying
                        ? "bg-[#00e5c9] text-[#081014] shadow-sm shadow-[#00e5c9]/50"
                        : "bg-[#162731] text-white hover:text-[#00e5c9]"
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Heart / Like Button */}
                <button
                  onClick={() => toggleLike(toTrack(song))}
                  title={liked ? "Liked" : "Like Song"}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    liked ? "text-[#f43f5e]" : "text-[#586d79] hover:text-white"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                </button>
              </div>

              {/* Center: Stream Count & Duration */}
              <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-[#6c7f8b]">
                <span className="flex items-center gap-1">
                  <Headphones className="w-3 h-3 text-[#586d79]" />
                  <span>{song.streams}</span>
                </span>
                <span>{formatTime(song.durationMs)}</span>
              </div>

              {/* Right: Title, Artist, & Album Jacket Cover */}
              <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-1">
                <div className="text-right truncate max-w-[130px] sm:max-w-[200px]">
                  <p
                    className={`text-xs font-semibold truncate transition-colors ${
                      isThisTrack
                        ? "text-[#00e5c9] font-bold"
                        : "text-white group-hover:text-[#00e5c9]"
                    }`}
                  >
                    {song.title}
                  </p>
                  <p className="text-[11px] text-[#697d8b] truncate">{song.artist}</p>
                </div>

                <TrackArtwork
                  coverUrl={song.coverUrl}
                  trackId={song.id}
                  title={song.title}
                  className="w-10 h-10 rounded-lg shadow-sm"
                  iconClassName="w-4 h-4"
                />

                {/* Quick Add to Queue action */}
                <div className="hidden group-hover:flex items-center gap-1 ml-1">
                  <button
                    onClick={() => onAddTrack(toTrack(song), false)}
                    title="Add to Queue"
                    className="p-1 text-[#697d8b] hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onAddTrack(toTrack(song), true)}
                    title="Play Next"
                    className="p-1 text-[#697d8b] hover:text-[#00e5c9] transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
