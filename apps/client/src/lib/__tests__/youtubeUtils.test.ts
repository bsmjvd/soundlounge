import { describe, it, expect } from "bun:test";
import { parseYouTubeDuration, extractYouTubeVideoId, isLikelySong } from "../youtubeUtils";

describe("YouTube Search & Utility Functions", () => {
  it("extracts YouTube video ID from various URL formats", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=5NV6Rdv1a3I")).toBe("5NV6Rdv1a3I");
    expect(extractYouTubeVideoId("https://youtu.be/5NV6Rdv1a3I")).toBe("5NV6Rdv1a3I");
    expect(extractYouTubeVideoId("https://music.youtube.com/watch?v=5NV6Rdv1a3I&feature=share")).toBe("5NV6Rdv1a3I");
    expect(extractYouTubeVideoId("5NV6Rdv1a3I")).toBe("5NV6Rdv1a3I");
    expect(extractYouTubeVideoId("just a query not a url")).toBeNull();
  });

  it("parses clock durations and numeric seconds", () => {
    expect(parseYouTubeDuration("3:45")).toBe(225000); // 3m 45s = 225s = 225000ms
    expect(parseYouTubeDuration("1:02:10")).toBe(3730000); // 1h 2m 10s = 3730s = 3730000ms
    expect(parseYouTubeDuration(180)).toBe(180000);
    expect(parseYouTubeDuration(undefined)).toBe(0);
  });

  it("filters out full movies, trailers, and non-music long videos", () => {
    // Regular songs: should be TRUE
    expect(isLikelySong("Hans Zimmer - Time (Inception OST)", 276)).toBe(true);
    expect(isLikelySong("Daft Punk - Get Lucky", 248)).toBe(true);
    expect(isLikelySong("Queen - Bohemian Rhapsody (Official Audio)", 354)).toBe(true);

    // Full movies and long videos (> 13 mins): should be FALSE
    expect(isLikelySong("Inception Full Movie HD 1080p", 8800)).toBe(false);
    expect(isLikelySong("Interstellar Complete Movie in English", 10100)).toBe(false);

    // Trailers and non-music keywords even under 13 mins: should be FALSE
    expect(isLikelySong("Inception Official Trailer #1 (2010)", 150)).toBe(false);
    expect(isLikelySong("Avatar 2 Teaser Trailer", 90)).toBe(false);
    expect(isLikelySong("Titanic Movie Clip - I'm Flying", 180)).toBe(false);

    // Too short (< 30s): should be FALSE
    expect(isLikelySong("Short sound effect", 12)).toBe(false);
  });
});
