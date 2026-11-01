import type { Track } from "@soundlounge/shared";
import { ARTISTS_CATALOG } from "../data/artistsCatalog";
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
  "vevo",
  "official channel",
  "yrf music",
  "tseries",
];

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
 * Extracts the true performing artist when a track is attributed to a record label
 * or when the artist is embedded in the title.
 */
export function resolveEffectiveArtist(track: Track): string {
  const authorLower = (track.artist || "").toLowerCase().trim();
  const titleLower = (track.title || "").toLowerCase();
  const isLabel =
    RECORD_LABELS.some((l) => authorLower.includes(l)) ||
    /music|records|company|entertainment|films|official|tseries/i.test(authorLower);

  // If track.artist is already a clean personal artist and not a generic channel/label
  if (
    !isLabel &&
    track.artist &&
    track.artist !== "Unknown Artist" &&
    track.artist !== "Various Artists"
  ) {
    return track.artist;
  }

  // Check title against all catalog artists
  for (const a of ARTISTS_CATALOG) {
    if (titleLower.includes(a.name.toLowerCase())) {
      return a.name;
    }
  }

  // Special checks for prominent playback singers & artists
  if (titleLower.includes("arijit") || titleLower.includes("arjit")) return "Arijit Singh";
  if (titleLower.includes("atif aslam") || titleLower.includes("atif")) return "Atif Aslam";
  if (titleLower.includes("mohit chauhan")) return "Mohit Chauhan";
  if (titleLower.includes("kk") || titleLower.includes("k.k.")) return "KK";
  if (titleLower.includes("shreya ghoshal") || titleLower.includes("shreya")) return "Shreya Ghoshal";
  if (titleLower.includes("sonu nigam")) return "Sonu Nigam";
  if (titleLower.includes("jubin nautiyal") || titleLower.includes("jubin")) return "Jubin Nautiyal";
  if (titleLower.includes("roop kumar")) return "Roop Kumar Rathod";
  if (titleLower.includes("sidhu moose wala") || titleLower.includes("sidhu")) return "Sidhu Moose Wala";
  if (titleLower.includes("jagjit singh") || titleLower.includes("jagjit")) return "Jagjit Singh";
  if (titleLower.includes("lata mangeshkar") || titleLower.includes("lata")) return "Lata Mangeshkar";
  if (titleLower.includes("kishore kumar") || titleLower.includes("kishore")) return "Kishore Kumar";
  if (titleLower.includes("mohammed rafi") || titleLower.includes("rafi")) return "Mohammed Rafi";
  if (titleLower.includes("diljit dosanjh") || titleLower.includes("diljit")) return "Diljit Dosanjh";
  if (titleLower.includes("karan aujla")) return "Karan Aujla";
  if (titleLower.includes("ap dhillon")) return "AP Dhillon";
  if (titleLower.includes("weeknd")) return "The Weeknd";
  if (titleLower.includes("daft punk")) return "Daft Punk";

  return track.artist || "Various Artists";
}

/**
 * Finds the best similar track to the currently playing song using a multi-tiered strategy:
 * 1. Remaining tracks by the SAME ARTIST from catalog (highest priority!)
 * 2. More tracks by the SAME ARTIST via dynamic live search (guarantees artist continuity)
 * 3. Tracks by PEER ARTISTS in the same genre cluster
 * 4. Tracks from other artists in the same genre
 * 5. Dynamic live search for genre peers
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

  // Resolve the true performing artist
  const effectiveArtist = resolveEffectiveArtist(currentTrack);
  const cleanArtist = clean(effectiveArtist);
  const cleanTitle = clean(currentTrack.title);

  // Classify genre for fallbacks
  const classification = classifyGenre({
    title: currentTrack.title,
    artist: effectiveArtist,
  });
  const detectedGenre: MusicGenre = classification.genre;

  // Helper to determine if we can safely make a network fetch
  const isTestEnv =
    typeof process !== "undefined" &&
    (process.env.NODE_ENV === "test" || !!process.env.BUN_ENV || !!process.env.VITEST);

  const isCustomMock =
    typeof fetchFn === "function" &&
    typeof globalThis !== "undefined" &&
    fetchFn !== globalThis.fetch;

  const canPerformFetch =
    !!fetchFn &&
    (isCustomMock ||
      (!isTestEnv && (typeof window !== "undefined" || searchApiUrl.startsWith("http"))));

  // --------------------------------------------------------------------------
  // Tier 1: Check if the SAME ARTIST is in ARTISTS_CATALOG and has unplayed tracks
  // --------------------------------------------------------------------------
  const matchingArtist = ARTISTS_CATALOG.find((a) => {
    const aClean = clean(a.name);
    return (
      cleanArtist.includes(aClean) ||
      aClean.includes(cleanArtist && cleanArtist.length > 3 ? cleanArtist : "___")
    );
  });

  if (matchingArtist) {
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
  // Tier 2: Search YouTube directly for MORE TRACKS BY THE SAME ARTIST!
  // (Fulfills rule: "the song suggestions must first match the artist as i searched for artist")
  // --------------------------------------------------------------------------
  if (canPerformFetch && effectiveArtist && effectiveArtist !== "Various Artists" && effectiveArtist !== "Unknown Artist") {
    try {
      const sameArtistQuery = `${effectiveArtist} best songs`;
      const res = await fetchFn(
        `${searchApiUrl}?q=${encodeURIComponent(sameArtistQuery)}&limit=15&sort=views`
      );

      if (res.ok) {
        const data = (await res.json()) as { tracks?: Track[] };
        const fetchedTracks = data.tracks || [];

        // Find candidate that matches the SAME ARTIST and is not in queue/history
        const sameArtistCandidate = fetchedTracks.find((t) => {
          if (excludedIds.has(t.id)) return false;
          const candidateCleanTitle = clean(t.title);
          if (candidateCleanTitle === cleanTitle) return false;
          if (t.durationMs < 50000 || t.durationMs > 720000) return false;

          const candidateCleanArtist = clean(t.artist);
          const candidateCleanTitleFull = clean(t.title);

          // Verify it is genuinely the same artist
          return (
            candidateCleanArtist.includes(cleanArtist) ||
            cleanArtist.includes(candidateCleanArtist) ||
            candidateCleanTitleFull.includes(cleanArtist)
          );
        });

        if (sameArtistCandidate) {
          // Normalize artist name so label channels don't leak into UI
          if (RECORD_LABELS.some((l) => (sameArtistCandidate.artist || "").toLowerCase().includes(l))) {
            sameArtistCandidate.artist = effectiveArtist;
          }

          return {
            track: sameArtistCandidate,
            matchType: "live_search",
            reason: `Same Artist: ${effectiveArtist}`,
          };
        }
      }
    } catch (err) {
      console.warn("Same artist YouTube search error:", err);
    }
  }

  // --------------------------------------------------------------------------
  // Tier 3: Check PEER ARTISTS in the same genre cluster (Catalog)
  // --------------------------------------------------------------------------
  const peerArtistNames = getPeerArtistsForArtist(effectiveArtist);
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
          reason: `Similar ${detectedGenre !== "other" ? detectedGenre.toUpperCase() : "Artist"}: ${peerCatalogArtist.name}`,
        };
      }
    }
  }

  // --------------------------------------------------------------------------
  // Tier 4: Check other catalog artists with matching region or genre
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
        reason: `Similar Style: ${artist.name}`,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Tier 5: Dynamic Edge YouTube Search Fallback for Genre
  // --------------------------------------------------------------------------
  if (canPerformFetch) {
    try {
      const query = detectedGenre !== "other"
        ? `best ${detectedGenre} songs`
        : `${effectiveArtist || currentTrack.title} music`;

      const res = await fetchFn(`${searchApiUrl}?q=${encodeURIComponent(query)}&limit=10&sort=views`);
      if (res.ok) {
        const data = (await res.json()) as { tracks?: Track[] };
        const fetchedTracks = data.tracks || [];

        const liveCandidate = fetchedTracks.find(
          (t) =>
            !excludedIds.has(t.id) &&
            clean(t.title) !== cleanTitle &&
            t.durationMs >= 50000 &&
            t.durationMs <= 720000
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
  // Tier 6: Final safety fallback to any unplayed catalog track
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
