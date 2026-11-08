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
   * Synchronously primes and unlocks the HTMLAudioElement within a user gesture.
   * Required for iOS Safari to avoid NotAllowedError on initial unconfigured state.
   */
  public primeAudioSession(track?: Track): void {
    if (typeof window === "undefined" || !this.audioElement) return;
    try {
      if (
        this.state.status === "idle" &&
        this.audioElement.paused &&
        (!this.audioElement.src || this.audioElement.src === "" || this.audioElement.src.endsWith("/"))
      ) {
        this.audioElement.src = "/audio/silence.mp3";
        this.audioElement.volume = 0.001;
        this.audioElement.play().catch(() => {});
      }
    } catch {}
    if (track) {
      this.updateMediaSession(track);
    }
  }

  /**
   * Preserves mobile OS (iOS Safari / Android) active background audio session
   * by running an inaudible continuous 5s silent MP3 loop on this.audioElement.
   * Unlike 0s data URIs, an authentic MP3 audio file prevents iOS from suspending
   * the browser process and keeps the Lock Screen Now Playing widget active.
   */
  private startSilentAudioAnchor(): void {
    if (!this.audioElement) return;
    try {
      const SILENT_MP3_PATH = "/audio/silence.mp3";
      if (!this.audioElement.src.endsWith(SILENT_MP3_PATH)) {
        this.audioElement.src = SILENT_MP3_PATH;
        this.audioElement.loop = true;
        this.audioElement.volume = 0.001; // Non-zero volume grants active iOS AVAudioSessionCategoryPlayback
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

        // Keep MediaSession and iOS Lock Screen scrubber in sync during iframe playback
        if (typeof window !== "undefined" && "mediaSession" in navigator) {
          try {
            navigator.mediaSession.playbackState = bridgeState.status === "playing" ? "playing" : "paused";
            if (bridgeState.durationMs > 0) {
              navigator.mediaSession.setPositionState({
                duration: bridgeState.durationMs / 1000,
                position: Math.max(0, bridgeState.positionMs / 1000),
                playbackRate: 1,
              });
            }
          } catch {}
        }
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
            if (typeof window !== "undefined" && "mediaSession" in navigator) {
              try {
                navigator.mediaSession.playbackState = "playing";
              } catch {}
            }
            this.emitState();
          }
        });

        this.audioElement.addEventListener("pause", () => {
          if (this.activeEngine === "audio" && this.state.status !== "idle") {
            this.state.status = "paused";
            if (typeof window !== "undefined" && "mediaSession" in navigator) {
              try {
                navigator.mediaSession.playbackState = "paused";
              } catch {}
            }
            this.emitState();
          }
        });

        this.audioElement.addEventListener("timeupdate", () => {
          if (this.activeEngine === "audio" && this.audioElement) {
            this.state.positionMs = Math.floor(this.audioElement.currentTime * 1000);
            if (typeof window !== "undefined" && "mediaSession" in navigator && this.audioElement.duration > 0) {
              try {
                navigator.mediaSession.setPositionState({
                  duration: this.audioElement.duration,
                  position: Math.max(0, this.audioElement.currentTime),
                  playbackRate: 1,
                });
              } catch {}
            }
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

    // 1. Check if direct videoId can be extracted synchronously
    const directVideoId =
      YouTubeIframeBridge.extractVideoId(track.url) ||
      YouTubeIframeBridge.extractVideoId(track.id);

    let videoId: string | null = directVideoId;
    if (!videoId) {
      videoId = await YouTubeIframeBridge.resolveVideoId(track);
    }

    // 2. PRIMARY ENGINE FOR YOUTUBE TRACKS: YouTube IFrame Audio Bridge
    // Plays the exact authentic YouTube video/audio in the user's browser with zero bot checks, zero BGM substitutions
    if (videoId) {
      this.activeEngine = "iframe";
      const isMobile =
        typeof navigator !== "undefined" &&
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        this.startSilentAudioAnchor();
      } else if (this.audioElement) {
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

    // 3. FALLBACK FOR LOCAL / NON-YOUTUBE AUDIO: Native HTMLAudioElement
    let playUrl = track.url || "";
    if (!playUrl || playUrl.trim() === "" || playUrl === "undefined") {
      if (track.title) {
        playUrl = `/api/stream/youtube?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist || "")}`;
      }
    }

    if (this.audioElement && playUrl) {
      this.activeEngine = "audio";
      this.ytBridge.pause();

      if (typeof window !== "undefined") {
        const win = window as unknown as WindowWithAudio;
        win.__soundlounge_active_audio__ = this.audioElement;
      }

      if (this.audioElement.src !== playUrl) {
        this.audioElement.src = playUrl;
      }

      if (positionMs > 0) {
        this.audioElement.currentTime = positionMs / 1000;
      }
      this.audioElement.volume = this.state.volume;

      try {
        await this.audioElement.play();
      } catch (err: unknown) {
        console.warn("SoloPlayer: audioElement.play() failed:", err);
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
