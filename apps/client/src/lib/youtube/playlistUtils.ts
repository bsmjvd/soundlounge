// Helpers shared by /api/playlist and its clients for normalizing YouTube Music
// playlist identifiers and converting playlist items into playable Tracks.

const MIN_TRACK_SECONDS = 40;
const MAX_TRACK_SECONDS = 900;

/**
 * YouTube Music playlist ids arrive as "VL<playlistId>" browse ids; the
 * getPlaylist endpoint accepts both, but caching needs one canonical form.
 */
export function normalizePlaylistId(id: string): string {
  return (id || "").trim().replace(/^VL/, "");
}

export interface PlaylistCard {
  id: string;
  title: string;
  author: string;
  trackCount: number | null;
  coverUrl: string;
}

export function toPlaylistCard(item: {
  id?: string;
  title?: string;
  name?: string;
  author?: { name?: string };
  authors?: { name?: string }[];
  song_count?: string;
  item_count?: string;
  thumbnail?: { contents?: { url?: string }[] } | null;
}): PlaylistCard | null {
  if (!item?.id) return null;
  const count = parseInt(item.song_count || item.item_count || "", 10);

  return {
    id: normalizePlaylistId(String(item.id)),
    title: item.title || item.name || "Untitled Playlist",
    author: item.author?.name || item.authors?.[0]?.name || "YouTube Music",
    trackCount: Number.isFinite(count) && count > 0 ? count : null,
    coverUrl: upgradeCoverUrl(item.thumbnail?.contents?.[0]?.url || ""),
  };
}

export function upgradeCoverUrl(url: string): string {
  if (url && url.includes("googleusercontent.com")) {
    return url.replace(/=w\d+-h\d+[^"']*/, "=w800-h800-l90-rj");
  }
  return url;
}

export function withinTrackDuration(seconds: number | undefined | null): boolean {
  return typeof seconds === "number" && seconds >= MIN_TRACK_SECONDS && seconds <= MAX_TRACK_SECONDS;
}

export function isPlaylistNode(item: { id?: string; item_type?: string }): boolean {
  if (item.item_type === "playlist") return true;
  return /^(VL|PL|RD)/.test(String(item.id || ""));
}
