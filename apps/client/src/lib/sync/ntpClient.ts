import {
  PROBE_GAP_MS,
  NTP_PROBE_PAIR_COUNT,
  type ClientAction,
  type ServerAction,
} from "@soundlounge/shared";

export interface NtpProbeSample {
  t0: number; // Client transmit time
  t1: number; // Server receive time
  t2: number; // Server transmit time
  t3: number; // Client receive time
}

export interface BestNtpOffsetResult {
  bestOffsetMs: number;
  bestRTT: number;
}

export function computeBestNtpOffset(samples: NtpProbeSample[]): BestNtpOffsetResult {
  if (samples.length === 0) {
    return { bestOffsetMs: 0, bestRTT: 0 };
  }

  let minRTT = Infinity;
  let bestOffset = 0;

  for (const s of samples) {
    const rtt = s.t3 - s.t0 - (s.t2 - s.t1);
    const offset = (s.t1 - s.t0 + (s.t2 - s.t3)) / 2;

    if (rtt < minRTT) {
      minRTT = rtt;
      bestOffset = offset;
    }
  }

  return {
    bestOffsetMs: Math.round(bestOffset),
    bestRTT: Math.max(0, Math.round(minRTT)),
  };
}

export class NtpSyncEngine {
  private samples: NtpProbeSample[] = [];
  private groupId: number = 0;
  private pendingT0Map: Map<string, number> = new Map();

  constructor(
    private sendSocketMessage: (action: ClientAction) => void,
    private onSyncCalculated: (result: BestNtpOffsetResult) => void
  ) {}

  startProbeSequence(pairCount: number = NTP_PROBE_PAIR_COUNT) {
    this.samples = [];
    this.groupId = Date.now();
    this.pendingT0Map.clear();

    for (let i = 0; i < pairCount; i++) {
      setTimeout(() => {
        const t0 = Date.now();
        const key = `${this.groupId}_${i}`;
        this.pendingT0Map.set(key, t0);

        const action: ClientAction = {
          type: "NTP_REQUEST",
          t0,
          probeGroupId: this.groupId,
          probeGroupIndex: i,
        };
        this.sendSocketMessage(action);
      }, i * PROBE_GAP_MS);
    }
  }

  handleNtpResponse(resp: {
    t0: number;
    t1: number;
    t2: number;
    probeGroupId: number;
    probeGroupIndex: number;
  }) {
    if (resp.probeGroupId !== this.groupId) return;

    const t3 = Date.now();
    const key = `${resp.probeGroupId}_${resp.probeGroupIndex}`;
    const t0 = this.pendingT0Map.get(key) || resp.t0;

    this.samples.push({
      t0,
      t1: resp.t1,
      t2: resp.t2,
      t3,
    });

    if (this.samples.length >= 3) {
      const result = computeBestNtpOffset(this.samples);
      this.onSyncCalculated(result);
    }
  }
}
