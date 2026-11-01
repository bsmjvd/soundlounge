"use client";

import React, { useState } from "react";
import {
  ListMusic,
  Play,
  Trash2,
  ArrowRight,
  BookmarkPlus,
  Music,
  Youtube,
  UploadCloud,
  Check,
} from "lucide-react";
import type { Track } from "@soundlounge/shared";

interface QueueViewProps {
  queue: Track[];
  currentIndex: number;
  onPlayTrack: (track: Track, index: number) => void;
  onRemoveTrack: (trackId: string) => void;
  onPlayNext: (track: Track) => void;
  onClearQueue: () => void;
  onSavePlaylist: (name: string) => void;
}

export function QueueView({
  queue,
  currentIndex,
  onPlayTrack,
  onRemoveTrack,
  onPlayNext,
  onClearQueue,
  onSavePlaylist,
}: QueueViewProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getSourceIcon = (source: Track["source"]) => {
    switch (source) {
      case "youtube":
        return <Youtube className="w-3 h-3 text-rose-400" />;
      case "soundcloud":
        return <Music className="w-3 h-3 text-amber-400" />;
      default:
        return <UploadCloud className="w-3 h-3 text-sky-400" />;
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playlistName.trim()) {
      onSavePlaylist(playlistName.trim());
      setPlaylistName("");
      setShowSaveModal(false);
    }
  };

  return (
    <div className="bg-[#131722]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-500/20">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Playing Queue
              </h2>
              <p className="text-[10px] text-gray-400">{queue.length} track{queue.length !== 1 ? "s" : ""} scheduled</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <>
                <button
                  onClick={() => setShowSaveModal(true)}
                  aria-label="Save queue as playlist"
                  className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
                  Save
                </button>
                <button
                  onClick={onClearQueue}
                  aria-label="Clear all songs from queue"
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-400 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {showSaveModal && (
          <form onSubmit={handleSaveSubmit} className="mb-4 bg-black/60 p-2.5 rounded-2xl border border-indigo-500/40 flex gap-2 backdrop-blur-md">
            <input
              type="text"
              placeholder="Name this playlist..."
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 outline-none px-2"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowSaveModal(false)}
              className="text-gray-400 hover:text-white px-2.5 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
              <ListMusic className="w-6 h-6" />
            </div>
            <p className="text-xs text-gray-300 font-semibold">Queue is empty</p>
            <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
              Search for any track or upload audio above to start queuing songs for you and your friends.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {queue.map((track, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`group flex items-center justify-between p-2.5 rounded-2xl transition-all duration-200 border ${
                    isCurrent
                      ? "bg-indigo-950/40 border-indigo-500/40 text-white shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/20"
                      : "bg-white/[0.02] border-transparent hover:border-white/10 hover:bg-white/5 text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0 pr-2">
                    <span className="text-[11px] font-mono tabular-nums text-gray-500 w-4 text-center">
                      {isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block animate-ping" />
                      ) : (
                        idx + 1
                      )}
                    </span>

                    {/* Track Cover Thumbnail */}
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 relative overflow-hidden flex-shrink-0 shadow-sm">
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          {getSourceIcon(track.source)}
                        </div>
                      )}
                    </div>

                    <div className="truncate flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isCurrent ? "text-indigo-200" : "text-white group-hover:text-sky-300"} transition-colors`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-[11px] font-mono tabular-nums text-gray-400">
                      {formatTime(track.durationMs)}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isCurrent && (
                        <button
                          onClick={() => onPlayTrack(track, idx)}
                          title="Play now"
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <button
                        onClick={() => onPlayNext(track)}
                        title="Play next"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-sky-400 hover:text-white transition-all cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveTrack(track.id)}
                        title="Remove from queue"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
