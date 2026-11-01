import type { Album, Track } from "@soundlounge/shared";
import { ALBUMS_CATALOG } from "../data/albumsCatalog";

function clean(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns all albums in the catalog.
 */
export function getAllAlbums(): Album[] {
  return [...ALBUMS_CATALOG];
}

/**
 * Retrieves a single album by its unique deterministic ID.
 */
export async function getAlbumById(id: string): Promise<Album | null> {
  const local = ALBUMS_CATALOG.find((a) => a.id === id);
  if (local) return local;

  // Optional: In production, fallback to edge API /api/metadata/album/:id
  try {
    const res = await fetch(`/api/metadata/album?id=${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      return data.album || null;
    }
  } catch {
    // Edge endpoint unreachable or in test environment
  }

  return null;
}

/**
 * Searches and disambiguates albums by title, year, movie star cast, or artist.
 */
export async function searchAlbums(
  query: string,
  options?: { year?: number; artist?: string }
): Promise<Album[]> {
  const cleanQ = clean(query);
  if (!cleanQ) return [];

  const matched = ALBUMS_CATALOG.filter((album) => {
    const titleMatch = clean(album.title).includes(cleanQ) || cleanQ.includes(clean(album.title));
    const artistMatch =
      clean(album.primaryArtist).includes(cleanQ) ||
      album.featuredSingers.some((s) => clean(s).includes(cleanQ));
    const movieMatch =
      album.movieDetails &&
      (clean(album.movieDetails.movieTitle).includes(cleanQ) ||
        album.movieDetails.starCast.some((star) => clean(star).includes(cleanQ)) ||
        album.movieDetails.musicDirectors.some((md) => clean(md).includes(cleanQ)));

    const basicMatch = titleMatch || artistMatch || Boolean(movieMatch);

    if (!basicMatch) return false;

    if (options?.year && album.releaseYear !== options.year) {
      return false;
    }

    if (options?.artist) {
      const artClean = clean(options.artist);
      const isArtist =
        clean(album.primaryArtist).includes(artClean) ||
        album.featuredSingers.some((s) => clean(s).includes(artClean));
      if (!isArtist) return false;
    }

    return true;
  });

  return matched;
}

/**
 * Retrieves all albums associated with an artist (as primary composer/artist or featured singer).
 */
export async function getAlbumsForArtist(artistName: string): Promise<Album[]> {
  const artClean = clean(artistName);
  if (!artClean) return [];

  return ALBUMS_CATALOG.filter((album) => {
    const primary = clean(album.primaryArtist).includes(artClean);
    const singer = album.featuredSingers.some((s) => clean(s).includes(artClean));
    const md = album.movieDetails?.musicDirectors.some((m) => clean(m).includes(artClean));
    return primary || singer || Boolean(md);
  });
}

/**
 * Retrieves albums matching a specific genre.
 */
export function getAlbumsByGenre(genre: string): Album[] {
  const gClean = clean(genre);
  return ALBUMS_CATALOG.filter((album) =>
    album.genres.some((g) => clean(g).includes(gClean))
  );
}
