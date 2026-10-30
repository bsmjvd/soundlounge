import { describe, it, expect, beforeEach, mock } from "bun:test";
import { SoloPlayer } from "../SoloPlayer";
import type { Track } from "@soundlounge/shared";

describe("SoloPlayer Engine", () => {
  let player: SoloPlayer;
  const sampleTrack: Track = {
    id: "track_1",
    title: "Midnight City",
    artist: "M83",
    durationMs: 243000,
    url: "https://r2.soundlounge.app/audio/midnight_city.mp3",
    source: "upload",
  };

  beforeEach(() => {
    player = new SoloPlayer();
  });

  it("initializes with idle state and 0ms position", () => {
    const state = player.getState();
    expect(state.status).toBe("idle");
    expect(state.currentTrack).toBeNull();
    expect(state.positionMs).toBe(0);
  });

  it("starts playback and updates state to playing", async () => {
    let notifiedState: any = null;
    player.onStateChange((state) => {
      notifiedState = state;
    });

    await player.play(sampleTrack, 5000);

    const state = player.getState();
    expect(state.status).toBe("playing");
    expect(state.currentTrack?.id).toBe("track_1");
    expect(state.positionMs).toBe(5000);
    expect(notifiedState?.status).toBe("playing");
  });

  it("pauses playback and preserves current position", async () => {
    await player.play(sampleTrack, 10000);
    player.pause();

    const state = player.getState();
    expect(state.status).toBe("paused");
    expect(state.positionMs).toBe(10000);
  });

  it("seeks to target position", async () => {
    await player.play(sampleTrack, 0);
    player.seek(45000);

    const state = player.getState();
    expect(state.positionMs).toBe(45000);
  });

  it("adjusts volume between 0.0 and 1.0", () => {
    player.setVolume(0.75);
    expect(player.getVolume()).toBe(0.75);

    // Clamps out of bound values
    player.setVolume(1.5);
    expect(player.getVolume()).toBe(1.0);

    player.setVolume(-0.2);
    expect(player.getVolume()).toBe(0.0);
  });
});
