import { create } from "zustand";
import type { Track } from "@soundlounge/shared";
import { findSimilarTrack, normalizeSongTitle } from "../recommendation/SimilarTracksEngine";

export interface QueueState {
  queue: Track[];
  currentIndex: number;
  isAutoplayEnabled: boolean;
  autoQueueReasons: Record<string, string>;
  isFetchingSimilar: boolean;

  // Actions
  addTrack: (track: Track, playNext?: boolean) => void;
  removeTrack: (trackId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setQueue: (tracks: Track[], currentIndex?: number) => void;
  nextTrack: () => Track | null;
  previousTrack: () => Track | null;
  getCurrentTrack: () => Track | null;
  setCurrentIndex: (index: number) => void;
  toggleAutoplay: () => void;
  setAutoplayEnabled: (enabled: boolean) => void;
  setAutoQueueReason: (trackId: string, reason: string) => void;
  ensureSimilarQueued: (currentTrack: Track, history?: Track[]) => Promise<Track | null>;
}

export const useQueueStore = create<QueueState>()((set, get) => ({
  queue: [],
  currentIndex: -1,
  isAutoplayEnabled: true,
  autoQueueReasons: {},
  isFetchingSimilar: false,

  toggleAutoplay: () => {
    set((state) => ({ isAutoplayEnabled: !state.isAutoplayEnabled }));
  },

  setAutoplayEnabled: (enabled: boolean) => {
    set({ isAutoplayEnabled: enabled });
  },

  setAutoQueueReason: (trackId: string, reason: string) => {
    set((state) => ({
      autoQueueReasons: { ...state.autoQueueReasons, [trackId]: reason },
    }));
  },

  ensureSimilarQueued: async (currentTrack: Track, history: Track[] = []) => {
    const state = get();
    if (!state.isAutoplayEnabled || !currentTrack || state.isFetchingSimilar) {
      return null;
    }

    // STRICT: Only auto-queue if there is NO song next to the current track
    const tracksAhead = state.queue.length - 1 - state.currentIndex;
    if (tracksAhead > 0) {
      return null;
    }

    set({ isFetchingSimilar: true });
    try {
      const res = await findSimilarTrack({
        currentTrack,
        existingQueue: state.queue,
        history,
      });

      if (res && res.track) {
        const freshState = get();
        // Double check not already present by ID or by normalized song title
        const candNorm = normalizeSongTitle(res.track.title, res.track.artist);
        const isDuplicate = freshState.queue.some((t) => {
          if (t.id === res.track.id) return true;
          const tNorm = normalizeSongTitle(t.title, t.artist);
          return (
            tNorm &&
            candNorm &&
            (tNorm === candNorm ||
              (tNorm.length >= 4 && candNorm.length >= 4 && (tNorm.startsWith(candNorm) || candNorm.startsWith(tNorm))))
          );
        });

        if (!isDuplicate) {
          set((s) => ({
            queue: [...s.queue, res.track],
            autoQueueReasons: {
              ...s.autoQueueReasons,
              [res.track.id]: res.reason,
            },
          }));
          return res.track;
        }
      }
      return null;
    } catch (err) {
      console.warn("Failed to auto-queue similar track:", err);
      return null;
    } finally {
      set({ isFetchingSimilar: false });
    }
  },

  addTrack: (track: Track, playNext: boolean = false) => {
    set((state) => {
      if (state.queue.length === 0) {
        return {
          queue: [track],
          currentIndex: 0,
        };
      }

      // If track is already in queue, move it rather than creating a duplicate
      const existingIdx = state.queue.findIndex((t) => t.id === track.id);
      let queueWithoutTrack = state.queue;
      let newCurrentIndex = state.currentIndex;

      if (existingIdx !== -1) {
        if (existingIdx === state.currentIndex) {
          // If currently playing, keep it as is
          return state;
        }
        queueWithoutTrack = state.queue.filter((t) => t.id !== track.id);
        if (existingIdx < state.currentIndex) {
          newCurrentIndex = Math.max(0, state.currentIndex - 1);
        }
      }

      if (playNext) {
        const insertIdx = newCurrentIndex >= 0 ? newCurrentIndex + 1 : 0;
        const newQueue = [...queueWithoutTrack];
        newQueue.splice(insertIdx, 0, track);
        return {
          queue: newQueue,
          currentIndex: newCurrentIndex,
        };
      }

      return {
        queue: [...queueWithoutTrack, track],
        currentIndex: newCurrentIndex,
      };
    });
  },

  removeTrack: (trackId: string) => {
    set((state) => {
      const idx = state.queue.findIndex((t) => t.id === trackId);
      if (idx === -1) return state;

      const newQueue = state.queue.filter((t) => t.id !== trackId);
      let newCurrentIndex = state.currentIndex;

      if (idx < state.currentIndex) {
        newCurrentIndex = Math.max(0, state.currentIndex - 1);
      } else if (idx === state.currentIndex) {
        newCurrentIndex = Math.min(newCurrentIndex, newQueue.length - 1);
      }

      return {
        queue: newQueue,
        currentIndex: newQueue.length === 0 ? -1 : newCurrentIndex,
      };
    });
  },

  reorderQueue: (fromIndex: number, toIndex: number) => {
    set((state) => {
      if (fromIndex < 0 || fromIndex >= state.queue.length || toIndex < 0 || toIndex >= state.queue.length) {
        return state;
      }

      const newQueue = [...state.queue];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);

      // Adjust currentIndex if necessary
      let newCurrentIndex = state.currentIndex;
      if (state.currentIndex === fromIndex) {
        newCurrentIndex = toIndex;
      } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
        newCurrentIndex--;
      } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
        newCurrentIndex++;
      }

      return {
        queue: newQueue,
        currentIndex: newCurrentIndex,
      };
    });
  },

  clearQueue: () => {
    set({
      queue: [],
      currentIndex: -1,
    });
  },

  setQueue: (tracks: Track[], currentIndex: number = 0) => {
    set({
      queue: tracks,
      currentIndex: tracks.length === 0 ? -1 : Math.max(0, Math.min(currentIndex, tracks.length - 1)),
    });
  },

  nextTrack: () => {
    const state = get();
    if (state.queue.length === 0) return null;
    if (state.currentIndex + 1 < state.queue.length) {
      const nextIdx = state.currentIndex + 1;
      set({ currentIndex: nextIdx });
      return state.queue[nextIdx];
    }
    return null;
  },

  previousTrack: () => {
    const state = get();
    if (state.queue.length === 0) return null;
    if (state.currentIndex - 1 >= 0) {
      const prevIdx = state.currentIndex - 1;
      set({ currentIndex: prevIdx });
      return state.queue[prevIdx];
    }
    return null;
  },

  getCurrentTrack: () => {
    const state = get();
    if (state.currentIndex >= 0 && state.currentIndex < state.queue.length) {
      return state.queue[state.currentIndex];
    }
    return null;
  },

  setCurrentIndex: (index: number) => {
    const state = get();
    if (index >= -1 && index < state.queue.length) {
      set({ currentIndex: index });
    }
  },
}));
