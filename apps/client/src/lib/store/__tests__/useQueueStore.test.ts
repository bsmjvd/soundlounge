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
});
