import type { Track } from "@soundlounge/shared";
import { ARTISTS_CATALOG, type ArtistProfileData } from "../data/artistsCatalog";
import {
  classifyGenre,
  getPeerArtistsForArtist,
  getPeerArtistsForGenre,
  type MusicGenre,
} from "./genreTaxonomy";

export interface FindSimilarOptions {
  currentTrack: Track;
  existingQueue: Track[];
  history?: Track[];
  searchApiUrl?: string;
  fetchFn?: typeof fetch;
}

export type SimilarMatchType =
  | "same_artist"
  | "peer_artist"
  | "genre_match"
  | "live_search";

export interface SimilarTrackResult {
  track: Track;
  matchType: SimilarMatchType;
  reason: string;
}

/**
 * Normalizes strings for loose name and identifier matching.
 */
function clean(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds the best similar track to the currently playing song using a multi-tiered strategy:
 * 1. Remaining tracks by the same artist from catalog
 * 2. Tracks by peer artists in the same genre cluster
 * 3. Tracks from other artists in the same genre
 * 4. Dynamic live search via YouTube edge API
 */
export async function findSimilarTrack(
  options: FindSimilarOptions
): Promise<SimilarTrackResult | null> {
  const {
    currentTrack,
    existingQueue,
    history = [],
    searchApiUrl = "/api/search",
    fetchFn = typeof fetch !== "undefined" ? fetch : undefined,
  } = options;

  if (!currentTrack) return null;

  // Build exclusion set to avoid any duplicates in queue or current song
  const excludedIds = new Set<string>();
  excludedIds.add(currentTrack.id);
  for (const t of existingQueue) {
    excludedIds.add(t.id);
  }

  // Also build set of recent history IDs (for tie-breaking/avoiding recent repeats)
  const historyIds = new Set<string>(history.map((t) => t.id));

  const cleanArtist = clean(currentTrack.artist);
  const cleanTitle = clean(currentTrack.title);

  // 1. Classify the genre and style of the current track
  const classification = classifyGenre({
    title: currentTrack.title,
    artist: currentTrack.artist,
  });
  const detectedGenre: MusicGenre = classification.genre;

  // --------------------------------------------------------------------------
  // Tier 1: Check if the same artist is in ARTISTS_CATALOG and has unplayed tracks
  // --------------------------------------------------------------------------
  const matchingArtist = ARTISTS_CATALOG.find((a) => {
    const aClean = clean(a.name);
    return cleanArtist.includes(aClean) || aClean.includes(cleanArtist && cleanArtist.length > 3 ? cleanArtist : "___");
  });

  if (matchingArtist) {
    // Look for unqueued track from this artist, preferring not in recent history
    const unqueuedTracks = matchingArtist.topTracks.filter((t) => !excludedIds.has(t.id));
    if (unqueuedTracks.length > 0) {
      const freshTrack = unqueuedTracks.find((t) => !historyIds.has(t.id)) || unqueuedTracks[0];
      return {
        track: freshTrack,
        matchType: "same_artist",
        reason: `Same Artist: ${matchingArtist.name}`,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Tier 2: Check peer artists in the same genre cluster
  // --------------------------------------------------------------------------
  const peerArtistNames = getPeerArtistsForArtist(currentTrack.artist);
  for (const peerName of peerArtistNames) {
    const peerClean = clean(peerName);
    const peerCatalogArtist = ARTISTS_CATALOG.find((a) => {
      const aClean = clean(a.name);
      return peerClean.includes(aClean) || aClean.includes(peerClean);
    });

    if (peerCatalogArtist) {
      const candidateTracks = peerCatalogArtist.topTracks.filter((t) => !excludedIds.has(t.id));
      if (candidateTracks.length > 0) {
        const selected = candidateTracks.find((t) => !historyIds.has(t.id)) || candidateTracks[0];
        return {
          track: selected,
          matchType: "peer_artist",
          reason: `Similar ${detectedGenre === "other" ? "Style" : detectedGenre.toUpperCase()}: ${peerCatalogArtist.name}`,
        };
      }
    }
  }

  // --------------------------------------------------------------------------
  // Tier 3: Check other catalog artists with matching region or genre
  // --------------------------------------------------------------------------
  const genrePeers = getPeerArtistsForGenre(detectedGenre);
  const candidateCatalogArtists = ARTISTS_CATALOG.filter((a) => {
    if (clean(a.name) === cleanArtist) return false;
    return (
      a.region === detectedGenre ||
      clean(a.genre).includes(detectedGenre) ||
      genrePeers.some((gp) => clean(gp) === clean(a.name))
    );
  });

  for (const artist of candidateCatalogArtists) {
    const candidateTracks = artist.topTracks.filter((t) => !excludedIds.has(t.id));
    if (candidateTracks.length > 0) {
      const selected = candidateTracks.find((t) => !historyIds.has(t.id)) || candidateTracks[0];
      return {
        track: selected,
        matchType: "genre_match",
        reason: `Similar Genre (${detectedGenre}): ${artist.name}`,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Tier 4: Dynamic Edge YouTube Search Fallback
  // --------------------------------------------------------------------------
  if (fetchFn) {
    try {
      // Craft an intelligent search query based on artist and genre
      let query = "";
      if (cleanArtist && cleanArtist !== "unknown artist") {
        query = `${currentTrack.artist} top songs`;
      } else if (detectedGenre !== "other") {
        query = `best ${detectedGenre} songs`;
      } else {
        // Strip common suffixes from title
        query = currentTrack.title.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim() + " similar";
      }

      const res = await fetchFn(`${searchApiUrl}?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = (await res.json()) as { tracks?: Track[] };
        const fetchedTracks = data.tracks || [];

        // Find the first track that is not already in the queue or history
        const liveCandidate = fetchedTracks.find(
          (t) =>
            !excludedIds.has(t.id) &&
            clean(t.title) !== cleanTitle &&
            t.durationMs > 30000 &&
            t.durationMs < 1200000 // Between 30s and 20 mins
        );

        if (liveCandidate) {
          return {
            track: liveCandidate,
            matchType: "live_search",
            reason: `Discovered Similar: ${liveCandidate.artist}`,
          };
        }
      }
    } catch (err) {
      console.warn("SimilarTracksEngine live search fallback error:", err);
    }
  }

  // --------------------------------------------------------------------------
  // Tier 5: Final safety fallback to any unplayed catalog track
  // --------------------------------------------------------------------------
  for (const artist of ARTISTS_CATALOG) {
    const candidate = artist.topTracks.find((t) => !excludedIds.has(t.id));
    if (candidate) {
      return {
        track: candidate,
        matchType: "genre_match",
        reason: `Suggested: ${candidate.artist}`,
      };
    }
  }

  return null;
}
