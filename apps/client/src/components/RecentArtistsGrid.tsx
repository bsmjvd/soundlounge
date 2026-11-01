"use client";

import React from "react";
import { Users, Play } from "lucide-react";

interface RecentArtistsGridProps {
  onSelectArtist: (artistName: string) => void;
}

export interface ArtistProfile {
  id: string;
  name: string;
  genre: string;
  avatarUrl: string;
  followers: string;
}

const ARTISTS: ArtistProfile[] = [
  {
    id: "art_weeknd",
    name: "The Weeknd",
    genre: "R&B / Pop",
    avatarUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
    followers: "115M",
  },
  {
    id: "art_sidhu",
    name: "Sidhu Moose Wala",
    genre: "Punjabi Hip-Hop",
    avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
    followers: "24M",
  },
  {
    id: "art_daftpunk",
    name: "Daft Punk",
    genre: "Electronic / House",
    avatarUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80",
    followers: "18M",
  },
  {
    id: "art_billie",
    name: "Billie Eilish",
    genre: "Alt Pop",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    followers: "98M",
  },
  {
    id: "art_kendrick",
    name: "Kendrick Lamar",
    genre: "Hip-Hop",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    followers: "72M",
  },
  {
    id: "art_dualipa",
    name: "Dua Lipa",
    genre: "Dance Pop",
    avatarUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80",
    followers: "84M",
  },
];

export function RecentArtistsGrid({ onSelectArtist }: RecentArtistsGridProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Users className="w-4 h-4 text-[#00e5c9]" />
          <span>Popular Artists</span>
        </h3>
        <span className="text-[11px] text-[#697c88]">Top Trending</span>
      </div>

      {/* 2x3 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {ARTISTS.map((artist) => (
          <div
            key={artist.id}
            onClick={() => onSelectArtist(artist.name)}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-[#0d181e] border border-[#1a2c35] hover:border-[#00e5c9]/60 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#00e5c9]/10"
          >
            {/* Portrait Image */}
            <img
              src={artist.avatarUrl}
              alt={artist.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
            />

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#081014]/95 via-[#081014]/30 to-transparent" />

            {/* Hover Play / View Indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/25 backdrop-blur-[1px]">
              <div className="w-10 h-10 rounded-full bg-[#00e5c9] text-[#081014] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>

            {/* Name Footer */}
            <div className="absolute bottom-0 inset-x-0 p-2.5 text-center">
              <p className="text-xs font-semibold text-white truncate drop-shadow group-hover:text-[#00e5c9] transition-colors">
                {artist.name}
              </p>
              <p className="text-[10px] text-[#718490] truncate drop-shadow">
                {artist.genre}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
