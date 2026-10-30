"use client";

import React, { useState } from "react";
import { Heart, ListMusic, History, Play, RotateCcw, Trash2, Plus } from "lucide-react";
import type { Track, Playlist } from "@soundlounge/shared";
import type { LastSessionSnapshot } from "../lib/store/useLibraryStore";

interface LibraryViewProps {
  likedTracks: Track[];
  playlists: Playlist[];
  history: Track[];
  lastSession: LastSessionSnapshot | null;
  onPlayTrack: (track: Track) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onResumeSession: (session: LastSessionSnapshot) => void;
}

export function LibraryView({
  likedTracks,
  playlists,
  history,
  lastSession,
  onPlayTrack,
  onPlayPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  onResumeSession,
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<"liked" | "playlists" | "history">("liked");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setShowCreateInput(false);
    }
  };

  return (
    <div className="bg-[#131722] border border-[#1f2638] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Continue Listening Banner */}
      {lastSession && (
        <div className="bg-gradient-to-r from-indigo-950/60 to-[#0b0d13] border border-indigo-500/30 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400">
                Continue Listening
              </p>
              <p className="text-xs font-medium text-white truncate">
                {lastSession.track.title}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                Resume from {formatTime(lastSession.positionMs)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onResumeSession(lastSession)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors flex-shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Resume
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-[#1f2638] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("liked")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "liked"
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Liked ({likedTracks.length})
          </button>
          <button
            onClick={() => setActiveTab("playlists")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "playlists"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Playlists ({playlists.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "history"
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History ({history.length})
          </button>
        </div>

        {activeTab === "playlists" && (
          <button
            onClick={() => setShowCreateInput(true)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            New Playlist
          </button>
        )}
      </div>

      {showCreateInput && activeTab === "playlists" && (
        <form onSubmit={handleCreateSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="New playlist title..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            autoFocus
            className="flex-1 bg-[#0b0d13] border border-[#1f2638] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-md text-xs font-semibold"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowCreateInput(false)}
            className="text-gray-400 hover:text-white px-2 py-1 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Tab Content */}
      <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
        {activeTab === "liked" && (
          likedTracks.length === 0 ? (
            <p className="text-center py-8 text-xs text-gray-500">
              No liked songs yet. Click the heart on any track to save it on this device.
            </p>
          ) : (
            likedTracks.map((track) => (
              <div
                key={track.id}
                className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#0b0d13]/60 transition-colors"
              >
                <div className="truncate">
                  <p className="text-xs font-medium text-gray-200 truncate">{track.title}</p>
                  <p className="text-[11px] text-gray-500 truncate">{track.artist}</p>
                </div>
                <button
                  onClick={() => onPlayTrack(track)}
                  className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )
        )}

        {activeTab === "playlists" && (
          playlists.length === 0 ? (
            <p className="text-center py-8 text-xs text-gray-500">
              No playlists created yet. Create one or save your playing queue.
            </p>
          ) : (
            playlists.map((pl) => (
              <div
                key={pl.id}
                className="group flex items-center justify-between p-2.5 rounded-xl bg-[#0b0d13]/40 border border-[#1f2638] hover:border-indigo-500/30 transition-all"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-200">{pl.name}</p>
                  <p className="text-[11px] text-gray-500">{pl.tracks.length} songs</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onPlayPlaylist(pl)}
                    disabled={pl.tracks.length === 0}
                    className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePlaylist(pl.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === "history" && (
          history.length === 0 ? (
            <p className="text-center py-8 text-xs text-gray-500">
              No listening history recorded yet.
            </p>
          ) : (
            history.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#0b0d13]/60 transition-colors"
              >
                <div className="truncate">
                  <p className="text-xs font-medium text-gray-200 truncate">{track.title}</p>
                  <p className="text-[11px] text-gray-500 truncate">{track.artist}</p>
                </div>
                <button
                  onClick={() => onPlayTrack(track)}
                  className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
