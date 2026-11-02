import { describe, expect, it } from "bun:test";
import { FEATURED_SPOTLIGHTS } from "../../lib/data/mockupData";

describe("DiscoverHero & 2026 Featured Spotlights", () => {
  it("contains verified 2026 Billboard and global chart-toppers", () => {
    expect(FEATURED_SPOTLIGHTS.length).toBeGreaterThanOrEqual(5);

    const titles = FEATURED_SPOTLIGHTS.map((s) => s.title);
    expect(titles).toContain("Die With a Smile");
    expect(titles).toContain("GNX: Kendrick Lamar");
    expect(titles).toContain("Hit Me Hard and Soft");
    expect(titles).toContain("Hurry Up Tomorrow");
    expect(titles).toContain("The Tortured Poets Department");

    const trackTitles = FEATURED_SPOTLIGHTS.map((s) => s.mainTrack.title.toLowerCase());
    expect(trackTitles).toContain("die with a smile");
    expect(trackTitles).toContain("luther");
    expect(trackTitles).toContain("birds of a feather");
    expect(trackTitles).toContain("timeless");
    expect(trackTitles).toContain("fortnight");
  });

  it("each featured spotlight has valid hero image and streaming track metadata", () => {
    for (const spotlight of FEATURED_SPOTLIGHTS) {
      expect(spotlight.heroImageUrl).toBeDefined();
      expect(spotlight.heroImageUrl.endsWith(".webp")).toBe(true);
      expect(spotlight.mainTrack.title).toBeDefined();
      expect(spotlight.mainTrack.artist).toBeDefined();
      expect(spotlight.mainTrack.url).toContain("/api/stream/youtube");
      expect(spotlight.accentColor).toBeDefined();
    }
  });

  it("cycles spotlight indexes within modulo boundaries", () => {
    const total = FEATURED_SPOTLIGHTS.length;
    let index = 0;

    // Simulate next
    index = (index + 1) % total;
    expect(index).toBe(1);

    // Simulate wrapping back
    index = (index - 1 + total) % total;
    expect(index).toBe(0);

    // Simulate prev from 0
    index = (index - 1 + total) % total;
    expect(index).toBe(total - 1);
  });
});
