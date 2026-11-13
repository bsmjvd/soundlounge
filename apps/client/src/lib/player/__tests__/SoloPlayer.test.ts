import { describe, it, expect, beforeEach, mock } from "bun:test";
import { SoloPlayer } from "../SoloPlayer";
import { cacheNextUrl } from "../nextUrlCache";
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

  it("wires transport handlers for next/previous track navigation", () => {
    const handleNext = mock(() => {});
    const handlePrevious = mock(() => {});
    const handleEnded = mock(() => {});

    player.setTransportHandlers({
      onNext: handleNext,
      onPrevious: handlePrevious,
      onEnded: handleEnded,
    });

    expect(typeof player.setTransportHandlers).toBe("function");
  });

  it("primes audio session synchronously for mobile iOS Safari", () => {
    expect(typeof player.primeAudioSession).toBe("function");
    // Calling primeAudioSession should not throw and should handle null/valid tracks
    expect(() => player.primeAudioSession()).not.toThrow();
    expect(() => player.primeAudioSession(sampleTrack)).not.toThrow();
  });

  it("plays YouTube track with direct video ID immediately without error", async () => {
    const ytTrack: Track = {
      id: "yt_6xoB4ZiKKn0",
      title: "The Last Ride",
      artist: "Sidhu Moose Wala",
      durationMs: 260000,
      url: "https://www.youtube.com/watch?v=6xoB4ZiKKn0",
      source: "youtube",
    };

    await player.play(ytTrack, 0);
    const state = player.getState();
    expect(state.status).toBe("playing");
    expect(state.currentTrack?.id).toBe("yt_6xoB4ZiKKn0");
    expect(player.getActiveEngine()).toBe("audio");
  });

  it("uses the pre-resolved cached URL instead of the /api/stream redirect", async () => {
    const streamTrack: Track = {
      id: "yt_abc123",
      title: "Cached Song",
      durationMs: 180000,
      url: "/api/stream/youtube?id=abc123",
      source: "youtube",
    };
    cacheNextUrl(streamTrack, "https://upstream.example/audio.mp4");

    const el = createFakeAudioElement();
    (player as unknown as { audioElement: unknown }).audioElement = el;

    const fetchSpy = mock(() => {
      throw new Error("play() must not fetch when the URL is pre-resolved");
    });
    const realFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    try {
      await player.play(streamTrack, 0);
    } finally {
      globalThis.fetch = realFetch;
    }

    expect(el.src).toBe("https://upstream.example/audio.mp4");
    expect(player.getState().status).toBe("playing");
  });

  it("surfaces NotAllowedError as paused so the next user tap can start audio", async () => {
    const el = createFakeAudioElement();
    el.playImpl = () =>
      Promise.reject(Object.assign(new Error("play() failed"), { name: "NotAllowedError" }));
    (player as unknown as { audioElement: unknown }).audioElement = el;

    await player.play(sampleTrack, 0);

    expect(player.getState().status).toBe("paused");
  });

  it("schedules resume attempts after an unexpected pause (incoming call)", async () => {
    const el = createFakeAudioElement();
    injectAudioElement(player, el);

    await player.play(sampleTrack, 0);
    el.dispatch("playing");
    el.dispatch("pause");

    expect(player.getState().status).toBe("paused");

    // The recovery ladder retries at 1s; playback must restart without a user gesture
    await new Promise((resolve) => setTimeout(resolve, 1150));
    expect(el.paused).toBe(false);
  });

  it("does not auto-resume after a user-initiated pause", async () => {
    const el = createFakeAudioElement();
    injectAudioElement(player, el);

    await player.play(sampleTrack, 0);
    player.pause();
    el.dispatch("pause");

    await new Promise((resolve) => setTimeout(resolve, 1150));
    expect(el.paused).toBe(true);
    expect(player.getState().status).toBe("paused");
  });
});

// Swaps the (DOM-less in tests) audio element for a fake and wires the real
// event listeners to it, so element events can be simulated
function injectAudioElement(
  player: SoloPlayer,
  el: ReturnType<typeof createFakeAudioElement>
): void {
  (player as unknown as { audioElement: unknown }).audioElement = el;
  (player as unknown as { setupElementListeners: (el: unknown) => void }).setupElementListeners(el);
}

function createFakeAudioElement() {
  const listeners = new Map<string, Set<() => void>>();
  const el: {
    src: string;
    volume: number;
    muted: boolean;
    currentTime: number;
    duration: number;
    readyState: number;
    playbackRate: number;
    paused: boolean;
    preload: string;
    playImpl: (() => Promise<void>) | null;
    play: () => Promise<void>;
    pause: () => void;
    load: () => void;
    addEventListener: (name: string, cb: () => void) => void;
    removeEventListener: (name: string, cb: () => void) => void;
    dispatch: (name: string) => void;
  } = {
    src: "",
    volume: 1,
    muted: false,
    currentTime: 0,
    duration: NaN,
    readyState: 0,
    playbackRate: 1,
    paused: true,
    preload: "auto",
    playImpl: null,
    play() {
      el.paused = false;
      return el.playImpl ? el.playImpl() : Promise.resolve();
    },
    pause() {
      el.paused = true;
    },
    load() {},
    addEventListener(name, cb) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(cb);
    },
    removeEventListener(name, cb) {
      listeners.get(name)?.delete(cb);
    },
    dispatch(name) {
      listeners.get(name)?.forEach((cb) => cb());
    },
  };
  return el;
}
