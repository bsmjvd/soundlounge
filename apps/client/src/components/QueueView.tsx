"use client";

import React, { useState } from "react";
import { ListMusic, Play, Trash2, ArrowRight, BookmarkPlus, Music, Youtube, UploadCloud } from "lucide-react";
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

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "youtube":
        return <Youtube className="w-3.5 h-3.5 text-red-400" />;
      case "soundcloud":
        return <Music className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <UploadCloud className="w-3.5 h-3.5 text-sky-400" />;
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
    <div className="bg-[#131722] border border-[#1f2638] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-gray-200">
            Playing Queue ({queue.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <>
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-md bg-[#0b0d13] border border-[#1f2638] transition-colors"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
                Save as Playlist
              </button>
              <button
                onClick={onClearQueue}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 px-2.5 py-1 rounded-md bg-[#0b0d13] border border-[#1f2638] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {showSaveModal && (
        <form onSubmit={handleSaveSubmit} className="mb-4 bg-[#0b0d13] p-3 rounded-xl border border-indigo-500/40 flex gap-2">
          <input
            type="text"
            placeholder="Playlist name..."
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 outline-none px-2"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-md text-xs font-semibold"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowSaveModal(false)}
            className="text-gray-400 hover:text-white px-2 py-1 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {queue.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-xs">
          Queue is empty. Add songs from your library, upload audio, or paste a link.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
          {queue.map((track, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={`${track.id}-${idx}`}
                className={`group flex items-center justify-between p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-indigo-950/40 border border-indigo-500/30 text-white"
                    : "hover:bg-[#0b0d13]/60 text-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xs font-mono text-gray-500 w-4 text-center">
                    {idx + 1}
                  </span>
                  <div className="p-1 rounded bg-[#0b0d13] border border-[#1f2638]">
                    {getSourceIcon(track.source)}
                  </div>
                  <div className="truncate">
                    <p className={`text-xs font-medium truncate ${isCurrent ? "text-indigo-300" : ""}`}>
                      {track.title}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] font-mono text-gray-500">
                    {formatTime(track.durationMs)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isCurrent && (
                      <button
                        onClick={() => onPlayTrack(track, idx)}
                        title="Play now"
                        className="p-1.5 rounded-lg hover:bg-indigo-600/30 text-indigo-400"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onPlayNext(track)}
                      title="Play next"
                      className="p-1.5 rounded-lg hover:bg-sky-500/20 text-sky-400"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveTrack(track.id)}
                      title="Remove from queue"
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
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
  );
}
