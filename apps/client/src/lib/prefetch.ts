// The phone streamer downloads a YouTube track on its first request (~2-4 s). Warming it before the
// click makes the play a cache hit. With prefetch=1 the route and phone answer at once.
const warmed = new Set<string>();

export function prefetchTrack(track: { url?: string } | null | undefined): void {
  const url = track?.url;
  if (!url?.startsWith("/api/stream/youtube") || warmed.has(url)) return;
  warmed.add(url);
  fetch(`${url}${url.includes("?") ? "&" : "?"}prefetch=1`).catch(() => warmed.delete(url));
}
