import { describe, it, expect, beforeEach } from "bun:test";
import { AudioEngineCoordinator } from "../AudioEngineCoordinator";
import type { Track } from "@soundlounge/shared";

describe("AudioEngineCoordinator", () => {
  let coordinator: AudioEngineCoordinator;
  const sampleTrack: Track = {
    id: "track_coord_1",
    title: "Intro",
    artist: "The xx",
    durationMs: 128000,
    url: "https://r2.soundlounge.app/audio/intro.mp3",
    source: "upload",
  };

  beforeEach(() => {
    coordinator = new AudioEngineCoordinator();
  });

  it("initializes in solo mode with default volume", () => {
    const state = coordinator.getState();
    expect(state.mode).toBe("solo");
    expect(state.status).toBe("idle");
    expect(state.volume).toBe(1.0);
  });

  it("handles play and pause in solo mode", async () => {
    await coordinator.play(sampleTrack, 2000);
    expect(coordinator.getState().status).toBe("playing");
    expect(coordinator.getState().currentTrack?.id).toBe("track_coord_1");
    expect(coordinator.getState().positionMs).toBe(2000);

    coordinator.pause();
    expect(coordinator.getState().status).toBe("paused");
  });

  it("switches cleanly between solo and synced mode", async () => {
    await coordinator.play(sampleTrack, 15000);
    expect(coordinator.getState().mode).toBe("solo");

    coordinator.setMode("synced");
    expect(coordinator.getState().mode).toBe("synced");

    // Switching back to solo
    coordinator.setMode("solo");
    expect(coordinator.getState().mode).toBe("solo");
  });

  it("subscribes to state change events", async () => {
    let callCount = 0;
    const unsubscribe = coordinator.onStateChange(() => {
      callCount++;
    });

    await coordinator.play(sampleTrack, 0);
    coordinator.pause();
    coordinator.setVolume(0.5);

    expect(callCount).toBeGreaterThanOrEqual(3);
    unsubscribe();
  });
});
