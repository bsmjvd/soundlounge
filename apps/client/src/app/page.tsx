"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Header } from "../components/Header";
import { MusicIngestion } from "../components/MusicIngestion";
import { QueueView } from "../components/QueueView";
import { LibraryView } from "../components/LibraryView";
import { PlayerBar } from "../components/PlayerBar";
import { InviteModal } from "../components/InviteModal";
import { AccessDenied } from "../components/AccessDenied";

import {
  AudioEngineCoordinator,
  type CoordinatorPlayerState,
  type PlaybackMode,
} from "../lib/player";
import { useLibraryStore, type LastSessionSnapshot } from "../lib/store/useLibraryStore";
import { useQueueStore } from "../lib/store/useQueueStore";
import { useRoomSync } from "../lib/sync/useRoomSync";
import type { Track, Playlist } from "@soundlounge/shared";

// Singleton coordinator instance for the browser tab
let coordinatorSingleton: AudioEngineCoordinator | null = null;
function getCoordinator(): AudioEngineCoordinator {
  if (!coordinatorSingleton) {
    coordinatorSingleton = new AudioEngineCoordinator();
  }
  return coordinatorSingleton;
}

export default function SoundloungeApp() {
  const coordinator = getCoordinator();

  // Read URL query params on mount for room and invite
  const [roomId, setRoomId] = useState("lounge-main");
  const [inviteToken, setInviteToken] = useState<string | undefined>(undefined);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get("room");
      const urlInvite = params.get("invite");
      if (urlRoom) setRoomId(urlRoom);
      if (urlInvite) setInviteToken(urlInvite);
    }
  }, []);

  // Player state subscription
  const [playerState, setPlayerState] = useState<CoordinatorPlayerState>(() =>
    coordinator.getState()
  );

  useEffect(() => {
    return coordinator.onStateChange((state) => {
      setPlayerState(state);
      // Automatically snapshot session for Continue Listening
      if (state.currentTrack && state.status === "playing") {
        useLibraryStore.getState().saveLastSession(state.currentTrack, state.positionMs);
      }
    });
  }, [coordinator]);

  // Stores
  const { queue, currentIndex } = useQueueStore();
  const queueActions = useQueueStore.getState();

  const {
    likedTracks,
    playlists,
    history,
    lastSession,
    toggleLike,
    isLiked,
    createPlaylist,
    addTrackToPlaylist,
    deletePlaylist,
    addToHistory,
  } = useLibraryStore();

  // Synchronized WebSocket engine
  const sync = useRoomSync({
    roomId,
    inviteToken,
    coordinator,
  });

  const handleModeChange = (newMode: PlaybackMode) => {
    coordinator.setMode(newMode);
  };

  const handleAddTrack = (track: Track, playNext: boolean = false) => {
    if (playerState.mode === "synced") {
      sync.sendAddTrack(track, playNext);
    } else {
      useQueueStore.getState().addTrack(track, playNext);
      if (queue.length === 0) {
        coordinator.play(track, 0);
        addToHistory(track);
      }
    }
  };

  const handlePlayQueueTrack = (track: Track, index: number) => {
    useQueueStore.getState().setCurrentIndex(index);
    addToHistory(track);

    if (playerState.mode === "synced") {
      sync.sendPlay(track.id, 0);
    } else {
      coordinator.play(track, 0);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (playerState.mode === "synced") {
      sync.sendRemoveTrack(trackId);
    } else {
      useQueueStore.getState().removeTrack(trackId);
    }
  };

  const handlePlayNext = (track: Track) => {
    if (playerState.mode === "synced") {
      sync.sendAddTrack(track, true);
    } else {
      useQueueStore.getState().addTrack(track, true);
    }
  };

  const handleClearQueue = () => {
    if (playerState.mode === "synced") {
      sync.sendClearQueue();
    } else {
      useQueueStore.getState().clearQueue();
    }
  };

  const handleSaveQueueAsPlaylist = (name: string) => {
    if (queue.length === 0) return;
    const plId = createPlaylist(name);
    queue.forEach((t) => addTrackToPlaylist(plId, t));
  };

  const handlePlaySingleTrack = (track: Track) => {
    addToHistory(track);
    if (playerState.mode === "synced") {
      sync.sendAddTrack(track, true);
      sync.sendPlay(track.id, 0);
    } else {
      useQueueStore.getState().setQueue([track], 0);
      coordinator.play(track, 0);
    }
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) return;
    const firstTrack = playlist.tracks[0];
    addToHistory(firstTrack);

    if (playerState.mode === "synced") {
      sync.sendClearQueue();
      playlist.tracks.forEach((t) => sync.sendAddTrack(t));
      sync.sendPlay(firstTrack.id, 0);
    } else {
      useQueueStore.getState().setQueue(playlist.tracks, 0);
      coordinator.play(firstTrack, 0);
    }
  };

  const handleResumeSession = (session: LastSessionSnapshot) => {
    addToHistory(session.track);
    if (playerState.mode === "synced") {
      sync.sendAddTrack(session.track, true);
      sync.sendPlay(session.track.id, session.positionMs);
    } else {
      useQueueStore.getState().setQueue([session.track], 0);
      coordinator.play(session.track, session.positionMs);
    }
  };

  const handleTogglePlay = () => {
    if (playerState.status === "playing") {
      if (playerState.mode === "synced") {
        sync.sendPause(playerState.positionMs);
      } else {
        coordinator.pause();
      }
    } else {
      const cur = playerState.currentTrack || queue[currentIndex] || queue[0];
      if (cur) {
        if (playerState.mode === "synced") {
          sync.sendPlay(cur.id, playerState.positionMs);
        } else {
          coordinator.play(cur, playerState.positionMs);
        }
      }
    }
  };

  const handleSeek = (posMs: number) => {
    if (playerState.mode === "synced") {
      sync.sendSeek(posMs);
    } else {
      coordinator.seek(posMs);
    }
  };

  const handleNext = () => {
    const next = useQueueStore.getState().nextTrack();
    if (next) {
      addToHistory(next);
      if (playerState.mode === "synced") {
        sync.sendPlay(next.id, 0);
      } else {
        coordinator.play(next, 0);
      }
    }
  };

  const handlePrevious = () => {
    const prev = useQueueStore.getState().previousTrack();
    if (prev) {
      addToHistory(prev);
      if (playerState.mode === "synced") {
        sync.sendPlay(prev.id, 0);
      } else {
        coordinator.play(prev, 0);
      }
    }
  };

  if (playerState.mode === "synced" && sync.isAccessDenied) {
    return (
      <div className="min-h-screen bg-[#0b0d13]">
        <Header
          mode={playerState.mode}
          onModeChange={handleModeChange}
          roomId={roomId}
          participantsCount={sync.participantsCount}
          pingMs={sync.pingMs}
          onOpenInvite={() => setIsInviteOpen(true)}
        />
        <AccessDenied
          roomId={roomId}
          onRetryWithToken={(token) => setInviteToken(token)}
          onReturnToSolo={() => handleModeChange("solo")}
        />
      </div>
    );
  }

  const activeTrack = playerState.currentTrack || queue[currentIndex] || null;

  return (
    <div className="min-h-screen bg-[#0b0d13] text-[#f3f4f6] pb-28">
      {/* Header Bar */}
      <Header
        mode={playerState.mode}
        onModeChange={handleModeChange}
        roomId={roomId}
        participantsCount={sync.participantsCount}
        pingMs={sync.pingMs}
        onOpenInvite={() => setIsInviteOpen(true)}
      />

      {/* Main Grid View */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Multi-Source Music Ingestion */}
        <MusicIngestion onAddTrack={handleAddTrack} roomId={roomId} />

        {/* 2-Column Split: Collaborative Queue & On-Device Library */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QueueView
            queue={queue}
            currentIndex={currentIndex}
            onPlayTrack={handlePlayQueueTrack}
            onRemoveTrack={handleRemoveTrack}
            onPlayNext={handlePlayNext}
            onClearQueue={handleClearQueue}
            onSavePlaylist={handleSaveQueueAsPlaylist}
          />

          <LibraryView
            likedTracks={likedTracks}
            playlists={playlists}
            history={history}
            lastSession={lastSession}
            onPlayTrack={handlePlaySingleTrack}
            onPlayPlaylist={handlePlayPlaylist}
            onCreatePlaylist={createPlaylist}
            onDeletePlaylist={deletePlaylist}
            onResumeSession={handleResumeSession}
          />
        </div>
      </main>

      {/* Persistent Bottom Audio Player Bar */}
      <PlayerBar
        currentTrack={activeTrack}
        status={playerState.status}
        positionMs={playerState.positionMs}
        durationMs={playerState.durationMs}
        volume={playerState.volume}
        mode={playerState.mode}
        pingMs={sync.pingMs}
        isLiked={activeTrack ? isLiked(activeTrack.id) : false}
        onToggleLike={(t) => toggleLike(t)}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onVolumeChange={(v) => coordinator.setVolume(v)}
      />

      {/* Share / Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomId={roomId}
        inviteToken={inviteToken}
      />
    </div>
  );
}
