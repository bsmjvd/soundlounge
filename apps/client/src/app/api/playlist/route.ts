import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";
import { YTNodes } from "youtubei.js";
import { isRateLimited } from "@/lib/rateLimit";
import { getBounded, setBounded } from "@/lib/boundedCache";
import { extractCleanTrackInfo } from "@/lib/youtube/artistAttribution";
import {
  isPlaylistNode,
  normalizePlaylistId,
  toPlaylistCard,
  upgradeCoverUrl,
  withinTrackDuration,
  type PlaylistCard,
} from "@/lib/youtube/playlistUtils";
import type { Track } from "@soundlounge/shared";

// Innertube singleton for playlist lookups
let innertubePromise: Promise<Innertube> | null = null;
async function getPlaylistInnertube(): Promise<Innertube> {
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

// Bounded, short-lived caches: playlist track lists change and playlist search
// results depend on region, so nothing here should outlive a browsing session.
const MAX_CACHE_ENTRIES = 60;
const CARD_CACHE_TTL_MS = 30 * 60_000;
const TRACKS_CACHE_TTL_MS = 10 * 60_000;

interface CachedCards {
  cards: PlaylistCard[];
  expiresAt: number;
}

interface CachedPlaylist {
  title: string;
  author: string;
  coverUrl: string;
  tracks: Track[];
  expiresAt: number;
}

const cardCache = new Map<string, CachedCards>();
const tracksCache = new Map<string, CachedPlaylist>();

const MAX_TRACKS = 200;

// GET /api/playlist?q=<search query>[&resolve=1]  → playlist search results (or just the top match)
// GET /api/playlist?id=<playlistId>               → full track list for one playlist
export async function GET(req: NextRequest) {
  if (await isRateLimited(req, "search", 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const playlistId = searchParams.get("id")?.trim();
  const resolveOnly = searchParams.get("resolve") === "1";
  // play=1: resolve the top playlist match AND return its tracks in one round trip
  const playTop = searchParams.get("play") === "1";

  if (!query && !playlistId) {
    return NextResponse.json({ error: "Provide ?q=<search> or ?id=<playlistId>" }, { status: 400 });
  }

  try {
    const yt = await getPlaylistInnertube();

    // ---- Playlist search (discover curated + user queries) ----
    if (query) {
      const cachedCards = getBounded(cardCache, query);
      if (cachedCards && cachedCards.expiresAt > Date.now()) {
        const cards = cachedCards.cards;
        return NextResponse.json(resolveOnly ? { playlist: cards[0] || null } : { playlists: cards });
      }

      const search = await yt.music.search(query, { type: "playlist" });
      const cards = (search.playlists?.contents || [])
        .filter((node) => isPlaylistNode(node))
        .map((node) => toPlaylistCard(node))
        .filter((card): card is PlaylistCard => card !== null)
        .slice(0, 8);

      setBounded(cardCache, query, { cards, expiresAt: Date.now() + CARD_CACHE_TTL_MS }, MAX_CACHE_ENTRIES);

      if (resolveOnly) {
        return NextResponse.json({ playlist: cards[0] || null });
      }
      if (playTop && cards[0]) {
        return NextResponse.json(await fetchPlaylistTracks(yt, cards[0]));
      }
      return NextResponse.json({ playlists: cards });
    }

    // ---- Full playlist track list ----
    return NextResponse.json(await fetchPlaylistTracks(yt, { id: normalizePlaylistId(playlistId!) }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Playlist API error:", err);
    return NextResponse.json({ error: message, playlists: [], tracks: [] }, { status: 200 });
  }
}

interface PlaylistCardWithCount extends Omit<PlaylistCard, "trackCount"> {
  trackCount?: number | null;
}

async function fetchPlaylistTracks(
  yt: Innertube,
  ref: { id: string; title?: string; author?: string; coverUrl?: string }
): Promise<{ playlist: PlaylistCardWithCount; tracks: Track[] }> {
  const id = normalizePlaylistId(ref.id);
  const cached = getBounded(tracksCache, id);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      playlist: {
        id,
        title: ref.title || cached.title,
        author: ref.author || cached.author,
        coverUrl: ref.coverUrl || cached.coverUrl,
        trackCount: cached.tracks.length,
      },
      tracks: cached.tracks,
    };
  }

  const playlist = await yt.music.getPlaylist(id);
  let title = ref.title || "Untitled Playlist";
  let author = ref.author || "YouTube Music";
  let coverUrl = ref.coverUrl || "";

  try {
    const header = playlist.header;
    if (header && "title" in header && header.title) {
      title = String(header.title) || title;
    }
    if (header && "subtitle" in header && header.subtitle) {
      author = String(header.subtitle) || author;
    }
    const bg = playlist.background?.contents?.[0]?.url;
    if (bg) coverUrl = upgradeCoverUrl(bg);
  } catch {}

  const tracks: Track[] = [];
  const seenIds = new Set<string>();

  const collectItems = (items: Iterable<unknown>) => {
    for (const item of items as Array<InstanceType<typeof YTNodes.MusicResponsiveListItem>>) {
      if (!item || !item.id) continue;
      const videoId = String(item.id);
      if (seenIds.has(videoId)) continue;
      if (!withinTrackDuration(item.duration?.seconds)) continue;

      const rawTitle = item.title || "Unknown Song";
      const rawArtist =
        item.artists?.map((a) => a.name).filter(Boolean).join(", ") || item.author?.name || "Unknown Artist";
      const { title: cleanTitle, artist } = extractCleanTrackInfo(rawTitle, rawArtist);

      seenIds.add(videoId);
      tracks.push({
        id: `yt_${videoId}`,
        title: cleanTitle,
        artist,
        durationMs: Math.round((item.duration?.seconds || 210) * 1000),
        url: `/api/stream/youtube?id=${videoId}`,
        source: "youtube",
        coverUrl: upgradeCoverUrl(
          item.thumbnail?.contents?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        ),
        viewsFormatted: "Playlist",
      });
    }
  };

  collectItems(playlist.contents || []);
  // Playlists can be longer than the first page; follow continuations up to a sane cap
  let page = playlist;
  while (tracks.length < MAX_TRACKS && page.has_continuation) {
    page = await page.getContinuation();
    collectItems(page.contents || []);
  }

  setBounded(
    tracksCache,
    id,
    { title, author, coverUrl, tracks, expiresAt: Date.now() + TRACKS_CACHE_TTL_MS },
    MAX_CACHE_ENTRIES
  );

  return {
    playlist: { id, title, author, coverUrl, trackCount: tracks.length },
    tracks,
  };
}
