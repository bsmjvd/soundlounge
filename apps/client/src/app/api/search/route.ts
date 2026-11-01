import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";
import {
  extractYouTubeVideoId,
  parseYouTubeDuration,
  isLikelySong,
} from "@/lib/youtubeUtils";
import type { Track } from "@soundlounge/shared";

// Innertube singleton for search
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

  // 1. Direct YouTube link or video ID
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

  const yt = await getSearchInnertube();

  // 2. Search YouTube Music catalog specifically for songs (no movies, trailers, or full films)
  try {
    const musicResults = await yt.music.search(query, { type: "song" });
    const songs = musicResults.songs?.contents || [];

    if (songs.length > 0) {
      const tracks: Track[] = songs.slice(0, 20).map((song: any) => {
        const id = song.id;
        const title = song.title || "Song";
        const artist =
          Array.isArray(song.artists) && song.artists.length > 0
            ? song.artists
                .map((a: any) => a.name)
                .filter(Boolean)
                .join(", ")
            : song.author || "Unknown Artist";

        const durationMs =
          parseYouTubeDuration(song.duration?.seconds) ||
          parseYouTubeDuration(song.duration?.text) ||
          210000;

        const rawCover =
          song.thumbnail?.[0]?.url ||
          song.thumbnails?.[0]?.url ||
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

        const coverUrl = rawCover.includes("googleusercontent.com")
          ? rawCover.replace(/=w\d+-h\d+[^"]*/, "=w800-h800-l90-rj")
          : rawCover;

        return {
          id: `yt_${id}`,
          title,
          artist,
          durationMs,
          url: `/api/stream/youtube?id=${id}`,
          source: "youtube",
          coverUrl,
        };
      });

      return NextResponse.json({ tracks });
    }
  } catch (musicErr) {
    console.warn("YouTube Music search returned no direct songs, trying filtered search:", musicErr);
  }

  // 3. Fallback: general YouTube search with strict music filtering (strips movies, full films, trailers)
  try {
    const results = await yt.search(query, { type: "video" });
    if (results.videos && results.videos.length > 0) {
      const musicOnlyVideos = results.videos.filter((video: any) => {
        const title = video.title?.text || "";
        const durationSec = video.duration?.seconds || 0;
        return isLikelySong(title, durationSec);
      });

      const tracks: Track[] = musicOnlyVideos.slice(0, 15).map((video: any) => {
        const id = video.id;
        const title = video.title?.text || "Song";
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
    console.error("YouTube search error:", err);
  }

  return NextResponse.json({ tracks: [] });
}
