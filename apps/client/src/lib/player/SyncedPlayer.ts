import type { Track } from "@soundlounge/shared";

export interface ExecutionPlan {
  immediate: boolean;
  delayMs: number;
  startPositionMs: number;
}

export interface DriftReport {
  driftMs: number;
  expectedPositionMs: number;
  actualPositionMs: number;
  needsCorrection: boolean;
}

export interface SyncedPlayerState {
  status: "idle" | "playing" | "paused" | "buffering";
  currentTrack: Track | null;
  positionMs: number;
  durationMs: number;
  volume: number;
  ntpOffsetMs: number;
  rttMs: number;
}

export type SyncedStateChangeCallback = (state: SyncedPlayerState) => void;

export class SyncedPlayer {
  private ntpOffsetMs: number = 0;
  private rttMs: number = 0;
  private audioElement: HTMLAudioElement | null = null;
  private scheduledTimer: any = null;
  private driftCheckInterval: any = null;
  private serverEpochStartTime: number = 0;
  private initialPlayPositionMs: number = 0;

  private state: SyncedPlayerState = {
    status: "idle",
    currentTrack: null,
    positionMs: 0,
    durationMs: 0,
    volume: 1.0,
    ntpOffsetMs: 0,
    rttMs: 0,
  };
  private listeners: Set<SyncedStateChangeCallback> = new Set();

  constructor() {
    this.initAudio();
  }

  private initAudio() {
    if (typeof window !== "undefined" && typeof Audio !== "undefined") {
      try {
        this.audioElement = new Audio();
        this.audioElement.preload = "auto";

        this.audioElement.addEventListener("timeupdate", () => {
          if (this.audioElement) {
            this.state.positionMs = Math.floor(this.audioElement.currentTime * 1000);
            this.emitState();
          }
        });

        this.audioElement.addEventListener("ended", () => {
          this.state.status = "idle";
          this.state.positionMs = 0;
          this.emitState();
        });
      } catch {
        this.audioElement = null;
      }
    }
  }

  setNtpOffset(offsetMs: number, rttMs: number = 0) {
    this.ntpOffsetMs = offsetMs;
    this.rttMs = rttMs;
    this.state.ntpOffsetMs = offsetMs;
    this.state.rttMs = rttMs;
    this.emitState();
  }

  getNtpOffset(): number {
    return this.ntpOffsetMs;
  }

  getRTT(): number {
    return this.rttMs;
  }

  computeServerTime(localTimeMs: number = Date.now()): number {
    return localTimeMs + this.ntpOffsetMs;
  }

  calculateExecutionPlan(serverTimeToExecute: number, targetPositionMs: number): ExecutionPlan {
    const currentServerTime = this.computeServerTime();
    const diff = serverTimeToExecute - currentServerTime;

    if (diff > 0) {
      return {
        immediate: false,
        delayMs: diff,
        startPositionMs: targetPositionMs,
      };
    } else {
      // Barrier timestamp has already passed (late joiner or network jitter)
      const elapsedSinceBarrier = Math.abs(diff);
      return {
        immediate: true,
        delayMs: 0,
        startPositionMs: targetPositionMs + elapsedSinceBarrier,
      };
    }
  }

  calculateDrift(
    serverEpochStartTime: number,
    initialPositionMs: number,
    nowServerTime: number,
    actualLocalPositionMs: number
  ): DriftReport {
    const elapsedSinceStart = Math.max(0, nowServerTime - serverEpochStartTime);
    const expectedPositionMs = initialPositionMs + elapsedSinceStart;
    const driftMs = actualLocalPositionMs - expectedPositionMs;
    const needsCorrection = Math.abs(driftMs) > 30; // 30ms sync threshold

    return {
      driftMs,
      expectedPositionMs,
      actualPositionMs: actualLocalPositionMs,
      needsCorrection,
    };
  }

  schedulePlay(track: Track, serverTimeToExecute: number, positionMs: number = 0): void {
    if (this.scheduledTimer) {
      clearTimeout(this.scheduledTimer);
      this.scheduledTimer = null;
    }

    this.state.currentTrack = track;
    this.state.durationMs = track.durationMs;
    this.serverEpochStartTime = serverTimeToExecute;
    this.initialPlayPositionMs = positionMs;

    const plan = this.calculateExecutionPlan(serverTimeToExecute, positionMs);

    const execute = () => {
      this.state.status = "playing";
      this.state.positionMs = plan.startPositionMs;

      if (this.audioElement) {
        if (this.audioElement.src !== track.url) {
          this.audioElement.src = track.url;
        }
        this.audioElement.currentTime = plan.startPositionMs / 1000;
        this.audioElement.volume = this.state.volume;
        this.audioElement.play().catch(() => {});
      }

      this.startDriftMonitor();
      this.emitState();
    };

    if (plan.immediate || plan.delayMs <= 0) {
      execute();
    } else {
      this.state.status = "buffering";
      if (this.audioElement && this.audioElement.src !== track.url) {
        this.audioElement.src = track.url;
        this.audioElement.currentTime = plan.startPositionMs / 1000;
        this.audioElement.load();
      }
      this.emitState();
      this.scheduledTimer = setTimeout(execute, plan.delayMs);
    }
  }

  schedulePause(serverTimeToExecute: number, positionMs: number): void {
    if (this.scheduledTimer) {
      clearTimeout(this.scheduledTimer);
      this.scheduledTimer = null;
    }
    this.stopDriftMonitor();

    const plan = this.calculateExecutionPlan(serverTimeToExecute, positionMs);
    const execute = () => {
      this.state.status = "paused";
      this.state.positionMs = positionMs;
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.currentTime = positionMs / 1000;
      }
      this.emitState();
    };

    if (plan.immediate || plan.delayMs <= 0) {
      execute();
    } else {
      this.scheduledTimer = setTimeout(execute, plan.delayMs);
    }
  }

  scheduleSeek(serverTimeToExecute: number, positionMs: number): void {
    const plan = this.calculateExecutionPlan(serverTimeToExecute, positionMs);
    const execute = () => {
      this.state.positionMs = plan.startPositionMs;
      this.initialPlayPositionMs = plan.startPositionMs;
      this.serverEpochStartTime = serverTimeToExecute;

      if (this.audioElement) {
        this.audioElement.currentTime = plan.startPositionMs / 1000;
      }
      this.emitState();
    };

    if (plan.immediate || plan.delayMs <= 0) {
      execute();
    } else {
      setTimeout(execute, plan.delayMs);
    }
  }

  private startDriftMonitor() {
    this.stopDriftMonitor();
    this.driftCheckInterval = setInterval(() => {
      if (this.state.status !== "playing" || !this.audioElement) return;

      const currentLocalPos = Math.floor(this.audioElement.currentTime * 1000);
      const nowServerTime = this.computeServerTime();
      const report = this.calculateDrift(
        this.serverEpochStartTime,
        this.initialPlayPositionMs,
        nowServerTime,
        currentLocalPos
      );

      if (report.needsCorrection) {
        // Correct drift: smooth playback rate modulation or direct alignment
        if (Math.abs(report.driftMs) < 150) {
          // Micro-speed adjust (0.97x or 1.03x) to preserve pitch perception
          this.audioElement.playbackRate = report.driftMs > 0 ? 0.97 : 1.03;
        } else {
          // Hard jump for large drift
          this.audioElement.currentTime = report.expectedPositionMs / 1000;
          this.audioElement.playbackRate = 1.0;
        }
      } else {
        this.audioElement.playbackRate = 1.0;
      }
    }, 1000);
  }

  private stopDriftMonitor() {
    if (this.driftCheckInterval) {
      clearInterval(this.driftCheckInterval);
      this.driftCheckInterval = null;
    }
  }

  setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.state.volume = clamped;
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
    this.emitState();
  }

  getState(): SyncedPlayerState {
    return { ...this.state };
  }

  onStateChange(cb: SyncedStateChangeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emitState() {
    const current = this.getState();
    for (const listener of this.listeners) {
      listener(current);
    }
  }

  dispose() {
    if (this.scheduledTimer) clearTimeout(this.scheduledTimer);
    this.stopDriftMonitor();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
    this.listeners.clear();
  }
}
