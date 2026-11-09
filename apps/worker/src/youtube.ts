// Resolve a YouTube id via Innertube and stream the audio bytes from the Worker, so the
// IP-locked googlevideo URL is fetched from Cloudflare egress rather than the browser.

export const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

// ANDROID_VR currently plays without a po_token (same client yt-dlp falls back to).
// shortcut: hardcoded client version, bump it when YouTube starts rejecting it.
const CLIENT = {
  clientName: "ANDROID_VR",
  clientVersion: "1.60.19",
  deviceMake: "Oculus",
  deviceModel: "Quest 3",
  androidSdkVersion: 32,
  osName: "Android",
  osVersion: "12L",
  hl: "en",
  gl: "US",
};
const USER_AGENT =
  "com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip";

interface Format {
  url?: string;
  mimeType: string;
  bitrate: number;
}

export function pickAudioFormat(formats: Format[] = []): Format | undefined {
  return formats
    .filter((f) => f.url && f.mimeType.startsWith("audio/"))
    // Prefer mp4/aac: Safari can't play webm/opus
    .sort((a, b) => Number(b.mimeType.startsWith("audio/mp4")) - Number(a.mimeType.startsWith("audio/mp4")) || b.bitrate - a.bitrate)[0];
}

export async function resolveAudio(videoId: string): Promise<Format> {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      "X-YouTube-Client-Name": "28",
      "X-YouTube-Client-Version": CLIENT.clientVersion,
    },
    body: JSON.stringify({ videoId, context: { client: CLIENT }, contentCheckOk: true, racyCheckOk: true }),
  });
  if (!res.ok) throw new Error(`innertube ${res.status}`);
  const data = (await res.json()) as any;
  const status = data.playabilityStatus?.status;
  if (status !== "OK") throw new Error(`unplayable: ${status} ${data.playabilityStatus?.reason ?? ""}`.trim());
  const format = pickAudioFormat(data.streamingData?.adaptiveFormats);
  if (!format) throw new Error("no audio format");
  return format;
}

// Resolved formats are cached per colo until the googlevideo URL expires (max 1h), so the
// player's follow-up Range requests and the app's probe don't each hit Innertube.
const cacheKey = (videoId: string) => new Request(`https://yt-format.cache/${videoId}`);

async function cachedResolve(videoId: string, fresh: boolean, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<Format> {
  const cache = (caches as any).default as Cache;
  if (!fresh) {
    const hit = await cache.match(cacheKey(videoId));
    if (hit) return hit.json();
  }
  const format = await resolveAudio(videoId);
  const expire = Number(new URL(format.url!).searchParams.get("expire")) * 1000;
  const ttl = Math.min(3600, Math.floor((expire - Date.now()) / 1000) - 60);
  if (ttl > 0) {
    ctx.waitUntil(
      cache.put(cacheKey(videoId), new Response(JSON.stringify(format), { headers: { "Cache-Control": `max-age=${ttl}` } }))
    );
  }
  return format;
}

export async function streamYouTube(
  videoId: string,
  request: Request,
  cors: Record<string, string>,
  ctx: { waitUntil(p: Promise<unknown>): void }
): Promise<Response> {
  const range = request.headers.get("Range");
  let upstream: Response | undefined;
  try {
    // A cached URL can 403 if this request left from a different egress IP, so re-resolve once
    for (const fresh of [false, true]) {
      const format = await cachedResolve(videoId, fresh, ctx);
      upstream = await fetch(format.url!, {
        headers: { "User-Agent": USER_AGENT, ...(range ? { Range: range } : {}) },
      });
      if (upstream.status !== 403) break;
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
  const headers = new Headers(cors);
  for (const h of ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"]) {
    const v = upstream!.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
  return new Response(upstream!.body, { status: upstream!.ok ? upstream!.status : 502, headers });
}
