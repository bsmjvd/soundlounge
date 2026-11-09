import type { NextRequest } from "next/server";

const WINDOW_SECONDS = 60;

function clientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Fixed-window per-IP limit backed by Upstash Redis (REST pipeline, no SDK).
 * Disabled when KV env vars are absent (local dev); fails open on any Redis error
 * so a KV outage never takes streaming/search down with it.
 */
export async function isRateLimited(req: NextRequest | Request, route: string, limit: number): Promise<boolean> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;

  const window = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const key = `rl:${route}:${clientIp(req)}:${window}`;

  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, WINDOW_SECONDS],
      ]),
      signal: AbortSignal.timeout(500),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as Array<{ result?: unknown }>;
    const count = Number(data?.[0]?.result);
    return Number.isFinite(count) && count > limit;
  } catch {
    return false;
  }
}
