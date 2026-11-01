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

  it("validates AlbumSchema with movie details and disambiguation keys", () => {
    const { AlbumSchema, createDisambiguationKey } = require("../src/index");

    // Case 1: The Train (2007) Bollywood Film
    const train2007Key = createDisambiguationKey("The Train", 2007, "Mithoon");
    expect(train2007Key).toBe("the_train_2007_mithoon");

    const train2007Album = {
      id: train2007Key,
      title: "The Train",
      releaseYear: 2007,
      type: "movie_soundtrack",
      disambiguationLabel: "2007 Bollywood Thriller • Mithoon, KK, Emraan Hashmi",
      primaryArtist: "Mithoon",
      featuredSingers: ["KK", "Shilpa Rao", "Zubeen Garg"],
      genres: ["Bollywood", "Sufi Rock"],
      coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
      movieDetails: {
        movieTitle: "The Train",
        releaseYear: 2007,
        starCast: ["Emraan Hashmi", "Geeta Basra"],
        musicDirectors: ["Mithoon"],
        lyricists: ["Sayeed Quadri"],
      },
      tracks: [
        {
          id: "yt_beete_lamhein",
          title: "Beete Lamhein",
          artist: "KK",
          durationMs: 312000,
          url: "https://r2.soundlounge.app/youtube/yt_beete_lamhein.m4a",
          source: "youtube",
        },
        {
          id: "yt_wo_ajnabee",
          title: "Wo Ajnabee",
          artist: "Mithoon, Shilpa Rao",
          durationMs: 345000,
          url: "https://r2.soundlounge.app/youtube/yt_wo_ajnabee.m4a",
          source: "youtube",
        },
      ],
    };
    expect(AlbumSchema.parse(train2007Album)).toMatchObject(train2007Album);

    // Case 2: The Train (1970) Bollywood Film
    const train1970Key = createDisambiguationKey("The Train", 1970, "RD Burman");
    expect(train1970Key).toBe("the_train_1970_rd_burman");
    expect(train1970Key).not.toBe(train2007Key);

    // Case 3: Train (American Rock Band)
    const trainBandKey = createDisambiguationKey("Train", 1993, "Band");
    expect(trainBandKey).toBe("train_1993_band");
    expect(trainBandKey).not.toBe(train2007Key);
    expect(trainBandKey).not.toBe(train1970Key);
  });
});
