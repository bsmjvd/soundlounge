import { describe, it, expect } from "bun:test";
import {
  createNtpResponse,
  calculateBarrierExecutionTime,
  calculateLateJoinerPosition,
} from "../src/sync";
import { DEFAULT_BARRIER_DELAY_MS } from "@soundlounge/shared";

describe("Sync Engine Math & Logic", () => {
  it("creates accurate NTP probe response with t0, t1, t2", () => {
    const t0 = 1700000000000;
    const t1 = 1700000000010;
    const t2 = 1700000000012;

    const response = createNtpResponse(
      { type: "NTP_REQUEST", t0, probeGroupId: 1, probeGroupIndex: 0 },
      t1,
      t2
    );

    expect(response).toEqual({
      type: "NTP_RESPONSE",
      t0,
      t1,
      t2,
      probeGroupId: 1,
      probeGroupIndex: 0,
    });
  });

  it("calculates execution barrier with maximum RTT plus headroom", () => {
    const nowServerEpoch = 1700000000000;
    const maxClientRtt = 120; // 120ms max client latency in room
    const barrier = calculateBarrierExecutionTime(nowServerEpoch, [20, 60, maxClientRtt]);

    // Barrier must be at least nowServerEpoch + base delay (300ms) + maxRtt/2
    expect(barrier).toBeGreaterThanOrEqual(nowServerEpoch + DEFAULT_BARRIER_DELAY_MS);
    expect(barrier).toBe(nowServerEpoch + DEFAULT_BARRIER_DELAY_MS + Math.ceil(maxClientRtt / 2));
  });

  it("calculates correct current position for late joiners", () => {
    const serverStartTime = 1700000000000;
    const positionAtStart = 5000; // started at 5s
    const nowEpoch = 1700000010000; // 10s later
    const durationMs = 180000; // 3 min track

    const pos = calculateLateJoinerPosition(serverStartTime, positionAtStart, nowEpoch, durationMs);
    expect(pos).toBe(15000); // 5s + 10s = 15s

    // Clamps to track duration if elapsed exceeds duration
    const endedPos = calculateLateJoinerPosition(serverStartTime, positionAtStart, serverStartTime + 200000, durationMs);
    expect(endedPos).toBe(durationMs);
  });
});
