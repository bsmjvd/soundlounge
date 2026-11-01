import { NextRequest, NextResponse } from "next/server";
import { Ytdl, chooseFormat } from "@distube/ytdl-core";

interface CachedFormat {
  url: string;
  mimeType: string;
  contentLength: number;
  expiresAt: number;
}

const formatCache = new Map<string, CachedFormat>();
const ytdl = new Ytdl();

async function getAudioStreamUrl(videoId: string): Promise<CachedFormat> {
  const cached = formatCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const info = await ytdl.getInfo(videoId);

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
