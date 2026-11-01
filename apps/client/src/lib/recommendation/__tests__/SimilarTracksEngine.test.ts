import { describe, it, expect } from "bun:test";
import { findSimilarTrack, resolveEffectiveArtist, normalizeSongTitle } from "../SimilarTracksEngine";
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
    id: "yt_TheLastRide",
    title: "The Last Ride",
    artist: "Sidhu Moose Wala",
    durationMs: 260000,
    url: "/api/stream/youtube?id=TheLastRide",
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
