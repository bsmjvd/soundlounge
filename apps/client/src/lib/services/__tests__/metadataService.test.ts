import { describe, it, expect } from "bun:test";
import { getDisambiguationCounterparts } from "../metadataService";

describe("Metadata & Disambiguation Service", () => {
  it("resolves disambiguation counterparts for identical and related titles", () => {
    const counterparts2007 = getDisambiguationCounterparts("the_train_2007_mithoon");
    expect(counterparts2007.length).toBeGreaterThanOrEqual(2);

    // Should include 1970 film and the American band
    expect(counterparts2007.some((a) => a.id === "the_train_1970_rd_burman")).toBe(true);
    expect(counterparts2007.some((a) => a.primaryArtist === "Train")).toBe(true);

    const counterparts1970 = getDisambiguationCounterparts("the_train_1970_rd_burman");
    expect(counterparts1970.some((a) => a.id === "the_train_2007_mithoon")).toBe(true);
  });
});
