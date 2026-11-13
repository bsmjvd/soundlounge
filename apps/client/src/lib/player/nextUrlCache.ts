import type { Track } from "@soundlounge/shared";

// Locked-screen track advancement on iOS dies if play() has to wait on a network
// round trip (the /api/stream/youtube 307 hop). The controller pre-resolves the
// next tracks' upstream URLs here while the current one plays, so ending a track
// can swap the <audio> src synchronously.
//
// TTL matches the phone streamer's short-lived tunnel URL (the route caches its
// resolved format for 60s too).
const TTL_MS = 60_000;
const MAX_ENTRIES = 50;

interface ResolvedUrl {
  url: string;
  expiresAt: number;
}

const resolved = new Map<string, ResolvedUrl>();
const pending = new Map<string, Promise<string | null>>();

export function getCachedNextUrl(track: Pick<Track, "id" | "url"> | null | undefined): string | null {
  if (!track?.id || !track.url?.startsWith("/api/stream/youtube")) return null;
  const hit = resolved.get(track.id);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    resolved.delete(track.id);
    return null;
  }
  return hit.url;
}

export function cacheNextUrl(track: Pick<Track, "id" | "url">, url: string): void {
  if (!track.id || !track.url?.startsWith("/api/stream/youtube")) return;
  if (resolved.size >= MAX_ENTRIES) {
    const oldest = resolved.keys().next().value;
    if (oldest !== undefined) resolved.delete(oldest);
  }
  resolved.set(track.id, { url, expiresAt: Date.now() + TTL_MS });
}

export function resolveAndCache(track: Pick<Track, "id" | "url">): Promise<string | null> {
  if (!track.id || !track.url?.startsWith("/api/stream/youtube")) return Promise.resolve(null);

  const hit = resolved.get(track.id);
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.url);
  if (hit) resolved.delete(track.id);

  const inFlight = pending.get(track.id);
  if (inFlight) return inFlight;

  const p = (async () => {
    try {
      const url = track.url.includes("?") ? `${track.url}&resolve=1` : `${track.url}?resolve=1`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as { url?: string };
      if (!data.url) return null;
      cacheNextUrl(track, data.url);
      return data.url;
    } catch {
      return null;
    } finally {
      pending.delete(track.id);
    }
  })();
  pending.set(track.id, p);
  return p;
}
