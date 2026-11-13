import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";
import { isRateLimited } from "@/lib/rateLimit";
import { parseYouTubeDuration } from "@/lib/youtubeUtils";
import { extractCleanTrackInfo, formatViews, parseViewCount } from "@/lib/youtube/artistAttribution";
import { normalizeSongTitle } from "@/lib/recommendation/normalizeTitle";
import { GENRE_DEFINITIONS, type MusicGenre } from "@/lib/recommendation/genreTaxonomy";
import type { Track } from "@soundlounge/shared";

// Innertube singleton for fresh-release lookups
let innertubePromise: Promise<Innertube> | null = null;
async function getNewReleasesInnertube(): Promise<Innertube> {
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

// Freshly released songs for a genre, filtered to the last month of uploads.
// The client removes anything already in the listener's history before showing these.
export async function GET(req: NextRequest) {
  if (await isRateLimited(req, "search", 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const { searchParams } = new URL(req.url);
  const genreParam = (searchParams.get("genre") || "").trim() as MusicGenre;
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));

  const genreDef = GENRE_DEFINITIONS[genreParam];
  if (!genreDef || genreParam === "other") {
    return NextResponse.json({ tracks: [], totalTracks: 0 });
  }

  try {
    const yt = await getNewReleasesInnertube();
    const label = genreDef.label.toLowerCase();
    const year = new Date().getFullYear();

    const [freshVideoSearch, musicSongSearch] = await Promise.allSettled([
      // upload_date=month narrows YouTube's index to genuine recent uploads
      yt.search(`new ${label} ${year}`, { type: "video", upload_date: "month" }),
      yt.music.search(`new ${genreParam} songs ${year}`, { type: "song" }),
    ]);

    const tracks: Track[] = [];
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();

    const pushTrack = (track: Track) => {
      if (seenIds.has(track.id)) return;
      const dedupeKey = normalizeSongTitle(track.title, track.artist);
      if (!dedupeKey || seenTitles.has(dedupeKey)) return;
      seenIds.add(track.id);
      seenTitles.add(dedupeKey);
      tracks.push(track);
    };

    if (freshVideoSearch.status === "fulfilled" && freshVideoSearch.value.videos) {
      for (const video of freshVideoSearch.value.videos as Array<{
        id?: string;
        duration?: { seconds?: number };
        title?: { text?: string };
        author?: { name?: string };
        view_count?: { text?: string };
        short_view_count?: { text?: string };
      }>) {
        if (!video || !video.id) continue;
        const id = String(video.id);
        const durSec = video.duration?.seconds || 0;
        if (durSec < 50 || durSec > 720) continue;

        const rawTitle = video.title?.text || "Unknown Song";
        const rawArtist = video.author?.name || "YouTube Artist";
        const { title, artist } = extractCleanTrackInfo(rawTitle, rawArtist, `${genreParam} new songs`);
        const views = parseViewCount(video.view_count?.text, video.short_view_count?.text);

        pushTrack({
          id: `yt_${id}`,
          title,
          artist,
          durationMs: (durSec || 210) * 1000,
          url: `/api/stream/youtube?id=${id}`,
          source: "youtube",
          coverUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          views,
          viewsFormatted: formatViews(views),
        });
      }
    }

    if (musicSongSearch.status === "fulfilled" && musicSongSearch.value.songs?.contents) {
      for (const song of musicSongSearch.value.songs.contents as Array<{
        id?: string;
        title?: string;
        artists?: Array<{ name?: string }>;
        author?: string;
        duration?: { seconds?: number; text?: string };
        thumbnail?: Array<{ url?: string }>;
        thumbnails?: Array<{ url?: string }>;
      }>) {
        if (!song || !song.id) continue;
        const id = String(song.id);

        const rawTitle = song.title || "Song";
        const rawArtist =
          Array.isArray(song.artists) && song.artists.length > 0
            ? song.artists
                .map((a: { name?: string }) => a.name)
                .filter(Boolean)
                .join(", ")
            : song.author || "Unknown Artist";
        const { title, artist } = extractCleanTrackInfo(rawTitle, rawArtist, `${genreParam} new songs`);

        const durSec =
          song.duration?.seconds ||
          (parseYouTubeDuration(song.duration?.text) ? parseYouTubeDuration(song.duration?.text)! / 1000 : 0);
        if (durSec < 50 || durSec > 720) continue;

        const rawCover =
          song.thumbnail?.[0]?.url || song.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        const coverUrl = rawCover.includes("googleusercontent.com")
          ? rawCover.replace(/=w\d+-h\d+[^"]*/, "=w800-h800-l90-rj")
          : rawCover;

        pushTrack({
          id: `yt_${id}`,
          title,
          artist,
          durationMs: Math.round(durSec * 1000),
          url: `/api/stream/youtube?id=${id}`,
          source: "youtube",
          coverUrl,
          views: 5_000_000,
          viewsFormatted: "New",
        });
      }
    }

    return NextResponse.json({ tracks: tracks.slice(0, limit), totalTracks: tracks.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("New releases API error:", err);
    return NextResponse.json({ tracks: [], totalTracks: 0, error: message });
  }
}
