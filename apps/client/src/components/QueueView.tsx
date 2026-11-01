"use client";

import React, { useState } from "react";
import {
  ListMusic,
  Play,
  Trash2,
  ArrowRight,
  BookmarkPlus,
  Music2,
  X,
  Volume2,
  Sparkles,
} from "lucide-react";
import type { Track } from "@soundlounge/shared";
import { TrackArtwork } from "./TrackArtwork";

interface QueueViewProps {
  queue: Track[];
  currentIndex: number;
  isAutoplayEnabled?: boolean;
  onToggleAutoplay?: () => void;
  autoQueueReasons?: Record<string, string>;
  onPlayTrack: (track: Track, index: number) => void;
  onRemoveTrack: (trackId: string) => void;
  onPlayNext: (track: Track) => void;
  onClearQueue: () => void;
  onSavePlaylist: (name: string) => void;
}

export function QueueView({
  queue,
  currentIndex,
  isAutoplayEnabled = true,
  onToggleAutoplay,
  autoQueueReasons = {},
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

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playlistName.trim()) {
      onSavePlaylist(playlistName.trim());
      setPlaylistName("");
      setShowSaveModal(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Queue Header & Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-indigo-400" />
            Playing Queue
          </h2>
          <p className="text-xs text-[#636c82] mt-0.5">
            {queue.length} track{queue.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onToggleAutoplay && (
            <button
              onClick={onToggleAutoplay}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                isAutoplayEnabled
                  ? "bg-[#00e5c9]/15 text-[#00e5c9] border-[#00e5c9]/40 shadow-sm shadow-[#00e5c9]/20 font-semibold"
                  : "bg-[#0e111a] hover:bg-[#151926] text-[#71788d] border-[#1b202d]"
              }`}
              title="Automatically queue similar songs matching artist and genre"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autoplay Similar: {isAutoplayEnabled ? "ON" : "OFF"}</span>
            </button>
          )}

          {queue.length > 0 && (
            <>
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 text-xs text-[#8c94aa] hover:text-white px-3 py-1.5 rounded-lg bg-[#0e111a] hover:bg-[#151926] border border-[#1b202d] transition-colors cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
                Save Playlist
              </button>
              <button
                onClick={onClearQueue}
                className="flex items-center gap-1.5 text-xs text-[#8c94aa] hover:text-rose-400 px-3 py-1.5 rounded-lg bg-[#0e111a] hover:bg-[#151926] border border-[#1b202d] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save Queue Modal Inline Form */}
      {showSaveModal && (
        <form
          onSubmit={handleSaveSubmit}
          className="p-3 rounded-xl bg-[#0e111a] border border-indigo-500/40 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Name your new playlist..."
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-xs text-white placeholder-[#586073] outline-none px-2"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowSaveModal(false)}
            className="p-1 text-[#666f85] hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Queue Data Table */}
      {queue.length > 0 ? (
        <div className="rounded-xl border border-[#171a25] bg-[#090b10] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[36px_1fr_80px_100px] items-center px-4 py-2.5 border-b border-[#141722] text-[10px] font-semibold text-[#545c70] uppercase tracking-wider">
            <span>#</span>
            <span>Title & Artist</span>
            <span className="text-right">Duration</span>
            <span className="text-right pr-2">Actions</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#12151f]">
            {queue.map((track, idx) => {
              const isPlaying = idx === currentIndex;

              return (
                <div
                  key={`${track.id}_${idx}`}
                  className={`group grid grid-cols-[36px_1fr_80px_100px] items-center px-4 py-2.5 transition-colors ${
                    isPlaying ? "bg-[#111522]" : "hover:bg-[#10131d]"
                  }`}
                >
                  {/* Status / Index */}
                  <div className="text-xs font-mono text-[#586073]">
                    {isPlaying ? (
                      <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                    ) : (
                      <>
                        <span className="group-hover:hidden">{idx + 1}</span>
                        <button
                          onClick={() => onPlayTrack(track, idx)}
                          className="hidden group-hover:inline-flex text-white hover:text-indigo-400 cursor-pointer"
                          title="Play Track"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Artwork & Info */}
                  <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                    <TrackArtwork
                      coverUrl={track.coverUrl}
                      trackId={track.id}
                      title={track.title}
                      className="w-10 h-10 rounded-lg"
                      iconClassName="w-4 h-4"
                    />
                    <div className="truncate">
                      <p
                        className={`text-xs font-semibold truncate transition-colors ${
                          isPlaying
                            ? "text-emerald-400"
                            : "text-white group-hover:text-sky-300"
                        }`}
                      >
                        {track.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-[#71788d] truncate">
                          {track.artist}
                        </p>
                        {autoQueueReasons[track.id] && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#00e5c9] bg-[#00e5c9]/10 px-1.5 py-0.5 rounded border border-[#00e5c9]/25 shrink-0">
                            <Sparkles className="w-2.5 h-2.5" />
                            {autoQueueReasons[track.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-right text-xs font-mono tabular-nums text-[#71788d]">
                    {formatTime(track.durationMs)}
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center justify-end gap-1">
                    {!isPlaying && (
                      <button
                        onClick={() => onPlayNext(track)}
                        title="Move to Play Next"
                        className="p-1.5 rounded-lg text-[#586073] hover:text-sky-300 transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveTrack(track.id)}
                      title="Remove from Queue"
                      className="p-1.5 rounded-lg text-[#586073] hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl border border-[#171a25] bg-[#090b10] space-y-2">
          <ListMusic className="w-8 h-8 text-[#363d50] mx-auto" />
          <p className="text-xs text-[#8c94aa] font-medium">Your queue is empty</p>
          <p className="text-[11px] text-[#586073]">
            Search for songs or artists in the Discover tab to add them to your queue.
          </p>
        </div>
      )}
    </div>
  );
}
