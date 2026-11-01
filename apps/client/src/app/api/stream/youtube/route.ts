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
 * Resolves a given query or synthetic slug to an authentic YouTube video ID.
 */
async function resolveToValidVideoId(input: string): Promise<string> {
  const cleanId = input.replace(/^yt_/, "").trim();
  // Valid 11-char YouTube ID check
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
    return cleanId;
  }

  // Turn slugs like "TumItnaJo" or "WoAjnabee_TheTrain" into natural search query
  const searchQuery = cleanId
    .replace(/([A-Z])/g, " $1")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  try {
    const yt = await getInnertube();
    const search = await yt.search(searchQuery);
    const first = search.videos?.[0] as any;
    if (first && first.id) {
      return String(first.id);
    }
  } catch (err) {
    console.warn("Failed to resolve fallback video query:", searchQuery, err);
  }

  return cleanId;
}

async function getAudioStreamUrl(videoIdInput: string): Promise<CachedFormat> {
  const cached = formatCache.get(videoIdInput);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  let videoId = await resolveToValidVideoId(videoIdInput);

  let info: any;
  try {
    info = await ytdl.getInfo(videoId);
  } catch (initialErr) {
    // If ytdl failed on videoId (e.g. video was unavailable or region-locked), search alternative
    console.warn(`ytdl failed for ${videoId}, searching fallback:`, initialErr);
    try {
      const yt = await getInnertube();
      const searchQuery = videoIdInput
        .replace(/^yt_/, "")
        .replace(/([A-Z])/g, " $1")
        .replace(/[_\-]+/g, " ")
        .trim();
      const search = await yt.search(searchQuery);
      const altVideo = (search.videos as any[])?.find((v) => v && v.id && v.id !== videoId);
      if (altVideo && altVideo.id) {
        videoId = String(altVideo.id);
        info = await ytdl.getInfo(videoId);
      } else {
        throw initialErr;
      }
    } catch {
      throw initialErr;
    }
  }

  // Prefer audio/mp4 (AAC) for universal browser support, fallback to audio/webm (Opus)
  const mp4Format = chooseFormat(info.formats, {
    filter: (f) => Boolean(f.hasAudio && !f.hasVideo && f.mimeType && f.mimeType.includes("mp4")),
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
    Number.isFinite(expireMs) && expireMs > 0
      ? Math.min(expireMs - 60000, Date.now() + 3600000)
      : Date.now() + 3600000;

  const result: CachedFormat = {
    url: chosenFormat.url,
    mimeType: chosenFormat.mimeType?.split(";")[0] || "audio/mp4",
    contentLength: chosenFormat.contentLength || 0,
    expiresAt,
  };

  formatCache.set(videoIdInput, result);
  formatCache.set(videoId, result);
  return result;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("id");

  if (!videoId) {
    return new NextResponse("Missing video id", { status: 400 });
  }

  try {
    const streamInfo = await getAudioStreamUrl(videoId);
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
      upstreamRes.headers.get("content-length") ||
      (streamInfo.contentLength ? String(streamInfo.contentLength) : null);
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`Streaming error for video ${videoId}:`, err);
    return new NextResponse(`Streaming error: ${err.message}`, { status: 500 });
  }
}
