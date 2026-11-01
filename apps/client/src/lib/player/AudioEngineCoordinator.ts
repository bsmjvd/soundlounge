import type { Track } from "@soundlounge/shared";
import { SoloPlayer } from "./SoloPlayer";
import { SyncedPlayer } from "./SyncedPlayer";

export type PlaybackMode = "solo" | "synced";

export interface CoordinatorPlayerState {
  mode: PlaybackMode;
  status: "idle" | "playing" | "paused" | "buffering";
  currentTrack: Track | null;
  positionMs: number;
  durationMs: number;
  volume: number;
  ntpOffsetMs: number;
  rttMs: number;
}

export type CoordinatorStateCallback = (state: CoordinatorPlayerState) => void;

export class AudioEngineCoordinator {
  private mode: PlaybackMode = "solo";
  private soloPlayer: SoloPlayer;
  private syncedPlayer: SyncedPlayer;
  private volume: number = 0.4;
  private listeners: Set<CoordinatorStateCallback> = new Set();

  constructor() {
    this.soloPlayer = new SoloPlayer();
    this.syncedPlayer = new SyncedPlayer();

    // Initialize with 40% volume, respecting localStorage preference if set
    let initialVol = 0.4;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("soundlounge_volume");
        if (saved !== null) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            initialVol = parsed;
          }
        }
      } catch {}
    }
    this.volume = initialVol;
    this.soloPlayer.setVolume(initialVol);
    this.syncedPlayer.setVolume(initialVol);

    this.soloPlayer.onStateChange(() => {
      if (this.mode === "solo") {
        this.emitState();
      }
    });

    this.syncedPlayer.onStateChange(() => {
      if (this.mode === "synced") {
        this.emitState();
      }
    });
  }

  setTransportHandlers(handlers: { onNext?: () => void; onPrevious?: () => void; onEnded?: () => void }): void {
    this.soloPlayer.setTransportHandlers(handlers);
  }

  getSoloPlayer(): SoloPlayer {
    return this.soloPlayer;
  }

  getSyncedPlayer(): SyncedPlayer {
    return this.syncedPlayer;
  }

  getMode(): PlaybackMode {
    return this.mode;
  }

  setMode(mode: PlaybackMode): void {
    if (this.mode === mode) return;

    if (this.mode === "solo") {
      this.soloPlayer.pause();
    } else {
      this.syncedPlayer.schedulePause(Date.now(), this.syncedPlayer.getState().positionMs);
    }

    this.mode = mode;
    this.emitState();
  }

  getState(): CoordinatorPlayerState {
    if (this.mode === "solo") {
      const s = this.soloPlayer.getState();
      return {
        mode: "solo",
        status: s.status,
        currentTrack: s.currentTrack,
        positionMs: s.positionMs,
        durationMs: s.durationMs,
        volume: this.volume,
        ntpOffsetMs: 0,
        rttMs: 0,
      };
    } else {
      const s = this.syncedPlayer.getState();
      return {
        mode: "synced",
        status: s.status,
        currentTrack: s.currentTrack,
        positionMs: s.positionMs,
        durationMs: s.durationMs,
        volume: this.volume,
        ntpOffsetMs: s.ntpOffsetMs,
        rttMs: s.rttMs,
      };
    }
  }

  async play(track: Track, positionMs: number = 0): Promise<void> {
    if (this.mode === "solo") {
      this.syncedPlayer.pause();
      await this.soloPlayer.play(track, positionMs);
    } else {
      this.soloPlayer.pause();
      // In synced mode, playing locally without server barrier schedules immediate barrier
      this.syncedPlayer.schedulePlay(track, Date.now() + 50, positionMs);
    }
    this.emitState();
  }

  pause(): void {
    if (this.mode === "solo") {
      this.soloPlayer.pause();
    } else {
      this.syncedPlayer.schedulePause(Date.now() + 50, this.getState().positionMs);
    }
    this.emitState();
  }

  seek(positionMs: number): void {
    if (this.mode === "solo") {
      this.soloPlayer.seek(positionMs);
    } else {
      this.syncedPlayer.scheduleSeek(Date.now() + 50, positionMs);
    }
    this.emitState();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.soloPlayer.setVolume(this.volume);
    this.syncedPlayer.setVolume(this.volume);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("soundlounge_volume", String(this.volume));
      } catch {}
    }
    this.emitState();
  }

  onStateChange(cb: CoordinatorStateCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emitState(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  dispose(): void {
    this.soloPlayer.dispose();
    this.syncedPlayer.dispose();
    this.listeners.clear();
  }
}
