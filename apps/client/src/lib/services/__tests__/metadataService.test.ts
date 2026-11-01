import { describe, it, expect } from "bun:test";
import {
  getAlbumById,
  searchAlbums,
  getAlbumsForArtist,
  getAllAlbums,
} from "../metadataService";

describe("Metadata & Disambiguation Service", () => {
  it("disambiguates identical album titles by release year and artist/composer", async () => {
    const results = await searchAlbums("The Train");
    expect(results.length).toBeGreaterThanOrEqual(2);

    const album2007 = results.find((a) => a.releaseYear === 2007);
    const album1970 = results.find((a) => a.releaseYear === 1970);

    expect(album2007).toBeDefined();
    expect(album2007!.primaryArtist).toBe("Mithoon");
    expect(album2007!.movieDetails?.starCast).toContain("Emraan Hashmi");
    expect(album2007!.tracks.some((t) => t.title === "Beete Lamhein")).toBe(true);

    expect(album1970).toBeDefined();
    expect(album1970!.primaryArtist).toBe("R.D. Burman");
    expect(album1970!.movieDetails?.starCast).toContain("Rajesh Khanna");
    expect(album1970!.tracks.some((t) => t.title === "Kis Liye Maine Pyaar Kiya")).toBe(true);
  });

  it("retrieves American Rock band Train album separately", async () => {
    const results = await searchAlbums("Train");
    const bandAlbum = results.find((a) => a.id.includes("train_2009"));

    expect(bandAlbum).toBeDefined();
    expect(bandAlbum!.primaryArtist).toBe("Train");
    expect(bandAlbum!.type).toBe("studio_album");
    expect(bandAlbum!.tracks.some((t) => t.title === "Hey, Soul Sister")).toBe(true);
  });

  it("retrieves album by exact ID", async () => {
    const album = await getAlbumById("the_train_2007_mithoon");
    expect(album).not.toBeNull();
    expect(album!.title).toBe("The Train");
    expect(album!.releaseYear).toBe(2007);
    expect(album!.tracks.length).toBe(5);
  });

  it("retrieves albums for a specific artist or singer", async () => {
    const albums = await getAlbumsForArtist("KK");
    expect(albums.some((a) => a.id === "the_train_2007_mithoon")).toBe(true);
  });
});
