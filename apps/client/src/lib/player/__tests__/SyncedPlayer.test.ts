import { describe, it, expect, beforeEach } from "bun:test";
import { SyncedPlayer } from "../SyncedPlayer";
import type { Track } from "@soundlounge/shared";

describe("SyncedPlayer Precision Audio Engine", () => {
  let player: SyncedPlayer;
  const sampleTrack: Track = {
    id: "sync_1",
    title: "Strobe",
    artist: "deadmau5",
    durationMs: 630000,
    url: "https://r2.soundlounge.app/audio/strobe.mp3",
    source: "upload",
  };

  beforeEach(() => {
    player = new SyncedPlayer();
  });

  it("updates and maintains NTP offset and round-trip time", () => {
    player.setNtpOffset(45, 18); // 45ms offset, 18ms RTT
    expect(player.getNtpOffset()).toBe(45);
    expect(player.getRTT()).toBe(18);
  });

  it("computes accurate server time based on local epoch and NTP offset", () => {
    player.setNtpOffset(50, 20);
    const localNow = 1700000000000;
    const serverNow = player.computeServerTime(localNow);
    expect(serverNow).toBe(1700000000050);
  });

  it("calculates delay and scheduled execution for future barrier timestamp", () => {
    player.setNtpOffset(0, 10);
    const currentServerTime = Date.now();
    const barrierTime = currentServerTime + 300; // 300ms in future

    const executionPlan = player.calculateExecutionPlan(barrierTime, 0);
    expect(executionPlan.immediate).toBe(false);
    expect(executionPlan.delayMs).toBeGreaterThanOrEqual(280);
    expect(executionPlan.delayMs).toBeLessThanOrEqual(320);
    expect(executionPlan.startPositionMs).toBe(0);
  });

  it("compensates late joiners when barrier timestamp is in the past", () => {
    player.setNtpOffset(0, 10);
    const currentServerTime = Date.now();
    const barrierTime = currentServerTime - 2500; // Barrier was 2.5s ago

    const executionPlan = player.calculateExecutionPlan(barrierTime, 1000);
    expect(executionPlan.immediate).toBe(true);
    expect(executionPlan.delayMs).toBe(0);
    // Should advance starting position by elapsed time (~2500ms + 1000ms = ~3500ms)
    expect(executionPlan.startPositionMs).toBeGreaterThanOrEqual(3400);
    expect(executionPlan.startPositionMs).toBeLessThanOrEqual(3600);
  });

  it("detects drift when local audio differs from server timeline by > 30ms", () => {
    player.setNtpOffset(0, 10);
    const serverEpochStartTime = 1700000000000;
    const initialPositionMs = 0;
    const nowServerTime = 1700000010000; // 10,000ms expected position

    // Local position is 9,950ms (drift = -50ms, lagging by 50ms)
    const driftLagging = player.calculateDrift(
      serverEpochStartTime,
      initialPositionMs,
      nowServerTime,
      9950
    );
    expect(driftLagging.driftMs).toBe(-50);
    expect(driftLagging.needsCorrection).toBe(true);

    // Local position is 10,010ms (drift = +10ms, within 30ms tolerance)
    const driftAcceptable = player.calculateDrift(
      serverEpochStartTime,
      initialPositionMs,
      nowServerTime,
      10010
    );
    expect(driftAcceptable.driftMs).toBe(10);
    expect(driftAcceptable.needsCorrection).toBe(false);
  });
});
