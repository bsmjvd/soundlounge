import { NextRequest, NextResponse } from "next/server";
import { Innertube, ClientType } from "youtubei.js";
import { extractYouTubeVideoId, parseYouTubeDuration } from "@/lib/youtubeUtils";
import type { Track } from "@soundlounge/shared";

// Innertube singleton
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
      const yt = await getInnertube();
      const info = await yt.getBasicInfo(directVideoId);
      const title = info.basic_info.title || "YouTube Track";
      const artist = info.basic_info.author || "YouTube";
      const durationMs = parseYouTubeDuration(info.basic_info.duration);

      const singleTrack: Track = {
        id: `yt_${directVideoId}`,
        title,
        artist,
        durationMs: durationMs || 210000,
        url: `/api/stream/youtube?id=${directVideoId}`,
        source: "youtube",
        coverUrl: `https://i.ytimg.com/vi/${directVideoId}/hqdefault.jpg`,
      };

      return NextResponse.json({ tracks: [singleTrack] });
    } catch (err) {
      console.warn("Direct YouTube lookup failed:", err);
    }
  }

  // 2. Perform YouTube Innertube search
  try {
    const yt = await getInnertube();
    const results = await yt.search(query, { type: "video" });

    if (results.videos && results.videos.length > 0) {
      const tracks: Track[] = results.videos.slice(0, 10).map((video: any) => {
        const id = video.id;
        const title = video.title?.text || "YouTube Track";
        const artist = video.author?.name || "YouTube";
        const durationSec = video.duration?.seconds || 0;

        return {
          id: `yt_${id}`,
          title,
          artist,
          durationMs: parseYouTubeDuration(durationSec) || 200000,
          url: `/api/stream/youtube?id=${id}`,
          source: "youtube",
          coverUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        };
      });

      return NextResponse.json({ tracks });
    }
  } catch (err) {
    console.warn("YouTube Innertube search failed, trying fallback:", err);
  }

  // 3. Fallback to iTunes Search API if YouTube was unreachable
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`;
    const res = await fetch(itunesUrl, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const tracks: Track[] = data.results.map((item: any) => ({
          id: `it_${item.trackId}`,
          title: item.trackName || "Track",
          artist: item.artistName || "Unknown Artist",
          durationMs: item.trackTimeMillis || 180000,
          url: item.previewUrl,
          source: "upload",
          coverUrl: item.artworkUrl100?.replace("100x100bb", "300x300bb") || item.artworkUrl100,
        }));
        return NextResponse.json({ tracks });
      }
    }
  } catch (fallbackErr) {
    console.error("All search providers failed:", fallbackErr);
  }

  return NextResponse.json({ tracks: [] });
}
