import { describe, it, expect } from "bun:test";
import { classifyGenre, getPeerArtistsForArtist, getLanguagesForGenre, type MusicGenre } from "../genreTaxonomy";
import { isTrackByArtist } from "../../youtube/artistAttribution";
import type { Track } from "@soundlounge/shared";

describe("Pakistani & Kashmiri Genre Taxonomy", () => {
  it("classifies Pakistani pop and Coke Studio tracks", () => {
    expect(classifyGenre({ title: "Pasoori", artist: "Ali Sethi, Shae Gill" }).genre).toBe("pakistani");
    expect(classifyGenre({ title: "Aadat", artist: "Atif Aslam" }).genre).toBe("pakistani");
    expect(classifyGenre({ title: "Kahani Suno 2.0", artist: "Kaifi Khalil" }).genre).toBe("pakistani");
    // Rahat Fateh Ali Khan stays filed under the ghazal/qawwali cluster (artist-first classification)
    expect(classifyGenre({ title: "Afreen Afreen", artist: "Rahat Fateh Ali Khan, Momina Mustehsan" }).genre).toBe(
      "ghazal"
    );
  });

  it("classifies Pakistani hip-hop into the pakistani genre", () => {
    expect(classifyGenre({ title: "Downers At Dusk", artist: "Talha Anjum" }).genre).toBe("pakistani");
    expect(classifyGenre({ title: "Mukhray", artist: "Young Stunners" }).genre).toBe("pakistani");
  });

  it("classifies Kashmiri artists and Sufiana markers", () => {
    expect(classifyGenre({ title: "Awara", artist: "Ali Saffudin" }).genre).toBe("kashmiri");
    expect(classifyGenre({ title: "I Remember", artist: "MC Kash" }).genre).toBe("kashmiri");
    expect(classifyGenre({ title: "Raga Pahadi Santoor Recital", artist: "Unknown Artist" }).genre).toBe("kashmiri");
  });

  it("still classifies Bollywood artists that were always there", () => {
    expect(classifyGenre({ title: "Tum Hi Ho", artist: "Arijit Singh" }).genre).toBe("bollywood");
    expect(classifyGenre({ title: "Channa Mereya", artist: "Arijit Singh" }).genre).toBe("bollywood");
  });

  it("bridges peer recommendations between pakistani and ghazal clusters", () => {
    const atifPeers = getPeerArtistsForArtist("Atif Aslam");
    expect(atifPeers).toContain("Ali Sethi");

    const languages = getLanguagesForGenre("pakistani" as MusicGenre);
    expect(languages).toContain("urdu");
    expect(getLanguagesForGenre("kashmiri" as MusicGenre)).toContain("kashmiri");
  });
});

describe("Artist attribution for the expanded dictionary", () => {
  const buildTrack = (artist: string, title: string): Track => ({
    id: "yt_test",
    title,
    artist,
    durationMs: 200000,
    url: "/api/stream/youtube?id=test",
    source: "youtube",
  });

  it("recognizes new Pakistani artists", () => {
    expect(isTrackByArtist("Ali Sethi", "Pasoori", "Ali Sethi")).toBe(true);
    expect(isTrackByArtist("Young Stunners", "Mukhray", "Young Stunners")).toBe(true);
    expect(isTrackByArtist("Coke Studio", "Pasoori", "Coke Studio Pakistan")).toBe(true);
  });

  it("recognizes Kashmiri artists", () => {
    expect(isTrackByArtist("Ali Saffudin", "Awara", "Ali Saffudin")).toBe(true);
    expect(isTrackByArtist("MC Kash", "I Remember", "MC Kash")).toBe(true);
  });

  it("rejects unrelated artists", () => {
    expect(isTrackByArtist("Some Other Singer", "Random Song", "Ali Sethi")).toBe(false);
    expect(isTrackByArtist("Unknown Artist", "Kashmir", "Ali Saffudin")).toBe(false);
  });
});
