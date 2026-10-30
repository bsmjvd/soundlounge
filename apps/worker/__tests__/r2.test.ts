import { describe, it, expect } from "bun:test";
import { sanitizeR2Key, formatAudioPublicUrl } from "../src/r2";
import { R2_AUDIO_FILE_NAME_DELIMITER } from "@soundlounge/shared";

describe("R2 Storage Utilities", () => {
  it("sanitizes filenames and namespaces them by room ID and timestamp", () => {
    const roomId = "room_abc123";
    const rawFileName = "My Favorite Track [2024]!.mp3";
    const timestamp = 1700000000000;

    const key = sanitizeR2Key(roomId, rawFileName, timestamp);
    expect(key).toBe(`rooms/${roomId}/My_Favorite_Track__2024__${R2_AUDIO_FILE_NAME_DELIMITER}${timestamp}.mp3`);
  });

  it("formats public CDN url from R2 key", () => {
    const cdnBase = "https://r2.soundlounge.app";
    const key = "rooms/room_1/track___1700000000000.mp3";
    const url = formatAudioPublicUrl(cdnBase, key);
    expect(url).toBe("https://r2.soundlounge.app/rooms/room_1/track___1700000000000.mp3");
  });
});
