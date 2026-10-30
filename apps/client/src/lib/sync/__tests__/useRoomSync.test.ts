import { describe, it, expect, beforeEach } from "bun:test";
import { computeBestNtpOffset, type NtpProbeSample } from "../ntpClient";

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
