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
   * Returns top artists ordered by affinity score.
   */
  public getTopArtists(limit = 10): ArtistAffinity[] {
    return Object.values(this.profile.artistAffinities)
      .sort((a, b) => b.score - a.score || b.lastInteractedAt - a.lastInteractedAt)
      .slice(0, limit);
  }

  /**
   * Returns top genres ordered by affinity score.
   */
  public getTopGenres(limit = 5): GenreAffinity[] {
    return Object.values(this.profile.genreAffinities)
      .sort((a, b) => b.score - a.score || b.lastInteractedAt - a.lastInteractedAt)
      .slice(0, limit);
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
   * Generates a personalized hero spotlight matching the user's dominant taste.
   * If the user loves Punjabi or Hip-Hop or Pop, this dynamically surfaces a hero slide for that!
   */
  public getPersonalizedSpotlights(): FeaturedSpotlight[] {
    const dominantGenre = this.getDominantGenre();
    const dominantArtist = this.getDominantArtist();

    // Additional authentic spotlights for genres not in original default mockup
    const PUNJABI_SPOTLIGHT: FeaturedSpotlight = {
      id: "karan_aujla_winning_speech",
      tagline: "Global Chart Sensation • 2026",
      title: "Making Memories & Beyond",
      subtitle: "Karan Aujla • 'Winning Speech'",
      description:
        "The record-breaking Punjabi powerhouse dominating global streaming charts with anthemic hooks and modern soundscapes.",
      artistName: "Karan Aujla",
      heroImageUrl: "/artists/karan-aujla.webp",
      accentColor: "#f59e0b",
      mainTrack: {
        id: "yt_winning_speech_karan",
        title: "Winning Speech",
        artist: "Karan Aujla",
        durationMs: 215000,
        coverUrl: "/artists/karan-aujla.webp",
        url: "/api/stream/youtube?title=Winning%20Speech&artist=Karan%20Aujla",
        source: "youtube",
        createdAt: 0,
      },
    };

    const SIDHU_SPOTLIGHT: FeaturedSpotlight = {
      id: "sidhu_moose_wala_295",
      tagline: "Iconic Global Masterwork • Moose Tape",
      title: "Moose Tape: Sidhu Moose Wala",
      subtitle: "The Timeless Voice • '295'",
      description:
        "Sidhu Moose Wala's historic global masterpiece that topped Billboard Canadian Albums and the Global YouTube charts.",
      artistName: "Sidhu Moose Wala",
      heroImageUrl: "/artists/sidhu-moose-wala.webp",
      accentColor: "#ef4444",
      mainTrack: {
        id: "yt_295",
        title: "295",
        artist: "Sidhu Moose Wala",
        durationMs: 270000,
        coverUrl: "/artists/sidhu-moose-wala.webp",
        url: "/api/stream/youtube?id=295",
        source: "youtube",
        createdAt: 0,
      },
    };

    const BOLLYWOOD_SPOTLIGHT: FeaturedSpotlight = {
      id: "the_train_beete_lamhein",
      tagline: "Iconic Romantic Lounge • Mithoon & KK",
      title: "The Train (2007)",
      subtitle: "KK & Mithoon • 'Beete Lamhein'",
      description:
        "Mithoon's legendary cult soundtrack featuring KK's timeless, emotional vocals and atmospheric electronic textures.",
      artistName: "KK & Mithoon",
      heroImageUrl: "/albums/the-train-2007.webp",
      accentColor: "#00e5c9",
      mainTrack: {
        id: "yt_d0oVZLquCMU",
        title: "Beete Lamhein",
        artist: "KK",
        durationMs: 312000,
        coverUrl: "/albums/the-train-2007.webp",
        url: "/api/stream/youtube?id=d0oVZLquCMU",
        source: "youtube",
        createdAt: 0,
      },
    };

    const list = [...FEATURED_SPOTLIGHTS];

    // If dominant artist is Karan Aujla or Sidhu Moose Wala, place their spotlight right at index 0
    if (dominantArtist) {
      const daLower = dominantArtist.toLowerCase();
      if (daLower.includes("karan aujla")) {
        return [PUNJABI_SPOTLIGHT, ...list.filter((s) => s.id !== PUNJABI_SPOTLIGHT.id)];
      }
      if (daLower.includes("sidhu moose")) {
        return [SIDHU_SPOTLIGHT, ...list.filter((s) => s.id !== SIDHU_SPOTLIGHT.id)];
      }
      if (daLower.includes("mithoon") || daLower.includes("kk") || daLower.includes("arijit")) {
        return [BOLLYWOOD_SPOTLIGHT, ...list.filter((s) => s.id !== BOLLYWOOD_SPOTLIGHT.id)];
      }
    }

    // If dominant genre is Punjabi, place Punjabi spotlight first
    if (dominantGenre === "punjabi") {
      return [PUNJABI_SPOTLIGHT, SIDHU_SPOTLIGHT, ...list];
    }

    // If dominant genre is Hip-Hop, prioritize Kendrick Lamar spotlight
    if (dominantGenre === "hiphop") {
      const kendrick = list.find((s) => s.id === "kendrick_sza_luther");
      if (kendrick) {
        return [kendrick, ...list.filter((s) => s.id !== "kendrick_sza_luther")];
      }
    }

    // If dominant genre is Pop/Synthwave, prioritize The Weeknd
    if (dominantGenre === "pop" || dominantGenre === "electronic") {
      const weeknd = list.find((s) => s.id === "weeknd_timeless");
      if (weeknd) {
        return [weeknd, ...list.filter((s) => s.id !== "weeknd_timeless")];
      }
    }

    // If dominant genre is Bollywood/Ghazal
    if (dominantGenre === "bollywood" || dominantGenre === "ghazal") {
      return [BOLLYWOOD_SPOTLIGHT, ...list];
    }

    return list;
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
    const tracks: Track[] = [];

    const addTrack = (t: Track) => {
      const norm = normalizeSongTitle(t.title, t.artist);
      if (seenIds.has(t.id) || (norm && seenTitles.has(norm))) return;
      seenIds.add(t.id);
      if (norm) seenTitles.add(norm);
      tracks.push(t);
    };

    // 1. Tracks from dominant artist
    if (dominantArtist) {
      const artistMatch = ARTISTS_CATALOG.find(
        (a) => a.name.toLowerCase() === dominantArtist.toLowerCase()
      );
      if (artistMatch) {
        artistMatch.topTracks.slice(0, 4).forEach(addTrack);
      }

      // 2. Tracks from peer artists
      const peerNames = getPeerArtistsForArtist(dominantArtist);
      for (const peer of peerNames) {
        if (tracks.length >= 8) break;
        const peerArtist = ARTISTS_CATALOG.find(
          (a) => a.name.toLowerCase() === peer.toLowerCase()
        );
        if (peerArtist && peerArtist.topTracks.length > 0) {
          addTrack(peerArtist.topTracks[0]);
          if (peerArtist.topTracks.length > 1 && tracks.length < 8) {
            addTrack(peerArtist.topTracks[1]);
          }
        }
      }
    }

    // 3. Fallback to dominant genre peers
    if (tracks.length < 5 && dominantGenre) {
      const genrePeers = getPeerArtistsForGenre(dominantGenre);
      for (const peer of genrePeers) {
        if (tracks.length >= 8) break;
        const peerArtist = ARTISTS_CATALOG.find(
          (a) => a.name.toLowerCase() === peer.toLowerCase()
        );
        if (peerArtist && peerArtist.topTracks.length > 0) {
          addTrack(peerArtist.topTracks[0]);
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
   */
  public getSidebarRecommendedTracks(): Track[] {
    const because = this.getBecauseYouListenedSection();
    if (because && because.tracks.length > 0) {
      return because.tracks.slice(0, 10);
    }
    // If no explicit taste yet, return a diverse cross-genre set from catalog
    const starterTracks: Track[] = [];
    for (const a of ARTISTS_CATALOG.slice(0, 8)) {
      if (a.topTracks.length > 0) {
        starterTracks.push(a.topTracks[0]);
      }
    }
    return starterTracks;
  }

  /**
   * Clears the taste profile (useful for settings / testing).
   */
  public clearProfile(): void {
    this.profile = createDefaultProfile();
    this.saveToStorage();
  }
}
