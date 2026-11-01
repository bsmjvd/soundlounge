import { describe, it, expect, beforeEach } from "bun:test";
import { useQueueStore } from "../useQueueStore";
import type { Track } from "@soundlounge/shared";

describe("useQueueStore", () => {
  const trackA: Track = {
    id: "track_a",
    title: "Track A",
    artist: "Artist A",
    durationMs: 180000,
    url: "https://r2.soundlounge.app/a.mp3",
    source: "upload",
  };

  const trackB: Track = {
    id: "track_b",
    title: "Track B",
    artist: "Artist B",
    durationMs: 200000,
    url: "https://r2.soundlounge.app/b.mp3",
    source: "upload",
  };

  const trackC: Track = {
    id: "track_c",
    title: "Track C",
    artist: "Artist C",
    durationMs: 210000,
    url: "https://r2.soundlounge.app/c.mp3",
    source: "upload",
  };

  beforeEach(() => {
    useQueueStore.setState({
      queue: [],
      currentIndex: -1,
    });
  });

  it("adds tracks to queue and plays first if empty", () => {
    const { addTrack } = useQueueStore.getState();

    addTrack(trackA);
    expect(useQueueStore.getState().queue.length).toBe(1);
    expect(useQueueStore.getState().currentIndex).toBe(0);

    addTrack(trackB);
    expect(useQueueStore.getState().queue.length).toBe(2);
    expect(useQueueStore.getState().currentIndex).toBe(0);
  });

  it("inserts track right after current when playNext is true", () => {
    const { addTrack } = useQueueStore.getState();

    addTrack(trackA);
    addTrack(trackB);
    addTrack(trackC, true); // Play next!

    const queue = useQueueStore.getState().queue;
    expect(queue.map((t) => t.id)).toEqual(["track_a", "track_c", "track_b"]);
  });

  it("removes tracks from queue", () => {
    const { addTrack, removeTrack } = useQueueStore.getState();

    addTrack(trackA);
    addTrack(trackB);
    removeTrack("track_a");

    const queue = useQueueStore.getState().queue;
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe("track_b");
  });

  it("reorders tracks in queue", () => {
    const { addTrack, reorderQueue } = useQueueStore.getState();

    addTrack(trackA);
    addTrack(trackB);
    addTrack(trackC);

    reorderQueue(0, 2); // Move A to end
    const queue = useQueueStore.getState().queue;
    expect(queue.map((t) => t.id)).toEqual(["track_b", "track_c", "track_a"]);
  });

  it("advances to next and previous tracks", () => {
    const { addTrack, nextTrack, previousTrack } = useQueueStore.getState();

    addTrack(trackA);
    addTrack(trackB);

    expect(useQueueStore.getState().getCurrentTrack()?.id).toBe("track_a");

    nextTrack();
    expect(useQueueStore.getState().getCurrentTrack()?.id).toBe("track_b");

    previousTrack();
    expect(useQueueStore.getState().getCurrentTrack()?.id).toBe("track_a");
  });

  it("toggles and maintains autoplay state", () => {
    expect(useQueueStore.getState().isAutoplayEnabled).toBe(true);

    useQueueStore.getState().toggleAutoplay();
    expect(useQueueStore.getState().isAutoplayEnabled).toBe(false);

    useQueueStore.getState().setAutoplayEnabled(true);
    expect(useQueueStore.getState().isAutoplayEnabled).toBe(true);
  });

  it("automatically queues a similar track when ensureSimilarQueued is invoked", async () => {
    const sidhuTrack: Track = {
      id: "yt_295",
      title: "295",
      artist: "Sidhu Moose Wala",
      durationMs: 270000,
      url: "/api/stream/youtube?id=295",
      source: "youtube",
    };

    useQueueStore.getState().setQueue([sidhuTrack], 0);
    expect(useQueueStore.getState().queue.length).toBe(1);

    const queued = await useQueueStore.getState().ensureSimilarQueued(sidhuTrack);
    expect(queued).not.toBeNull();
    expect(useQueueStore.getState().queue.length).toBe(2);
    expect(useQueueStore.getState().queue[1].artist).toContain("Sidhu Moose Wala");

    // Check that autoQueueReason is recorded
    const reason = useQueueStore.getState().autoQueueReasons[queued!.id];
    expect(reason).toBeDefined();
    expect(reason).toContain("Sidhu Moose Wala");
  });

  it("does NOT auto-queue suggestions if there is already a song next to the current track", async () => {
    // Current track at index 0, with trackB next to it at index 1 (tracksAhead === 1)
    useQueueStore.getState().setQueue([trackA, trackB], 0);
    expect(useQueueStore.getState().queue.length).toBe(2);

    const queued = await useQueueStore.getState().ensureSimilarQueued(trackA);
    // Must return null and queue length must remain strictly 2
    expect(queued).toBeNull();
    expect(useQueueStore.getState().queue.length).toBe(2);
    expect(useQueueStore.getState().queue.map((t) => t.id)).toEqual(["track_a", "track_b"]);
  });

  it("moves existing track to playNext without duplicating", () => {
    useQueueStore.getState().setQueue([trackA, trackB, trackC], 0);

    // Call addTrack with trackC and playNext=true
    useQueueStore.getState().addTrack(trackC, true);

    const queue = useQueueStore.getState().queue;
    // trackC moved to index 1, right after trackA
    expect(queue.map((t) => t.id)).toEqual(["track_a", "track_c", "track_b"]);
    expect(queue.length).toBe(3);
  });
});
