import { describe, it, expect } from "bun:test";
import { createHmac } from "node:crypto";
import { signPhoneUrl } from "../phoneStreamer";
import { isAllowedStreamUrl } from "../streamHosts";

describe("signPhoneUrl", () => {
  it("signs <videoId>.<exp> with HMAC-SHA256 the way phone-streamer verifies it", () => {
    const url = new URL(signPhoneUrl("https://a-b.trycloudflare.com", "secret", "cWMxCE2HTag", 1000));
    const exp = url.searchParams.get("exp")!;
    expect(url.pathname).toBe("/yt/cWMxCE2HTag");
    expect(Number(exp)).toBe(1000 + 6 * 3600);
    expect(url.searchParams.get("sig")).toBe(createHmac("sha256", "secret").update(`cWMxCE2HTag.${exp}`).digest("hex"));
    expect(isAllowedStreamUrl(url.toString())).toBe(true);
  });
});
