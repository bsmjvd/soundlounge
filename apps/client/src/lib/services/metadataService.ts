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
