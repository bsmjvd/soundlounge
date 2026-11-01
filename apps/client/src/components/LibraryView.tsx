"use client";

import React, { useState } from "react";
import {
  Heart,
  ListMusic,
  History,
  Play,
  RotateCcw,
  Trash2,
  Plus,
  Music2,
  Sparkles,
} from "lucide-react";
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
    <div className="bg-[#131722]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
      <div>
        {/* Continue Listening Hero Banner */}
        {lastSession && (
          <div className="mb-4 bg-gradient-to-r from-indigo-950/60 via-[#161a26] to-black/60 border border-indigo-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-lg shadow-indigo-950/20 backdrop-blur-xl">
            <div className="flex items-center gap-3.5 overflow-hidden flex-1 min-w-0 pr-2">
              <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 relative overflow-hidden shadow-md">
                {lastSession.track.coverUrl ? (
                  <img
                    src={lastSession.track.coverUrl}
                    alt={lastSession.track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
              </div>
              <div className="truncate">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-indigo-400">
                  <Sparkles className="w-2.5 h-2.5" /> Continue Listening
                </span>
                <p className="text-xs font-semibold text-white truncate">
                  {lastSession.track.title}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-gray-400 truncate">
                  Resume from {formatTime(lastSession.positionMs)}
                </p>
              </div>
            </div>
            <button
              onClick={() => onResumeSession(lastSession)}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-white/10 hover:scale-105 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume
            </button>
          </div>
        )}

        {/* Tabs Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("liked")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "liked"
                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/20"
                  : "text-gray-400 hover:text-white bg-white/5 border border-transparent"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Liked ({likedTracks.length})
            </button>
            <button
              onClick={() => setActiveTab("playlists")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "playlists"
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/20"
                  : "text-gray-400 hover:text-white bg-white/5 border border-transparent"
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              Playlists ({playlists.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/20"
                  : "text-gray-400 hover:text-white bg-white/5 border border-transparent"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History ({history.length})
            </button>
          </div>

          {activeTab === "playlists" && (
            <button
              onClick={() => setShowCreateInput(true)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Playlist
            </button>
          )}
        </div>

        {showCreateInput && activeTab === "playlists" && (
          <form onSubmit={handleCreateSubmit} className="mb-3 flex gap-2 bg-black/50 p-2.5 rounded-2xl border border-indigo-500/40 backdrop-blur-md">
            <input
              type="text"
              placeholder="New playlist title..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 outline-none px-2"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreateInput(false)}
              className="text-gray-400 hover:text-white px-2.5 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Tab Content */}
        <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-1">
          {activeTab === "liked" && (
            likedTracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                  <Heart className="w-6 h-6" />
                </div>
                <p className="text-xs text-gray-300 font-semibold">No liked songs yet</p>
                <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                  Click the heart icon on any playing track to save your favorites directly to your local browser storage.
                </p>
              </div>
            ) : (
              likedTracks.map((track) => (
                <div
                  key={track.id}
                  className="group flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 relative overflow-hidden flex-shrink-0 shadow-sm">
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Music2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-rose-300 transition-colors">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-[11px] font-mono tabular-nums text-gray-400">
                      {formatTime(track.durationMs)}
                    </span>
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white text-white hover:text-black transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === "playlists" && (
            playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                  <ListMusic className="w-6 h-6" />
                </div>
                <p className="text-xs text-gray-300 font-semibold">No playlists created yet</p>
                <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                  Click "New Playlist" or use "Save" in the Queue view to save custom listening sets.
                </p>
              </div>
            ) : (
              playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/5 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <ListMusic className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{pl.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{pl.tracks.length} track{pl.tracks.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPlayPlaylist(pl)}
                      disabled={pl.tracks.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-black text-xs font-bold shadow-md shadow-white/10 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play
                    </button>
                    <button
                      onClick={() => onDeletePlaylist(pl.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-all cursor-pointer"
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
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                  <History className="w-6 h-6" />
                </div>
                <p className="text-xs text-gray-300 font-semibold">No history recorded yet</p>
                <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                  Songs you play will automatically appear here so you can re-listen anytime.
                </p>
              </div>
            ) : (
              history.map((track, i) => (
                <div
                  key={`${track.id}-${i}`}
                  className="group flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/10 hover:bg-white/5 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 relative overflow-hidden flex-shrink-0 shadow-sm">
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Music2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-sky-300 transition-colors">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-[11px] font-mono tabular-nums text-gray-400">
                      {formatTime(track.durationMs)}
                    </span>
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white text-white hover:text-black transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
