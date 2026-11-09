import { describe, it, expect } from "bun:test";
import { pickAudioFormat } from "../src/youtube";

describe("pickAudioFormat", () => {
  it("prefers mp4 audio, then highest bitrate, skipping video and url-less formats", () => {
    const formats = [
      { url: "v", mimeType: "video/mp4", bitrate: 900000 },
      { url: "opus", mimeType: 'audio/webm; codecs="opus"', bitrate: 160000 },
      { mimeType: 'audio/mp4; codecs="mp4a.40.2"', bitrate: 256000 },
      { url: "aac-lo", mimeType: 'audio/mp4; codecs="mp4a.40.5"', bitrate: 48000 },
      { url: "aac-hi", mimeType: 'audio/mp4; codecs="mp4a.40.2"', bitrate: 130000 },
    ];
    expect(pickAudioFormat(formats)?.url).toBe("aac-hi");
    expect(pickAudioFormat([])).toBeUndefined();
  });
});
