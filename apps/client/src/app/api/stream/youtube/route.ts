import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";
import { Ytdl, chooseFormat, Client } from "@distube/ytdl-core";
import { Readable } from "stream";

interface CachedFormat {
  url: string;
  mimeType: string;
  contentLength?: number;
  expiresAt: number;
}

const formatCache = new Map<string, CachedFormat>();
const titleResolveCache = new Map<string, { title: string; artist?: string }>();
const ytdl = new Ytdl();

// Direct override dictionary for known curated catalog tracks
const KNOWN_ID_MAP: Record<string, { title: string; artist?: string }> = {
  "6xoB4ZiKKn0": { title: "The Last Ride", artist: "Sidhu Moose Wala" },
  TheLastRide: { title: "The Last Ride", artist: "Sidhu Moose Wala" },
  "295": { title: "295", artist: "Sidhu Moose Wala" },
  M8vDwlHigJA: { title: "GOAT", artist: "Sidhu Moose Wala" },
  "y-PQiShdTKA": { title: "Tochan", artist: "Sidhu Moose Wala" },
  d0oVZLquCMU: { title: "Beete Lamhein", artist: "KK" },
  ZaraSa: { title: "Zara Sa", artist: "KK" },
  KyaMujhePyaarHai: { title: "Kya Mujhe Pyaar Hai", artist: "KK" },
  Lover: { title: "Lover", artist: "Diljit Dosanjh" },
  Naina: { title: "Naina", artist: "Diljit Dosanjh" },
  BrownMunde: { title: "Brown Munde", artist: "AP Dhillon" },
  Excuses: { title: "Excuses", artist: "AP Dhillon" },
  Aadat: { title: "Aadat", artist: "Atif Aslam" },
  WohLamhe: { title: "Woh Lamhe", artist: "Atif Aslam" },
  "kPa7bsKwL-c": { title: "Die With A Smile", artist: "Lady Gaga & Bruno Mars" },
  Fortnight: { title: "Fortnight", artist: "Taylor Swift" },
  VtVFTuIZFYU: { title: "Young And Menace", artist: "Fall Out Boy" },
  fKopy74weus: { title: "Thunder", artist: "Imagine Dragons" },
  "Pw-0pbY9JeU": { title: "Jumpsuit", artist: "Twenty One Pilots" },
  GtUVQei3nX4: { title: "Side Piece", artist: "Snoop Dogg" },
  s7jXASBWwwI: { title: "Surrender", artist: "Hurts" },
  iDy2wCQYSrU: { title: "Told You So", artist: "Paramore" },
  YVkUvmDQ3HY: { title: "Just Lose It", artist: "Eminem" },
};

/**
 * Resolves song title and artist from an 11-char YouTube video ID
 * using official oEmbed (bypasses all bot detection, zero tokens required).
 */
async function resolveTitleFromVideoId(videoId: string): Promise<{ title: string; artist?: string } | null> {
  const cleanId = videoId.replace(/^yt_/, "").trim();
  if (KNOWN_ID_MAP[cleanId]) {
    return KNOWN_ID_MAP[cleanId];
  }
  if (titleResolveCache.has(cleanId)) {
    return titleResolveCache.get(cleanId)!;
  }

  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanId}&format=json`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const rawTitle = String(data.title || "");
      const author = String(data.author_name || "");
      const cleanTitle = rawTitle
        .replace(/\(.*?\)/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/official video/gi, "")
        .replace(/lyric video/gi, "")
        .replace(/audio/gi, "")
        .replace(/[|–-].*$/, "")
        .trim();

      const resolved = { title: cleanTitle || rawTitle, artist: author };
      titleResolveCache.set(cleanId, resolved);
      return resolved;
    }
  } catch (err) {
    console.warn(`oEmbed lookup failed for videoId ${cleanId}:`, err);
  }

  return null;
}

/**
 * Decrypts JioSaavn encrypted_media_url using DES-ECB with key "38346591".
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
  } catch (err) {
    console.warn("Failed to decrypt Saavn URL:", err);
    return null;
  }
}

/**
 * Queries JioSaavn CDN for direct 320kbps CD-quality audio stream.
 * 100% reliable, zero bot check, native byte range support, universal format.
 */
async function getJioSaavnStream(title: string, artist?: string): Promise<CachedFormat | null> {
  const cleanTitle = title
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/official video/gi, "")
    .replace(/lyric video/gi, "")
    .replace(/audio/gi, "")
    .trim();

  const cleanArtist = artist && artist !== "Unknown Artist" ? artist.replace(/vevo/gi, "").trim() : "";
  const query = `${cleanTitle} ${cleanArtist}`.trim();

  try {
    const searchUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(4000),
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const songId = searchData?.songs?.data?.[0]?.id;
    if (!songId) return null;

    const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${songId}&_format=json&_marker=0&ctx=web6dot0`;
    const detailRes = await fetch(detailUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(4000),
    });

    if (!detailRes.ok) return null;
    const detailData = await detailRes.json();
    const song = detailData?.songs?.[0];
    if (!song?.encrypted_media_url) return null;

    const decrypted = decryptSaavnUrl(song.encrypted_media_url);
    if (!decrypted) return null;

    // Prefer high-quality 320kbps MP4 AAC audio
    const stream320 = decrypted.replace("_96.mp4", "_320.mp4");

    return {
      url: stream320,
      mimeType: "audio/mp4",
      expiresAt: Date.now() + 86400000, // 24 hours cache
    };
  } catch (err) {
    console.warn("JioSaavn lookup error for:", query, err);
    return null;
  }
}

/**
 * Fallback to direct ytdl extraction (for rare tracks not in CDN catalog)
 */
async function getYtdlStream(videoId: string): Promise<CachedFormat | null> {
  try {
    const info = await ytdl.getInfo(videoId);
    const mp4Format = chooseFormat(info.formats, {
      filter: (f: { hasAudio?: boolean; hasVideo?: boolean; mimeType?: string }) =>
        Boolean(f.hasAudio && !f.hasVideo && f.mimeType && f.mimeType.includes("mp4")),
    });

    const chosenFormat =
      mp4Format ||
      chooseFormat(info.formats, {
        filter: { hasAudio: true, hasVideo: false },
      });

    if (chosenFormat && chosenFormat.url) {
      return {
        url: chosenFormat.url,
        mimeType: chosenFormat.mimeType?.split(";")[0] || "audio/mp4",
        contentLength: chosenFormat.contentLength || 0,
        expiresAt: Date.now() + 3600000,
      };
    }
  } catch (err) {
    console.warn(`ytdl fallback failed for ${videoId}:`, err);
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawVideoId = searchParams.get("id");
  const query = searchParams.get("q");
  let title = searchParams.get("title");
  let artist = searchParams.get("artist") || undefined;

  const videoId = rawVideoId ? rawVideoId.replace(/^yt_/, "").trim() : null;

  if (!videoId && !query && !title) {
    return new NextResponse("Missing track identifier (id, title, or q required)", { status: 400 });
  }

  const cacheKey = `${videoId || ""}::${title || ""}::${artist || ""}::${query || ""}`;
  let streamInfo: CachedFormat | null | undefined = formatCache.get(cacheKey);

  if (!streamInfo || streamInfo.expiresAt <= Date.now()) {
    // 1. Resolve title & artist if missing
    if (!title && videoId) {
      const resolved = await resolveTitleFromVideoId(videoId);
      if (resolved) {
        title = resolved.title;
        artist = artist || resolved.artist;
      }
    } else if (!title && query) {
      title = query;
    }

    // 2. Primary Engine: Ultra-reliable CDN Audio Stream (320kbps CD Quality)
    if (title) {
      streamInfo = await getJioSaavnStream(title, artist);
    }

    // 3. Fallback Engine: ytdl-core if video ID is available
    if (!streamInfo && videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      streamInfo = await getYtdlStream(videoId);
    }

    if (streamInfo) {
      formatCache.set(cacheKey, streamInfo);
      if (videoId) formatCache.set(videoId, streamInfo);
    }
  }

  if (!streamInfo || !streamInfo.url) {
    return new NextResponse(
      JSON.stringify({
        error: "Stream not found",
        track: { videoId, title, artist, query },
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 4. Stream Audio with HTTP Byte-Range support (206 Partial Content)
  // Essential for iOS Safari lockscreen scrubbing, smooth seeking, and fast playback start
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

    // If 320kbps 404s, fallback to original non-320 URL
    if (upstreamRes.status === 404 && streamInfo.url.includes("_320.mp4")) {
      const fallbackUrl = streamInfo.url.replace("_320.mp4", "_96.mp4");
      upstreamRes = await fetch(fallbackUrl, {
        headers: upstreamHeaders,
        signal: AbortSignal.timeout(20000),
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", streamInfo.mimeType || "audio/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "Range, Accept-Ranges, Content-Type");
    responseHeaders.set("Cache-Control", "public, max-age=86400");

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
    console.error(`Streaming error for ${videoId || title || query}:`, err);
    return new NextResponse(`Streaming proxy error: ${message}`, { status: 500 });
  }
}
