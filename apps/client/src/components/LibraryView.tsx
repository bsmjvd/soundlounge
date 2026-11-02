"use client";

import React, { useState } from "react";
import { Heart, Library, History, Play, Trash2, Plus, Music2, X, Clock } from "lucide-react";
import type { Track, Playlist } from "@soundlounge/shared";
import type { LastSessionSnapshot } from "../lib/store/useLibraryStore";
import { TrackArtwork } from "./TrackArtwork";

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
  activeSection?: "liked" | "playlists" | "history";
}

export function LibraryView({
  likedTracks,
  playlists,
  history,
  onPlayTrack,
  onPlayPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  activeSection = "liked",
}: LibraryViewProps) {
  const [internalTab, setInternalTab] = useState<"liked" | "playlists" | "history">(activeSection);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Sync with prop if it changes
  React.useEffect(() => {
    if (activeSection) {
      setInternalTab(activeSection);
    }
  }, [activeSection]);

  const currentTab = internalTab;

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

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div className="space-y-6">
      {/* Tab Navigation Pill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInternalTab("liked")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentTab === "liked"
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${currentTab === "liked" ? "fill-current" : ""}`} />
            <span>Liked Songs ({likedTracks.length})</span>
          </button>

          <button
            onClick={() => setInternalTab("playlists")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentTab === "playlists"
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Playlists ({playlists.length})</span>
          </button>

          <button
            onClick={() => setInternalTab("history")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentTab === "history"
                ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>
        </div>

        {currentTab === "playlists" && !showCreateInput && (
          <button
            onClick={() => setShowCreateInput(true)}
            className="flex items-center gap-1.5 text-xs text-[#00e5ff] hover:text-white px-3 py-1.5 rounded-lg bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/30 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#00e5ff]" />
            New Playlist
          </button>
        )}
      </div>

      {/* Playlist Creation Inline Form */}
      {showCreateInput && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-3 rounded-xl bg-[#0e111a] border border-indigo-500/40 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Playlist name..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-xs text-white placeholder-[#586073] outline-none px-2"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowCreateInput(false)}
            className="p-1 text-[#666f85] hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* 1. LIKED SONGS VIEW */}
      {currentTab === "liked" && (
        <>
          {likedTracks.length > 0 ? (
            <div className="rounded-xl border border-[#171a25] bg-[#090b10] overflow-hidden">
              <div className="grid grid-cols-[36px_1fr_80px_60px] items-center px-4 py-2.5 border-b border-[#141722] text-[10px] font-semibold text-[#545c70] uppercase tracking-wider">
                <span>#</span>
                <span>Title & Artist</span>
                <span className="text-right">Duration</span>
                <span className="text-right pr-2">Play</span>
              </div>
              <div className="divide-y divide-[#12151f]">
                {likedTracks.map((track, idx) => (
                  <div
                    key={track.id}
                    className="group grid grid-cols-[36px_1fr_80px_60px] items-center px-4 py-2.5 hover:bg-[#10131d] transition-colors"
                  >
                    <div className="text-xs font-mono text-[#586073]">
                      <span className="group-hover:hidden">{idx + 1}</span>
                      <button
                        onClick={() => onPlayTrack(track)}
                        className="hidden group-hover:inline-flex text-white hover:text-indigo-400 cursor-pointer"
                        title="Play Track"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                      <TrackArtwork
                        coverUrl={track.coverUrl}
                        trackId={track.id}
                        title={track.title}
                        className="w-10 h-10 rounded-lg"
                        iconClassName="w-4 h-4"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-sky-300 transition-colors">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-[#71788d] truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono tabular-nums text-[#71788d]">
                      {formatTime(track.durationMs)}
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => onPlayTrack(track)}
                        title="Play Track"
                        className="p-1.5 rounded-lg text-[#586073] hover:text-white transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-[#171a25] bg-[#090b10] space-y-2">
              <Heart className="w-8 h-8 text-[#363d50] mx-auto" />
              <p className="text-xs text-[#8c94aa] font-medium">No liked songs yet</p>
              <p className="text-[11px] text-[#586073]">
                Click the heart icon on any playing track or search result to save it here.
              </p>
            </div>
          )}
        </>
      )}

      {/* 2. PLAYLISTS VIEW */}
      {currentTab === "playlists" && (
        <div className="space-y-4">
          {playlists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-4 rounded-xl border border-[#171a25] bg-[#090b10] hover:border-[#222738] transition-colors group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-[#141722] border border-[#222738] flex items-center justify-center text-indigo-400 flex-shrink-0">
                        <Library className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <h3 className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {pl.name}
                        </h3>
                        <p className="text-[11px] text-[#636c82] mt-0.5">
                          {pl.tracks.length} track{pl.tracks.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeletePlaylist(pl.id)}
                      title="Delete playlist"
                      className="p-1.5 text-[#586073] hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#12151f] flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPlaylistId(selectedPlaylistId === pl.id ? null : pl.id)}
                      className="text-[11px] text-[#71788d] hover:text-white transition-colors cursor-pointer"
                    >
                      {selectedPlaylistId === pl.id ? "Hide Tracks" : "View Tracks"}
                    </button>

                    <button
                      onClick={() => onPlayPlaylist(pl)}
                      disabled={pl.tracks.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-black text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Play All
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-[#171a25] bg-[#090b10] space-y-2">
              <Library className="w-8 h-8 text-[#363d50] mx-auto" />
              <p className="text-xs text-[#8c94aa] font-medium">No playlists created</p>
              <p className="text-[11px] text-[#586073]">
                Create a playlist or save your current queue to build your audio collection.
              </p>
            </div>
          )}

          {/* Expanded Playlist Tracks View */}
          {selectedPlaylist && (
            <div className="mt-4 rounded-xl border border-[#171a25] bg-[#090b10] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{selectedPlaylist.name} Tracks</span>
                  <span className="text-[10px] text-[#636c82] font-normal">({selectedPlaylist.tracks.length})</span>
                </h3>
                <button
                  onClick={() => setSelectedPlaylistId(null)}
                  className="p-1 text-[#666f85] hover:text-white rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedPlaylist.tracks.length > 0 ? (
                <div className="divide-y divide-[#12151f]">
                  {selectedPlaylist.tracks.map((track, idx) => (
                    <div
                      key={`${track.id}_${idx}`}
                      className="group flex items-center justify-between py-2 hover:bg-[#10131d] px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                        <TrackArtwork
                          coverUrl={track.coverUrl}
                          trackId={track.id}
                          title={track.title}
                          className="w-9 h-9 rounded-lg"
                          iconClassName="w-4 h-4"
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate">{track.title}</p>
                          <p className="text-[11px] text-[#71788d] truncate">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono tabular-nums text-[#71788d]">
                          {formatTime(track.durationMs)}
                        </span>
                        <button
                          onClick={() => onPlayTrack(track)}
                          title="Play Track"
                          className="p-1.5 rounded-lg text-[#586073] hover:text-white transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#586073] py-4 text-center">This playlist is empty.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. HISTORY VIEW */}
      {currentTab === "history" && (
        <>
          {history.length > 0 ? (
            <div className="rounded-xl border border-[#171a25] bg-[#090b10] overflow-hidden">
              <div className="grid grid-cols-[36px_1fr_80px_60px] items-center px-4 py-2.5 border-b border-[#141722] text-[10px] font-semibold text-[#545c70] uppercase tracking-wider">
                <span>#</span>
                <span>Title & Artist</span>
                <span className="text-right">Duration</span>
                <span className="text-right pr-2">Replay</span>
              </div>
              <div className="divide-y divide-[#12151f]">
                {history.map((track, idx) => (
                  <div
                    key={`${track.id}_${idx}`}
                    className="group grid grid-cols-[36px_1fr_80px_60px] items-center px-4 py-2.5 hover:bg-[#10131d] transition-colors"
                  >
                    <div className="text-xs font-mono text-[#586073]">
                      <span className="group-hover:hidden">{idx + 1}</span>
                      <button
                        onClick={() => onPlayTrack(track)}
                        className="hidden group-hover:inline-flex text-white hover:text-indigo-400 cursor-pointer"
                        title="Replay Track"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                      <TrackArtwork
                        coverUrl={track.coverUrl}
                        trackId={track.id}
                        title={track.title}
                        className="w-10 h-10 rounded-lg"
                        iconClassName="w-4 h-4"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-sky-300 transition-colors">
                          {track.title}
                        </p>
                        <p className="text-[11px] text-[#71788d] truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono tabular-nums text-[#71788d]">
                      {formatTime(track.durationMs)}
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => onPlayTrack(track)}
                        title="Replay Track"
                        className="p-1.5 rounded-lg text-[#586073] hover:text-white transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-[#171a25] bg-[#090b10] space-y-2">
              <Clock className="w-8 h-8 text-[#363d50] mx-auto" />
              <p className="text-xs text-[#8c94aa] font-medium">No listening history yet</p>
              <p className="text-[11px] text-[#586073]">Tracks you play will be cataloged here automatically.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
