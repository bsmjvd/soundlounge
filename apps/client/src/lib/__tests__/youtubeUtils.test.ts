import { describe, it, expect } from "bun:test";
import { parseYouTubeDuration, extractYouTubeVideoId } from "../youtubeUtils";

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
});
