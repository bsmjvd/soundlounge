"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "../components/Header";
import { AmbientBackground } from "../components/AmbientBackground";
import { NowPlayingHero } from "../components/NowPlayingHero";
import { MusicIngestion } from "../components/MusicIngestion";
import { QueueView } from "../components/QueueView";
import { LibraryView } from "../components/LibraryView";
import { PlayerBar } from "../components/PlayerBar";
import { InviteModal } from "../components/InviteModal";
import { AccessDenied } from "../components/AccessDenied";
import { StudioImmersiveModal } from "../components/StudioImmersiveModal";
import { NavigationSidebar, type NavTab } from "../components/NavigationSidebar";

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

  // Navigation and Modal State
  const [activeTab, setActiveTab] = useState<NavTab>("search");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [roomId, setRoomId] = useState("lounge-main");
  const [inviteToken, setInviteToken] = useState<string | undefined>(undefined);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

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

  // Wire transport handlers for lock screen and auto-next on track completion
  useEffect(() => {
    coordinator.setTransportHandlers({
      onNext: handleNext,
      onPrevious: handlePrevious,
      onEnded: handleNext,
    });
  }, [queue, currentIndex]);

  // Global desktop studio keyboard shortcuts (Space, Arrow keys, F for Studio Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === "ArrowRight" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        handleSeek(Math.min((playerState.durationMs || 0), playerState.positionMs + 5000));
      } else if (e.code === "ArrowLeft" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        handleSeek(Math.max(0, playerState.positionMs - 5000));
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsStudioOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerState.status, playerState.positionMs, playerState.durationMs]);

  if (playerState.mode === "synced" && sync.isAccessDenied) {
    return (
      <div className="min-h-screen bg-[#07080b]">
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
    <div className="min-h-screen bg-[#07080b] text-[#f3f4f6] relative overflow-x-hidden selection:bg-indigo-600/30 selection:text-white">
      {/* Full-bleed Ambient Blurred Song Aura (Zero Seams, Zero Breaks) */}
      <AmbientBackground
        currentTrack={activeTrack}
        isPlaying={playerState.status === "playing"}
      />

      {/* Main Studio Shell: Two-Column Flex Layout */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left Persistent Navigation Sidebar */}
        <NavigationSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          mode={playerState.mode}
          onModeChange={handleModeChange}
          queueCount={queue.length}
          likedCount={likedTracks.length}
          playlistsCount={playlists.length}
          historyCount={history.length}
          roomId={roomId}
          participantsCount={sync.participantsCount}
          pingMs={sync.pingMs}
          onOpenInvite={() => setIsInviteOpen(true)}
          lastSession={lastSession}
          onResumeSession={handleResumeSession}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Right Main Content Stage */}
        <div className="flex-1 min-w-0 flex flex-col justify-between pb-28">
          <div>
            {/* Top Stage Bar */}
            <Header
              mode={playerState.mode}
              onModeChange={handleModeChange}
              roomId={roomId}
              participantsCount={sync.participantsCount}
              pingMs={sync.pingMs}
              onOpenInvite={() => setIsInviteOpen(true)}
              onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
            />

            {/* Stage Canvas */}
            <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 space-y-6">
              {/* Cinematic Now Playing Hero Banner */}
              <NowPlayingHero
                currentTrack={activeTrack}
                status={playerState.status}
                positionMs={playerState.positionMs}
                durationMs={playerState.durationMs}
                mode={playerState.mode}
                pingMs={sync.pingMs}
                isLiked={activeTrack ? isLiked(activeTrack.id) : false}
                onToggleLike={(t) => toggleLike(t)}
                onTogglePlay={handleTogglePlay}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSeek={handleSeek}
                onOpenStudio={() => setIsStudioOpen(true)}
              />

              {/* Dynamic Tab Stage View */}
              <div className="pt-2">
                {activeTab === "search" && (
                  <MusicIngestion
                    onAddTrack={handleAddTrack}
                    onPlayDirect={handlePlaySingleTrack}
                    roomId={roomId}
                  />
                )}

                {activeTab === "queue" && (
                  <QueueView
                    queue={queue}
                    currentIndex={currentIndex}
                    onPlayTrack={handlePlayQueueTrack}
                    onRemoveTrack={handleRemoveTrack}
                    onPlayNext={handlePlayNext}
                    onClearQueue={handleClearQueue}
                    onSavePlaylist={handleSaveQueueAsPlaylist}
                  />
                )}

                {activeTab === "liked" && (
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
                    activeSection="liked"
                  />
                )}

                {activeTab === "playlists" && (
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
                    activeSection="playlists"
                  />
                )}

                {activeTab === "history" && (
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
                    activeSection="history"
                  />
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Edge-to-Edge Audio Player Bar */}
      <div className="relative z-20">
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
          onOpenStudio={() => setIsStudioOpen(true)}
        />
      </div>

      {/* Share / Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomId={roomId}
        inviteToken={inviteToken}
      />

      {/* Fullscreen Immersive Studio Player */}
      <StudioImmersiveModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        currentTrack={activeTrack}
        status={playerState.status}
        positionMs={playerState.positionMs}
        durationMs={playerState.durationMs}
        volume={playerState.volume}
        isLiked={activeTrack ? isLiked(activeTrack.id) : false}
        onToggleLike={(t) => toggleLike(t)}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onVolumeChange={(v) => coordinator.setVolume(v)}
      />
    </div>
  );
}
