import type { Track } from "@soundlounge/shared";
import { getCachedNextUrl } from "./nextUrlCache";

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

// 44-byte silent WAV. Playing it muted inside a user gesture unlocks the iOS
// audio session so later programmatic play() calls are not blocked.
const SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

// Lock-screen scrubber freshness; timeupdate fires ~4x/s but the position state
// only needs refreshing about once a second.
const POSITION_STATE_INTERVAL_MS = 1000;

// iOS pauses the element for interruptions (calls, alarms, route changes) and
// gives no "interruption ended" event, so retry on a timer ladder plus
// visibility/focus events until a "playing" event confirms recovery.
const RESUME_RETRY_DELAYS_MS = [1000, 3000, 7000, 15000];

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
  private onNextCallback?: () => void;
  private onPreviousCallback?: () => void;
  private onEndedCallback?: () => void;
  private priming = false;
  private userPaused = false;
  private interrupted = false;
  private resumeRetryTimers: ReturnType<typeof setTimeout>[] = [];
  private playToken = 0;
  private lastPositionStateAt = 0;
  private mediaSessionHandlersRegistered = false;

  constructor() {
    this.initAudioElement();
  }

  setTransportHandlers(handlers: { onNext?: () => void; onPrevious?: () => void; onEnded?: () => void }): void {
    this.onNextCallback = handlers.onNext;
    this.onPreviousCallback = handlers.onPrevious;
    this.onEndedCallback = handlers.onEnded;
  }

  public primeAudioSession(track?: Track): void {
    if (track) {
      this.updateMediaSession(track);
    }
    this.unlockAudioSession();
  }

  public getActiveEngine(): "audio" {
    return "audio";
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

        this.setupElementListeners(this.audioElement);

        // Interruption recovery triggers that fire outside the element itself
        if (typeof document !== "undefined") {
          document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") this.attemptInterruptionResume();
          });
          window.addEventListener("pageshow", () => this.attemptInterruptionResume());
          window.addEventListener("focus", () => this.attemptInterruptionResume());
        }
      } catch {
        this.audioElement = null;
      }
    }
  }

  private setupElementListeners(el: HTMLAudioElement) {
    el.addEventListener("playing", () => {
      if (this.priming) return;
      this.clearInterruption();
      this.state.status = "playing";
      this.syncElementDuration();
      this.updatePositionState();
      this.emitState();
    });

    el.addEventListener("pause", () => {
      if (this.priming) return;
      this.handleUnexpectedPause();
      if (this.state.status !== "idle") {
        this.state.status = "paused";
        this.updatePositionState();
        this.emitState();
      }
    });

    el.addEventListener("timeupdate", () => {
      if (this.audioElement) {
        this.state.positionMs = Math.floor(this.audioElement.currentTime * 1000);
        this.updatePositionStateThrottled();
        this.emitState();
      }
    });

    el.addEventListener("durationchange", () => this.syncElementDuration());
    el.addEventListener("loadedmetadata", () => this.syncElementDuration());
    el.addEventListener("seeked", () => this.updatePositionState());
    el.addEventListener("ratechange", () => this.updatePositionState());

    el.addEventListener("ended", () => {
      this.state.status = "idle";
      this.state.positionMs = 0;
      this.emitState();
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    });

    el.addEventListener("waiting", () => {
      if (this.state.status === "playing") {
        this.state.status = "buffering";
        this.emitState();
      }
    });

    el.addEventListener("canplay", () => {
      if (this.state.status === "buffering") {
        this.state.status = "playing";
        this.emitState();
      }
    });

    el.addEventListener("error", () => {
      console.warn("SoloPlayer: HTMLAudioElement error:", this.audioElement?.error);
      this.state.status = "idle";
      this.emitState();
    });
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
      } catch {}

      // iOS requires action handlers to be assigned exactly ONCE — registering
      // them again on every track change makes the lock screen drop the
      // next/previous buttons. Metadata above still updates per track.
      if (!this.mediaSessionHandlersRegistered) {
        // Each handler is registered separately: setActionHandler throws for
        // unsupported actions and one failure must not drop the rest.
        try {
          navigator.mediaSession.setActionHandler("play", () => {
            void this.resume();
          });
        } catch {}
        try {
          navigator.mediaSession.setActionHandler("pause", () => this.pause());
        } catch {}
        try {
          navigator.mediaSession.setActionHandler("stop", () => this.stop());
        } catch {}
        try {
          navigator.mediaSession.setActionHandler("seekbackward", (details) => {
            const offset = details.seekOffset || 10;
            this.seek(Math.max(0, (this.audioElement?.currentTime ?? 0) - offset) * 1000);
          });
        } catch {}
        try {
          navigator.mediaSession.setActionHandler("seekforward", (details) => {
            const offset = details.seekOffset || 10;
            this.seek(((this.audioElement?.currentTime ?? 0) + offset) * 1000);
          });
        } catch {}
        try {
          navigator.mediaSession.setActionHandler("seekto", (details) => {
            if (details.seekTime !== undefined) {
              this.seek(details.seekTime * 1000);
            }
          });
        } catch {}
        try {
          navigator.mediaSession.setActionHandler("nexttrack", () => {
            if (this.onNextCallback) this.onNextCallback();
          });
        } catch {}
        try {
          navigator.mediaSession.setActionHandler("previoustrack", () => {
            if (this.onPreviousCallback) this.onPreviousCallback();
          });
        } catch {}
        this.mediaSessionHandlersRegistered = true;
      }

      this.updatePositionState();
    }
  }

  // The lock-screen scrubber only appears when the session knows duration,
  // position and rate — without this iOS shows play/pause buttons only.
  private updatePositionState(): void {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (typeof navigator.mediaSession.setPositionState !== "function") return;
    const el = this.audioElement;
    if (!el || !isFinite(el.duration) || el.duration <= 0 || isNaN(el.currentTime)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: el.duration,
        playbackRate: el.playbackRate,
        position: Math.min(Math.max(el.currentTime, 0), el.duration),
      });
      this.lastPositionStateAt = Date.now();
    } catch {}
  }

  private updatePositionStateThrottled(): void {
    if (Date.now() - this.lastPositionStateAt < POSITION_STATE_INTERVAL_MS) return;
    this.updatePositionState();
  }

  // The element's real duration always wins over the catalog's estimate —
  // hand-authored track durations and title-search-resolved streams are often
  // wrong, which desyncs the seek bar (dragging past the audio's actual end
  // kills playback). Infinity (unknown/live) is treated as "not known yet".
  private syncElementDuration(): void {
    const el = this.audioElement;
    if (!el) return;
    const duration = el.duration;
    if (!isFinite(duration) || duration <= 0) return;
    const elementMs = Math.round(duration * 1000);
    if (Math.abs(elementMs - this.state.durationMs) > 1500) {
      this.state.durationMs = elementMs;
      this.emitState();
    }
    this.updatePositionState();
  }

  private handleUnexpectedPause(): void {
    if (this.interrupted || this.userPaused || this.priming) return;
    if (!this.state.currentTrack || this.state.status === "idle") return;
    this.interrupted = true;
    RESUME_RETRY_DELAYS_MS.forEach((delay) => {
      this.resumeRetryTimers.push(setTimeout(() => this.attemptInterruptionResume(), delay));
    });
  }

  private attemptInterruptionResume(): void {
    if (!this.interrupted) return;
    const el = this.audioElement;
    if (!el || this.state.status === "playing") {
      this.clearInterruption();
      return;
    }
    el.play().catch(() => {});
  }

  private clearInterruption(): void {
    this.interrupted = false;
    this.clearResumeRetries();
  }

  private clearResumeRetries(): void {
    this.resumeRetryTimers.forEach(clearTimeout);
    this.resumeRetryTimers = [];
  }

  private unlockAudioSession(): void {
    const el = this.audioElement;
    if (!el || this.priming) return;
    // Only needed before the first real play; a loaded element is already unlocked
    if (this.state.status !== "idle" || el.src) return;
    this.priming = true;
    const finish = () => {
      this.priming = false;
      this.state.status = "idle";
      this.state.positionMs = 0;
      el.muted = false;
      this.emitState();
    };
    try {
      el.muted = true;
      el.src = SILENT_WAV_DATA_URI;
      const p = el.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          try {
            el.pause();
          } catch {}
          finish();
        }).catch(finish);
      } else {
        finish();
      }
    } catch {
      finish();
    }
  }

  private waitForCanPlay(timeoutMs: number): Promise<void> {
    const el = this.audioElement;
    if (!el || el.readyState >= 3) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        el.removeEventListener("canplay", done);
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(done, timeoutMs);
      el.addEventListener("canplay", done, { once: true });
    });
  }

  private async handlePlayRejection(err: unknown, token: number): Promise<void> {
    let failure: unknown = err;
    const name = failure instanceof Error ? failure.name : "";

    if (name === "AbortError") {
      // load() interrupted the first attempt; retry once the element can play
      await this.waitForCanPlay(3000);
      if (token !== this.playToken || !this.audioElement) return;
      try {
        await this.audioElement.play();
        return;
      } catch (retryErr) {
        failure = retryErr;
      }
    }

    if (failure instanceof Error && failure.name === "NotAllowedError") {
      // Gesture unlock failed: surface as paused so the UI's play button (a real
      // gesture) can start audio on the next tap
      console.warn("SoloPlayer: play() blocked, waiting for a user gesture");
      this.state.status = "paused";
      this.emitState();
      return;
    }

    console.warn(
      "SoloPlayer: play() rejected:",
      failure instanceof Error ? failure.message : String(failure)
    );
    this.state.status = "paused";
    this.emitState();
  }

  async play(track: Track, positionMs: number = 0): Promise<void> {
    const token = ++this.playToken;
    this.userPaused = false;
    this.clearInterruption();
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

      // A pre-resolved upstream URL skips the /api/stream 307 hop — that round
      // trip is what kills locked-screen track advancement on iOS.
      const cachedUrl = getCachedNextUrl(track);
      const targetUrl = cachedUrl
        ? cachedUrl
        : playUrl.startsWith("http://") || playUrl.startsWith("https://")
          ? playUrl
          : typeof window !== "undefined"
            ? `${window.location.origin}${playUrl}`
            : playUrl;

      if (this.audioElement.src !== targetUrl) {
        this.audioElement.src = targetUrl;
        this.audioElement.load();
      }

      if (positionMs > 0) {
        this.audioElement.currentTime = positionMs / 1000;
      }
      this.audioElement.volume = this.state.volume;

      try {
        await this.audioElement.play();
      } catch (err: unknown) {
        if (token !== this.playToken) return;
        await this.handlePlayRejection(err, token);
      }
    }

    if (token !== this.playToken) return;
    this.updateMediaSession(track);
    this.updatePositionState();
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = this.state.status === "playing" ? "playing" : "paused";
      } catch {}
    }
    this.emitState();
  }

  async resume(): Promise<void> {
    if (!this.state.currentTrack) return;
    this.userPaused = false;
    this.clearInterruption();
    if (this.state.status !== "playing") {
      this.state.status = "playing";
    }
    if (this.audioElement) {
      try {
        await this.audioElement.play();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "NotAllowedError") {
          this.state.status = "paused";
        }
      }
    }
    this.updatePositionState();
    this.emitState();
  }

  pause(): void {
    this.userPaused = true;
    this.clearInterruption();
    this.state.status = "paused";
    if (this.audioElement) {
      this.audioElement.pause();
      this.state.positionMs = Math.floor(this.audioElement.currentTime * 1000);
    }
    this.updatePositionState();
    this.emitState();
  }

  stop(): void {
    this.pause();
    if (this.audioElement) {
      try {
        this.audioElement.currentTime = 0;
      } catch {}
    }
    this.state.positionMs = 0;
    this.emitState();
  }

  seek(positionMs: number): void {
    const el = this.audioElement;
    const elementMs = el && isFinite(el.duration) && el.duration > 0 ? Math.round(el.duration * 1000) : 0;
    const maxMs = elementMs || this.state.durationMs || positionMs;
    const clampedPos = Math.max(0, Math.min(positionMs, maxMs));
    this.state.positionMs = clampedPos;
    if (el) {
      el.currentTime = clampedPos / 1000;
    }
    this.updatePositionState();
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
    this.clearResumeRetries();
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
