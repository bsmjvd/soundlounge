import type { Track } from "@soundlounge/shared";
import { YouTubeIframeBridge } from "./YouTubeIframeBridge";

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
  private ytBridge: YouTubeIframeBridge = YouTubeIframeBridge.getInstance();
  private activeEngine: "audio" | "iframe" = "audio";

  private state: SoloPlayerState = {
    status: "idle",
    currentTrack: null,
    positionMs: 0,
    durationMs: 0,
    volume: 0.4,
  };
  private listeners: Set<StateChangeCallback> = new Set();
  private onNextCallback?: () => void;
  private onPreviousCallback?: () => void;
  private onEndedCallback?: () => void;

  constructor() {
    this.initAudioElement();
    this.initYtBridge();
  }

  setTransportHandlers(handlers: { onNext?: () => void; onPrevious?: () => void; onEnded?: () => void }): void {
    this.onNextCallback = handlers.onNext;
    this.onPreviousCallback = handlers.onPrevious;
    this.onEndedCallback = handlers.onEnded;
    this.ytBridge.setOnEnded(() => {
      if (this.activeEngine === "iframe" && this.onEndedCallback) {
        this.onEndedCallback();
      }
    });
  }

  private initYtBridge() {
    this.ytBridge.onStateChange((bridgeState) => {
      if (this.activeEngine === "iframe") {
        this.state.status = bridgeState.status;
        this.state.positionMs = bridgeState.positionMs;
        if (bridgeState.durationMs > 0) {
          this.state.durationMs = bridgeState.durationMs;
        }
        this.emitState();
      }
    });
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
          if (this.activeEngine === "audio") {
            this.state.status = "playing";
            this.emitState();
          }
        });

        this.audioElement.addEventListener("pause", () => {
          if (this.activeEngine === "audio" && this.state.status !== "idle") {
            this.state.status = "paused";
            this.emitState();
          }
        });

        this.audioElement.addEventListener("timeupdate", () => {
          if (this.activeEngine === "audio" && this.audioElement) {
            this.state.positionMs = Math.floor(this.audioElement.currentTime * 1000);
            this.emitState();
          }
        });

        this.audioElement.addEventListener("durationchange", () => {
          if (this.activeEngine === "audio" && this.audioElement && !isNaN(this.audioElement.duration)) {
            this.state.durationMs = Math.floor(this.audioElement.duration * 1000);
            this.emitState();
          }
        });

        this.audioElement.addEventListener("ended", () => {
          if (this.activeEngine === "audio") {
            this.state.status = "idle";
            this.state.positionMs = 0;
            this.emitState();
            if (this.onEndedCallback) {
              this.onEndedCallback();
            }
          }
        });

        this.audioElement.addEventListener("waiting", () => {
          if (this.activeEngine === "audio" && this.state.status === "playing") {
            this.state.status = "buffering";
            this.emitState();
          }
        });

        this.audioElement.addEventListener("canplay", () => {
          if (this.activeEngine === "audio" && this.state.status === "buffering") {
            this.state.status = "playing";
            this.emitState();
          }
        });

        this.audioElement.addEventListener("error", () => {
          console.warn("SoloPlayer: HTMLAudioElement error, checking fallback:", this.audioElement?.error);
          const currentTrack = this.state.currentTrack;
          if (currentTrack) {
            const videoId =
              YouTubeIframeBridge.extractVideoId(currentTrack.url) ||
              YouTubeIframeBridge.extractVideoId(currentTrack.id);
            if (videoId) {
              console.log("SoloPlayer: Direct audio failed; gracefully activating YouTube IFrame playback for", videoId);
              this.activeEngine = "iframe";
              this.ytBridge.loadAndPlay(videoId, this.state.positionMs);
              return;
            }
          }
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

  getActiveEngine(): "audio" | "iframe" {
    return this.activeEngine;
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
        if (this.onNextCallback) {
          navigator.mediaSession.setActionHandler("nexttrack", () => this.onNextCallback?.());
        }
        if (this.onPreviousCallback) {
          navigator.mediaSession.setActionHandler("previoustrack", () => this.onPreviousCallback?.());
        }
      } catch {}
    }
  }

  async play(track: Track, positionMs: number = 0): Promise<void> {
    this.state.currentTrack = track;
    this.state.durationMs = track.durationMs || 0;
    this.state.positionMs = positionMs;
    this.state.status = "playing";

    const isVercel =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("vercel.app") || window.location.hostname.includes("soundlounge.vercel.app"));

    const videoId =
      YouTubeIframeBridge.extractVideoId(track.url) ||
      YouTubeIframeBridge.extractVideoId(track.id);

    // On Vercel cloud deployments, YouTube datacenter bot blocks prevent serverless streaming.
    // Use YouTube IFrame directly for zero-latency, 100% reliable sound playback!
    if (isVercel && videoId) {
      this.activeEngine = "iframe";
      if (this.audioElement) {
        try {
          this.audioElement.pause();
          this.audioElement.src = "";
        } catch {}
      }
      this.ytBridge.loadAndPlay(videoId, positionMs);
      this.updateMediaSession(track);
      this.emitState();
      return;
    }

    // Default audio element playback for local dev and uploaded / R2 assets
    this.activeEngine = "audio";
    if (this.audioElement) {
      if (typeof window !== "undefined") {
        const win = window as unknown as WindowWithAudio;
        win.__soundlounge_active_audio__ = this.audioElement;

        const allAudios = document.querySelectorAll("audio");
        allAudios.forEach((el) => {
          if (el !== this.audioElement) {
            try {
              el.pause();
              el.currentTime = 0;
            } catch {}
          }
        });
      }

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
        // If play() failed on a YouTube track, activate iframe fallback
        if (videoId) {
          console.log("SoloPlayer: Switching to YouTube IFrame fallback after play() rejection");
          this.activeEngine = "iframe";
          this.ytBridge.loadAndPlay(videoId, positionMs);
        }
      }
    }

    this.updateMediaSession(track);
    this.emitState();
  }

  async resume(): Promise<void> {
    if (this.state.currentTrack && this.state.status === "paused") {
      this.state.status = "playing";
      if (this.activeEngine === "iframe") {
        this.ytBridge.play();
      } else if (this.audioElement) {
        try {
          await this.audioElement.play();
        } catch {}
      }
      this.emitState();
    }
  }

  pause(): void {
    this.state.status = "paused";
    if (this.activeEngine === "iframe") {
      this.ytBridge.pause();
    } else if (this.audioElement) {
      this.audioElement.pause();
      this.state.positionMs = Math.floor(this.audioElement.currentTime * 1000);
    }
    this.emitState();
  }

  seek(positionMs: number): void {
    const clampedPos = Math.max(0, Math.min(positionMs, this.state.durationMs || positionMs));
    this.state.positionMs = clampedPos;
    if (this.activeEngine === "iframe") {
      this.ytBridge.seekTo(clampedPos);
    } else if (this.audioElement) {
      this.audioElement.currentTime = clampedPos / 1000;
    }
    this.emitState();
  }

  setVolume(volume: number): void {
    const clamped = Math.max(0.0, Math.min(1.0, volume));
    this.state.volume = clamped;
    this.ytBridge.setVolume(clamped);
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
    if (this.activeEngine === "iframe") {
      this.ytBridge.pause();
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
