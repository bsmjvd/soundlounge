import { describe, it, expect } from "bun:test";
import {
  normalizePlaylistId,
  toPlaylistCard,
  withinTrackDuration,
  isPlaylistNode,
  upgradeCoverUrl,
} from "../playlistUtils";
import { CURATED_PLAYLISTS } from "../../data/curatedPlaylists";

describe("YouTube Music playlist utilities", () => {
  it("normalizes VL-prefixed browse ids to their canonical playlist id", () => {
    expect(normalizePlaylistId("VLPLabc123")).toBe("PLabc123");
    expect(normalizePlaylistId("PLabc123")).toBe("PLabc123");
    expect(normalizePlaylistId("  VLrdXYZ ")).toBe("rdXYZ");
    expect(normalizePlaylistId("")).toBe("");
  });

  it("maps a YouTube Music playlist node into a card", () => {
    const card = toPlaylistCard({
      id: "VLPLtest1",
      title: "Coke Studio Greatest",
      author: { name: "Coke Studio" },
      song_count: "42",
      thumbnail: { contents: [{ url: "https://lh3.googleusercontent.com/x=w544-h544-l90-rj" }] },
    });
    expect(card).not.toBeNull();
    expect(card!.id).toBe("PLtest1");
    expect(card!.title).toBe("Coke Studio Greatest");
    expect(card!.trackCount).toBe(42);
    expect(card!.coverUrl).toContain("=w800-h800-l90-rj");
  });

  it("returns null for playlist nodes without an id", () => {
    expect(toPlaylistCard({ title: "No Id" })).toBeNull();
  });

  it("upgrades googleusercontent thumbnails and leaves other urls alone", () => {
    expect(upgradeCoverUrl("https://lh3.googleusercontent.com/a=w60-h60")).toContain("=w800-h800-l90-rj");
    expect(upgradeCoverUrl("https://i.ytimg.com/vi/x/hqdefault.jpg")).toBe(
      "https://i.ytimg.com/vi/x/hqdefault.jpg"
    );
  });

  it("applies the song duration window used by the playlist importer", () => {
    expect(withinTrackDuration(10)).toBe(false);
    expect(withinTrackDuration(200)).toBe(true);
    expect(withinTrackDuration(1200)).toBe(false);
    expect(withinTrackDuration(undefined)).toBe(false);
  });

  it("recognizes playlist nodes by type or id prefix", () => {
    expect(isPlaylistNode({ id: "PLabc", item_type: "playlist" })).toBe(true);
    expect(isPlaylistNode({ id: "VLPLabc" })).toBe(true);
    expect(isPlaylistNode({ id: "abc123", item_type: "song" })).toBe(false);
  });
});

describe("Curated playlist seed data", () => {
  it("defines unique curated playlists with search queries (never fabricated ids)", () => {
    const ids = new Set<string>();
    for (const curated of CURATED_PLAYLISTS) {
      expect(ids.has(curated.id)).toBe(false);
      ids.add(curated.id);
      expect(curated.title.length).toBeGreaterThan(2);
      expect(curated.query.length).toBeGreaterThan(5);
      // Queries, not YouTube playlist ids — resolution happens at runtime
      expect(curated.query).not.toMatch(/^(PL|VL|RD)[\w-]{10,}/);
      expect(curated.coverUrl).toMatch(/^\/playlists\/.+\.png$/);
    }
    expect(CURATED_PLAYLISTS.length).toBeGreaterThanOrEqual(8);
  });
});
