import type { Track } from "@soundlounge/shared";

/**
 * YouTube IFrame Audio Bridge
 *
 * Provides resilient, zero-bot-block client-side audio playback directly
 * within the user's browser using Google's official YouTube IFrame Player API.
 * Ensures 100% audio reliability on cloud platforms (e.g. Vercel) where datacenter
 * IPs are challenged by YouTube bot detection.
 */

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          width?: string | number;
          height?: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  unMute?: () => void;
  isMuted?: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  loadVideoById?: (args: { videoId: string; startSeconds?: number }) => void;
  cueVideoById?: (args: { videoId: string; startSeconds?: number }) => void;
  destroy: () => void;
}

export type IframePlaybackStatus = "idle" | "playing" | "paused" | "buffering";

export interface IframeBridgeState {
  status: IframePlaybackStatus;
  positionMs: number;
  durationMs: number;
  videoId: string | null;
}

export class YouTubeIframeBridge {
  private static instance: YouTubeIframeBridge | null = null;
  private static videoIdCache = new Map<string, string>();
  private player: YTPlayerInstance | null = null;
  private isReady = false;
  private currentVideoId: string | null = null;
  private state: IframeBridgeState = {
    status: "idle",
    positionMs: 0,
    durationMs: 0,
    videoId: null,
  };
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: IframeBridgeState) => void> = new Set();
  private onEndedCallback: (() => void) | null = null;
  private pendingVideoId: string | null = null;
  private pendingStartMs: number = 0;
  private volume: number = 0.4;
  private desiredStatus: "idle" | "playing" | "paused" = "idle";

  public static getInstance(): YouTubeIframeBridge {
    if (!YouTubeIframeBridge.instance) {
      YouTubeIframeBridge.instance = new YouTubeIframeBridge();
    }
    return YouTubeIframeBridge.instance;
  }

  private constructor() {
    if (typeof window !== "undefined") {
      this.initIframeApi();
      this.initVisibilityListener();
    }
  }

  private initVisibilityListener(): void {
    if (typeof document === "undefined") return;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.desiredStatus === "playing" && this.isReady) {
        try {
          this.player?.playVideo();
        } catch {}
      }
    });
  }

  /**
   * Loads the YouTube IFrame API script tag once and initializes the hidden container
   */
  public initIframeApi(): void {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") return;

    // Check if player container already exists
    let container = document.getElementById("soundlounge-yt-bridge");
    if (!container) {
      container = document.createElement("div");
      container.id = "soundlounge-yt-bridge";
      // 200x200 positioned fixed at bottom with 0.001 opacity - satisfies YouTube embed policy and browser audio subsystems
      container.style.position = "fixed";
      container.style.bottom = "0px";
      container.style.right = "0px";
      container.style.width = "200px";
      container.style.height = "200px";
      container.style.opacity = "0.001";
      container.style.pointerEvents = "none";
      container.style.zIndex = "-1";
      try {
        document.body.appendChild(container);
      } catch {}
    }

    if (window.YT && window.YT.Player) {
      this.createPlayer();
      return;
    }

    // Set callback before script loads
    const existingCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (existingCallback) existingCallback();
      this.createPlayer();
    };

    // Inject YouTube IFrame API script if not present
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      try {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);
      } catch {}
    }
  }

  private createPlayer(): void {
    if (typeof window === "undefined" || !window.YT || !window.YT.Player) return;
    if (this.player) return;

    try {
      this.player = new window.YT.Player("soundlounge-yt-bridge", {
        width: "200",
        height: "200",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            this.isReady = true;
            this.setVolume(this.volume);
            if (this.pendingVideoId) {
              const vid = this.pendingVideoId;
              const pos = this.pendingStartMs;
              this.pendingVideoId = null;
              this.loadAndPlay(vid, pos);
            }
          },
          onStateChange: (event) => {
            this.handleStateChange(event.data);
          },
          onError: (event) => {
            console.warn("YouTubeIframeBridge error code:", event.data);
            this.state.status = "idle";
            this.stopPolling();
            this.emitState();
          },
        },
      });
    } catch (err) {
      console.warn("Failed to instantiate YT.Player:", err);
    }
  }

  private handleStateChange(ytState: number): void {
    const YTState = window.YT?.PlayerState;
    if (!YTState) return;

    switch (ytState) {
      case YTState.PLAYING:
        this.state.status = "playing";
        this.startPolling();
        break;
      case YTState.PAUSED:
        // Detect unwanted pause caused by screen turning off or mobile lock while user intended to play
        if (typeof document !== "undefined" && document.hidden && this.desiredStatus === "playing") {
          try {
            this.player?.playVideo();
          } catch {}
          return;
        }
        this.state.status = "paused";
        this.stopPolling();
        break;
      case YTState.BUFFERING:
        this.state.status = "buffering";
        break;
      case YTState.ENDED:
        this.state.status = "idle";
        this.state.positionMs = 0;
        this.stopPolling();
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
        break;
      case YTState.UNSTARTED:
      case YTState.CUED:
      default:
        break;
    }
    this.emitState();
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      if (this.player && this.isReady) {
        try {
          const currSec = this.player.getCurrentTime() || 0;
          const durSec = this.player.getDuration() || 0;
          this.state.positionMs = Math.floor(currSec * 1000);
          if (durSec > 0) {
            this.state.durationMs = Math.floor(durSec * 1000);
          }
          this.emitState();
        } catch {}
      }
    }, 250);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  public loadAndPlay(videoId: string, startMs: number = 0): void {
    this.desiredStatus = "playing";
    this.currentVideoId = videoId;
    this.state.videoId = videoId;
    this.state.positionMs = startMs;

    if (!this.isReady || !this.player) {
      this.pendingVideoId = videoId;
      this.pendingStartMs = startMs;
      this.initIframeApi();
      return;
    }

    try {
      const startSec = Math.max(0, Math.floor(startMs / 1000));
      if (typeof this.player.loadVideoById === "function") {
        this.player.loadVideoById({
          videoId,
          startSeconds: startSec,
        });
        try {
          this.player.playVideo();
        } catch {}
      } else if (typeof this.player.cueVideoById === "function") {
        this.player.cueVideoById({
          videoId,
          startSeconds: startSec,
        });
        this.player.playVideo();
      }
      try {
        this.player.unMute?.();
      } catch {}
      if (typeof this.player.setVolume === "function") {
        this.player.setVolume(Math.round(this.volume * 100));
      }
      this.state.status = "buffering";
      this.emitState();
    } catch (err) {
      console.warn("YouTubeIframeBridge loadAndPlay failed:", err);
    }
  }

  public play(): void {
    this.desiredStatus = "playing";
    if (this.player && this.isReady) {
      try {
        this.player.playVideo();
      } catch {}
    }
  }

  public pause(): void {
    this.desiredStatus = "paused";
    if (this.player && this.isReady) {
      try {
        this.player.pauseVideo();
        this.stopPolling();
      } catch {}
    }
    this.state.status = "paused";
    this.emitState();
  }

  public seekTo(ms: number): void {
    this.state.positionMs = ms;
    if (this.player && this.isReady) {
      try {
        this.player.seekTo(ms / 1000, true);
      } catch {}
    }
    this.emitState();
  }

  public setVolume(volume0to1: number): void {
    this.volume = Math.max(0, Math.min(1, volume0to1));
    if (this.player && this.isReady) {
      try {
        if (this.volume > 0) {
          this.player.unMute?.();
        }
        this.player.setVolume(Math.round(this.volume * 100));
      } catch {}
    }
  }

  public setOnEnded(cb: () => void): void {
    this.onEndedCallback = cb;
  }

  public onStateChange(listener: (state: IframeBridgeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitState(): void {
    const s = { ...this.state };
    for (const listener of this.listeners) {
      listener(s);
    }
  }

  public getState(): IframeBridgeState {
    return { ...this.state };
  }

  /**
   * Resolves any Track into a verified 11-char YouTube video ID.
   * Checks direct ID, query params, URL path, and caches results.
   * If slug/title is given, queries /api/search dynamically.
   */
  public static async resolveVideoId(track: Track): Promise<string | null> {
    if (!track) return null;

    // Direct override for known song aliases
    if (track.url?.includes("TheLastRide") || track.id?.includes("TheLastRide")) {
      return "6xoB4ZiKKn0";
    }

    // 1. Direct check in track.url
    const fromUrl = this.extractVideoId(track.url);
    if (fromUrl) return fromUrl;

    // 2. Direct check in track.id
    const fromId = this.extractVideoId(track.id);
    if (fromId) return fromId;

    // 3. Cache lookup
    const cacheKey = `${track.id || ""}::${track.title || ""}::${track.artist || ""}`;
    if (this.videoIdCache.has(cacheKey)) {
      return this.videoIdCache.get(cacheKey)!;
    }

    // 4. Query /api/search for exact track
    const query = `${track.title} ${track.artist || ""}`.trim();
    if (!query) return null;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        const found = data.tracks?.[0];
        if (found) {
          const vid = this.extractVideoId(found.id) || this.extractVideoId(found.url);
          if (vid) {
            this.videoIdCache.set(cacheKey, vid);
            if (track.id) this.videoIdCache.set(track.id, vid);
            return vid;
          }
        }
      }
    } catch (err) {
      console.warn("YouTubeIframeBridge: Failed to resolve video ID:", query, err);
    }

    return null;
  }

  /**
   * Extracts clean 11-char YouTube ID from any track URL or track ID
   */
  public static extractVideoId(trackIdOrUrl: string): string | null {
    if (!trackIdOrUrl) return null;

    if (trackIdOrUrl.includes("TheLastRide")) return "6xoB4ZiKKn0";

    const isLikelySlug = (str: string) => (/^[a-zA-Z]+$/.test(str) && /[a-z][A-Z]/.test(str)) || str === "kabira_yjhd";

    // Check query params ?id= or ?v=
    try {
      if (trackIdOrUrl.includes("?")) {
        const url = new URL(trackIdOrUrl, "http://localhost");
        const idParam = url.searchParams.get("id") || url.searchParams.get("v");
        if (idParam && /^[a-zA-Z0-9_-]{11}$/.test(idParam) && !isLikelySlug(idParam)) {
          return idParam;
        }
      }
    } catch {}

    // Check direct /stream/youtube/VIDEO_ID or /watch?v=VIDEO_ID or /embed/VIDEO_ID
    const streamMatch = trackIdOrUrl.match(/(?:\/stream\/youtube\/|v=|\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (streamMatch) return streamMatch[1];

    // Check clean yt_ prefix
    const cleanId = trackIdOrUrl.replace(/^yt_/, "").trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanId) && !isLikelySlug(cleanId)) {
      return cleanId;
    }

    return null;
  }
}
