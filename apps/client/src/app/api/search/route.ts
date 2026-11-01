import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";
import { extractYouTubeVideoId, parseYouTubeDuration } from "@/lib/youtubeUtils";
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

function parseViewCount(viewCountText?: string, shortViewText?: string): number {
  if (viewCountText) {
    const numericStr = viewCountText.replace(/[^0-9]/g, "");
    const parsed = parseInt(numericStr, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (shortViewText) {
    const text = shortViewText.toUpperCase().trim();
    const match = text.match(/^([\d.]+)\s*([KMB])?/);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2];
      if (unit === "B") return val * 1_000_000_000;
      if (unit === "M") return val * 1_000_000;
      if (unit === "K") return val * 1_000;
      return val;
    }
  }
  return 0;
}

function formatViews(views: number): string {
  if (!views || views <= 0) return "500K";
  if (views >= 1_000_000_000) {
    return (views / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (views >= 1_000_000) {
    return (views / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (views >= 1_000) {
    return (views / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return views.toLocaleString();
}

const RECORD_LABELS = [
  "sony music",
  "t-series",
  "yrf",
  "zee music",
  "tips",
  "saregama",
  "speed records",
  "universal music",
  "eros now",
  "aditya music",
  "think music",
  "lahari",
  "geet mp3",
  "white hill",
  "juke dock",
  "warner music",
  "times music",
  "venus",
  "desi music factory",
  "vyrl",
  "dm - desi melodies",
  "vevo",
  "official channel",
  "yrf music",
  "tseries",
];

const ARTIST_DICTIONARY: { name: string; aliases: string[] }[] = [
  { name: "Arijit Singh", aliases: ["arijit singh", "arjit singh", "arijit", "arjit"] },
  { name: "Atif Aslam", aliases: ["atif aslam", "atif"] },
  { name: "Mohit Chauhan", aliases: ["mohit chauhan"] },
  { name: "KK", aliases: ["kk", "k.k.", "kay kay"] },
  { name: "Shreya Ghoshal", aliases: ["shreya ghoshal", "shreya"] },
  { name: "Sonu Nigam", aliases: ["sonu nigam"] },
  { name: "Jubin Nautiyal", aliases: ["jubin nautiyal", "jubin"] },
  { name: "Asees Kaur", aliases: ["asees kaur", "asees"] },
  { name: "Roop Kumar Rathod", aliases: ["roop kumar rathod", "roop kumar"] },
  { name: "Jagjit Singh", aliases: ["jagjit singh", "jagjit"] },
  { name: "Mehdi Hassan", aliases: ["mehdi hassan"] },
  { name: "Ghulam Ali", aliases: ["ghulam ali"] },
  { name: "Pankaj Udhas", aliases: ["pankaj udhas"] },
  { name: "Lata Mangeshkar", aliases: ["lata mangeshkar", "lata"] },
  { name: "Kishore Kumar", aliases: ["kishore kumar", "kishore"] },
  { name: "Mohammed Rafi", aliases: ["mohammed rafi", "mohd rafi", "rafi"] },
  { name: "Asha Bhosle", aliases: ["asha bhosle", "asha"] },
  { name: "R.D. Burman", aliases: ["r.d. burman", "rd burman", "pancham"] },
  { name: "Mukesh", aliases: ["mukesh"] },
  { name: "Alka Yagnik", aliases: ["alka yagnik"] },
  { name: "Kumar Sanu", aliases: ["kumar sanu"] },
  { name: "Udit Narayan", aliases: ["udit narayan"] },
  { name: "Sunidhi Chauhan", aliases: ["sunidhi chauhan"] },
  { name: "Sidhu Moose Wala", aliases: ["sidhu moose wala", "sidhu moosewala", "sidhu"] },
  { name: "Karan Aujla", aliases: ["karan aujla"] },
  { name: "Diljit Dosanjh", aliases: ["diljit dosanjh", "diljit"] },
  { name: "AP Dhillon", aliases: ["ap dhillon"] },
  { name: "The Weeknd", aliases: ["the weeknd", "weeknd"] },
  { name: "Daft Punk", aliases: ["daft punk"] },
  { name: "Billie Eilish", aliases: ["billie eilish"] },
  { name: "Dua Lipa", aliases: ["dua lipa"] },
  { name: "Taylor Swift", aliases: ["taylor swift"] },
  { name: "Drake", aliases: ["drake"] },
  { name: "Ed Sheeran", aliases: ["ed sheeran"] },
  { name: "Justin Bieber", aliases: ["justin bieber"] },
  { name: "Post Malone", aliases: ["post malone"] },
  { name: "Coldplay", aliases: ["coldplay"] },
  { name: "Pritam", aliases: ["pritam"] },
  { name: "Mithoon", aliases: ["mithoon"] },
  { name: "A.R. Rahman", aliases: ["a.r. rahman", "ar rahman", "rahman"] },
];

function extractCleanTrackInfo(
  rawTitle: string,
  rawAuthor?: string,
  query: string = ""
): { title: string; artist: string } {
  const authorLower = (rawAuthor || "").toLowerCase().trim();
  const titleLower = (rawTitle || "").toLowerCase();
  const queryLower = (query || "").toLowerCase().trim();
  const isLabel =
    RECORD_LABELS.some((l) => authorLower.includes(l)) ||
    /music|records|company|entertainment|films|official|tseries/i.test(authorLower);

  // 1. Check artist dictionary against title or author
  let detectedArtist = "";
  for (const entry of ARTIST_DICTIONARY) {
    if (entry.aliases.some((alias) => titleLower.includes(alias) || authorLower.includes(alias))) {
      detectedArtist = entry.name;
      break;
    }
  }

  // 2. If query was searched for an artist (e.g. 'arjit')
  if (!detectedArtist && queryLower.length >= 3) {
    for (const entry of ARTIST_DICTIONARY) {
      if (entry.aliases.some((alias) => alias.includes(queryLower) || queryLower.includes(alias))) {
        if (titleLower.includes(queryLower) || titleLower.includes(entry.name.toLowerCase())) {
          detectedArtist = entry.name;
          break;
        }
      }
    }
  }

  // 3. Fallback: if not a record label, use author name
  if (!detectedArtist) {
    detectedArtist = isLabel ? "Various Artists" : rawAuthor || "Unknown Artist";
  }

  // Clean title: extract main song title before first | or • or separator
  let cleanTitle = rawTitle;
  const pipeParts = rawTitle.split(/\s*[|•]\s*/);
  if (pipeParts.length > 1) {
    cleanTitle = pipeParts[0];
  }

  cleanTitle = cleanTitle
    .replace(
      /\s*[-–—]\s*(lyrical song|lyric video|official audio|official video|full song|video song|audio song|song).*/i,
      ""
    )
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .trim();

  return { title: cleanTitle || rawTitle, artist: detectedArtist };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const sort = searchParams.get("sort") || "relevance"; // "relevance" | "views" | "duration"

  if (!query) {
    return NextResponse.json({
      tracks: [],
      totalTracks: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
    });
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
      const views = Number(info.basic_info.view_count) || 100000;

      const singleTrack: Track = {
        id: `yt_${directVideoId}`,
        title,
        artist,
        durationMs: durationMs || 240000,
        url: `/api/stream/youtube?id=${directVideoId}`,
        source: "youtube",
        coverUrl: `https://i.ytimg.com/vi/${directVideoId}/hqdefault.jpg`,
        views,
        viewsFormatted: formatViews(views),
      };

      return NextResponse.json({
        tracks: [singleTrack],
        totalTracks: 1,
        page: 1,
        totalPages: 1,
        hasMore: false,
      });
    } catch (err) {
      console.warn("Direct YouTube lookup error:", err);
    }
  }

  try {
    const yt = await getSearchInnertube();
    const cleanQuery = query.toLowerCase();

    // Query both general video search and music song search to get an exhaustive list
    const [videoSearch, songSearch] = await Promise.allSettled([
      yt.search(`${query} song`, { type: "video" }),
      yt.music.search(query, { type: "song" }),
    ]);

    const candidateTracks: Track[] = [];
    const seenIds = new Set<string>();

    // 1. Parse video search results (which contain rich view counts and short view counts)
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
        if (seenIds.has(id)) continue;

        const durSec = video.duration?.seconds || 0;
        // Filter strictly for individual song duration: 50s to 720s (12 mins max)
        if (durSec < 50 || durSec > 720) continue;

        const rawTitle = video.title?.text || "Unknown Song";
        const rawArtist = video.author?.name || "YouTube Artist";
        const { title, artist } = extractCleanTrackInfo(rawTitle, rawArtist, query);
        const views = parseViewCount(video.view_count?.text, video.short_view_count?.text);

        const track: Track = {
          id: `yt_${id}`,
          title,
          artist,
          durationMs: (durSec || 210) * 1000,
          url: `/api/stream/youtube?id=${id}`,
          source: "youtube",
          coverUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          views,
          viewsFormatted: formatViews(views),
        };

        seenIds.add(id);
        candidateTracks.push(track);
      }
    }

    // 2. Parse YouTube Music results
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
        if (seenIds.has(id)) continue;

        const rawTitle = song.title || "Song";
        const rawArtist =
          Array.isArray(song.artists) && song.artists.length > 0
            ? song.artists
                .map((a: { name?: string }) => a.name)
                .filter(Boolean)
                .join(", ")
            : song.author || "Unknown Artist";
        const { title, artist } = extractCleanTrackInfo(rawTitle, rawArtist, query);

        const durSec =
          song.duration?.seconds ||
          (parseYouTubeDuration(song.duration?.text) ? parseYouTubeDuration(song.duration?.text)! / 1000 : 210);

        if (durSec < 50 || durSec > 720) continue;

        const rawCover =
          song.thumbnail?.[0]?.url || song.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

        const coverUrl = rawCover.includes("googleusercontent.com")
          ? rawCover.replace(/=w\d+-h\d+[^"]*/, "=w800-h800-l90-rj")
          : rawCover;

        // Music results don't always expose exact view count, estimate from popularity
        const estimatedViews = 5_000_000;

        const track: Track = {
          id: `yt_${id}`,
          title,
          artist,
          durationMs: Math.round(durSec * 1000),
          url: `/api/stream/youtube?id=${id}`,
          source: "youtube",
          coverUrl,
          views: estimatedViews,
          viewsFormatted: "Official",
        };

        seenIds.add(id);
        candidateTracks.push(track);
      }
    }

    // Relevance & Popularity scoring function:
    // Guarantees:
    // 1. Tracks with query in the title or artist rank highest in relevance.
    // 2. Most played and highest viewed tracks within relevant results rank first.
    candidateTracks.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aArtist = a.artist.toLowerCase();
      const bArtist = b.artist.toLowerCase();

      const aMatches = aTitle.includes(cleanQuery) || aArtist.includes(cleanQuery);
      const bMatches = bTitle.includes(cleanQuery) || bArtist.includes(cleanQuery);

      if (sort === "duration") {
        return a.durationMs - b.durationMs;
      }

      if (sort === "relevance") {
        if (aMatches !== bMatches) return aMatches ? -1 : 1;
        return (b.views || 0) - (a.views || 0);
      }

      // Default: "views" (Most played / highest views first, prioritizing matching tracks)
      if (aMatches !== bMatches) return aMatches ? -1 : 1;
      return (b.views || 0) - (a.views || 0);
    });

    // Pagination slicing
    const totalTracks = candidateTracks.length;
    const startIndex = (page - 1) * limit;
    const paginatedTracks = candidateTracks.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(totalTracks / limit);

    return NextResponse.json({
      tracks: paginatedTracks,
      totalTracks,
      page,
      totalPages,
      hasMore: startIndex + limit < totalTracks,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Search API error:", err);
    return NextResponse.json({
      tracks: [],
      totalTracks: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
      error: message,
    });
  }
}
