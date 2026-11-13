import { describe, it, expect, beforeEach } from "bun:test";
import { TasteProfileEngine } from "../TasteProfileEngine";
import type { Track, Album } from "@soundlounge/shared";
import { ARTISTS_CATALOG } from "../../data/artistsCatalog";
import { ALBUMS_CATALOG } from "../../data/albumsCatalog";

describe("User Taste Profile Engine", () => {
  let engine: TasteProfileEngine;

  const karanTrack: Track = {
    id: "yt_softly",
    title: "Softly",
    artist: "Karan Aujla",
    durationMs: 154000,
    url: "/api/stream/youtube?id=softly",
    source: "youtube",
  };

  const sidhuTrack: Track = {
    id: "yt_295",
    title: "295",
    artist: "Sidhu Moose Wala",
    durationMs: 270000,
    url: "/api/stream/youtube?id=295",
    source: "youtube",
  };

  const weekndTrack: Track = {
    id: "yt_blinding_lights",
    title: "Blinding Lights",
    artist: "The Weeknd",
    durationMs: 200000,
    url: "/api/stream/youtube?id=blinding_lights",
    source: "youtube",
  };

  beforeEach(() => {
    TasteProfileEngine.resetInstance();
    engine = TasteProfileEngine.getInstance();
    engine.clearProfile();
  });

  it("starts with empty profile and hasTasteProfile = false", () => {
    expect(engine.hasTasteProfile()).toBe(false);
    expect(engine.getDominantArtist()).toBeNull();
    expect(engine.getDominantGenre()).toBeNull();
    expect(engine.getTopArtists()).toHaveLength(0);
  });

  it("accurately updates artist and genre affinity upon playback", () => {
    engine.recordPlay(karanTrack);

    expect(engine.hasTasteProfile()).toBe(true);
    expect(engine.getDominantArtist()).toBe("Karan Aujla");
    expect(engine.getDominantGenre()).toBe("punjabi");

    const topArtists = engine.getTopArtists();
    expect(topArtists[0].artistName).toBe("Karan Aujla");
    expect(topArtists[0].playCount).toBe(1);
    expect(topArtists[0].score).toBeGreaterThan(2);

    const topGenres = engine.getTopGenres();
    expect(topGenres[0].genre).toBe("punjabi");
    expect(topGenres[0].playCount).toBe(1);
  });

  it("gives stronger affinity to liked tracks", () => {
    engine.recordPlay(weekndTrack);
    const scoreAfterPlay = engine.getTopArtists().find((a) => a.artistName === "The Weeknd")!.score;

    engine.recordLike(weekndTrack, true);
    const scoreAfterLike = engine.getTopArtists().find((a) => a.artistName === "The Weeknd")!.score;

    expect(scoreAfterLike).toBeGreaterThan(scoreAfterPlay + 3);
    expect(engine.getDominantGenre()).toBe("pop");
  });

  it("dynamically re-ranks artists putting user's favorites and peer artists first", () => {
    // Record plays for Karan Aujla
    engine.recordPlay(karanTrack);
    engine.recordPlay(karanTrack);

    const ranked = engine.rankArtists(ARTISTS_CATALOG);

    // Karan Aujla should be rank #1
    expect(ranked[0].name).toBe("Karan Aujla");

    // Peer artists (Sidhu Moose Wala, Diljit Dosanjh, AP Dhillon) should be ranked higher than unrelated artists
    const punjabiPeers = ["Sidhu Moose Wala", "Diljit Dosanjh", "AP Dhillon"];
    const peerPositions = punjabiPeers.map((p) => ranked.findIndex((a) => a.name === p));
    const unrelatedArtistIdx = ranked.findIndex((a) => a.name === "Children of Bodom" || a.name === "Coldplay");

    for (const pos of peerPositions) {
      if (pos !== -1 && unrelatedArtistIdx !== -1) {
        expect(pos).toBeLessThan(unrelatedArtistIdx);
      }
    }
  });

  it("dynamically re-ranks albums putting matching genre and artist albums first", () => {
    // User listens to Sidhu Moose Wala and Karan Aujla
    engine.recordPlay(sidhuTrack);
    engine.recordPlay(karanTrack);

    const rankedAlbums = engine.rankAlbums(ALBUMS_CATALOG);

    // Moose Tape or Making Memories should be in the top 3 albums
    const top3Titles = rankedAlbums.slice(0, 3).map((a) => a.title.toLowerCase());
    const matchesPunjabi = top3Titles.some((t) => t.includes("moose") || t.includes("memories"));
    expect(matchesPunjabi).toBe(true);
  });

  it("generates a 'Because You Listened To [Artist]' section with matching tracks", () => {
    engine.recordPlay(karanTrack);

    const section = engine.getBecauseYouListenedSection();
    expect(section).not.toBeNull();
    expect(section!.title).toContain("Karan Aujla");
    expect(section!.tracks.length).toBeGreaterThan(0);

    // Tracks should be from Karan Aujla or peer Punjabi artists
    const artists = section!.tracks.map((t) => t.artist.toLowerCase());
    const allRelevant = artists.every(
      (a) =>
        a.includes("karan aujla") ||
        a.includes("sidhu") ||
        a.includes("diljit") ||
        a.includes("dhillon") ||
        a.includes("shubh")
    );
    expect(allRelevant).toBe(true);
  });

  it("prioritizes relevant spotlight hero when user has a dominant genre", () => {
    engine.recordPlay(karanTrack);

    const spotlights = engine.getPersonalizedSpotlights();
    expect(spotlights.length).toBeGreaterThan(0);
    // First spotlight should be Karan Aujla or Punjabi hit
    expect(spotlights[0].artistName.toLowerCase()).toContain("karan aujla");
  });

  it("recommends fresh unplayed tracks matching the dominant taste", () => {
    engine.recordPlay(karanTrack);

    const recs = engine.getSidebarRecommendedTracks();
    expect(recs.length).toBeGreaterThan(0);

    // The track just played must not be recommended again
    expect(recs.some((t) => t.id === karanTrack.id)).toBe(false);

    // Recommendations should lean into the dominant Punjabi affinity
    const isPunjabiArtist = (a: string) =>
      ["karan aujla", "sidhu", "diljit", "dhillon", "shubh"].some((p) => a.includes(p));
    const punjabiCount = recs.filter((t) => isPunjabiArtist(t.artist.toLowerCase())).length;
    expect(punjabiCount).toBeGreaterThanOrEqual(3);
  });

  it("decays old interactions so recent listening dominates", () => {
    engine.recordPlay(weekndTrack);
    engine.recordPlay(karanTrack);

    // Age The Weeknd's interaction by a month; Karan Aujla stays fresh
    const profile = engine.getProfile();
    profile.artistAffinities["The Weeknd"].lastInteractedAt = Date.now() - 30 * 86400000;

    expect(engine.getTopArtists()[0].artistName).toBe("Karan Aujla");
    expect(engine.getDominantArtist()).toBe("Karan Aujla");
  });

  it("keeps raw affinity scores intact while decaying reads", () => {
    engine.recordPlay(weekndTrack);
    const rawScore = engine.getTopArtists()[0].score;

    engine.getProfile().artistAffinities["The Weeknd"].lastInteractedAt = Date.now() - 14 * 86400000;

    // Stored score unchanged, decay only affects ordering
    expect(engine.getTopArtists()[0].score).toBe(rawScore);
    expect(engine.getTopArtists()[0].score).toBeGreaterThan(0);
  });
});
