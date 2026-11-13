import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";
import { isRateLimited } from "@/lib/rateLimit";
import { parseYouTubeDuration } from "@/lib/youtubeUtils";
import {
  extractCleanTrackInfo,
  formatViews,
  isTrackByArtist,
  parseViewCount,
} from "@/lib/youtube/artistAttribution";
import { normalizeSongTitle } from "@/lib/recommendation/normalizeTitle";
import type { Track } from "@soundlounge/shared";

// Innertube singleton for artist discography lookups
let innertubePromise: Promise<Innertube> | null = null;
async function getArtistInnertube(): Promise<Innertube> {
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

// Full discography for one artist, resolved live from YouTube Music + video search
// and merged/deduped. Powers the artist page "All Songs" list.
export async function GET(req: NextRequest) {
  if (await isRateLimited(req, "search", 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist")?.trim();
  const limit = Math.min(60, Math.max(1, parseInt(searchParams.get("limit") || "40", 10)));

  if (!artist || artist.length < 2) {
    return NextResponse.json({ tracks: [], totalTracks: 0 });
  }

  try {
    const yt = await getArtistInnertube();

    const [videoSearch, songSearch] = await Promise.allSettled([
      yt.search(`${artist} songs`, { type: "video" }),
      yt.music.search(artist, { type: "song" }),
    ]);

    const tracks: Track[] = [];
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();

    const pushTrack = (track: Track) => {
      if (seenIds.has(track.id)) return;
      const normTitle = normalizeSongTitle(track.title);
      // Different uploads of the same song (live, remix, audio) collapse into one entry
      const dedupeKey = `${normTitle}::${track.artist.toLowerCase()}`;
      if (seenTitles.has(dedupeKey)) return;
      seenIds.add(track.id);
      seenTitles.add(dedupeKey);
      tracks.push(track);
    };

    if (videoSearch.status === "fulfilled" && videoSearch.value.videos) {
      for (const video of videoSearch.value.videos as Array<{
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
        const { title, artist: attributed } = extractCleanTrackInfo(rawTitle, rawArtist, artist);
        if (!isTrackByArtist(attributed, title, artist)) continue;
        // A song can match through its title while the dictionary attributes the
        // uploader's alias (e.g. a "KK" channel uploading a Karan Aujla song).
        // The requested artist is the truth for this listing.
        const displayArtist = isTrackByArtist(attributed, "", artist) ? attributed : artist;

        const views = parseViewCount(video.view_count?.text, video.short_view_count?.text);
        pushTrack({
          id: `yt_${id}`,
          title,
          artist: displayArtist,
          durationMs: (durSec || 210) * 1000,
          url: `/api/stream/youtube?id=${id}`,
          source: "youtube",
          coverUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          views,
          viewsFormatted: formatViews(views),
        });
      }
    }

    if (songSearch.status === "fulfilled" && songSearch.value.songs?.contents) {
      for (const song of songSearch.value.songs.contents as Array<{
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
        const { title, artist: attributed } = extractCleanTrackInfo(rawTitle, rawArtist, artist);
        if (!isTrackByArtist(attributed, title, artist)) continue;
        const displayArtist = isTrackByArtist(attributed, "", artist) ? attributed : artist;

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
          artist: displayArtist,
          durationMs: Math.round(durSec * 1000),
          url: `/api/stream/youtube?id=${id}`,
          source: "youtube",
          coverUrl,
          views: 5_000_000,
          viewsFormatted: "Official",
        });
      }
    }

    // Most popular first
    tracks.sort((a, b) => (b.views || 0) - (a.views || 0));

    return NextResponse.json({ tracks: tracks.slice(0, limit), totalTracks: tracks.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Artist tracks API error:", err);
    return NextResponse.json({ tracks: [], totalTracks: 0, error: message });
  }
}
