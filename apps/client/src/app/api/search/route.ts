import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";
import { extractYouTubeVideoId, parseYouTubeDuration } from "@/lib/youtubeUtils";
import type { Track } from "@soundlounge/shared";

// Innertube singleton for search (using default desktop client so SearchHeader parses cleanly)
let innertubePromise: Promise<Innertube> | null = null;
async function getSearchInnertube(): Promise<Innertube> {
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ tracks: [] });
  }

  // 1. Check if user pasted a direct YouTube link or video ID
  const directVideoId = extractYouTubeVideoId(query);
  if (directVideoId) {
    try {
      const yt = await getSearchInnertube();
      const info = await yt.getBasicInfo(directVideoId);
      const title = info.basic_info.title || "YouTube Track";
      const artist = info.basic_info.author || "YouTube";
      const durationMs = parseYouTubeDuration(info.basic_info.duration);

      const singleTrack: Track = {
        id: `yt_${directVideoId}`,
        title,
        artist,
        durationMs: durationMs || 240000,
        url: `/api/stream/youtube?id=${directVideoId}`,
        source: "youtube",
        coverUrl: `https://i.ytimg.com/vi/${directVideoId}/hqdefault.jpg`,
      };

      return NextResponse.json({ tracks: [singleTrack] });
    } catch (err) {
      console.warn("Direct YouTube lookup error:", err);
    }
  }

  // 2. Perform YouTube Innertube search
  try {
    const yt = await getSearchInnertube();
    const results = await yt.search(query, { type: "video" });

    if (results.videos && results.videos.length > 0) {
      const tracks: Track[] = results.videos.slice(0, 15).map((video: any) => {
        const id = video.id;
        const title = video.title?.text || "YouTube Track";
        const artist = video.author?.name || "YouTube";
        const durationSec = video.duration?.seconds || 0;

        return {
          id: `yt_${id}`,
          title,
          artist,
          durationMs: parseYouTubeDuration(durationSec) || 210000,
          url: `/api/stream/youtube?id=${id}`,
          source: "youtube",
          coverUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        };
      });

      return NextResponse.json({ tracks });
    }
  } catch (err) {
    console.error("YouTube Innertube search failed:", err);
  }

  return NextResponse.json({ tracks: [] });
}
