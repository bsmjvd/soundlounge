import { describe, it, expect } from "bun:test";
import {
  classifyGenre,
  getPeerArtistsForArtist,
  getPeerArtistsForGenre,
  type MusicGenre,
} from "../genreTaxonomy";

describe("Genre Taxonomy & Classification Engine", () => {
  it("accurately classifies Ghazal artists and tracks", () => {
    const track1 = {
      title: "Tum Itna Jo Muskura Rahe Ho",
      artist: "Jagjit Singh",
    };
    const res1 = classifyGenre(track1);
    expect(res1.genre).toBe("ghazal");
    expect(res1.confidence).toBeGreaterThanOrEqual(0.8);

    const track2 = {
      title: "Ranjish Hi Sahi - Live Ghazal",
      artist: "Mehdi Hassan",
    };
    const res2 = classifyGenre(track2);
    expect(res2.genre).toBe("ghazal");

    const track3 = {
      title: "Chupke Chupke Raat Din",
      artist: "Ghulam Ali",
    };
    const res3 = classifyGenre(track3);
    expect(res3.genre).toBe("ghazal");

    const track4 = {
      title: "Soulful Urdu Ghazal Collection",
      artist: "Various Artists",
    };
    const res4 = classifyGenre(track4);
    expect(res4.genre).toBe("ghazal");
  });

  it("accurately classifies Punjabi and Desi Hip-Hop artists and tracks", () => {
    const track1 = {
      title: "295",
      artist: "Sidhu Moose Wala",
    };
    const res1 = classifyGenre(track1);
    expect(res1.genre).toBe("punjabi");

    const track2 = {
      title: "Winning Speech",
      artist: "Karan Aujla",
    };
    const res2 = classifyGenre(track2);
    expect(res2.genre).toBe("punjabi");

    const track3 = {
      title: "Kath Lagda",
      artist: "Navaan Sandhu, Dhanda Nyoliwala",
    };
    const res3 = classifyGenre(track3);
    expect(res3.genre).toBe("punjabi");
  });

  it("accurately classifies Pop and Global R&B artists", () => {
    const track1 = {
      title: "Blinding Lights",
      artist: "The Weeknd",
    };
    const res1 = classifyGenre(track1);
    expect(res1.genre).toBe("pop");

    const track2 = {
      title: "Levitating",
      artist: "Dua Lipa",
    };
    const res2 = classifyGenre(track2);
    expect(res2.genre).toBe("pop");

    const track3 = {
      title: "Birds of a Feather",
      artist: "Billie Eilish",
    };
    const res3 = classifyGenre(track3);
    expect(res3.genre).toBe("pop");
  });

  it("accurately classifies Electronic & Synthwave artists", () => {
    const track1 = {
      title: "Get Lucky",
      artist: "Daft Punk ft. Pharrell Williams",
    };
    const res1 = classifyGenre(track1);
    expect(res1.genre).toBe("electronic");
  });

  it("accurately classifies Hip-Hop / Rap artists", () => {
    const track1 = {
      title: "Not Like Us",
      artist: "Kendrick Lamar",
    };
    const res1 = classifyGenre(track1);
    expect(res1.genre).toBe("hiphop");
  });

  it("retrieves peer artists for Ghazal legend Jagjit Singh", () => {
    const peers = getPeerArtistsForArtist("Jagjit Singh");
    expect(peers.length).toBeGreaterThan(0);
    expect(peers.some((p) => p.toLowerCase().includes("mehdi hassan"))).toBe(true);
    expect(peers.some((p) => p.toLowerCase().includes("ghulam ali"))).toBe(true);
  });

  it("retrieves peer artists for Punjabi artist Sidhu Moose Wala", () => {
    const peers = getPeerArtistsForArtist("Sidhu Moose Wala");
    expect(peers.length).toBeGreaterThan(0);
    expect(peers.some((p) => p.toLowerCase().includes("karan aujla"))).toBe(true);
    expect(peers.some((p) => p.toLowerCase().includes("diljit dosanjh"))).toBe(true);
  });

  it("retrieves peer artists for Pop artist The Weeknd", () => {
    const peers = getPeerArtistsForArtist("The Weeknd");
    expect(peers.length).toBeGreaterThan(0);
    expect(peers.some((p) => p.toLowerCase().includes("dua lipa"))).toBe(true);
  });

  it("provides fallback genre for unknown eclectic tracks", () => {
    const track = {
      title: "Random Acoustic Instrumental #402",
      artist: "Anonymous Musician",
    };
    const res = classifyGenre(track);
    expect(res.genre).toBe("other");
  });
});
