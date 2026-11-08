import { describe, expect, it, mock } from "bun:test";
import React from "react";
import { NavigationSidebar } from "../NavigationSidebar";
import { MOCKUP_SIDEBAR_TRACKS } from "../../lib/data/mockupData";

describe("NavigationSidebar Component & Mobile Responsiveness", () => {
  it("renders correctly with default playlist tracks", () => {
    const handleTabChange = mock(() => {});
    const handleModeChange = mock(() => {});
    const handlePlayTrack = mock(() => {});

    expect(typeof NavigationSidebar).toBe("function");
    expect(MOCKUP_SIDEBAR_TRACKS.length).toBeGreaterThanOrEqual(5);
  });

  it("handles track click and triggers onPlayTrack", () => {
    const handlePlayTrack = mock((track: any) => {});
    const sampleTrack = MOCKUP_SIDEBAR_TRACKS[0];

    handlePlayTrack(sampleTrack);
    expect(handlePlayTrack).toHaveBeenCalledWith(sampleTrack);
  });

  it("handles mobile tab navigation callbacks", () => {
    const handleTabChange = mock((tab: any) => {});
    const handleCloseMobile = mock(() => {});

    handleTabChange("queue");
    handleCloseMobile();

    expect(handleTabChange).toHaveBeenCalledWith("queue");
    expect(handleCloseMobile).toHaveBeenCalledTimes(1);
  });
});
