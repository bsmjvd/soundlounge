import { describe, it, expect } from "bun:test";
import { findSimilarTrack, resolveEffectiveArtist } from "../SimilarTracksEngine";
import { normalizeSongTitle } from "../normalizeTitle";
import { ARTISTS_CATALOG } from "../../data/artistsCatalog";
import type { Track } from "@soundlounge/shared";

describe("Intelligent Similar Tracks Recommendation Engine", () => {
  const sidhuTrack1: Track = {
    id: "yt_295",
    title: "295",
    artist: "Sidhu Moose Wala",
    durationMs: 270000,
    url: "/api/stream/youtube?id=295",
    source: "youtube",
  };

  const sidhuTrack2: Track = {
    id: "yt_6xoB4ZiKKn0",
    title: "The Last Ride",
    artist: "Sidhu Moose Wala",
    durationMs: 260000,
    url: "/api/stream/youtube?id=6xoB4ZiKKn0&title=The%20Last%20Ride&artist=Sidhu%20Moose%20Wala",
    source: "youtube",
  };

  const jagjitTrack1: Track = {
    id: "yt_TumItnaJo",
    title: "Tum Itna Jo Muskura Rahe Ho",
    artist: "Jagjit Singh",
    durationMs: 318000,
    url: "/api/stream/youtube?id=TumItnaJo",
    source: "youtube",
  };

  const weekndTrack1: Track = {
    id: "yt_fHI8X480mxo",
    title: "Blinding Lights",
    artist: "The Weeknd",
    durationMs: 200000,
    url: "/api/stream/youtube?id=fHI8X480mxo",
    source: "youtube",
  };

  const nusratTrack1: Track = {
    id: "yt_MujheTumYaad",
    title: "Mujhe Tum Yaad Aate Ho",
    artist: "Nusrat Fateh Ali Khan",
    durationMs: 320000,
    url: "/api/stream/youtube?id=MujheTumYaad",
    source: "youtube",
  };

  it("prioritizes another track by the same artist when available in catalog", async () => {
    const res = await findSimilarTrack({
      currentTrack: sidhuTrack1,
      existingQueue: [sidhuTrack1],
    });

    expect(res).not.toBeNull();
    expect(res!.track.artist).toContain("Sidhu Moose Wala");
    expect(res!.track.id).not.toBe(sidhuTrack1.id);
    expect(res!.matchType).toBe("same_artist");
  });

  it("prioritizes another track by Nusrat Fateh Ali Khan when playing Nusrat track", async () => {
    const res = await findSimilarTrack({
      currentTrack: nusratTrack1,
      existingQueue: [nusratTrack1],
    });

    expect(res).not.toBeNull();
    expect(res!.track.artist).toContain("Nusrat Fateh Ali Khan");
    expect(res!.track.id).not.toBe(nusratTrack1.id);
    expect(res!.matchType).toBe("same_artist");
    expect(res!.reason).toContain("Nusrat Fateh Ali Khan");
  });

  it("recommends Ghazal peers (Jagjit Singh / Mehdi Hassan) when Nusrat tracks are exhausted", async () => {
    const allNusratIds = [
      "yt_MujheTumYaad",
      "yt_YeJoHalkaHalka",
      "yt_AfreenAfreenOriginal",
      "yt_MereRashkeQamar",
      "yt_KinnaSohna",
    ];
    const dummyQueue: Track[] = allNusratIds.map((id) => ({
      id,
      title: "Sample Nusrat Track",
      artist: "Nusrat Fateh Ali Khan",
      durationMs: 300000,
      url: `/api/stream/youtube?id=${id}`,
      source: "youtube",
    }));

    const res = await findSimilarTrack({
      currentTrack: nusratTrack1,
      existingQueue: dummyQueue,
    });

    expect(res).not.toBeNull();
    const ghazalArtists = ["jagjit singh", "mehdi hassan", "ghulam ali", "pankaj udhas"];
    const matched = ghazalArtists.some((p) => res!.track.artist.toLowerCase().includes(p));
    expect(matched).toBe(true);
    expect(res!.reason.toLowerCase()).toMatch(/ghazal|similar/i);
  });

  it("recommends a Ghazal peer (Mehdi Hassan / Ghulam Ali / Pankaj Udhas) when Ghazal is playing and artist tracks are exhausted", async () => {
    // Exclude all Jagjit Singh tracks so same-artist is exhausted
    const allJagjitIds = [
      "yt_Ju6kNKaBOQ8",
      "yt_tEomN5_KjW0",
      "yt_42_K6J30o30",
      "yt_P_nLgM1VqF0",
      "yt_49rS29FwU_o",
      "yt_TumItnaJo",
      "yt_HoshwalonKo",
      "yt_ChithiNaKoi",
      "yt_JhukiJhuki",
      "yt_WohKagaz",
    ];
    const dummyQueue: Track[] = allJagjitIds.map((id) => ({
      id,
      title: "Sample",
      artist: "Jagjit Singh",
      durationMs: 200000,
      url: `/api/stream/youtube?id=${id}`,
      source: "youtube",
    }));

    const res = await findSimilarTrack({
      currentTrack: jagjitTrack1,
      existingQueue: dummyQueue,
    });

    expect(res).not.toBeNull();
    // Must recommend a fellow Ghazal legend
    const peerArtists = ["mehdi hassan", "ghulam ali", "pankaj udhas"];
    const matchedPeer = peerArtists.some((p) => res!.track.artist.toLowerCase().includes(p));
    expect(matchedPeer).toBe(true);
    expect(res!.matchType).toMatch(/peer_artist|genre_match/);
    expect(res!.reason.toLowerCase()).toContain("ghazal");
  });

  it("recommends Pop peers (Dua Lipa / Billie Eilish) when Pop track is playing", async () => {
    // Exclude all The Weeknd tracks
    const allWeekndIds = ["yt_34Na4j8AVgA", "yt_fHI8X480mxo", "yt_XXYlFuWEuKI", "yt_yzTuBuRdAyA", "yt_CtyytBCHA9U"];
    const dummyQueue: Track[] = allWeekndIds.map((id) => ({
      id,
      title: "Sample Pop",
      artist: "The Weeknd",
      durationMs: 200000,
      url: `/api/stream/youtube?id=${id}`,
      source: "youtube",
    }));

    const res = await findSimilarTrack({
      currentTrack: weekndTrack1,
      existingQueue: dummyQueue,
    });

    expect(res).not.toBeNull();
    const isPopPeer =
      res!.track.artist.toLowerCase().includes("dua lipa") || res!.track.artist.toLowerCase().includes("billie eilish");
    expect(isPopPeer).toBe(true);
  });

  it("falls back to live YouTube search for arbitrary external tracks", async () => {
    const obscureTrack: Track = {
      id: "yt_obscure_99",
      title: "Rare Ambient Soundscape 404",
      artist: "Autonomous Ambient Ensemble",
      durationMs: 400000,
      url: "/api/stream/youtube?id=obscure_99",
      source: "youtube",
    };

    const mockLiveTrack: Track = {
      id: "yt_discovered_123",
      title: "Atmospheric Echoes In F Minor",
      artist: "Autonomous Ambient Ensemble",
      durationMs: 350000,
      url: "/api/stream/youtube?id=discovered_123",
      source: "youtube",
    };

    const mockFetch = async () => {
      return {
        ok: true,
        json: async () => ({ tracks: [mockLiveTrack] }),
      } as unknown as Response;
    };

    const res = await findSimilarTrack({
      currentTrack: obscureTrack,
      existingQueue: [obscureTrack],
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(res).not.toBeNull();
    expect(res!.track.id).toBe("yt_discovered_123");
    expect(res!.matchType).toBe("live_search");
  });

  it("never duplicates tracks already in the active queue by id", async () => {
    const queue = [sidhuTrack1, sidhuTrack2];
    const res = await findSimilarTrack({
      currentTrack: sidhuTrack1,
      existingQueue: queue,
    });

    expect(res).not.toBeNull();
    expect(queue.some((t) => t.id === res!.track.id)).toBe(false);
  });

  it("never duplicates songs with title variations (e.g. Softly vs SOFTLY KARAN AUJLA)", async () => {
    const softlyInQueue: Track = {
      id: "yt_softly_original",
      title: "Softly",
      artist: "Karan Aujla",
      durationMs: 156000,
      url: "/api/stream/youtube?id=softly_original",
      source: "youtube",
    };

    const winningSpeechPlaying: Track = {
      id: "yt_winning_speech",
      title: "Winning Speech",
      artist: "Karan Aujla",
      durationMs: 204000,
      url: "/api/stream/youtube?id=winning_speech",
      source: "youtube",
    };

    // Candidate 1 is a duplicate of Softly (different video ID, uppercase title + artist suffix)
    const duplicateSoftlyCandidate: Track = {
      id: "yt_softly_duplicate_upload",
      title: "SOFTLY KARAN AUJLA",
      artist: "Karan Aujla",
      durationMs: 171000,
      url: "/api/stream/youtube?id=softly_duplicate_upload",
      source: "youtube",
    };

    // Candidate 2 is a fresh unplayed song by Karan Aujla
    const freshCandidate: Track = {
      id: "yt_admirin_you",
      title: "Admirin' You",
      artist: "Karan Aujla",
      durationMs: 214000,
      url: "/api/stream/youtube?id=admirin_you",
      source: "youtube",
    };

    const mockFetch = async () => {
      return {
        ok: true,
        json: async () => ({ tracks: [duplicateSoftlyCandidate, freshCandidate] }),
      } as unknown as Response;
    };

    const res = await findSimilarTrack({
      currentTrack: winningSpeechPlaying,
      existingQueue: [softlyInQueue, winningSpeechPlaying],
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(res).not.toBeNull();
    // It MUST skip the duplicate "SOFTLY KARAN AUJLA" and pick "Admirin' You"
    expect(res!.track.id).toBe("yt_admirin_you");
    expect(res!.track.title).toBe("Admirin' You");
  });

  it("correctly identifies Karan Aujla and avoids false KK matches caused by producer Ikky", () => {
    // Song produced by Ikky
    const trackWithIkky: Track = {
      id: "yt_karan_for_a_reason",
      title: "For A Reason (Official Video) Karan Aujla | Tania | Ikky | Latest Punjabi Songs 2025",
      artist: "Rehaan Records",
      durationMs: 189000,
      url: "/api/stream/youtube?id=karan_for_a_reason",
      source: "youtube",
    };

    const artist = resolveEffectiveArtist(trackWithIkky);
    expect(artist).toBe("Karan Aujla");
    expect(artist).not.toBe("KK");
  });

  it("normalizes song titles accurately across formatting styles", () => {
    expect(normalizeSongTitle("Softly", "Karan Aujla")).toBe("softly");
    expect(normalizeSongTitle("SOFTLY KARAN AUJLA", "Karan Aujla")).toBe("softly");
    expect(normalizeSongTitle("Softly (Official Music Video)", "Karan Aujla")).toBe("softly");
    expect(normalizeSongTitle("Softly - Lyrical Song", "Karan Aujla")).toBe("softly");
  });
});

describe("Similar Tracks relevance guards (related tier + verified fallbacks)", () => {
  const makeTrack = (id: string, title: string, artist: string, durationMs = 250000): Track => ({
    id,
    title,
    artist,
    durationMs,
    url: `/api/stream/youtube?id=${id.replace(/^yt_/, "")}`,
    source: "youtube",
  });

  const mockResponse = (payload: unknown) =>
    ({
      ok: true,
      json: async () => payload,
    }) as unknown as Response;

  const urlAwareFetch = (related: Track[], search: Track[]) =>
    (async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/related")) return mockResponse({ tracks: related });
      if (url.includes("/api/search")) return mockResponse({ tracks: search });
      // Any other endpoint (e.g. /api/new-releases) answers empty
      return mockResponse({ tracks: [] });
    }) as unknown as typeof fetch;

  const obscureTrack: Track = makeTrack("yt_obscureAA1", "Fading Signal", "Autonomous Ambient Ensemble", 300000);

  it("prefers same-artist tracks from the YouTube related list", async () => {
    const unrelated = makeTrack("yt_pop_unrelated", "Levitating", "Dua Lipa");
    const sameArtist = makeTrack("yt_aa2", "Ghost Frequencies", "Autonomous Ambient Ensemble", 280000);

    const res = await findSimilarTrack({
      currentTrack: obscureTrack,
      existingQueue: [obscureTrack],
      fetchFn: urlAwareFetch([unrelated, sameArtist], []),
    });

    expect(res).not.toBeNull();
    expect(res!.track.id).toBe("yt_aa2");
    expect(res!.reason).toContain("Same Artist");
  });

  it("falls back to a related-list candidate (which is inherently relevant) when no same-artist match exists", async () => {
    const unrelated = makeTrack("yt_pop_unrelated", "Levitating", "Dua Lipa");

    const res = await findSimilarTrack({
      currentTrack: obscureTrack,
      existingQueue: [obscureTrack],
      fetchFn: urlAwareFetch([unrelated], []),
    });

    expect(res).not.toBeNull();
    expect(res!.track.id).toBe("yt_pop_unrelated");
    expect(res!.reason).toContain("Related to");
  });

  it("never re-suggests a track the user removed", async () => {
    const rejectedSameArtist = makeTrack("yt_aa3", "Neon Drift", "Autonomous Ambient Ensemble");
    const freshSameArtist = makeTrack("yt_aa4", "Static Bloom", "Autonomous Ambient Ensemble");

    const res = await findSimilarTrack({
      currentTrack: obscureTrack,
      existingQueue: [obscureTrack],
      rejectedTracks: [rejectedSameArtist],
      fetchFn: urlAwareFetch([], [rejectedSameArtist, freshSameArtist]),
    });

    expect(res).not.toBeNull();
    expect(res!.track.id).toBe("yt_aa4");
  });

  it("never accepts an unverified cross-artist candidate for unknown-genre tracks", async () => {
    const unrelated = makeTrack("yt_bolly_unrelated", "Tum Hi Ho", "Arijit Singh");

    const res = await findSimilarTrack({
      currentTrack: obscureTrack,
      existingQueue: [obscureTrack],
      fetchFn: urlAwareFetch([], [unrelated]),
    });

    expect(res).not.toBeNull();
    // The unrelated live-search candidate must be rejected; only catalog fallbacks may answer
    expect(res!.track.id).not.toBe("yt_bolly_unrelated");
    expect(res!.reason).not.toContain("Discovered Similar");
  });

  it("verifies the genre of live-search candidates when the genre is known", async () => {
    const currentTrack: Track = makeTrack("yt_unknown_dj1", "Midnight Techno Pulse", "Unknown DJ");
    // Exhaust the only catalog electronic artist (Daft Punk) via his catalog tracks
    const queue: Track[] = [
      currentTrack,
      makeTrack("yt_5NV6Rdv1a3I", "Get Lucky", "Daft Punk ft. Pharrell Williams", 248000),
      makeTrack("yt_L93-7vRte34", "Harder, Better, Faster, Stronger", "Daft Punk", 224000),
      makeTrack("yt_FGBhQbmPwH8", "One More Time", "Daft Punk", 320000),
    ];

    const popCandidate = makeTrack("yt_dua_lev", "Levitating", "Dua Lipa", 203000);
    const electronicCandidate = makeTrack("yt_kavinsky_nc", "Nightcall", "Kavinsky", 258000);

    const res = await findSimilarTrack({
      currentTrack,
      existingQueue: queue,
      fetchFn: urlAwareFetch([], [popCandidate, electronicCandidate]),
    });

    expect(res).not.toBeNull();
    // The pop candidate must be rejected; the genre-matching candidate is accepted
    expect(res!.track.id).toBe("yt_kavinsky_nc");
    expect(res!.reason).toContain("Discovered Similar");
  });

  it("re-attributes a title-matched candidate carrying an unrelated channel alias (KK leak)", async () => {
    const kaujla = ARTISTS_CATALOG.find((a) => a.name === "Karan Aujla")!;
    const currentTrack: Track = { ...kaujla.topTracks[0] };
    // Exhaust the whole catalog discography so the live same-artist search fires
    const dummyQueue: Track[] = kaujla.topTracks.map((t) => ({ ...t }));

    // A "KK" channel upload that only matches because the title names Karan Aujla
    const kkLeak = makeTrack("yt_kk_leak", "Unknown Karan Aujla Session Tape", "KK", 240000);

    const res = await findSimilarTrack({
      currentTrack,
      existingQueue: dummyQueue,
      fetchFn: urlAwareFetch([], [kkLeak]),
    });

    expect(res).not.toBeNull();
    expect(res!.track.id).toBe("yt_kk_leak");
    // The wrong channel alias must be replaced with the real artist
    expect(res!.track.artist).toBe("Karan Aujla");
    expect(res!.reason).toContain("Same Artist");
  });
});
