import { NextRequest, NextResponse } from "next/server";
import { Innertube, ClientType } from "youtubei.js";

interface CachedStream {
  url: string;
  mimeType: string;
  contentLength: number;
  expiresAt: number;
}

const streamCache = new Map<string, CachedStream>();

let innertubePromise: Promise<Innertube> | null = null;
async function getInnertube(): Promise<Innertube> {
  if (!innertubePromise) {
    innertubePromise = Innertube.create({
      client_type: ClientType.IOS,
      retrieve_player: false,
      generate_session_locally: true,
    }).catch((err) => {
      innertubePromise = null;
      throw err;
    });
  }
  return innertubePromise;
}

async function resolveDirectAudioUrl(videoId: string): Promise<CachedStream> {
  const cached = streamCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const yt = await getInnertube();
  const info = await yt.getBasicInfo(videoId);

  const audioFormats = (info.streaming_data?.adaptive_formats || []).filter(
    (f) => f.has_audio && !f.has_video && f.is_original !== false
  );

  const m4aFormats = audioFormats
    .filter((f) => f.mime_type?.startsWith("audio/mp4"))
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

  const chosenFormat = m4aFormats[0] || audioFormats[0];

  if (!chosenFormat) {
    throw new Error(`No suitable audio format found for YouTube video ${videoId}`);
  }

  let streamUrl = chosenFormat.url;
  if (!streamUrl && (chosenFormat.signature_cipher || chosenFormat.cipher)) {
    streamUrl = await chosenFormat.decipher(info.actions.session.player);
  }

  if (!streamUrl) {
    throw new Error(`Unable to decipher stream URL for YouTube video ${videoId}`);
  }

  let expireMs = NaN;
  try {
    expireMs = Number(new URL(streamUrl).searchParams.get("expire")) * 1000;
  } catch {}

  const expiresAt =
    Number.isFinite(expireMs) && expireMs > 0
      ? Math.min(expireMs - 60000, Date.now() + 3600000)
      : Date.now() + 3600000;

  const result: CachedStream = {
    url: streamUrl,
    mimeType: chosenFormat.mime_type?.split(";")[0] || "audio/mp4",
    contentLength: chosenFormat.content_length || 0,
    expiresAt,
  };

  streamCache.set(videoId, result);
  return result;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("id");

  if (!videoId) {
    return new NextResponse("Missing video id", { status: 400 });
  }

  try {
    const streamInfo = await resolveDirectAudioUrl(videoId);
    const rangeHeader = req.headers.get("range");

    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      Referer: "https://www.youtube.com/",
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

    const contentLength = upstreamRes.headers.get("content-length");
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
