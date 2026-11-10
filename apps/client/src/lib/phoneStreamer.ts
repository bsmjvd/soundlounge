import { createHmac } from "node:crypto";

// Phone YouTube streamer (phone-streamer/ in the repo root). The phone registers its current
// Cloudflare quick-tunnel URL with the worker; links to it are HMAC-signed with PHONE_SECRET.
const WORKER_HTTP_URL = process.env.NEXT_PUBLIC_WORKER_HTTP_URL?.trim().replace(/\/+$/, "") || "";
const LINK_TTL_S = 6 * 3600;
const CHECK_INTERVAL_MS = 60_000;

let phone: { base: string | null; checkedAt: number } = { base: null, checkedAt: 0 };

export function signPhoneUrl(base: string, secret: string, videoId: string, nowS = Math.floor(Date.now() / 1000)): string {
  const exp = nowS + LINK_TTL_S;
  const sig = createHmac("sha256", secret).update(`${videoId}.${exp}`).digest("hex");
  return `${base}/yt/${videoId}?exp=${exp}&sig=${sig}`;
}

// Registered and answering /health; the result is cached so an offline phone costs one check a minute
async function currentPhoneBase(): Promise<string | null> {
  if (Date.now() - phone.checkedAt < CHECK_INTERVAL_MS) return phone.base;
  let base: string | null = null;
  try {
    const reg = await fetch(`${WORKER_HTTP_URL}/api/phone`, { signal: AbortSignal.timeout(1500), cache: "no-store" });
    const candidate = ((await reg.json()) as { url?: string | null }).url ?? null;
    const health = candidate ? await fetch(`${candidate}/health`, { signal: AbortSignal.timeout(1500), cache: "no-store" }) : null;
    if (health?.ok) base = candidate;
  } catch {
    // Unreachable worker or phone: fall through to the other engines
  }
  phone = { base, checkedAt: Date.now() };
  return base;
}

/** Signed phone URL for this video, or null when the phone isn't configured or reachable. */
export async function phoneStreamUrl(videoId: string): Promise<string | null> {
  const secret = process.env.PHONE_SECRET;
  if (!secret || !WORKER_HTTP_URL) return null;
  const base = await currentPhoneBase();
  return base ? signPhoneUrl(base, secret, videoId) : null;
}
