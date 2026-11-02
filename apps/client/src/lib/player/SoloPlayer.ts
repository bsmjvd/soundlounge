import type { Track } from "@soundlounge/shared";

export interface SoloPlayerState {
  status: "idle" | "playing" | "paused" | "buffering";
  currentTrack: Track | null;
  positionMs: number;
  durationMs: number;
  volume: number;
}

export type StateChangeCallback = (state: SoloPlayerState) => void;

interface WindowWithAudio {
  __soundlounge_active_audio__?: HTMLAudioElement | null;
}

export class SoloPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private state: SoloPlayerState = {
    status: "idle",
    currentTrack: null,
    positionMs: 0,
    durationMs: 0,
    volume: 0.4,
  };
  private listeners: Set<StateChangeCallback> = new Set();
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private onNextCallback?: () => void;
  private onPreviousCallback?: () => void;
  private onEndedCallback?: () => void;

  constructor() {
    this.initAudioElement();
  }

  setTransportHandlers(handlers: { onNext?: () => void; onPrevious?: () => void; onEnded?: () => void }): void {
    this.onNextCallback = handlers.onNext;
    this.onPreviousCallback = handlers.onPrevious;
    this.onEndedCallback = handlers.onEnded;
  }

  private initAudioElement() {
    if (typeof window !== "undefined" && typeof Audio !== "undefined") {
      try {
        const win = window as unknown as WindowWithAudio;
        if (win.__soundlounge_active_audio__) {
          try {
            win.__soundlounge_active_audio__.pause();
            win.__soundlounge_active_audio__.src = "";
          } catch {}
        }

        this.audioElement = new Audio();
        this.audioElement.preload = "auto";
        this.audioElement.volume = this.state.volume;
        win.__soundlounge_active_audio__ = this.audioElement;

        this.audioElement.addEventListener("playing", () => {
          this.state.status = "playing";
          this.emitState();
        });

        this.audioElement.addEventListener("pause", () => {
          if (this.state.status !== "idle") {
            this.state.status = "paused";
            this.emitState();
          }
        });

        this.audioElement.addEventListener("timeupdate", () => {
          if (this.audioElement) {
            this.state.positionMs = Math.floor(this.audioElement.currentTime * 1000);
            this.emitState();
          }
        });

        this.audioElement.addEventListener("durationchange", () => {
          if (this.audioElement && !isNaN(this.audioElement.duration)) {
            this.state.durationMs = Math.floor(this.audioElement.duration * 1000);
            this.emitState();
          }
        });

        this.audioElement.addEventListener("ended", () => {
          this.state.status = "idle";
          this.state.positionMs = 0;
          this.emitState();
          if (this.onEndedCallback) {
            this.onEndedCallback();
          }
        });

        this.audioElement.addEventListener("waiting", () => {
          if (this.state.status === "playing") {
            this.state.status = "buffering";
            this.emitState();
          }
        });

        this.audioElement.addEventListener("canplay", () => {
          if (this.state.status === "buffering") {
            this.state.status = "playing";
            this.emitState();
          }
        });

        this.audioElement.addEventListener("error", () => {
          console.warn("SoloPlayer: HTMLAudioElement error:", this.audioElement?.error);
          this.state.status = "idle";
          this.emitState();
        });
      } catch {
        // Fallback to simulated audio in headless / non-DOM environments
        this.audioElement = null;
      }
    }
  }

  getState(): SoloPlayerState {
    return { ...this.state };
  }

  getVolume(): number {
    return this.state.volume;
  }

  onStateChange(cb: StateChangeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emitState() {
    const current = this.getState();
    for (const listener of this.listeners) {
      listener(current);
    }
  }

  private updateMediaSession(track: Track) {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist || "Unknown Artist",
          album: "Soundlounge",
          artwork: track.coverUrl
            ? [
                { src: track.coverUrl, sizes: "96x96", type: "image/png" },
                { src: track.coverUrl, sizes: "128x128", type: "image/png" },
                { src: track.coverUrl, sizes: "512x512", type: "image/png" },
              ]
            : undefined,
        });

        navigator.mediaSession.setActionHandler("play", () => this.resume());
        navigator.mediaSession.setActionHandler("pause", () => this.pause());
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined) {
            this.seek(details.seekTime * 1000);
          }
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          if (this.onNextCallback) this.onNextCallback();
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          if (this.onPreviousCallback) this.onPreviousCallback();
        });
      } catch {
        // Ignored in non-supporting browsers
      }
    }
  }

  async play(track: Track, positionMs: number = 0): Promise<void> {
    this.state.currentTrack = track;
    this.state.positionMs = positionMs;
    this.state.durationMs = track.durationMs;
    this.state.status = "playing";

    if (this.audioElement) {
      // 1. Immediately pause before any URL switch to strictly prevent simultaneous audio
      try {
        this.audioElement.pause();
      } catch {}

      // 2. Halt any other rogue audio elements across the document
      if (typeof window !== "undefined") {
        const win = window as unknown as WindowWithAudio;
        if (win.__soundlounge_active_audio__ && win.__soundlounge_active_audio__ !== this.audioElement) {
          try {
            win.__soundlounge_active_audio__.pause();
            win.__soundlounge_active_audio__.src = "";
          } catch {}
          win.__soundlounge_active_audio__ = this.audioElement;
        }
        if (typeof document !== "undefined") {
          document.querySelectorAll("audio").forEach((el) => {
            if (el !== this.audioElement) {
              try {
                el.pause();
                el.currentTime = 0;
              } catch {}
            }
          });
        }
      }

      // Ensure title and artist are cleanly added to stream URL without duplicating
      let playUrl = track.url;
      if (playUrl.startsWith("/api/stream/youtube")) {
        try {
          const dummyBase = "http://localhost";
          const parsed = new URL(playUrl, dummyBase);
          if (!parsed.searchParams.has("title") && track.title) {
            parsed.searchParams.set("title", track.title);
          }
          if (!parsed.searchParams.has("artist") && track.artist) {
            parsed.searchParams.set("artist", track.artist);
          }
          playUrl = `${parsed.pathname}${parsed.search}`;
        } catch {}
      }

      const currentSrc = this.audioElement.src;
      const targetUrl =
        playUrl.startsWith("http://") || playUrl.startsWith("https://")
          ? playUrl
          : typeof window !== "undefined"
            ? `${window.location.origin}${playUrl}`
            : playUrl;

      if (currentSrc !== targetUrl) {
        this.audioElement.src = playUrl;
        this.audioElement.load();
      }

      if (positionMs > 0) {
        this.audioElement.currentTime = positionMs / 1000;
      }
      this.audioElement.volume = this.state.volume;

      try {
        await this.audioElement.play();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("SoloPlayer: play() rejected or interrupted:", message);
      }
    }

    this.updateMediaSession(track);
    this.emitState();
  }

  async resume(): Promise<void> {
    if (this.state.currentTrack && this.state.status === "paused") {
      this.state.status = "playing";
      if (this.audioElement) {
        try {
          await this.audioElement.play();
        } catch {}
      }
      this.emitState();
    }
  }

  pause(): void {
    this.state.status = "paused";
    if (this.audioElement) {
      this.audioElement.pause();
      this.state.positionMs = Math.floor(this.audioElement.currentTime * 1000);
    }
    this.emitState();
  }

  seek(positionMs: number): void {
    const clampedPos = Math.max(0, Math.min(positionMs, this.state.durationMs || positionMs));
    this.state.positionMs = clampedPos;
    if (this.audioElement) {
      this.audioElement.currentTime = clampedPos / 1000;
    }
    this.emitState();
  }

  setVolume(volume: number): void {
    const clamped = Math.max(0.0, Math.min(1.0, volume));
    this.state.volume = clamped;
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
    this.emitState();
  }

  dispose(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
    if (typeof window !== "undefined") {
      const win = window as unknown as WindowWithAudio;
      if (win.__soundlounge_active_audio__ === this.audioElement) {
        win.__soundlounge_active_audio__ = null;
      }
    }
    this.listeners.clear();
    this.state = {
      status: "idle",
      currentTrack: null,
      positionMs: 0,
      durationMs: 0,
      volume: 0.4,
    };
  }
}
