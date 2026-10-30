import {
  DEFAULT_BARRIER_DELAY_MS,
  type NtpResponse,
  type ClientAction,
} from "@soundlounge/shared";

export function createNtpResponse(
  req: { t0: number; probeGroupId: number; probeGroupIndex: number },
  t1: number,
  t2: number
): NtpResponse {
  return {
    type: "NTP_RESPONSE",
    t0: req.t0,
    t1,
    t2,
    probeGroupId: req.probeGroupId,
    probeGroupIndex: req.probeGroupIndex,
  };
}

export function calculateBarrierExecutionTime(
  nowServerEpoch: number,
  clientRtts: number[] = [],
  baseDelayMs: number = DEFAULT_BARRIER_DELAY_MS
): number {
  const maxRtt = clientRtts.length > 0 ? Math.max(...clientRtts) : 0;
  const oneWayHeadroom = Math.ceil(maxRtt / 2);
  return nowServerEpoch + baseDelayMs + oneWayHeadroom;
}

export function calculateLateJoinerPosition(
  serverStartTime: number,
  positionAtStart: number,
  nowEpoch: number,
  durationMs: number
): number {
  if (nowEpoch <= serverStartTime) {
    return Math.min(positionAtStart, durationMs);
  }
  const elapsedSinceStart = nowEpoch - serverStartTime;
  const currentPos = positionAtStart + elapsedSinceStart;
  return Math.min(Math.max(0, currentPos), durationMs);
}
