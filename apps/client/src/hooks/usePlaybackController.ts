"use client";

import { useState, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { AudioEngineCoordinator, type CoordinatorPlayerState, type PlaybackMode } from "../lib/player";
import { useLibraryStore, type LastSessionSnapshot } from "../lib/store/useLibraryStore";
import { useQueueStore } from "../lib/store/useQueueStore";
import { useRoomSync } from "../lib/sync/useRoomSync";
import { prefetchTrack } from "../lib/prefetch";
import { resolveAndCache } from "../lib/player/nextUrlCache";
import type { Track } from "@soundlounge/shared";

// Singleton coordinator instance for the browser tab, preserved on window across fast refresh
let coordinatorSingleton: AudioEngineCoordinator | null = null;
function getCoordinator(): AudioEngineCoordinator {
  if (!coordinatorSingleton) {
    if (typeof window !== "undefined") {
      const winWithCoord = window as unknown as { __soundlounge_coordinator__?: AudioEngineCoordinator };
      if (winWithCoord.__soundlounge_coordinator__) {
        coordinatorSingleton = winWithCoord.__soundlounge_coordinator__;
      } else {
        coordinatorSingleton = new AudioEngineCoordinator();
        winWithCoord.__soundlounge_coordinator__ = coordinatorSingleton;
      }
    } else {
      coordinatorSingleton = new AudioEngineCoordinator();
    }
  }
  return coordinatorSingleton ?? new AudioEngineCoordinator();
}

interface PlaybackControllerOptions {
  roomId: string;
  inviteToken?: string;
  recordPlay: (track: Track) => void;
}

// Owns the audio coordinator, room sync and every play/queue action, routing each to the
// local queue (solo) or the room (synced).
export function usePlaybackController({ roomId, inviteToken, recordPlay }: PlaybackControllerOptions) {
  const coordinator = getCoordinator();
  const addToHistory = useLibraryStore((s) => s.addToHistory);
  const { queue, currentIndex, isAutoplayEnabled, ensureSimilarQueued } = useQueueStore(
    useShallow((s) => ({
      queue: s.queue,
      currentIndex: s.currentIndex,
      isAutoplayEnabled: s.isAutoplayEnabled,
      ensureSimilarQueued: s.ensureSimilarQueued,
    }))
  );

  // Player state subscription
  const [playerState, setPlayerState] = useState<CoordinatorPlayerState>(() => coordinator.getState());

  const lastRecordedTrackIdRef = useRef<string | null>(null);
  const lastSessionSavedAtRef = useRef(0);

  useEffect(() => {
    return coordinator.onStateChange((state) => {
      setPlayerState(state);
      // Track ended/stopped: a later replay of the same track counts as a new play
      if (state.status === "idle") lastRecordedTrackIdRef.current = null;
      if (!state.currentTrack) return;

      // State emits on every timeupdate, so record taste once per track and throttle session snapshots
      const isNewPlay = state.status === "playing" && state.currentTrack.id !== lastRecordedTrackIdRef.current;
      if (isNewPlay) {
        lastRecordedTrackIdRef.current = state.currentTrack.id;
        recordPlay(state.currentTrack);
      }
      const now = Date.now();
      if (
        isNewPlay ||
        state.status === "paused" ||
        (state.status === "playing" && now - lastSessionSavedAtRef.current >= 5000)
      ) {
        lastSessionSavedAtRef.current = now;
        useLibraryStore.getState().saveLastSession(state.currentTrack, state.positionMs);
      }
    });
  }, [coordinator, recordPlay]);

  // Synchronized WebSocket engine
  const sync = useRoomSync({
    // Only join the room while in synced mode; solo listeners must not affect the shared room
    roomId: playerState.mode === "synced" ? roomId : "",
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
      const state = useQueueStore.getState();
      const wasEmpty = state.queue.length === 0;
      state.addTrack(track, playNext);
      if (wasEmpty) {
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

  // One-time global touch listener to unlock audio on iOS Safari upon first gesture
  useEffect(() => {
    const handleFirstTouch = () => {
      coordinator.primeAudioSession();
      window.removeEventListener("touchstart", handleFirstTouch, true);
      window.removeEventListener("click", handleFirstTouch, true);
    };
    window.addEventListener("touchstart", handleFirstTouch, { capture: true, once: true });
    window.addEventListener("click", handleFirstTouch, { capture: true, once: true });
    return () => {
      window.removeEventListener("touchstart", handleFirstTouch, true);
      window.removeEventListener("click", handleFirstTouch, true);
    };
  }, [coordinator]);

  const handlePlaySingleTrack = (track: Track) => {
    addToHistory(track);
    if (playerState.mode === "synced") {
      sync.sendClearQueue();
      sync.sendAddTrack(track, false);
      sync.sendPlay(track.id, 0);
    } else {
      const state = useQueueStore.getState();
      state.setQueue([track], 0);
      coordinator.play(track, 0);
      if (isAutoplayEnabled) {
        state.seedSimilarQueue(track, useLibraryStore.getState().history);
      }
    }
  };

  // Replace the queue with a list (album, mix, playlist, artist) and start playback
  // at startIndex, so list views (sidebar playlist, liked songs) continue in order
  const handlePlayTracksFrom = (tracks: Track[], startIndex: number) => {
    if (tracks.length === 0) return;
    const clamped = Math.max(0, Math.min(startIndex, tracks.length - 1));
    const startTrack = tracks[clamped];
    useQueueStore.getState().setQueue(tracks, clamped);
    addToHistory(startTrack);
    if (playerState.mode === "synced") {
      sync.sendClearQueue();
      tracks.forEach((t) => sync.sendAddTrack(t));
      sync.sendPlay(startTrack.id, 0);
    } else {
      coordinator.play(startTrack, 0);
    }
  };

  const handlePlayTracks = (tracks: Track[]) => {
    handlePlayTracksFrom(tracks, 0);
  };

  const handleAddTracksToQueue = (tracks: Track[]) => {
    tracks.forEach((t) => handleAddTrack(t, false));
  };

  const handleResumeSession = (session: LastSessionSnapshot) => {
    addToHistory(session.track);
    if (playerState.mode === "synced") {
      sync.sendAddTrack(session.track, true);
      sync.sendPlay(session.track.id, session.positionMs);
    } else {
      const state = useQueueStore.getState();
      const existingIdx = state.queue.findIndex((t) => t.id === session.track.id);
      if (existingIdx !== -1) {
        state.setCurrentIndex(existingIdx);
      } else if (state.queue.length > 0) {
        const insertIdx = state.currentIndex >= 0 ? state.currentIndex + 1 : 0;
        state.addTrack(session.track, true);
        state.setCurrentIndex(insertIdx);
      } else {
        state.setQueue([session.track], 0);
      }
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

  const handleNext = async () => {
    let next = useQueueStore.getState().nextTrack();
    if (!next && isAutoplayEnabled) {
      const cur = playerState.currentTrack || queue[currentIndex];
      if (cur) {
        const autoNext = await ensureSimilarQueued(cur, useLibraryStore.getState().history);
        if (autoNext) {
          if (coordinator.getMode() === "synced") sync.sendAddTrack(autoNext);
          next = useQueueStore.getState().nextTrack();
        }
      }
    }

    if (next) {
      addToHistory(next);
      if (coordinator.getMode() === "synced") {
        sync.sendPlay(next.id, 0);
      } else {
        coordinator.play(next, 0);
      }
    }
  };

  // Autonomous similarity queuing:
  // ONLY trigger when the current track is playing, autoplay is ON, and there is NO song next to it (tracksAhead <= 0)
  useEffect(() => {
    const tracksAhead = queue.length - 1 - currentIndex;
    const cur = playerState.currentTrack || queue[currentIndex];
    if (cur && playerState.status === "playing" && isAutoplayEnabled && tracksAhead <= 0) {
      ensureSimilarQueued(cur, useLibraryStore.getState().history).then((track) => {
        // shortcut: every listener may queue its own pick; dedupe server-side if rooms get busy
        if (track && coordinator.getMode() === "synced") sync.sendAddTrack(track);
      });
    }
  }, [playerState.currentTrack?.id, playerState.status, queue.length, currentIndex, isAutoplayEnabled]);

  // Warm the next two tracks while this one plays, so skipping ahead starts instantly.
  // resolveAndCache pre-resolves their upstream URLs so track changes on a locked
  // screen swap the audio src synchronously instead of waiting on the stream redirect.
  useEffect(() => {
    if (playerState.status !== "playing") return;
    queue.slice(currentIndex + 1, currentIndex + 3).forEach((track) => {
      prefetchTrack(track);
      void resolveAndCache(track);
    });
  }, [playerState.status, queue, currentIndex]);

  const handlePrevious = () => {
    const prev = useQueueStore.getState().previousTrack();
    if (prev) {
      addToHistory(prev);
      if (coordinator.getMode() === "synced") {
        sync.sendPlay(prev.id, 0);
      } else {
        coordinator.play(prev, 0);
      }
    }
  };

  // Wire transport handlers for lock screen and auto-next on track completion.
  // Registered once through a ref so they always see the latest mode/queue/history.
  const transportRef = useRef({ handleNext, handlePrevious });
  transportRef.current = { handleNext, handlePrevious };
  useEffect(() => {
    coordinator.setTransportHandlers({
      onNext: () => transportRef.current.handleNext(),
      onPrevious: () => transportRef.current.handlePrevious(),
      onEnded: () => transportRef.current.handleNext(),
    });
  }, [coordinator]);

  return {
    coordinator,
    playerState,
    sync,
    activeTrack: playerState.currentTrack || queue[currentIndex] || null,
    handleModeChange,
    handleAddTrack,
    handleAddTracksToQueue,
    handlePlayQueueTrack,
    handleRemoveTrack,
    handlePlayNext,
    handleClearQueue,
    handlePlaySingleTrack,
    handlePlayTracks,
    handlePlayTracksFrom,
    handleResumeSession,
    handleTogglePlay,
    handleSeek,
    handleNext,
    handlePrevious,
  };
}
