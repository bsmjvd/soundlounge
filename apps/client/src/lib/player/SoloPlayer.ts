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
    this.registerMediaSessionActions();
  }

  /**
   * Registers mediaSession actions unconditionally so lock screens (iOS / Android)
   * display Previous & Next track buttons instead of default +10s / -10s seek buttons.
   */
  private registerMediaSessionActions(): void {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => this.resume());
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          this.seek(details.seekTime * 1000);
        }
      });

      // ALWAYS bind nexttrack and previoustrack unconditionally
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (this.onNextCallback) {
          this.onNextCallback();
        }
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (this.onPreviousCallback) {
          this.onPreviousCallback();
        }
      });

      // Explicitly remove seekbackward and seekforward handlers so lock screen media widgets
      // prioritize the Previous Track and Next Track controls
      try {
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
      } catch {}
    } catch (err) {
      console.warn("Failed to register mediaSession actions:", err);
    }
  }

  /**
   * Preserves mobile OS (iOS Safari / Android) active background audio session
   * by running an inaudible silent audio carrier loop on this.audioElement.
   */
  private startSilentAudioAnchor(): void {
    if (!this.audioElement) return;
    try {
      const SILENT_WAV_DATA_URI =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
      if (this.audioElement.src !== SILENT_WAV_DATA_URI) {
        this.audioElement.src = SILENT_WAV_DATA_URI;
        this.audioElement.loop = true;
        this.audioElement.volume = 0.001; // Non-zero volume grants active iOS AVAudioSession
      }
      this.audioElement.play().catch(() => {});
    } catch {}
  }

  private stopSilentAudioAnchor(): void {
    if (!this.audioElement) return;
    try {
      this.audioElement.pause();
    } catch {}
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
              console.log(
                "SoloPlayer: Direct audio failed; gracefully activating YouTube IFrame playback for",
                videoId
              );
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
                { src: track.coverUrl, sizes: "256x256", type: "image/png" },
                { src: track.coverUrl, sizes: "512x512", type: "image/png" },
              ]
            : undefined,
        });

        this.registerMediaSessionActions();

        navigator.mediaSession.playbackState = "playing";
        if (track.durationMs && track.durationMs > 0) {
          try {
            navigator.mediaSession.setPositionState({
              duration: track.durationMs / 1000,
              position: Math.max(0, this.state.positionMs / 1000),
              playbackRate: 1,
            });
          } catch {}
        }
      } catch {}
    }
  }

  async play(track: Track, positionMs: number = 0): Promise<void> {
    this.state.currentTrack = track;
    this.state.durationMs = track.durationMs || 0;
    this.state.positionMs = positionMs;
    this.state.status = "playing";
    this.emitState();

    // 1. Resolve videoId for YouTube-sourced or streaming tracks
    let videoId: string | null = null;
    if (track.source === "youtube" || track.url.includes("youtube") || track.id.startsWith("yt_")) {
      videoId = await YouTubeIframeBridge.resolveVideoId(track);
    }

    // 2. Play via YouTube IFrame Audio Bridge for YouTube tracks (100% reliable, zero bot block)
    if (videoId) {
      this.activeEngine = "iframe";
      this.startSilentAudioAnchor();
      this.ytBridge.loadAndPlay(videoId, positionMs);
      this.updateMediaSession(track);
      return;
    }

    // 3. Fallback to HTMLAudioElement for local audio, uploaded audio, or direct CDN streams
    this.activeEngine = "audio";
    if (this.audioElement) {
      this.audioElement.loop = false;
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
        const fallbackVid = await YouTubeIframeBridge.resolveVideoId(track);
        if (fallbackVid) {
          console.log("SoloPlayer: Switching to YouTube IFrame fallback after play() rejection");
          this.activeEngine = "iframe";
          this.ytBridge.loadAndPlay(fallbackVid, positionMs);
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
        this.startSilentAudioAnchor();
        this.ytBridge.play();
      } else if (this.audioElement) {
        try {
          await this.audioElement.play();
        } catch {}
      }
      if (typeof window !== "undefined" && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.playbackState = "playing";
        } catch {}
      }
      this.emitState();
    }
  }

  pause(): void {
    this.state.status = "paused";
    if (this.activeEngine === "iframe") {
      this.stopSilentAudioAnchor();
      this.ytBridge.pause();
    } else if (this.audioElement) {
      this.audioElement.pause();
      this.state.positionMs = Math.floor(this.audioElement.currentTime * 1000);
    }
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "paused";
      } catch {}
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
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        if (this.state.durationMs > 0) {
          navigator.mediaSession.setPositionState({
            duration: this.state.durationMs / 1000,
            position: clampedPos / 1000,
            playbackRate: this.state.status === "playing" ? 1 : 0,
          });
        }
      } catch {}
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
