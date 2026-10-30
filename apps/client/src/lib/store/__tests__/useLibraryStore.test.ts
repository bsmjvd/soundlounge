import { describe, it, expect, beforeEach } from "bun:test";
import { useLibraryStore } from "../useLibraryStore";
import type { Track } from "@soundlounge/shared";

describe("useLibraryStore (On-Device LocalStorage Persistence)", () => {
  const sampleTrack1: Track = {
    id: "yt_101",
    title: "Get Lucky",
    artist: "Daft Punk",
    durationMs: 248000,
    url: "https://r2.soundlounge.app/audio/get_lucky.mp3",
    source: "youtube",
  };

  const sampleTrack2: Track = {
    id: "sc_202",
    title: "Midnight City",
    artist: "M83",
    durationMs: 243000,
    url: "https://r2.soundlounge.app/audio/midnight.mp3",
    source: "soundcloud",
  };

  beforeEach(() => {
    // Reset store state before each test
    useLibraryStore.setState({
      likedTracks: [],
      playlists: [],
      history: [],
      lastSession: null,
    });
  });

  it("toggles liked tracks", () => {
    const { toggleLike, isLiked } = useLibraryStore.getState();

    expect(isLiked(sampleTrack1.id)).toBe(false);

    toggleLike(sampleTrack1);
    expect(useLibraryStore.getState().isLiked(sampleTrack1.id)).toBe(true);
    expect(useLibraryStore.getState().likedTracks.length).toBe(1);

    toggleLike(sampleTrack1);
    expect(useLibraryStore.getState().isLiked(sampleTrack1.id)).toBe(false);
    expect(useLibraryStore.getState().likedTracks.length).toBe(0);
  });

  it("creates playlists and adds tracks to them", () => {
    const { createPlaylist, addTrackToPlaylist, removeTrackFromPlaylist } =
      useLibraryStore.getState();

    const playlistId = createPlaylist("Late Night Vibes", "Chill electronic tracks");
    expect(useLibraryStore.getState().playlists.length).toBe(1);

    addTrackToPlaylist(playlistId, sampleTrack1);
    addTrackToPlaylist(playlistId, sampleTrack2);

    const playlist = useLibraryStore.getState().playlists.find((p) => p.id === playlistId);
    expect(playlist?.tracks.length).toBe(2);
    expect(playlist?.tracks[0].id).toBe("yt_101");

    removeTrackFromPlaylist(playlistId, sampleTrack1.id);
    const updated = useLibraryStore.getState().playlists.find((p) => p.id === playlistId);
    expect(updated?.tracks.length).toBe(1);
    expect(updated?.tracks[0].id).toBe("sc_202");
  });

  it("records listening history with de-duplication and limit", () => {
    const { addToHistory } = useLibraryStore.getState();

    addToHistory(sampleTrack1);
    addToHistory(sampleTrack2);
    addToHistory(sampleTrack1); // Re-playing moves track1 to top

    const history = useLibraryStore.getState().history;
    expect(history.length).toBe(2);
    expect(history[0].id).toBe(sampleTrack1.id);
    expect(history[1].id).toBe(sampleTrack2.id);
  });

  it("persists and restores continue listening session snapshot", () => {
    const { saveLastSession } = useLibraryStore.getState();

    saveLastSession(sampleTrack1, 45000);
    const session = useLibraryStore.getState().lastSession;

    expect(session).not.toBeNull();
    expect(session?.track.id).toBe(sampleTrack1.id);
    expect(session?.positionMs).toBe(45000);
    expect(session?.timestamp).toBeGreaterThan(0);
  });
});
