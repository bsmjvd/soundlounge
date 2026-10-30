import { create } from "zustand";
import type { Track } from "@soundlounge/shared";

export interface QueueState {
  queue: Track[];
  currentIndex: number;

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
}

export const useQueueStore = create<QueueState>()((set, get) => ({
  queue: [],
  currentIndex: -1,

  addTrack: (track: Track, playNext: boolean = false) => {
    set((state) => {
      if (state.queue.length === 0) {
        return {
          queue: [track],
          currentIndex: 0,
        };
      }

      if (playNext) {
        const insertIdx = state.currentIndex >= 0 ? state.currentIndex + 1 : 0;
        const newQueue = [...state.queue];
        newQueue.splice(insertIdx, 0, track);
        return {
          queue: newQueue,
        };
      }

      return {
        queue: [...state.queue, track],
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
      if (
        fromIndex < 0 ||
        fromIndex >= state.queue.length ||
        toIndex < 0 ||
        toIndex >= state.queue.length
      ) {
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
