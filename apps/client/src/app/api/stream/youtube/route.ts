import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";
import CryptoJS from "crypto-js";
import { isYouTubeVideoId } from "@/lib/youtubeUtils";
import { INVIDIOUS_INSTANCES, isAllowedStreamUrl } from "@/lib/streamHosts";
import { getBounded, setBounded } from "@/lib/boundedCache";
import { isRateLimited } from "@/lib/rateLimit";

interface CachedFormat {
  url: string;
  mimeType: string;
  contentLength?: number;
  expiresAt: number;
}

const formatCache = new Map<string, CachedFormat>();
const searchToVideoIdCache = new Map<string, string>();
const CACHE_MAX_ENTRIES = 500;

let innertubePromise: Promise<Innertube> | null = null;
async function getInnertube(): Promise<Innertube> {
  if (!innertubePromise) {
    innertubePromise = Innertube.create({
      retrieve_player: false,
      generate_session_locally: true,
    }).catch((err) => {
      innertubePromise = null;
      throw err;
    });
  }
  return innertubePromise;
}

/**
 * Searches YouTube for an exact song when no videoId is provided or if initial video is unavailable
 */
async function searchExactYouTubeSong(title: string, artist?: string): Promise<string | null> {
  const cacheKey = `${title.toLowerCase().trim()}::${(artist || "").toLowerCase().trim()}`;
  const cachedVid = getBounded(searchToVideoIdCache, cacheKey);
  if (cachedVid) {
    return cachedVid;
  }

  try {
    const yt = await getInnertube();
    const cleanTitle = title
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .trim();
    const cleanArtist = artist && artist !== "Unknown Artist" ? artist.replace(/vevo/gi, "").trim() : "";
    const query = `${cleanTitle} ${cleanArtist} audio`.trim();

    const search = await yt.search(query);
    const videos = (search.videos as Array<{ duration?: { seconds?: number }; id?: string }>) || [];

    const validSongVideos = videos.filter((v) => {
      const durSec = v.duration?.seconds || 0;
      return durSec >= 45 && durSec <= 720;
    });

    const chosen = validSongVideos[0] || videos[0];
    if (chosen && chosen.id) {
      const vid = String(chosen.id);
      setBounded(searchToVideoIdCache, cacheKey, vid, CACHE_MAX_ENTRIES);
      return vid;
    }
  } catch (err) {
    console.warn("searchExactYouTubeSong failed:", title, artist, err);
  }

  return null;
}

const CANONICAL_TRACK_IDS: Record<string, string> = {
  // Karan Aujla
  "softly": "cWMxCE2HTag",
  "winningspeech": "0DS5jYQeiw0",
  "winning speech": "0DS5jYQeiw0",
  // Diljit Dosanjh
  "lover": "3K66ntQkJko",
  "naina": "3u6lLWGjFLY",
  // Sidhu Moose Wala
  "thelastride": "6xoB4ZiKKn0",
  "the last ride": "6xoB4ZiKKn0",
  "so high": "cl0a3i2wFcc",
  "sohigh": "cl0a3i2wFcc",
  "295": "n_FCrCQ6-b4",
  // A.R. Rahman
  "jai ho": "2R3XstG35sE",
  "jaiho": "2R3XstG35sE",
  // Asha Bhosle / R.D. Burman
  "dum maro dum": "kOrRYDJ4AuY",
  "dummarodum": "kOrRYDJ4AuY",
  "mehbooba mehbooba": "Nl9-rpuwp3E",
  "mehboobamehbooba": "Nl9-rpuwp3E",
  // Lata Mangeshkar
  "tujhe dekha toh": "cNV5hLSa9H8",
  "tujhedekhatoh": "cNV5hLSa9H8",
  "kabhi kabhie mere dil mein": "o-j2hFfLOSE",
  "kabhie kabhie mere dil mein": "o-j2hFfLOSE",
  "kabhi kabhi mere dil mein": "o-j2hFfLOSE",
  "kis liye maine pyaar kiya": "KuWK-u493PU",
  "kis liye maine pyar kiya": "KuWK-u493PU",
  // Atif Aslam
  "woh lamhe": "bJY37eZjW74",
  "wohlamhe": "bJY37eZjW74",
  "aadat": "rgqpWCbANjM",
  "jeene laga hoon": "qpIdoaaPa6U",
  "jeenelagahoon": "qpIdoaaPa6U",
  "pehli nazar mein": "BadBAMnPX0I",
  "pehlinazarmein": "BadBAMnPX0I",
  "tajdar-e-haram": "a18py61_F_w",
  "tajdar e haram": "a18py61_F_w",
  "tajdareharam": "a18py61_F_w",
};

/**
 * Resolves input into a verified 11-char YouTube video ID
 */
async function resolveVideoId(
  idInput?: string | null,
  title?: string | null,
  artist?: string | null,
  query?: string | null
): Promise<string | null> {
  const cleanId = (idInput || "").replace(/^yt_/, "").trim();
  const lowerTitle = (title || "").toLowerCase().trim();

  // 1. Known catalog alias
  if (cleanId.toLowerCase() === "thelastride") {
    return "6xoB4ZiKKn0";
  }

  // 2. A well-formed YouTube ID passed by the caller is played as-is
  if (isYouTubeVideoId(cleanId)) {
    return cleanId;
  }

  // 3. Missing or slug ID: canonical track resolution by title
  if (lowerTitle && CANONICAL_TRACK_IDS[lowerTitle]) {
    return CANONICAL_TRACK_IDS[lowerTitle];
  }

  // 4. If title or query is provided, search YouTube for the exact song
  if (title && title.trim()) {
    const found = await searchExactYouTubeSong(title.trim(), artist || undefined);
    if (found) return found;
  }

  if (query && query.trim()) {
    const found = await searchExactYouTubeSong(query.trim());
    if (found) return found;
  }

  if (cleanId) {
    const naturalQuery = cleanId
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]+/g, " ")
      .trim();
    const found = await searchExactYouTubeSong(naturalQuery, artist || undefined);
    if (found) return found;
  }

  return cleanId || null;
}

let lastExtractionError = "";

/**
 * Extracts audio via Invidious, which proxies the bytes itself. googlevideo URLs are locked to the
 * resolving IP, so anything resolved on Vercel or Cloudflare can't be handed to the browser (and
 * both are bot-walled anyway).
 */
async function fetchInvidiousAudio(videoId: string): Promise<CachedFormat | null> {
  for (const inst of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${inst}/api/v1/videos/${encodeURIComponent(videoId)}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        lastExtractionError = `Invidious ${res.status} for ${videoId}`;
        continue;
      }

      const data: any = await res.json();
      const adaptive = data?.adaptiveFormats || [];
      const audios = adaptive.filter((f: any) => f.type && f.type.startsWith("audio"));
      if (audios.length === 0) continue;

      // Prefer audio/mp4 for universal cross-platform mobile & desktop playback
      const mp4Audio = audios.find((f: any) => f.type.includes("mp4"));
      const chosen = mp4Audio || audios[0];

      if (chosen && chosen.url) {
        let expireMs = NaN;
        try {
          expireMs = Number(new URL(chosen.url).searchParams.get("expire")) * 1000;
        } catch {}

        const expiresAt =
          Number.isFinite(expireMs) && expireMs > 0
            ? Math.min(expireMs - 60000, Date.now() + 3600000)
            : Date.now() + 3600000;

        // Route stream through Invidious /videoplayback proxy matching exact issuer node to eliminate cluster 403
        const gUrl = new URL(chosen.url);
        const issuer = gUrl.searchParams.get("issuer");
        const proxyHost = issuer ? `https://${issuer}` : inst;
        const proxyStreamUrl = `${proxyHost}/videoplayback${gUrl.search}`;

        return {
          url: proxyStreamUrl,
          mimeType: chosen.type?.split(";")[0] || "audio/mp4",
          contentLength: chosen.clen ? Number(chosen.clen) : chosen.contentLength ? Number(chosen.contentLength) : undefined,
          expiresAt,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastExtractionError = msg;
      console.warn(`Invidious extraction failed for ${videoId} on ${inst}:`, msg);
    }
  }

  return null;
}


/**
 * Decrypts JioSaavn URL with DES-ECB
 */
function decryptSaavnUrl(encUrl: string): string | null {
  try {
    const key = CryptoJS.enc.Utf8.parse("38346591");
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encUrl),
    });
    const decrypted = CryptoJS.DES.decrypt(cipherParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    const raw = decrypted.toString(CryptoJS.enc.Utf8);
    return raw || null;
  } catch {
    return null;
  }
}

/**
 * Fallback to JioSaavn ONLY if title matches with high precision (never loose BGM or wrong song)
 */
async function fallbackSaavnMatch(title: string, artist?: string): Promise<CachedFormat | null> {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanTitle = title
    .replace(/&amp;/g, "&")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/official video/gi, "")
    .replace(/lyric video/gi, "")
    .replace(/audio/gi, "")
    .trim();
  const cleanArtist = (artist || "")
    .replace(/- Topic/gi, "")
    .replace(/vevo/gi, "")
    .replace(/official/gi, "")
    .trim();
  const query = `${cleanTitle} ${cleanArtist}`.trim();

  try {
    const searchUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!searchRes.ok) return null;

    const data = await searchRes.json();
    const songs = data?.songs?.data || [];
    const targetNorm = norm(cleanTitle);

    // Verify title matches to ensure authentic track without random BGM substitution
    const match = songs.find((s: { title?: string; singers?: string }) => {
      const rawSTitle = (s.title || "").replace(/&amp;/g, "&").replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();
      const sNorm = norm(rawSTitle);
      return targetNorm !== "" && sNorm === targetNorm;
    });

    if (!match || !match.id) return null;

    const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${match.id}&_format=json&_marker=0&ctx=web6dot0`;
    const detailRes = await fetch(detailUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!detailRes.ok) return null;

    const detailData = await detailRes.json();
    const song = detailData?.songs?.[0];
    if (!song?.encrypted_media_url) return null;

    const dec = decryptSaavnUrl(song.encrypted_media_url);
    if (!dec) return null;

    return {
      // Saavn sometimes hands out http:// URLs; the redirect allow-list (and mixed content) needs https
      url: dec.replace("_96.mp4", "_320.mp4").replace(/^http:/, "https:"),
      mimeType: "audio/mp4",
      expiresAt: Date.now() + 86400000,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (await isRateLimited(req, "stream", 60)) {
    return new NextResponse("Too many requests", { status: 429, headers: { "Retry-After": "60" } });
  }

  const { searchParams } = new URL(req.url);
  const rawVideoId = searchParams.get("id");
  const query = searchParams.get("q");
  const title = searchParams.get("title");
  const artist = searchParams.get("artist") || undefined;

  if (!rawVideoId && !query && !title) {
    return new NextResponse("Missing track identifier (id, title, or q required)", { status: 400 });
  }

  // 1. If an external stream proxy (e.g. residential tunnel or dedicated proxy) is configured, route through it
  const rawStreamProxy = process.env.STREAM_PROXY_URL || process.env.NEXT_PUBLIC_STREAM_PROXY_URL;
  const streamProxy = rawStreamProxy
    ? rawStreamProxy
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .trim()
        .replace(/\/+$/, "")
    : null;

  if (streamProxy) {
    try {
      const targetUrl = new URL(`${streamProxy}/api/stream/youtube`);
      targetUrl.search = searchParams.toString();

      const upstreamHeaders: Record<string, string> = {
        "User-Agent":
          req.headers.get("user-agent") ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      };
      const rangeHeader = req.headers.get("range");
      if (rangeHeader) {
        upstreamHeaders["Range"] = rangeHeader;
      }

      const proxyRes = await fetch(targetUrl.toString(), {
        headers: upstreamHeaders,
        signal: AbortSignal.timeout(20000),
      });

      if (proxyRes.ok || proxyRes.status === 206) {
        const responseHeaders = new Headers();
        const contentType = proxyRes.headers.get("content-type") || "audio/mp4";
        responseHeaders.set("Content-Type", contentType);
        responseHeaders.set("Accept-Ranges", "bytes");
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Access-Control-Allow-Headers", "Range, Accept-Ranges, Content-Type");
        responseHeaders.set("Cache-Control", "public, max-age=3600");

        const contentRange = proxyRes.headers.get("content-range");
        if (contentRange) responseHeaders.set("Content-Range", contentRange);

        const contentLength = proxyRes.headers.get("content-length");
        if (contentLength) responseHeaders.set("Content-Length", contentLength);

        return new Response(proxyRes.body, {
          status: proxyRes.status,
          headers: responseHeaders,
        });
      } else {
        console.warn(`Stream proxy returned HTTP ${proxyRes.status} ${proxyRes.statusText}`);
      }
    } catch (proxyErr) {
      console.warn("Stream proxy failed, falling back to direct extraction:", proxyErr);
    }
  }

  const cacheKey = `${rawVideoId || ""}::${title || ""}::${artist || ""}::${query || ""}`;
  let streamInfo: CachedFormat | null | undefined = getBounded(formatCache, cacheKey);

  if (!streamInfo || streamInfo.expiresAt <= Date.now()) {
    // 1. Resolve authentic YouTube video ID
    let targetVid = await resolveVideoId(rawVideoId, title, artist, query);

    // 2. Primary engine: Invidious-proxied audio
    if (targetVid) {
      streamInfo = await fetchInvidiousAudio(targetVid);
    }

    // 3. If primary video failed, try searching for exact alternate YouTube upload
    if (!streamInfo && (title || query)) {
      const altVid = await searchExactYouTubeSong(title || query || "", artist);
      if (altVid && altVid !== targetVid) {
        targetVid = altVid;
        streamInfo = await fetchInvidiousAudio(altVid);
      }
    }

    // Resolve title and artist if not explicitly passed
    let queryTitle: string | null | undefined = title;
    let queryArtist: string | null | undefined = artist;
    if (!queryTitle && targetVid) {
      try {
        const yt = await getInnertube();
        const basic = await yt.getBasicInfo(targetVid);
        queryTitle = basic.basic_info.title;
        queryArtist = queryArtist || basic.basic_info.author;
      } catch {}
    }

    // 4. Secondary fallback: High-fidelity direct 320kbps MP4 audio with byte ranges (zero bot block)
    if (!streamInfo && (queryTitle || title)) {
      streamInfo = await fallbackSaavnMatch((queryTitle || title)!, queryArtist || undefined);
    }

    // Untrusted hosts are never cached, so the 404 below isn't served from cache either
    if (streamInfo && isAllowedStreamUrl(streamInfo.url)) {
      setBounded(formatCache, cacheKey, streamInfo, CACHE_MAX_ENTRIES);
      if (targetVid) setBounded(formatCache, targetVid, streamInfo, CACHE_MAX_ENTRIES);
    }
  }

  // The URL comes from upstream data (Invidious issuer, JioSaavn), so never redirect off the allow-list
  const untrusted = !!streamInfo?.url && !isAllowedStreamUrl(streamInfo.url);
  if (!streamInfo || !streamInfo.url || untrusted) {
    return new NextResponse(
      JSON.stringify({
        error: "Direct audio stream could not be extracted",
        details: untrusted ? "untrusted stream host" : lastExtractionError,
        track: { id: rawVideoId, title, artist, query },
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 5. Direct Edge Streaming via HTTP 307 Redirect
  // Cleanly bypasses Vercel datacenter IP restrictions & timeouts, streaming directly to browser
  const redirectRes = NextResponse.redirect(streamInfo.url, 307);
  redirectRes.headers.set("Access-Control-Allow-Origin", "*");
  redirectRes.headers.set("Access-Control-Allow-Headers", "Range, Accept-Ranges, Content-Type");
  redirectRes.headers.set("Cache-Control", "public, max-age=3600");
  return redirectRes;
}
