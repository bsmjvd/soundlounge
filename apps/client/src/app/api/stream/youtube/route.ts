import { NextRequest, NextResponse } from "next/server";
import { Ytdl, chooseFormat } from "@distube/ytdl-core";
import { Innertube } from "youtubei.js";

interface CachedFormat {
  url: string;
  mimeType: string;
  contentLength: number;
  expiresAt: number;
}

const formatCache = new Map<string, CachedFormat>();
const searchToVideoIdCache = new Map<string, string>();
const ytdl = new Ytdl();

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
 * Searches YouTube for the exact official song matching title and artist,
 * filtering out 2-hour compilations, full concerts, and non-music videos.
 */
async function searchExactSong(title: string, artist?: string): Promise<string | null> {
  const cacheKey = `${title.toLowerCase().trim()}::${(artist || "").toLowerCase().trim()}`;
  if (searchToVideoIdCache.has(cacheKey)) {
    return searchToVideoIdCache.get(cacheKey)!;
  }

  try {
    const yt = await getInnertube();
    const cleanTitle = title
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .trim();
    const cleanArtist = artist && artist !== "Unknown Artist" ? artist : "";
    const query = `${cleanTitle} ${cleanArtist} audio`.trim();

    const search = await yt.search(query);
    const videos = (search.videos as Array<{ duration?: { seconds?: number }; id?: string }>) || [];

    // Filter for proper song duration: between 50s and 12 mins (720s)
    const validSongVideos = videos.filter((v) => {
      const durSec = v.duration?.seconds || 0;
      return durSec >= 50 && durSec <= 720;
    });

    const chosen = validSongVideos[0] || videos[0];
    if (chosen && chosen.id) {
      const vid = String(chosen.id);
      searchToVideoIdCache.set(cacheKey, vid);
      return vid;
    }
  } catch (err) {
    console.warn("Failed exact song search:", title, artist, err);
  }

  return null;
}

/**
 * Resolves a request into a valid 11-char YouTube video ID.
 */
async function resolveToValidVideoId(
  idInput?: string | null,
  title?: string | null,
  artist?: string | null,
  q?: string | null
): Promise<string> {
  // If title or query is provided, search YouTube directly for the exact song!
  if (title && title.trim()) {
    const foundId = await searchExactSong(title.trim(), artist || undefined);
    if (foundId) return foundId;
  }

  if (q && q.trim()) {
    const foundId = await searchExactSong(q.trim());
    if (foundId) return foundId;
  }

  const cleanId = (idInput || "").replace(/^yt_/, "").trim();

  // If cleanId is already an 11-char YouTube ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
    return cleanId;
  }

  // Turn slugs like "TumItnaJo" into a natural search query
  if (cleanId) {
    const naturalQuery = cleanId
      .replace(/([A-Z])/g, " $1")
      .replace(/[_\-]+/g, " ")
      .trim();
    const foundId = await searchExactSong(naturalQuery, artist || undefined);
    if (foundId) return foundId;
  }

  return cleanId || "dQw4w9WgXcQ";
}

async function getAudioStreamUrl(
  idInput?: string | null,
  title?: string | null,
  artist?: string | null,
  q?: string | null
): Promise<CachedFormat> {
  const cacheKey = `${idInput || ""}::${title || ""}::${artist || ""}::${q || ""}`;
  const cached = formatCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  let videoId = await resolveToValidVideoId(idInput, title, artist, q);

  let info: Awaited<ReturnType<typeof ytdl.getInfo>>;
  try {
    info = await ytdl.getInfo(videoId);

    // Sanity check duration: If video is over 15 mins (900s) and title is available, re-search for the single track!
    const durSec = Number(info.videoDetails?.lengthSeconds) || 0;
    if (durSec > 900 && title) {
      console.warn(`Video ${videoId} is too long (${durSec}s), searching for single song...`);
      const altId = await searchExactSong(title, artist || undefined);
      if (altId && altId !== videoId) {
        videoId = altId;
        info = await ytdl.getInfo(videoId);
      }
    }
  } catch (initialErr) {
    console.warn(`ytdl failed for ${videoId}, searching fallback:`, initialErr);
    const fallbackQuery = title || q || idInput || "";
    const altId = await searchExactSong(fallbackQuery, artist || undefined);
    if (altId && altId !== videoId) {
      videoId = altId;
      info = await ytdl.getInfo(videoId);
    } else {
      throw initialErr;
    }
  }

  // Prefer audio/mp4 (AAC) for universal browser support, fallback to audio/webm (Opus)
  const mp4Format = chooseFormat(info.formats, {
    filter: (f: { hasAudio?: boolean; hasVideo?: boolean; mimeType?: string }) =>
      Boolean(f.hasAudio && !f.hasVideo && f.mimeType && f.mimeType.includes("mp4")),
  });

  const chosenFormat =
    mp4Format ||
    chooseFormat(info.formats, {
      filter: { hasAudio: true, hasVideo: false },
    });

  if (!chosenFormat || !chosenFormat.url) {
    throw new Error(`No direct audio stream found for video ${videoId}`);
  }

  let expireMs = NaN;
  try {
    expireMs = Number(new URL(chosenFormat.url).searchParams.get("expire")) * 1000;
  } catch {}

  const expiresAt =
    Number.isFinite(expireMs) && expireMs > 0 ? Math.min(expireMs - 60000, Date.now() + 3600000) : Date.now() + 3600000;

  const result: CachedFormat = {
    url: chosenFormat.url,
    mimeType: chosenFormat.mimeType?.split(";")[0] || "audio/mp4",
    contentLength: chosenFormat.contentLength || 0,
    expiresAt,
  };

  formatCache.set(cacheKey, result);
  formatCache.set(videoId, result);
  return result;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("id");
  const query = searchParams.get("q");
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");

  if (!videoId && !query && !title) {
    return new NextResponse("Missing track identifier (id, title, or q required)", { status: 400 });
  }

  try {
    const streamInfo = await getAudioStreamUrl(videoId, title, artist, query);
    const rangeHeader = req.headers.get("range");

    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    if (rangeHeader) {
      upstreamHeaders["Range"] = rangeHeader;
    }

    const upstreamRes = await fetch(streamInfo.url, {
      headers: upstreamHeaders,
    });

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", streamInfo.mimeType);
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "public, max-age=3600");

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    const contentLength =
      upstreamRes.headers.get("content-length") || (streamInfo.contentLength ? String(streamInfo.contentLength) : null);
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
    return new NextResponse(`Streaming error: ${message}`, { status: 500 });
  }
}
