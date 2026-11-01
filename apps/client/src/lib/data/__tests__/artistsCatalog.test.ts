import { describe, it, expect } from "bun:test";
import {
  ARTISTS_CATALOG,
  getAllCatalogArtists,
  getArtistsByLetter,
  getArtistsByRegion,
  searchArtistsCatalog,
} from "../artistsCatalog";

describe("Scalable Artists Directory & Discography Catalog", () => {
  it("provides an extensive verified catalog of artists", () => {
    const all = getAllCatalogArtists();
    expect(all.length).toBeGreaterThanOrEqual(20);
    // Every artist has an avatar, bio, legal name, and top tracks
    for (const a of all) {
      expect(a.id).toBeDefined();
      expect(a.name).toBeDefined();
      expect(a.realName).toBeDefined();
      expect(a.avatarUrl).toBeDefined();
      expect(a.bio.length).toBeGreaterThan(10);
      expect(a.topTracks.length).toBeGreaterThan(0);
    }
  });

  it("filters artists by starting letter (A-Z jump strip)", () => {
    const aArtists = getArtistsByLetter("A");
    expect(aArtists.length).toBeGreaterThanOrEqual(3);
    expect(aArtists.every((a) => a.name.toUpperCase().startsWith("A"))).toBe(true);

    const kArtists = getArtistsByLetter("K");
    expect(kArtists.length).toBeGreaterThanOrEqual(3);
    const kNames = kArtists.map((a) => a.name);
    expect(kNames).toContain("KK");
    expect(kNames).toContain("Karan Aujla");
    expect(kNames).toContain("Kendrick Lamar");

    const tArtists = getArtistsByLetter("T");
    const tNames = tArtists.map((a) => a.name);
    expect(tNames).toContain("Train");
    expect(tNames).toContain("The Weeknd");
    expect(tNames).toContain("Taylor Swift");

    const all = getArtistsByLetter("ALL");
    expect(all.length).toBe(ARTISTS_CATALOG.length);
  });

  it("filters artists by musical region and genre", () => {
    const bollywood = getArtistsByRegion("bollywood");
    expect(bollywood.length).toBeGreaterThanOrEqual(3);
    expect(bollywood.some((a) => a.name === "Arijit Singh")).toBe(true);
    expect(bollywood.some((a) => a.name === "KK")).toBe(true);
    expect(bollywood.some((a) => a.name === "Mithoon")).toBe(true);

    const ghazal = getArtistsByRegion("ghazal");
    expect(ghazal.some((a) => a.name === "Jagjit Singh")).toBe(true);
    expect(ghazal.some((a) => a.name === "Mehdi Hassan")).toBe(true);

    const retro = getArtistsByRegion("retro");
    expect(retro.some((a) => a.name === "Lata Mangeshkar")).toBe(true);
    expect(retro.some((a) => a.name === "R.D. Burman")).toBe(true);

    const rock = getArtistsByRegion("rock");
    expect(rock.some((a) => a.name === "Train")).toBe(true);
    expect(rock.some((a) => a.name === "Coldplay")).toBe(true);
  });

  it("disambiguates artists connected to 'The Train' across eras and bands", () => {
    // 1. Train (American Rock band)
    const trainBand = ARTISTS_CATALOG.find((a) => a.id === "train-band");
    expect(trainBand).toBeDefined();
    expect(trainBand!.genre.toLowerCase()).toContain("rock");
    expect(trainBand!.topTracks.some((t) => t.title.includes("Drops of Jupiter"))).toBe(true);
    expect(trainBand!.topTracks.some((t) => t.title.includes("Hey, Soul Sister"))).toBe(true);

    // 2. The Train (2007 Bollywood Movie: KK & Mithoon)
    const kk = ARTISTS_CATALOG.find((a) => a.id === "kk");
    expect(kk).toBeDefined();
    expect(kk!.topTracks.some((t) => t.title.includes("Beete Lamhein"))).toBe(true);
    expect(kk!.albums?.some((alb) => alb.id === "the_train_2007_mithoon")).toBe(true);

    const mithoon = ARTISTS_CATALOG.find((a) => a.id === "mithoon");
    expect(mithoon).toBeDefined();
    expect(mithoon!.topTracks.some((t) => t.title.includes("Wo Ajnabee"))).toBe(true);
    expect(mithoon!.albums?.some((alb) => alb.id === "the_train_2007_mithoon")).toBe(true);

    // 3. The Train (1970 Classic Bollywood Movie: Lata Mangeshkar & R.D. Burman)
    const lata = ARTISTS_CATALOG.find((a) => a.id === "lata-mangeshkar");
    expect(lata).toBeDefined();
    expect(lata!.topTracks.some((t) => t.title.includes("Kis Liye Maine Pyaar Kiya"))).toBe(true);
    expect(lata!.albums?.some((alb) => alb.id === "the_train_1970_rd_burman")).toBe(true);

    const rdBurman = ARTISTS_CATALOG.find((a) => a.id === "rd-burman");
    expect(rdBurman).toBeDefined();
    expect(rdBurman!.topTracks.some((t) => t.title.includes("O Meri Jaan Maine Kaha"))).toBe(true);
    expect(rdBurman!.albums?.some((alb) => alb.id === "the_train_1970_rd_burman")).toBe(true);
  });

  it("performs multi-criteria search by name, role, legal name, and genre", () => {
    const search1 = searchArtistsCatalog("emperor");
    expect(search1.some((a) => a.name === "Mehdi Hassan")).toBe(true);

    const search2 = searchArtistsCatalog("pancham");
    expect(search2.some((a) => a.name === "R.D. Burman")).toBe(true);

    const search3 = searchArtistsCatalog("nightingale");
    expect(search3.some((a) => a.name === "Lata Mangeshkar")).toBe(true);

    const search4 = searchArtistsCatalog("soul sister");
    expect(search4.some((a) => a.name === "Train")).toBe(true);
  });
});
