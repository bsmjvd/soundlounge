import type { Album } from "@soundlounge/shared";
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
export async function searchAlbums(query: string, options?: { year?: number; artist?: string }): Promise<Album[]> {
  const cleanQ = clean(query);
  if (!cleanQ) return [];

  const matched = ALBUMS_CATALOG.filter((album) => {
    const titleMatch = clean(album.title).includes(cleanQ) || cleanQ.includes(clean(album.title));
    const artistMatch =
      clean(album.primaryArtist).includes(cleanQ) || album.featuredSingers.some((s) => clean(s).includes(cleanQ));
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
        clean(album.primaryArtist).includes(artClean) || album.featuredSingers.some((s) => clean(s).includes(artClean));
      if (!isArtist) return false;
    }

    return true;
  });

  return matched;
}

/**
 * Disambiguation Engine: Finds alternative releases that share the same or easily-confused
 * title, band name, or cinematic franchise (e.g. The Train 2007 vs The Train 1970 vs Train the band).
 */
export function getDisambiguationCounterparts(albumId: string): Album[] {
  const current = ALBUMS_CATALOG.find((a) => a.id === albumId);
  if (!current) return [];

  const currentTitleClean = clean(current.title);
  const currentArtistClean = clean(current.primaryArtist);

  // Define cross-era / cross-entity disambiguation clusters
  const isTrainRelated =
    currentTitleClean === "the train" ||
    currentArtistClean === "train" ||
    current.id.includes("train_");

  if (isTrainRelated) {
    return ALBUMS_CATALOG.filter((a) => a.id !== albumId && (clean(a.title) === "the train" || clean(a.primaryArtist) === "train"));
  }

  // General title collision detection (e.g., releases sharing normalized titles)
  return ALBUMS_CATALOG.filter((a) => a.id !== albumId && clean(a.title) === currentTitleClean);
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
  return ALBUMS_CATALOG.filter((album) => album.genres.some((g) => clean(g).includes(gClean)));
}

/**
 * Filters albums by movie soundtrack vs studio album.
 */
export function getAlbumsByType(type: "movie_soundtrack" | "studio_album"): Album[] {
  return ALBUMS_CATALOG.filter((album) => album.type === type);
}

/**
 * Filters albums featuring a specific actor in the star cast.
 */
export function getAlbumsByStarCast(actorName: string): Album[] {
  const actorClean = clean(actorName);
  const actorCompact = actorClean.replace(/\s+/g, "");
  if (!actorClean) return [];

  return ALBUMS_CATALOG.filter((album) =>
    album.movieDetails?.starCast.some((star) => {
      const starClean = clean(star);
      const starCompact = starClean.replace(/\s+/g, "");
      return (
        starClean.includes(actorClean) ||
        actorClean.includes(starClean) ||
        (actorCompact.length >= 4 && (starCompact.includes(actorCompact) || actorCompact.includes(starCompact)))
      );
    })
  );
}
