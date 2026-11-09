import { describe, it, expect, beforeEach } from "bun:test";
import { computeBestNtpOffset, type NtpProbeSample } from "../ntpClient";
import { indexOfTrackOrZero } from "../useRoomSync";
import type { Track } from "@soundlounge/shared";

describe("indexOfTrackOrZero", () => {
  const track = (id: string): Track => ({
    id,
    title: id,
    artist: "Artist",
    durationMs: 1000,
    url: `https://r2.soundlounge.app/${id}.mp3`,
    source: "upload",
  });
  const queue = [track("a"), track("b"), track("c")];

  it("keeps the current track's position when the queue is replaced", () => {
    expect(indexOfTrackOrZero(queue, "c")).toBe(2);
  });

  it("falls back to 0 when the track is missing or unset", () => {
    expect(indexOfTrackOrZero(queue, "zzz")).toBe(0);
    expect(indexOfTrackOrZero(queue, null)).toBe(0);
    expect(indexOfTrackOrZero(queue, undefined)).toBe(0);
  });
});

describe("NTP Client Probe Pair Math", () => {
  it("calculates accurate clock offset and minimum RTT filtering jitter", () => {
    // 4 sample probe pairs with varying network jitter
    const samples: NtpProbeSample[] = [
      { t0: 1000, t1: 1050, t2: 1052, t3: 1120 }, // RTT = 120 - 2 = 118ms, offset = (50 + -68)/2 = -9ms
      { t0: 2000, t1: 2020, t2: 2021, t3: 2045 }, // RTT = 45 - 1 = 44ms (clean lowest jitter!), offset = (20 + -24)/2 = -2ms
      { t0: 3000, t1: 3080, t2: 3082, t3: 3190 }, // RTT = 190 - 2 = 188ms
      { t0: 4000, t1: 4030, t2: 4031, t3: 4075 }, // RTT = 75 - 1 = 74ms
    ];

    const result = computeBestNtpOffset(samples);

    // Should choose sample 2 with lowest RTT (44ms)
    expect(result.bestRTT).toBe(44);
    expect(result.bestOffsetMs).toBe(-2);
  });
});
