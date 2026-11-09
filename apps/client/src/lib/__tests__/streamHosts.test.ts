import { describe, it, expect } from "bun:test";
import { isAllowedStreamUrl } from "../streamHosts";
import { getBounded, setBounded } from "../boundedCache";

describe("isAllowedStreamUrl", () => {
  it("allows https URLs on trusted hosts and their subdomains", () => {
    expect(isAllowedStreamUrl("https://rr3---sn-abc.googlevideo.com/videoplayback?expire=1")).toBe(true);
    expect(isAllowedStreamUrl("https://aac.saavncdn.com/123/abc_320.mp4")).toBe(true);
    expect(isAllowedStreamUrl("https://yt.chocolatemoo53.com/videoplayback?x=1")).toBe(true);
    expect(isAllowedStreamUrl("https://node2.chocolatemoo53.com/videoplayback?x=1")).toBe(true);
  });

  it("rejects lookalike hosts, plain http and garbage", () => {
    expect(isAllowedStreamUrl("https://googlevideo.com.evil.example/videoplayback")).toBe(false);
    expect(isAllowedStreamUrl("https://evilgooglevideo.com/videoplayback")).toBe(false);
    expect(isAllowedStreamUrl("http://rr3---sn-abc.googlevideo.com/videoplayback")).toBe(false);
    expect(isAllowedStreamUrl("not a url")).toBe(false);
    expect(isAllowedStreamUrl("")).toBe(false);
  });
});

describe("setBounded / getBounded", () => {
  it("evicts the least recently used entry once over the limit", () => {
    const map = new Map<string, number>();
    setBounded(map, "a", 1, 2);
    setBounded(map, "b", 2, 2);
    expect(getBounded(map, "a")).toBe(1); // "a" is now most recent
    setBounded(map, "c", 3, 2);
    expect([...map.keys()]).toEqual(["a", "c"]);
    expect(getBounded(map, "b")).toBeUndefined();
  });
});
