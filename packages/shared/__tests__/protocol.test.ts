import { describe, it, expect } from "bun:test";
import {
  ClientActionSchema,
  ServerActionSchema,
  TrackSchema,
  RoomPlaybackStateSchema,
} from "../src/index";
import { PRIVATE_ROOM_CLOSE_CODE, PROBE_GAP_MS } from "../src/constants";

describe("Soundlounge Protocol Validation", () => {
  it("validates multi-source TrackSchema for YouTube, SoundCloud, and Uploads", () => {
    const ytTrack = {
      id: "yt_123",
      title: "Bohemian Rhapsody",
      artist: "Queen",
      durationMs: 354000,
      url: "https://r2.soundlounge.app/youtube/yt_123.m4a",
      source: "youtube" as const,
      coverUrl: "https://i.ytimg.com/vi/yt_123/hqdefault.jpg",
    };
    expect(TrackSchema.parse(ytTrack)).toMatchObject(ytTrack);

    const scTrack = {
      id: "sc_456",
      title: "Resonance",
      artist: "HOME",
      durationMs: 212000,
      url: "https://api-v2.soundcloud.com/media/sc_456/stream",
      source: "soundcloud" as const,
    };
    expect(TrackSchema.parse(scTrack)).toMatchObject(scTrack);

    const uploadTrack = {
      id: "upl_789",
      title: "My Track.wav",
      artist: "Basim",
      durationMs: 180000,
      url: "https://r2.soundlounge.app/room-1/My_Track___123.wav",
      source: "upload" as const,
      r2Key: "room-1/My_Track___123.wav",
    };
    expect(TrackSchema.parse(uploadTrack)).toMatchObject(uploadTrack);
  });

  it("validates NTP probe pairs with jitter filtering fields", () => {
    const ntpReq = {
      type: "NTP_REQUEST" as const,
      t0: 1700000000000,
      probeGroupId: 42,
      probeGroupIndex: 0,
      clientRTT: 28,
    };
    expect(ClientActionSchema.parse(ntpReq)).toMatchObject(ntpReq);
  });

  it("validates scheduled barrier execution broadcast", () => {
    const playBroadcast = {
      type: "SCHEDULED_PLAY" as const,
      trackId: "yt_123",
      serverTimeToExecute: 1700000000500,
      positionMs: 12000,
    };
    expect(ServerActionSchema.parse(playBroadcast)).toMatchObject(playBroadcast);
  });

  it("exports correct protocol constants", () => {
    expect(PRIVATE_ROOM_CLOSE_CODE).toBe(4003);
    expect(PROBE_GAP_MS).toBe(25);
  });
});
