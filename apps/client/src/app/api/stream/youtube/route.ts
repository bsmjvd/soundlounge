import { NextRequest, NextResponse } from "next/server";
import { Ytdl, Client, chooseFormat } from "@distube/ytdl-core";
import { Innertube } from "youtubei.js";
import CryptoJS from "crypto-js";

interface CachedFormat {
  url: string;
  mimeType: string;
  contentLength?: number;
  expiresAt: number;
}

const formatCache = new Map<string, CachedFormat>();
const searchToVideoIdCache = new Map<string, string>();

// VisionOS, Tv, and WebEmbedded clients bypass bot checks without PO tokens or cookies
const DEFAULT_CLIENT_SETS: Client[][] = [
  [Client.Tv, Client.WebEmbedded],
  [Client.WebEmbedded],
  [Client.Tv],
  [Client.Mweb],
  [Client.WebMusic],
  [Client.VisionOS],
];

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
 * Searches YouTube for candidate songs matching title and artist
 */
async function searchCandidateYouTubeSongs(title: string, artist?: string): Promise<string[]> {
  try {
    const yt = await getInnertube();
    const cleanTitle = title
      .replace(/&amp;/g, "&")
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

    const ids = (validSongVideos.length > 0 ? validSongVideos : videos)
      .map((v) => (v.id ? String(v.id) : null))
      .filter((id): id is string => Boolean(id) && /^[a-zA-Z0-9_-]{11}$/.test(id));

    return Array.from(new Set(ids)).slice(0, 4);
  } catch (err) {
    console.warn("searchCandidateYouTubeSongs failed:", title, artist, err);
    return [];
  }
}

/**
 * Searches YouTube for an exact song when no videoId is provided or if initial video is unavailable
 */
async function searchExactYouTubeSong(title: string, artist?: string): Promise<string | null> {
  const cacheKey = `${title.toLowerCase().trim()}::${(artist || "").toLowerCase().trim()}`;
  if (searchToVideoIdCache.has(cacheKey)) {
    return searchToVideoIdCache.get(cacheKey)!;
  }

  const candidates = await searchCandidateYouTubeSongs(title, artist);
  if (candidates.length > 0) {
    searchToVideoIdCache.set(cacheKey, candidates[0]);
    return candidates[0];
  }

  return null;
}

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

  // Known catalog aliases
  if (cleanId === "TheLastRide" || cleanId.toLowerCase() === "thelastride") {
    return "6xoB4ZiKKn0";
  }

  const isLikelySlug = (/^[a-zA-Z]+$/.test(cleanId) && /[a-z][A-Z]/.test(cleanId)) || cleanId === "kabira_yjhd";

  // If cleanId is an authentic 11-char YouTube ID (not a slug)
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanId) && !isLikelySlug) {
    return cleanId;
  }

  // If title or query is provided, search YouTube for the exact song
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
      .replace(/[_\-]+/g, " ")
      .trim();
    const found = await searchExactYouTubeSong(naturalQuery, artist || undefined);
    if (found) return found;
  }

  return cleanId || null;
}

/**
 * Extracts high-fidelity audio format from YouTube using VisionOS / Tv clients
 */
let lastExtractionError = "";

async function extractYouTubeAudioFormat(videoId: string): Promise<CachedFormat | null> {
  for (const clients of DEFAULT_CLIENT_SETS) {
    try {
      const yt = new Ytdl({ clients });
      const info = await yt.getInfo(videoId);
      const audioFormats = info.formats.filter((f) => f.hasAudio && !f.hasVideo && Boolean(f.url));
      if (audioFormats.length === 0) continue;

      // Prefer AAC / MP4 (itag 140) for universal cross-platform browser support, fallback to Opus / WebM
      const mp4Formats = audioFormats.filter((f) => f.mimeType && f.mimeType.includes("mp4"));
      const sortedFormats = (mp4Formats.length > 0 ? mp4Formats : audioFormats).sort(
        (a, b) => (b.bitrate || 0) - (a.bitrate || 0)
      );

      const chosen = sortedFormats[0];
      if (!chosen || !chosen.url) continue;

      let expireMs = NaN;
      try {
        expireMs = Number(new URL(chosen.url).searchParams.get("expire")) * 1000;
      } catch {}

      const expiresAt =
        Number.isFinite(expireMs) && expireMs > 0 ? Math.min(expireMs - 60000, Date.now() + 3600000) : Date.now() + 3600000;

      return {
        url: chosen.url,
        mimeType: chosen.mimeType?.split(";")[0] || "audio/mp4",
        contentLength: chosen.contentLength || undefined,
        expiresAt,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastExtractionError = msg;
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
      return sNorm === targetNorm || sNorm.startsWith(targetNorm) || targetNorm.startsWith(sNorm);
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
      url: dec.replace("_96.mp4", "_320.mp4"),
      mimeType: "audio/mp4",
      expiresAt: Date.now() + 86400000,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
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
  let streamInfo: CachedFormat | null | undefined = formatCache.get(cacheKey);

  if (!streamInfo || streamInfo.expiresAt <= Date.now()) {
    // 1. Collect candidate video IDs in priority order
    const candidateIds: string[] = [];
    const initialVid = await resolveVideoId(rawVideoId, title, artist, query);
    if (initialVid) candidateIds.push(initialVid);

    if (title || query) {
      const searchCandidates = await searchCandidateYouTubeSongs(title || query || "", artist);
      for (const id of searchCandidates) {
        if (!candidateIds.includes(id)) {
          candidateIds.push(id);
        }
      }
    }

    // 2. Primary Engine: Direct YouTube Audio Extraction across candidates
    let successfulVid: string | null = null;
    for (const vid of candidateIds) {
      streamInfo = await extractYouTubeAudioFormat(vid);
      if (streamInfo) {
        successfulVid = vid;
        break;
      }
    }

    // Resolve title and artist if not explicitly passed
    let queryTitle: string | null | undefined = title;
    let queryArtist: string | null | undefined = artist;
    if (!queryTitle && successfulVid) {
      try {
        const yt = await getInnertube();
        const basic = await yt.getBasicInfo(successfulVid);
        queryTitle = basic.basic_info.title;
        queryArtist = queryArtist || basic.basic_info.author;
      } catch {}
    }

    // 3. Secondary fallback: High-fidelity direct 320kbps MP4 audio with byte ranges (zero bot block)
    if (!streamInfo && (queryTitle || title)) {
      streamInfo = await fallbackSaavnMatch((queryTitle || title)!, queryArtist || undefined);
    }

    if (streamInfo) {
      formatCache.set(cacheKey, streamInfo);
      if (successfulVid) formatCache.set(successfulVid, streamInfo);
    }
  }

  if (!streamInfo || !streamInfo.url) {
    return new NextResponse(
      JSON.stringify({
        error: "Direct audio stream could not be extracted",
        details: lastExtractionError,
        track: { id: rawVideoId, title, artist, query },
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 5. Proxy Stream with HTTP Range Header (206 Partial Content)
  const rangeHeader = req.headers.get("range");
  const upstreamHeaders: Record<string, string> = {
    "User-Agent":
      req.headers.get("user-agent") ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  if (rangeHeader) {
    upstreamHeaders["Range"] = rangeHeader;
  }

  try {
    let upstreamRes = await fetch(streamInfo.url, {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(20000),
    });

    // If 404/403 (e.g. expired CDN URL), invalidate cache and retry once
    if (upstreamRes.status === 404 || upstreamRes.status === 403) {
      formatCache.delete(cacheKey);
      if (rawVideoId) formatCache.delete(rawVideoId);

      const targetVid = await resolveVideoId(rawVideoId, title, artist, query);
      if (targetVid) {
        const fresh = await extractYouTubeAudioFormat(targetVid);
        if (fresh && fresh.url) {
          streamInfo = fresh;
          upstreamRes = await fetch(fresh.url, {
            headers: upstreamHeaders,
            signal: AbortSignal.timeout(20000),
          });
        }
      }
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", streamInfo.mimeType || "audio/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "Range, Accept-Ranges, Content-Type");
    responseHeaders.set("Cache-Control", "public, max-age=3600");

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Streaming proxy error for ${rawVideoId || title}:`, err);
    return new NextResponse(`Streaming proxy error: ${message}`, { status: 500 });
  }
}
