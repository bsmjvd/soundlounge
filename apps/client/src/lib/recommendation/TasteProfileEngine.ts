import type { Track, Album } from "@soundlounge/shared";
import {
  type MusicGenre,
  classifyGenre,
  getPeerArtistsForArtist,
  getPeerArtistsForGenre,
  GENRE_DEFINITIONS,
} from "./genreTaxonomy";
import { resolveEffectiveArtist, normalizeSongTitle } from "./SimilarTracksEngine";
import { ARTISTS_CATALOG, type ArtistProfileData } from "../data/artistsCatalog";
import { ALBUMS_CATALOG } from "../data/albumsCatalog";
import { type DisplayAlbum, type DisplayArtist, type FeaturedSpotlight, FEATURED_SPOTLIGHTS } from "../data/mockupData";

export interface ArtistAffinity {
  artistName: string;
  score: number;
  playCount: number;
  likeCount: number;
  lastInteractedAt: number;
}

export interface GenreAffinity {
  genre: MusicGenre;
  label: string;
  score: number;
  playCount: number;
  lastInteractedAt: number;
}

export interface StoredTasteProfile {
  artistAffinities: Record<string, ArtistAffinity>;
  genreAffinities: Record<string, GenreAffinity>;
  recentTracks: Track[];
  likedTrackIds: string[];
  totalInteractions: number;
  lastActiveTimestamp: number;
}

const STORAGE_KEY = "soundlounge_user_taste_v2";

// Affinity scores decay over time so recent listening outweighs old habits
// (an artist interacted with a week ago counts for half of one played today).
const AFFINITY_HALF_LIFE_DAYS = 7;

// How strongly recommendations favor what was heard recently, and how much
// deterministic per-day rotation is mixed in so the list keeps evolving.
const RECENT_WARMTH_WEIGHT = 4;
const ROTATION_JITTER_WEIGHT = 3;

// Diversity caps inside the sidebar recommendation list
const MAX_TRACKS_PER_ARTIST = 2;
const MAX_TRACKS_PER_GENRE = 4;
const SIDEBAR_TRACK_LIMIT = 10;

// Memory storage fallback for SSR or environments where window.localStorage is not present
const memoryStorage = new Map<string, string>();

function getStorageItem(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  }
  return memoryStorage.get(key) ?? null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {}
  }
  memoryStorage.set(key, value);
}

// Initial state
function createDefaultProfile(): StoredTasteProfile {
  return {
    artistAffinities: {},
    genreAffinities: {},
    recentTracks: [],
    likedTrackIds: [],
    totalInteractions: 0,
    lastActiveTimestamp: Date.now(),
  };
}

export type TasteListener = (profile: StoredTasteProfile) => void;

/**
 * High-performance, persistent taste profile manager that mirrors modern streaming
 * recommendation engines (YouTube Music / Spotify).
 */
export class TasteProfileEngine {
  private static instance: TasteProfileEngine | null = null;
  private profile: StoredTasteProfile;
  private listeners: Set<TasteListener> = new Set();

  private constructor() {
    this.profile = this.loadFromStorage();
  }

  public static getInstance(): TasteProfileEngine {
    if (!TasteProfileEngine.instance) {
      TasteProfileEngine.instance = new TasteProfileEngine();
    }
    return TasteProfileEngine.instance;
  }

  /**
   * Resets singleton for testing purposes.
   */
  public static resetInstance(): void {
    TasteProfileEngine.instance = null;
  }

  private loadFromStorage(): StoredTasteProfile {
    const raw = getStorageItem(STORAGE_KEY);
    if (!raw) return createDefaultProfile();
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          artistAffinities: parsed.artistAffinities || {},
          genreAffinities: parsed.genreAffinities || {},
          recentTracks: Array.isArray(parsed.recentTracks) ? parsed.recentTracks : [],
          likedTrackIds: Array.isArray(parsed.likedTrackIds) ? parsed.likedTrackIds : [],
          totalInteractions: typeof parsed.totalInteractions === "number" ? parsed.totalInteractions : 0,
          lastActiveTimestamp: typeof parsed.lastActiveTimestamp === "number" ? parsed.lastActiveTimestamp : Date.now(),
        };
      }
    } catch (e) {
      console.warn("Failed to parse stored taste profile:", e);
    }
    return createDefaultProfile();
  }

  private saveToStorage(): void {
    try {
      setStorageItem(STORAGE_KEY, JSON.stringify(this.profile));
      this.notifyListeners();
    } catch (e) {
      console.warn("Failed to persist taste profile:", e);
    }
  }

  public subscribe(listener: TasteListener): () => void {
    this.listeners.add(listener);
    // Call immediately with current state
    listener(this.profile);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.profile);
      } catch (err) {
        console.error("Error in taste listener:", err);
      }
    }
  }

  public getProfile(): StoredTasteProfile {
    return this.profile;
  }

  /**
   * Determines if the user has any explicit listening history or taste signal.
   */
  public hasTasteProfile(): boolean {
    return (
      this.profile.totalInteractions > 0 ||
      Object.keys(this.profile.artistAffinities).length > 0 ||
      this.profile.recentTracks.length > 0
    );
  }

  /**
   * Records a track playback event, adding strong affinity to the artist and genre.
   */
  public recordPlay(track: Track): void {
    if (!track) return;
    const now = Date.now();
    const effectiveArtist = resolveEffectiveArtist(track);
    const classification = classifyGenre({
      title: track.title,
      artist: effectiveArtist,
    });
    const detectedGenre = classification.genre;

    // Update Artist Affinity
    if (effectiveArtist && effectiveArtist !== "Unknown Artist" && effectiveArtist !== "Various Artists") {
      const existing = this.profile.artistAffinities[effectiveArtist] || {
        artistName: effectiveArtist,
        score: 0,
        playCount: 0,
        likeCount: 0,
        lastInteractedAt: now,
      };
      existing.score += 2.5; // Significant weight for playback
      existing.playCount += 1;
      existing.lastInteractedAt = now;
      this.profile.artistAffinities[effectiveArtist] = existing;
    }

    // Update Genre Affinity
    if (detectedGenre && detectedGenre !== "other") {
      const genreDef = GENRE_DEFINITIONS[detectedGenre];
      const existingG = this.profile.genreAffinities[detectedGenre] || {
        genre: detectedGenre,
        label: genreDef?.label || detectedGenre.toUpperCase(),
        score: 0,
        playCount: 0,
        lastInteractedAt: now,
      };
      existingG.score += 2.0;
      existingG.playCount += 1;
      existingG.lastInteractedAt = now;
      this.profile.genreAffinities[detectedGenre] = existingG;
    }

    // Update Recent Tracks (de-duplicate by track ID and normalized title)
    const normTitle = normalizeSongTitle(track.title, track.artist);
    const filteredRecent = this.profile.recentTracks.filter(
      (t) => t.id !== track.id && normalizeSongTitle(t.title, t.artist) !== normTitle
    );
    this.profile.recentTracks = [track, ...filteredRecent].slice(0, 30);
    this.profile.totalInteractions += 1;
    this.profile.lastActiveTimestamp = now;

    this.saveToStorage();
  }

  /**
   * Records a like/favorite toggle, giving a high +4.0 weight to the artist and genre.
   */
  public recordLike(track: Track, isLikedNow: boolean): void {
    if (!track) return;
    const now = Date.now();
    const effectiveArtist = resolveEffectiveArtist(track);
    const classification = classifyGenre({
      title: track.title,
      artist: effectiveArtist,
    });
    const detectedGenre = classification.genre;

    if (isLikedNow) {
      if (!this.profile.likedTrackIds.includes(track.id)) {
        this.profile.likedTrackIds.push(track.id);
      }
      if (effectiveArtist && effectiveArtist !== "Unknown Artist") {
        const existing = this.profile.artistAffinities[effectiveArtist] || {
          artistName: effectiveArtist,
          score: 0,
          playCount: 0,
          likeCount: 0,
          lastInteractedAt: now,
        };
        existing.score += 4.0;
        existing.likeCount += 1;
        existing.lastInteractedAt = now;
        this.profile.artistAffinities[effectiveArtist] = existing;
      }
      if (detectedGenre && detectedGenre !== "other") {
        const genreDef = GENRE_DEFINITIONS[detectedGenre];
        const existingG = this.profile.genreAffinities[detectedGenre] || {
          genre: detectedGenre,
          label: genreDef?.label || detectedGenre.toUpperCase(),
          score: 0,
          playCount: 0,
          lastInteractedAt: now,
        };
        existingG.score += 3.5;
        existingG.lastInteractedAt = now;
        this.profile.genreAffinities[detectedGenre] = existingG;
      }
    } else {
      this.profile.likedTrackIds = this.profile.likedTrackIds.filter((id) => id !== track.id);
      if (this.profile.artistAffinities[effectiveArtist]) {
        this.profile.artistAffinities[effectiveArtist].score = Math.max(
          0,
          this.profile.artistAffinities[effectiveArtist].score - 3.0
        );
      }
    }

    this.profile.totalInteractions += 1;
    this.profile.lastActiveTimestamp = now;
    this.saveToStorage();
  }

  /**
   * Records an explicit search query for an artist or genre, boosting initial affinity.
   */
  public recordSearch(query: string): void {
    if (!query || query.trim().length < 2) return;
    const cleanQuery = query.toLowerCase().trim();
    const now = Date.now();

    // Check if query matches a catalog artist
    for (const a of ARTISTS_CATALOG) {
      if (a.name.toLowerCase().includes(cleanQuery) || cleanQuery.includes(a.name.toLowerCase())) {
        const existing = this.profile.artistAffinities[a.name] || {
          artistName: a.name,
          score: 0,
          playCount: 0,
          likeCount: 0,
          lastInteractedAt: now,
        };
        existing.score += 1.5;
        existing.lastInteractedAt = now;
        this.profile.artistAffinities[a.name] = existing;

        if (a.region && a.region !== "all" && a.region !== "global") {
          const gKey = a.region as MusicGenre;
          const genreDef = GENRE_DEFINITIONS[gKey];
          if (genreDef) {
            const existingG = this.profile.genreAffinities[gKey] || {
              genre: gKey,
              label: genreDef.label,
              score: 0,
              playCount: 0,
              lastInteractedAt: now,
            };
            existingG.score += 1.5;
            existingG.lastInteractedAt = now;
            this.profile.genreAffinities[gKey] = existingG;
          }
        }
      }
    }

    this.profile.totalInteractions += 1;
    this.profile.lastActiveTimestamp = now;
    this.saveToStorage();
  }

  /**
   * Records an explicit artist profile exploration.
   */
  public recordArtistView(artistName: string): void {
    if (!artistName) return;
    const now = Date.now();
    const existing = this.profile.artistAffinities[artistName] || {
      artistName,
      score: 0,
      playCount: 0,
      likeCount: 0,
      lastInteractedAt: now,
    };
    existing.score += 1.2;
    existing.lastInteractedAt = now;
    this.profile.artistAffinities[artistName] = existing;

    const catalogMatch = ARTISTS_CATALOG.find(
      (a) => a.name.toLowerCase() === artistName.toLowerCase()
    );
    if (catalogMatch && catalogMatch.region && catalogMatch.region !== "all" && catalogMatch.region !== "global") {
      const g = catalogMatch.region as MusicGenre;
      const genreDef = GENRE_DEFINITIONS[g];
      if (genreDef) {
        const existingG = this.profile.genreAffinities[g] || {
          genre: g,
          label: genreDef.label,
          score: 0,
          playCount: 0,
          lastInteractedAt: now,
        };
        existingG.score += 1.2;
        existingG.lastInteractedAt = now;
        this.profile.genreAffinities[g] = existingG;
      }
    }

    this.profile.totalInteractions += 1;
    this.profile.lastActiveTimestamp = now;
    this.saveToStorage();
  }

  /**
   * Returns top artists ordered by affinity score, with time decay so recent
   * interactions dominate: score halves roughly every AFFINITY_HALF_LIFE_DAYS.
   */
  public getTopArtists(limit = 10): ArtistAffinity[] {
    return Object.values(this.profile.artistAffinities)
      .sort(
        (a, b) =>
          TasteProfileEngine.effectiveAffinity(b) - TasteProfileEngine.effectiveAffinity(a) ||
          b.lastInteractedAt - a.lastInteractedAt
      )
      .slice(0, limit);
  }

  /**
   * Returns top genres ordered by affinity score with the same time decay.
   */
  public getTopGenres(limit = 5): GenreAffinity[] {
    return Object.values(this.profile.genreAffinities)
      .sort(
        (a, b) =>
          TasteProfileEngine.effectiveAffinity(b) - TasteProfileEngine.effectiveAffinity(a) ||
          b.lastInteractedAt - a.lastInteractedAt
      )
      .slice(0, limit);
  }

  /** Exponential time decay applied at read time; raw stored scores stay intact. */
  private static effectiveAffinity(entry: { score: number; lastInteractedAt: number }): number {
    const days = Math.max(0, (Date.now() - entry.lastInteractedAt) / 86400000);
    return entry.score * Math.pow(0.5, days / AFFINITY_HALF_LIFE_DAYS);
  }

  /**
   * Returns user's primary dominant artist or null.
   */
  public getDominantArtist(): string | null {
    const top = this.getTopArtists(1);
    return top.length > 0 ? top[0].artistName : null;
  }

  /**
   * Returns user's primary dominant music genre or null.
   */
  public getDominantGenre(): MusicGenre | null {
    const top = this.getTopGenres(1);
    return top.length > 0 ? top[0].genre : null;
  }

  /**
   * Dynamically re-ranks an array of artists so user's favorite artists appear first,
   * followed by peer artists in their dominant genres, followed by others.
   */
  public rankArtists(artists: ArtistProfileData[]): ArtistProfileData[] {
    const topArtists = this.getTopArtists(15);
    const topGenres = this.getTopGenres(3).map((g) => g.genre);

    if (topArtists.length === 0 && topGenres.length === 0) {
      return artists;
    }

    const artistScores = new Map<string, number>();

    // 1. Assign explicit affinity score
    topArtists.forEach((a, idx) => {
      artistScores.set(a.artistName.toLowerCase(), 1000 - idx * 20 + a.score);
    });

    // 2. Assign peer genre score
    topGenres.forEach((g, gIdx) => {
      const peerNames = getPeerArtistsForGenre(g);
      peerNames.forEach((peer, pIdx) => {
        const key = peer.toLowerCase();
        if (!artistScores.has(key)) {
          artistScores.set(key, 500 - gIdx * 50 - pIdx * 10);
        }
      });
    });

    return [...artists].sort((a, b) => {
      const scoreA = artistScores.get(a.name.toLowerCase()) ?? 0;
      const scoreB = artistScores.get(b.name.toLowerCase()) ?? 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return 0;
    });
  }

  /**
   * Dynamically re-ranks an array of DisplayArtists (for PopularArtistsRow).
   */
  public rankDisplayArtists(artists: DisplayArtist[]): DisplayArtist[] {
    const topArtists = this.getTopArtists(15);
    const topGenres = this.getTopGenres(3).map((g) => g.genre);

    if (topArtists.length === 0 && topGenres.length === 0) {
      return artists;
    }

    const artistScores = new Map<string, number>();

    topArtists.forEach((a, idx) => {
      artistScores.set(a.artistName.toLowerCase(), 1000 - idx * 20 + a.score);
    });

    topGenres.forEach((g, gIdx) => {
      const peerNames = getPeerArtistsForGenre(g);
      peerNames.forEach((peer, pIdx) => {
        const key = peer.toLowerCase();
        if (!artistScores.has(key)) {
          artistScores.set(key, 500 - gIdx * 50 - pIdx * 10);
        }
      });
    });

    return [...artists].sort((a, b) => {
      const scoreA = artistScores.get(a.name.toLowerCase()) ?? 0;
      const scoreB = artistScores.get(b.name.toLowerCase()) ?? 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Dynamically re-ranks albums so albums matching the user's favorite artists and genres
   * appear at the beginning of the list.
   */
  public rankAlbums<T extends Album | DisplayAlbum>(albums: T[]): T[] {
    const topArtists = this.getTopArtists(10);
    const topGenres = this.getTopGenres(3).map((g) => g.genre);

    if (topArtists.length === 0 && topGenres.length === 0) {
      return albums;
    }

    const artistSet = new Set(topArtists.map((a) => a.artistName.toLowerCase()));

    return [...albums].sort((a, b) => {
      const artistA = (
        ("artist" in a && typeof a.artist === "string" ? a.artist : "") ||
        ("primaryArtist" in a && typeof (a as Album).primaryArtist === "string" ? (a as Album).primaryArtist : "") ||
        ""
      ).toLowerCase();
      const artistB = (
        ("artist" in b && typeof b.artist === "string" ? b.artist : "") ||
        ("primaryArtist" in b && typeof (b as Album).primaryArtist === "string" ? (b as Album).primaryArtist : "") ||
        ""
      ).toLowerCase();

      // Check artist match
      const aMatchesArtist = Array.from(artistSet).some((name) => artistA.includes(name));
      const bMatchesArtist = Array.from(artistSet).some((name) => artistB.includes(name));

      if (aMatchesArtist && !bMatchesArtist) return -1;
      if (!aMatchesArtist && bMatchesArtist) return 1;

      // Check genre match
      const genresA = (("genres" in a && Array.isArray((a as Album).genres) ? (a as Album).genres : []) || []).map((g) =>
        g.toLowerCase()
      );
      const genresB = (("genres" in b && Array.isArray((b as Album).genres) ? (b as Album).genres : []) || []).map((g) =>
        g.toLowerCase()
      );

      const aMatchesGenre = topGenres.some((tg) => genresA.some((g) => g.includes(tg)));
      const bMatchesGenre = topGenres.some((tg) => genresB.some((g) => g.includes(tg)));

      if (aMatchesGenre && !bMatchesGenre) return -1;
      if (!aMatchesGenre && bMatchesGenre) return 1;

      return 0;
    });
  }

  /**
   * Generates the hero spotlight slides. Instead of one static lineup, slides
   * are generated from the whole artist catalog and ranked by the user's
   * time-decayed taste, with a small per-day rotation so the hero keeps
   * evolving. The curated brand spotlights are kept at the tail.
   */
  public getPersonalizedSpotlights(): FeaturedSpotlight[] {
    const topArtists = this.getTopArtists(10);
    const topGenres = this.getTopGenres(3);

    const daySeed = Math.floor(Date.now() / 86400000);
    const jitterFor = (id: string) => {
      let h = daySeed;
      for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
      return (h % 1000) / 1000;
    };

    const artistScore = new Map<string, number>();
    topArtists.forEach((t, idx) => {
      artistScore.set(t.artistName.toLowerCase(), 1000 - idx * 10);
    });
    topGenres.forEach((g, gIdx) => {
      for (const a of ARTISTS_CATALOG) {
        if (a.region === g.genre) {
          const key = a.name.toLowerCase();
          if (!artistScore.has(key)) {
            artistScore.set(key, 500 - gIdx * 50);
          }
        }
      }
    });

    const accentPalette = ["#f59e0b", "#ef4444", "#00e5c9", "#a855f7", "#38bdf8", "#f43f5e", "#22c55e", "#eab308", "#818cf8", "#fb923c"];

    const artistSpotlights = ARTISTS_CATALOG.filter(
      (a) => a.topTracks.length > 0 && (a.bannerUrl || a.avatarUrl)
    ).map((a, idx): { spotlight: FeaturedSpotlight; score: number } => ({
      spotlight: {
        id: `artist_${a.id || a.name.toLowerCase().replace(/\s+/g, "_")}`,
        tagline: a.monthlyListeners ? `${a.monthlyListeners} monthly listeners` : a.regionLabel || a.genre,
        title: a.name,
        subtitle: a.genre,
        description: a.bio,
        artistName: a.name,
        heroImageUrl: a.bannerUrl || a.avatarUrl || "",
        accentColor: accentPalette[idx % accentPalette.length],
        mainTrack: a.topTracks[0],
      },
      score: artistScore.get(a.name.toLowerCase()) ?? 0,
    }));

    artistSpotlights.sort(
      (a, b) => b.score - a.score || jitterFor(b.spotlight.id) - jitterFor(a.spotlight.id)
    );

    // Fresh artist spotlights lead; the curated brand slides stay at the tail
    return [...artistSpotlights.slice(0, 8).map((s) => s.spotlight), ...FEATURED_SPOTLIGHTS];
  }

  /**
   * Generates a tailored track list based on user taste:
   * "Because You Listened To [Artist]"
   */
  public getBecauseYouListenedSection(): {
    title: string;
    subtitle: string;
    tracks: Track[];
  } | null {
    const dominantArtist = this.getDominantArtist();
    const dominantGenre = this.getDominantGenre();

    if (!dominantArtist && !dominantGenre) return null;

    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const seenCovers = new Set<string>();
    const artistTrackCount = new Map<string, number>();
    const tracks: Track[] = [];

    const addTrack = (t: Track, maxPerArtist: number = 2) => {
      if (!t) return;
      const norm = normalizeSongTitle(t.title, t.artist);
      const cleanCover = (t.coverUrl || "").trim();
      const artKey = (t.artist || "").toLowerCase().trim();

      if (seenIds.has(t.id)) return;
      if (norm && seenTitles.has(norm)) return;
      // Guarantee no duplicate identical cover artwork side-by-side
      if (cleanCover && seenCovers.has(cleanCover)) return;

      const currentArtistCount = artistTrackCount.get(artKey) || 0;
      if (currentArtistCount >= maxPerArtist) return;

      seenIds.add(t.id);
      if (norm) seenTitles.add(norm);
      if (cleanCover) seenCovers.add(cleanCover);
      artistTrackCount.set(artKey, currentArtistCount + 1);
      tracks.push(t);
    };

    // 1. Featured tracks from dominant artist (up to 2 unique tracks with distinct covers)
    if (dominantArtist) {
      const artistMatch = ARTISTS_CATALOG.find(
        (a) =>
          a.name.toLowerCase() === dominantArtist.toLowerCase() ||
          dominantArtist.toLowerCase().includes(a.name.toLowerCase()) ||
          a.name.toLowerCase().includes(dominantArtist.toLowerCase())
      );
      if (artistMatch) {
        artistMatch.topTracks.slice(0, 4).forEach((t) => addTrack(t, 2));
      }

      // 2. Peer artists: Pass 1 — add 1 distinct track per peer artist for maximum diversity
      const peerNames = getPeerArtistsForArtist(dominantArtist);
      for (const peer of peerNames) {
        if (tracks.length >= 8) break;
        const peerArtist = ARTISTS_CATALOG.find(
          (a) => a.name.toLowerCase() === peer.toLowerCase()
        );
        if (peerArtist && peerArtist.topTracks.length > 0) {
          addTrack(peerArtist.topTracks[0], 1);
        }
      }

      // Pass 2: If still room, add secondary tracks from peers with distinct covers
      if (tracks.length < 8) {
        for (const peer of peerNames) {
          if (tracks.length >= 8) break;
          const peerArtist = ARTISTS_CATALOG.find(
            (a) => a.name.toLowerCase() === peer.toLowerCase()
          );
          if (peerArtist && peerArtist.topTracks.length > 1) {
            addTrack(peerArtist.topTracks[1], 2);
          }
        }
      }
    }

    // 3. Fallback to dominant genre peers (1 distinct track per artist)
    if (tracks.length < 5 && dominantGenre) {
      const genrePeers = getPeerArtistsForGenre(dominantGenre);
      for (const peer of genrePeers) {
        if (tracks.length >= 8) break;
        const peerArtist = ARTISTS_CATALOG.find(
          (a) => a.name.toLowerCase() === peer.toLowerCase()
        );
        if (peerArtist && peerArtist.topTracks.length > 0) {
          addTrack(peerArtist.topTracks[0], 1);
        }
      }
    }

    if (tracks.length === 0) return null;

    const title = dominantArtist
      ? `Because you listened to ${dominantArtist}`
      : `Made For You • ${dominantGenre ? dominantGenre.toUpperCase() : "Soundscape"} Mix`;

    const subtitle = dominantArtist
      ? `Top tracks & musical peers inspired by your taste`
      : `Tailored selections based on your recent listening`;

    return { title, subtitle, tracks };
  }

  /**
   * Generates dynamic sidebar recommended tracks matching user's taste.
   *
   * Works like a lightweight discovery feed: candidates come from the whole
   * catalog, are scored against time-decayed artist/genre affinities plus
   * "warm" artists from recent listening, skip tracks the user already played,
   * and get a small deterministic per-day jitter so the list keeps rotating
   * (more like what you heard this week, different every day).
   */
  public getSidebarRecommendedTracks(): Track[] {
    const topArtists = this.getTopArtists(10);
    const topGenres = this.getTopGenres(3);
    const recentTracks = this.profile.recentTracks;

    if (topArtists.length === 0 && topGenres.length === 0) {
      // No taste signal yet: a diverse cross-genre starter set from the catalog
      const starterTracks: Track[] = [];
      for (const a of ARTISTS_CATALOG.slice(0, 8)) {
        if (a.topTracks.length > 0) {
          starterTracks.push(a.topTracks[0]);
        }
      }
      return starterTracks;
    }

    const maxArtistScore = TasteProfileEngine.effectiveAffinity(topArtists[0]) || 1;
    const maxGenreScore = TasteProfileEngine.effectiveAffinity(topGenres[0]) || 1;
    const recentArtistNames = new Set(recentTracks.map((t) => resolveEffectiveArtist(t).toLowerCase()));

    const playedIds = new Set(recentTracks.map((t) => t.id));
    const playedTitles = new Set(
      recentTracks.map((t) => normalizeSongTitle(t.title, t.artist)).filter(Boolean)
    );

    const genreAffinityByGenre = new Map(topGenres.map((g) => [g.genre, g]));
    const daySeed = Math.floor(Date.now() / 86400000);
    const jitterFor = (id: string) => {
      let h = daySeed;
      for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
      return (h % 1000) / 1000;
    };

    interface ScoredCandidate {
      track: Track;
      artistName: string;
      genre: MusicGenre | "other";
      score: number;
    }

    const candidates: ScoredCandidate[] = [];
    for (const artist of ARTISTS_CATALOG) {
      for (const track of artist.topTracks) {
        if (playedIds.has(track.id)) continue;
        const norm = normalizeSongTitle(track.title, track.artist);
        if (norm && playedTitles.has(norm)) continue;

        // Artist affinity: exact catalog name first, then affinity entries
        // whose name appears in the track's artist field (features etc.)
        const trackArtistLower = artist.name.toLowerCase();
        let artistScore = 0;
        const directAffinity = this.profile.artistAffinities[artist.name];
        if (directAffinity) {
          artistScore = TasteProfileEngine.effectiveAffinity(directAffinity) / maxArtistScore;
        } else {
          for (const a of topArtists) {
            if (trackArtistLower.includes(a.artistName.toLowerCase())) {
              artistScore = Math.max(
                artistScore,
                (TasteProfileEngine.effectiveAffinity(a) / maxArtistScore) * 0.8
              );
            }
          }
        }

        // Genre affinity from what's playing these days
        const genre = classifyGenre({ title: track.title, artist: artist.name }).genre;
        let genreScore = 0;
        const genreAffinity = genreAffinityByGenre.get(genre);
        if (genreAffinity) {
          genreScore = TasteProfileEngine.effectiveAffinity(genreAffinity) / maxGenreScore;
        }

        // Warmth: artists heard recently (even without affinity entries) get a nudge
        const warmth = recentArtistNames.has(trackArtistLower) ? 1 : 0;

        const score =
          artistScore * 40 + genreScore * 25 + warmth * RECENT_WARMTH_WEIGHT + jitterFor(track.id) * ROTATION_JITTER_WEIGHT;

        candidates.push({ track, artistName: artist.name, genre, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    const picked: Track[] = [];
    const perArtist = new Map<string, number>();
    const perGenre = new Map<string, number>();
    for (const candidate of candidates) {
      if (picked.length >= SIDEBAR_TRACK_LIMIT) break;
      const artistCount = perArtist.get(candidate.artistName) || 0;
      if (artistCount >= MAX_TRACKS_PER_ARTIST) continue;
      const genreCount = perGenre.get(candidate.genre) || 0;
      if (genreCount >= MAX_TRACKS_PER_GENRE) continue;
      perArtist.set(candidate.artistName, artistCount + 1);
      perGenre.set(candidate.genre, genreCount + 1);
      picked.push(candidate.track);
    }

    return picked;
  }

  /**
   * Clears the taste profile (useful for settings / testing).
   */
  public clearProfile(): void {
    this.profile = createDefaultProfile();
    this.saveToStorage();
  }
}
