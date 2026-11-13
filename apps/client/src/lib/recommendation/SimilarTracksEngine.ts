import type { Track } from "@soundlounge/shared";
import { ARTISTS_CATALOG } from "../data/artistsCatalog";
import { classifyGenre, getPeerArtistsForArtist, getPeerArtistsForGenre, getLanguagesForGenre, type MusicGenre } from "./genreTaxonomy";
import { normalizeSongTitle } from "./normalizeTitle";

export interface FindSimilarOptions {
  currentTrack: Track;
  existingQueue: Track[];
  history?: Track[];
  /** Suggestions the user manually removed — never offered again this session. */
  rejectedTracks?: Track[];
  searchApiUrl?: string;
  relatedApiUrl?: string;
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
 * Extracts the raw YouTube video id from a track (id prefix or stream URL).
 */
function extractVideoIdFromTrack(track: Track): string | null {
  if (track.source !== "youtube") return null;
  if (track.id && track.id.startsWith("yt_")) return track.id.slice(3);
  const match = (track.url || "").match(/[?&]id=([\w-]+)/);
  return match ? match[1] : null;
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
  if (
    matchesWordBoundary(titleLower, "nusrat fateh ali khan") ||
    matchesWordBoundary(titleLower, "nusrat fateh ali") ||
    matchesWordBoundary(titleLower, "nusrat")
  )
    return "Nusrat Fateh Ali Khan";
  if (
    matchesWordBoundary(titleLower, "rahat fateh ali khan") ||
    matchesWordBoundary(titleLower, "rahat fateh ali") ||
    matchesWordBoundary(titleLower, "rahat")
  )
    return "Rahat Fateh Ali Khan";
  if (matchesWordBoundary(titleLower, "jagjit singh") || matchesWordBoundary(titleLower, "jagjit"))
    return "Jagjit Singh";
  if (matchesWordBoundary(titleLower, "mehdi hassan") || matchesWordBoundary(titleLower, "mehdi"))
    return "Mehdi Hassan";
  if (matchesWordBoundary(titleLower, "ghulam ali")) return "Ghulam Ali";
  if (matchesWordBoundary(titleLower, "pankaj udhas")) return "Pankaj Udhas";
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
    rejectedTracks = [],
    searchApiUrl = "/api/search",
    relatedApiUrl = "/api/related",
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
  // Tracks the user explicitly removed from the suggestions are never offered again
  for (const t of rejectedTracks) {
    if (!t) continue;
    excludedIds.add(t.id);
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

  // A candidate is "same artist" when artist or title clearly references the effective artist
  const isSameArtistCandidate = (candidate: Track): boolean => {
    const candidateCleanArtist = clean(candidate.artist);
    const candidateCleanTitleFull = clean(candidate.title);
    return (
      candidateCleanArtist.includes(cleanArtist) ||
      cleanArtist.includes(candidateCleanArtist) ||
      candidateCleanTitleFull.includes(cleanArtist)
    );
  };

  // A candidate has a trustworthy identity if its artist is a real performer (not a placeholder/label)
  const hasTrustedIdentity = (candidate: Track): boolean => {
    const artist = (candidate.artist || "").trim();
    if (!artist || artist === "Various Artists" || artist === "Unknown Artist") return false;
    return !RECORD_LABELS.some((l) => artist.toLowerCase().includes(l));
  };

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
          // A candidate can match through its title while carrying an unrelated
          // dictionary alias (e.g. a "KK" channel uploading a Karan Aujla song).
          // When the attributed artist isn't genuinely the effective artist,
          // re-attribute so the artist label and cover stay correct.
          if (!matchesWordBoundary(clean(sameArtistCandidate.artist), cleanArtist)) {
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
  // Tier 2.5: YouTube Music RELATED TRACKS (radio/autoplay) — YouTube's own
  // similarity signal, which naturally preserves genre, artist and language.
  // --------------------------------------------------------------------------
  const currentVideoId = extractVideoIdFromTrack(currentTrack);
  if (canPerformFetch && currentVideoId) {
    try {
      const res = await fetchFn(`${relatedApiUrl}?videoId=${encodeURIComponent(currentVideoId)}&limit=15`);

      if (res.ok) {
        const data = (await res.json()) as { tracks?: Track[] };
        const relatedTracks = (data.tracks || []).filter(
          (t) => !isDuplicateCandidate(t) && t.durationMs >= 50000 && t.durationMs <= 720000
        );

        // (a) Same artist first
        const relatedSameArtist = relatedTracks.find(isSameArtistCandidate);
        if (relatedSameArtist) {
          if (!hasTrustedIdentity(relatedSameArtist) || !matchesWordBoundary(clean(relatedSameArtist.artist), cleanArtist)) {
            relatedSameArtist.artist = effectiveArtist;
          }
          return {
            track: relatedSameArtist,
            matchType: "live_search",
            reason: `Same Artist: ${effectiveArtist}`,
          };
        }

        // (b) Same genre (when genre is known), then (c) any related track —
        // related-list results are inherently relevant to what's playing.
        const relatedCandidate =
          (detectedGenre !== "other"
            ? relatedTracks.find(
                (t) =>
                  !isSameArtistCandidate(t) &&
                  hasTrustedIdentity(t) &&
                  classifyGenre({ title: t.title, artist: t.artist }).genre === detectedGenre
              )
            : undefined) || relatedTracks.find((t) => !isSameArtistCandidate(t) && hasTrustedIdentity(t));

        if (relatedCandidate) {
          return {
            track: relatedCandidate,
            matchType: "live_search",
            reason: `Related to ${currentTrack.title}`,
          };
        }
      }
    } catch (err) {
      console.warn("Related tracks fetch error:", err);
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
  // Tier 4.5: FRESH RELEASES — brand-new songs in the current genre the
  // listener hasn't heard yet, ahead of generic genre-matched catalog tracks.
  // --------------------------------------------------------------------------
  if (canPerformFetch && detectedGenre !== "other") {
    try {
      const res = await fetchFn(`/api/new-releases?genre=${encodeURIComponent(detectedGenre)}&limit=12`);
      if (res.ok) {
        const data = (await res.json()) as { tracks?: Track[] };
        const freshCandidate = (data.tracks || []).find((t) => {
          if (isDuplicateCandidate(t)) return false;
          if (t.durationMs < 50000 || t.durationMs > 720000) return false;
          if (!hasTrustedIdentity(t)) return false;
          // A fresh release must genuinely belong to the genre being played
          return classifyGenre({ title: t.title, artist: t.artist }).genre === detectedGenre;
        });

        if (freshCandidate) {
          return {
            track: freshCandidate,
            matchType: "live_search",
            reason: `New ${detectedGenre.toUpperCase()} Release: ${freshCandidate.artist}`,
          };
        }
      }
    } catch (err) {
      console.warn("New releases fetch error:", err);
    }
  }

  // --------------------------------------------------------------------------
  // Tier 5: Dynamic YouTube Search Fallback for Genre (verified candidates only)
  // --------------------------------------------------------------------------
  if (canPerformFetch) {
    try {
      const genreLanguages = getLanguagesForGenre(detectedGenre);
      const query =
        detectedGenre !== "other"
          ? `best ${detectedGenre}${genreLanguages[0] ? ` ${genreLanguages[0]}` : ""} songs`
          : `${effectiveArtist || currentTrack.title} music`;

      const res = await fetchFn(`${searchApiUrl}?q=${encodeURIComponent(query)}&limit=10&sort=views`);
      if (res.ok) {
        const data = (await res.json()) as { tracks?: Track[] };
        const fetchedTracks = data.tracks || [];

        const liveCandidate = fetchedTracks.find((t) => {
          if (isDuplicateCandidate(t)) return false;
          if (t.durationMs < 50000 || t.durationMs > 720000) return false;
          // Never accept candidates without a verifiable real artist
          if (!hasTrustedIdentity(t)) return false;

          if (detectedGenre !== "other") {
            // The candidate must genuinely classify into the detected genre
            return classifyGenre({ title: t.title, artist: t.artist }).genre === detectedGenre;
          }

          // Genre unknown: require artist continuity, otherwise the result is
          // unrelated to what's playing and must be rejected
          return isSameArtistCandidate(t);
        });

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
  // Tier 6: Genre-Consistent Safety Fallback
  // (Prevents unrelated genres from appearing when current artist tracks are exhausted)
  // --------------------------------------------------------------------------

  // 6a. FIRST: catalog artists matching the CURRENT track's genre — what's
  // playing always wins over the user's historical taste.
  const sameGenreCatalog = ARTISTS_CATALOG.filter(
    (a) => a.region === detectedGenre || a.genre.toLowerCase().includes(detectedGenre)
  );
  for (const artist of sameGenreCatalog) {
    const candidate = artist.topTracks.find((t) => !isDuplicateCandidate(t));
    if (candidate) {
      return {
        track: candidate,
        matchType: "genre_match",
        reason: `Suggested ${detectedGenre.toUpperCase()}: ${candidate.artist}`,
      };
    }
  }

  // 6b/6c: taste-informed fallbacks — only meaningful when we couldn't detect
  // the current track's genre (otherwise they would ignore what's playing).
  if (detectedGenre === "other") {
    try {
      const { TasteProfileEngine } = await import("./TasteProfileEngine");
      const taste = TasteProfileEngine.getInstance();
      const userTopGenres = taste.getTopGenres(3).map((g) => g.genre);
      const userTopArtists = taste.getTopArtists(5).map((a) => a.artistName.toLowerCase());

      // 6b. Try catalog artists matching the user's known top genres
      for (const g of userTopGenres) {
        const gArtists = ARTISTS_CATALOG.filter(
          (a) => a.region === g || a.genre.toLowerCase().includes(g)
        );
        for (const artist of gArtists) {
          const candidate = artist.topTracks.find((t) => !isDuplicateCandidate(t));
          if (candidate) {
            return {
              track: candidate,
              matchType: "genre_match",
              reason: `From Your Taste in ${g.toUpperCase()}: ${candidate.artist}`,
            };
          }
        }
      }

      // 6c. Try catalog artists matching user's top artist affinities
      for (const artistName of userTopArtists) {
        const match = ARTISTS_CATALOG.find((a) => a.name.toLowerCase().includes(artistName));
        if (match) {
          const candidate = match.topTracks.find((t) => !isDuplicateCandidate(t));
          if (candidate) {
            return {
              track: candidate,
              matchType: "same_artist",
              reason: `Based on your favorite artist: ${candidate.artist}`,
            };
          }
        }
      }
    } catch {
      // TasteProfileEngine optional during isolated tests
    }

    // 6d. Absolute fallback (genre unknown only): pick from catalog rather
    // than suggesting nothing at all.
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
  }

  // Genre is known but nothing matching exists — do NOT seed an unrelated track.
  return null;
}

/**
 * Generates a batch of similar tracks (same artist first, then genre peers)
 * to seed an immediate rich queue when starting playback of a new song or artist.
 */
export async function findSimilarBatch(
  options: FindSimilarOptions,
  count: number = 4
): Promise<SimilarTrackResult[]> {
  const results: SimilarTrackResult[] = [];
  let currentQueue = [...options.existingQueue];

  for (let i = 0; i < count; i++) {
    const next = await findSimilarTrack({
      ...options,
      existingQueue: currentQueue,
    });
    if (!next || !next.track) break;
    results.push(next);
    currentQueue.push(next.track);
  }

  return results;
}
