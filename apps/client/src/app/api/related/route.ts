import { NextRequest, NextResponse } from "next/server";
import { Innertube, YTNodes } from "youtubei.js";
import { isRateLimited } from "@/lib/rateLimit";
import type { Track } from "@soundlounge/shared";

// Innertube singleton for YouTube Music related tracks
let innertubePromise: Promise<Innertube> | null = null;
async function getMusicInnertube(): Promise<Innertube> {
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

function cleanRelatedTitle(rawTitle: string, artist: string): string {
  let s = (rawTitle || "").split(/\s*[|•]\s*/)[0];

  s = s
    .replace(/\s*[-–—]\s*(lyrical|official|video|audio|full song|song).*/i, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .trim();

  if (artist && artist !== "Various Artists" && artist !== "Unknown Artist") {
    const artistRegex = new RegExp(`\\s*[-–—:]?\\s*${artist.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
    s = s.replace(artistRegex, "").trim();
  }

  return s || rawTitle;
}

export async function GET(req: NextRequest) {
  if (await isRateLimited(req, "related", 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId")?.trim() || "";
  const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

  if (!videoId || !/^[\w-]{5,20}$/.test(videoId)) {
    return NextResponse.json({ tracks: [], error: "A valid videoId is required" }, { status: 400 });
  }

  try {
    const yt = await getMusicInnertube();
    const upNext = await yt.music.getUpNext(videoId, true);

    const tracks: Track[] = [];
    const seenIds = new Set<string>([videoId]);

    for (const item of upNext.contents || []) {
      if (!item.is(YTNodes.PlaylistPanelVideo)) continue;

      const video = item.as(YTNodes.PlaylistPanelVideo);
      const id = video.video_id ? String(video.video_id) : "";
      if (!id || seenIds.has(id)) continue;

      const durSec = video.duration?.seconds || 0;
      if (durSec < 50 || durSec > 720) continue;

      const artist =
        Array.isArray(video.artists) && video.artists.length > 0
          ? video.artists.map((a) => a.name).filter(Boolean).join(", ")
          : video.author || "Unknown Artist";

      const title = cleanRelatedTitle(video.title?.text || "Unknown Song", artist);
      const thumbnails = video.thumbnail || [];
      const coverUrl = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      seenIds.add(id);
      tracks.push({
        id: `yt_${id}`,
        title,
        artist,
        durationMs: Math.round((durSec || 210) * 1000),
        url: `/api/stream/youtube?id=${id}`,
        source: "youtube",
        coverUrl,
      });

      if (tracks.length >= limit) break;
    }

    return NextResponse.json({ tracks, totalTracks: tracks.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Related tracks API error:", err);
    return NextResponse.json({ tracks: [], totalTracks: 0, error: message });
  }
}
