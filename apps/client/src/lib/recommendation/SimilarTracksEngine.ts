import type { Track } from "@soundlounge/shared";
import { ARTISTS_CATALOG } from "../data/artistsCatalog";
import { classifyGenre, getPeerArtistsForArtist, getPeerArtistsForGenre, type MusicGenre } from "./genreTaxonomy";

export interface FindSimilarOptions {
  currentTrack: Track;
  existingQueue: Track[];
  history?: Track[];
  searchApiUrl?: string;
  fetchFn?: typeof fetch;
}

export type SimilarMatchType = "same_artist" | "peer_artist" | "genre_match" | "live_search";

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
 * Word boundary-safe matching for artist names (avoids "ikky" matching "kk").
 */
function matchesWordBoundary(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
  return regex.test(text);
}

/**
 * Normalizes a song title to its core canonical form to detect duplicates across variations
 * (e.g. "Softly", "SOFTLY KARAN AUJLA", "Softly (Official Music Video)", "Softly - Lyrical").
 */
export function normalizeSongTitle(title: string, artist?: string): string {
  let s = (title || "").toLowerCase();

  // Strip pipe or bullet suffix additions (e.g. "| Official Video | Ikky")
  s = s.split(/\s*[|•]\s*/)[0];

  // Strip artist name if embedded in title (e.g. "SOFTLY KARAN AUJLA" -> "softly")
  if (artist && artist.trim().length >= 3) {
    const escaped = artist
      .trim()
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "");
  }

  // Strip common YouTube audio/video badges, parentheticals, and extra punctuation
  s = s
    .replace(/\s*[-–—:]\s*(lyrical|official|video|audio|full song|song).*/i, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/feat\..*|ft\..*/i, "")
    .replace(/official\s+(music\s+)?(video|audio|track)/gi, "")
    .replace(/lyric(al)?\s+(video|song|audio)/gi, "")
    .replace(/full\s+(audio|video|song)/gi, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return s;
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
    /music|records|company|entertainment|films|official|tseries|vevo/i.test(authorLower);

  // If track.artist is already a clean personal artist and not a generic channel/label
  if (
    !isLabel &&
    track.artist &&
    track.artist !== "Unknown Artist" &&
    track.artist !== "Various Artists" &&
    track.artist !== "KK" // Guard against previous false "KK" attributions
  ) {
    return track.artist;
  }

  // Check specific artist names in order of specificity (longer names first)
  if (matchesWordBoundary(titleLower, "karan aujla")) return "Karan Aujla";
  if (
    matchesWordBoundary(titleLower, "sidhu moose wala") ||
    matchesWordBoundary(titleLower, "sidhu moosewala") ||
    matchesWordBoundary(titleLower, "sidhu")
  )
    return "Sidhu Moose Wala";
  if (matchesWordBoundary(titleLower, "diljit dosanjh") || matchesWordBoundary(titleLower, "diljit"))
    return "Diljit Dosanjh";
  if (matchesWordBoundary(titleLower, "ap dhillon")) return "AP Dhillon";
  if (
    matchesWordBoundary(titleLower, "arijit singh") ||
    matchesWordBoundary(titleLower, "arjit singh") ||
    matchesWordBoundary(titleLower, "arijit") ||
    matchesWordBoundary(titleLower, "arjit")
  )
    return "Arijit Singh";
  if (matchesWordBoundary(titleLower, "atif aslam") || matchesWordBoundary(titleLower, "atif")) return "Atif Aslam";
  if (matchesWordBoundary(titleLower, "mohit chauhan")) return "Mohit Chauhan";
  if (matchesWordBoundary(titleLower, "shreya ghoshal") || matchesWordBoundary(titleLower, "shreya"))
    return "Shreya Ghoshal";
  if (matchesWordBoundary(titleLower, "sonu nigam")) return "Sonu Nigam";
  if (matchesWordBoundary(titleLower, "jubin nautiyal") || matchesWordBoundary(titleLower, "jubin"))
    return "Jubin Nautiyal";
  if (matchesWordBoundary(titleLower, "roop kumar")) return "Roop Kumar Rathod";
  if (matchesWordBoundary(titleLower, "jagjit singh") || matchesWordBoundary(titleLower, "jagjit"))
    return "Jagjit Singh";
  if (matchesWordBoundary(titleLower, "lata mangeshkar") || matchesWordBoundary(titleLower, "lata"))
    return "Lata Mangeshkar";
  if (matchesWordBoundary(titleLower, "kishore kumar") || matchesWordBoundary(titleLower, "kishore"))
    return "Kishore Kumar";
  if (
    matchesWordBoundary(titleLower, "mohammed rafi") ||
    matchesWordBoundary(titleLower, "mohd rafi") ||
    matchesWordBoundary(titleLower, "rafi")
  )
    return "Mohammed Rafi";
  if (matchesWordBoundary(titleLower, "the weeknd") || matchesWordBoundary(titleLower, "weeknd")) return "The Weeknd";
  if (matchesWordBoundary(titleLower, "daft punk")) return "Daft Punk";
  // Word boundary for KK so "ikky", "chakk", etc. never match KK
  if (matchesWordBoundary(titleLower, "kk") || matchesWordBoundary(titleLower, "k.k.")) return "KK";

  // Check title against all catalog artists (longer names first)
  const catalogSorted = [...ARTISTS_CATALOG].sort((a, b) => b.name.length - a.name.length);
  for (const a of catalogSorted) {
    if (matchesWordBoundary(titleLower, a.name.toLowerCase())) {
      return a.name;
    }
  }

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
export async function findSimilarTrack(options: FindSimilarOptions): Promise<SimilarTrackResult | null> {
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

  // Build exclusion set of normalized titles across current track, queue, and history
  const excludedTitles = new Set<string>();
  const addExcludedTitle = (t: Track) => {
    const norm = normalizeSongTitle(t.title, t.artist);
    if (norm) excludedTitles.add(norm);
    const pure = clean(t.title);
    if (pure) excludedTitles.add(pure);
  };

  addExcludedTitle(currentTrack);
  for (const t of existingQueue) {
    addExcludedTitle(t);
  }
  for (const t of history) {
    addExcludedTitle(t);
  }

  const isDuplicateCandidate = (candidate: Track): boolean => {
    if (excludedIds.has(candidate.id)) return true;

    const candNorm = normalizeSongTitle(candidate.title, candidate.artist || effectiveArtist);
    const candPure = clean(candidate.title);

    if (candNorm && excludedTitles.has(candNorm)) return true;
    if (candPure && excludedTitles.has(candPure)) return true;

    for (const excluded of excludedTitles) {
      if (candNorm && excluded) {
        if (candNorm === excluded) return true;
        if (candNorm.length >= 4 && excluded.length >= 4) {
          if (candNorm.startsWith(excluded) || excluded.startsWith(candNorm)) {
            return true;
          }
        }
      }
    }
    return false;
  };

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
    typeof fetchFn === "function" && typeof globalThis !== "undefined" && fetchFn !== globalThis.fetch;

  const canPerformFetch =
    !!fetchFn && (isCustomMock || (!isTestEnv && (typeof window !== "undefined" || searchApiUrl.startsWith("http"))));

  // --------------------------------------------------------------------------
  // Tier 1: Check if the SAME ARTIST is in ARTISTS_CATALOG and has unplayed tracks
  // --------------------------------------------------------------------------
  const matchingArtist = ARTISTS_CATALOG.find((a) => {
    const aClean = clean(a.name);
    return cleanArtist.includes(aClean) || aClean.includes(cleanArtist && cleanArtist.length > 3 ? cleanArtist : "___");
  });

  if (matchingArtist) {
    const unqueuedTracks = matchingArtist.topTracks.filter((t) => !isDuplicateCandidate(t));
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
  if (
    canPerformFetch &&
    effectiveArtist &&
    effectiveArtist !== "Various Artists" &&
    effectiveArtist !== "Unknown Artist"
  ) {
    try {
      const sameArtistQuery = `${effectiveArtist} best songs`;
      const res = await fetchFn(`${searchApiUrl}?q=${encodeURIComponent(sameArtistQuery)}&limit=15&sort=views`);

      if (res.ok) {
        const data = (await res.json()) as { tracks?: Track[] };
        const fetchedTracks = data.tracks || [];

        // Find candidate that matches the SAME ARTIST and is not in queue/history
        const sameArtistCandidate = fetchedTracks.find((t) => {
          if (isDuplicateCandidate(t)) return false;
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
          // Normalize artist name so label channels or previous KK leaks don't appear in UI
          if (
            !sameArtistCandidate.artist ||
            sameArtistCandidate.artist === "Various Artists" ||
            sameArtistCandidate.artist === "Unknown Artist" ||
            sameArtistCandidate.artist === "KK" ||
            RECORD_LABELS.some((l) => (sameArtistCandidate.artist || "").toLowerCase().includes(l))
          ) {
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
      const candidateTracks = peerCatalogArtist.topTracks.filter((t) => !isDuplicateCandidate(t));
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
    const candidateTracks = artist.topTracks.filter((t) => !isDuplicateCandidate(t));
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
      const query =
        detectedGenre !== "other" ? `best ${detectedGenre} songs` : `${effectiveArtist || currentTrack.title} music`;

      const res = await fetchFn(`${searchApiUrl}?q=${encodeURIComponent(query)}&limit=10&sort=views`);
      if (res.ok) {
        const data = (await res.json()) as { tracks?: Track[] };
        const fetchedTracks = data.tracks || [];

        const liveCandidate = fetchedTracks.find(
          (t) => !isDuplicateCandidate(t) && t.durationMs >= 50000 && t.durationMs <= 720000
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
    const candidate = artist.topTracks.find((t) => !isDuplicateCandidate(t));
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
