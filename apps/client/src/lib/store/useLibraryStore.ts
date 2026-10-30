import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Track, Playlist } from "@soundlounge/shared";

export interface LastSessionSnapshot {
  track: Track;
  positionMs: number;
  timestamp: number;
}

export interface LibraryState {
  likedTracks: Track[];
  playlists: Playlist[];
  history: Track[];
  lastSession: LastSessionSnapshot | null;

  // Actions
  toggleLike: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
  createPlaylist: (name: string, description?: string) => string;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addToHistory: (track: Track) => void;
  saveLastSession: (track: Track, positionMs: number) => void;
  clearHistory: () => void;
}

// Memory fallback for SSR / testing environments without window.localStorage
const memoryStorageMap = new Map<string, string>();
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStorageMap.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    } else {
      memoryStorageMap.set(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    } else {
      memoryStorageMap.delete(key);
    }
  },
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedTracks: [],
      playlists: [],
      history: [],
      lastSession: null,

      toggleLike: (track: Track) => {
        set((state) => {
          const exists = state.likedTracks.some((t) => t.id === track.id);
          return {
            likedTracks: exists
              ? state.likedTracks.filter((t) => t.id !== track.id)
              : [track, ...state.likedTracks],
          };
        });
      },

      isLiked: (trackId: string) => {
        return get().likedTracks.some((t) => t.id === trackId);
      },

      createPlaylist: (name: string, description?: string) => {
        const id = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newPlaylist: Playlist = {
          id,
          name,
          description,
          tracks: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          playlists: [...state.playlists, newPlaylist],
        }));
        return id;
      },

      addTrackToPlaylist: (playlistId: string, track: Track) => {
        set((state) => ({
          playlists: state.playlists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            if (pl.tracks.some((t) => t.id === track.id)) return pl;
            return {
              ...pl,
              tracks: [...pl.tracks, track],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      removeTrackFromPlaylist: (playlistId: string, trackId: string) => {
        set((state) => ({
          playlists: state.playlists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            return {
              ...pl,
              tracks: pl.tracks.filter((t) => t.id !== trackId),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      deletePlaylist: (playlistId: string) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
        }));
      },

      addToHistory: (track: Track) => {
        set((state) => {
          const filtered = state.history.filter((t) => t.id !== track.id);
          const updated = [track, ...filtered].slice(0, 50); // Keep last 50
          return { history: updated };
        });
      },

      saveLastSession: (track: Track, positionMs: number) => {
        set({
          lastSession: {
            track,
            positionMs,
            timestamp: Date.now(),
          },
        });
      },

      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: "soundlounge:library-v1",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
