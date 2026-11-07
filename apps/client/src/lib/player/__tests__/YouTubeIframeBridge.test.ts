import { describe, it, expect } from "bun:test";
import { YouTubeIframeBridge } from "../YouTubeIframeBridge";

describe("YouTubeIframeBridge", () => {
  it("extracts clean 11-char YouTube ID from queries and URLs", () => {
    expect(YouTubeIframeBridge.extractVideoId("/api/stream/youtube?id=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(YouTubeIframeBridge.extractVideoId("/api/stream/youtube?v=PfH7jq_uSCM&title=Die")).toBe("PfH7jq_uSCM");
    expect(YouTubeIframeBridge.extractVideoId("/stream/youtube/oO49x759V40/Flume.m4a")).toBe("oO49x759V40");
    expect(YouTubeIframeBridge.extractVideoId("yt_yFpcNTX1OwY")).toBe("yFpcNTX1OwY");
    expect(YouTubeIframeBridge.extractVideoId("PfH7jq_uSCM")).toBe("PfH7jq_uSCM");
  });

  it("handles non-YouTube tracks safely", () => {
    expect(YouTubeIframeBridge.extractVideoId("https://example.com/audio.mp3")).toBeNull();
    expect(YouTubeIframeBridge.extractVideoId("")).toBeNull();
  });

  it("maintains singleton bridge instance", () => {
    const bridge1 = YouTubeIframeBridge.getInstance();
    const bridge2 = YouTubeIframeBridge.getInstance();
    expect(bridge1).toBe(bridge2);
    expect(bridge1.getState().status).toBe("idle");
  });
});
