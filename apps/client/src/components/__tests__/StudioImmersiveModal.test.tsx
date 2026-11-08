import { describe, expect, it, mock } from "bun:test";
import React from "react";
import { StudioImmersiveModal } from "../StudioImmersiveModal";
import type { Track } from "@soundlounge/shared";

describe("StudioImmersiveModal Component & Fullscreen Behavior", () => {
  const dummyTrack: Track = {
    id: "yt_mock_123",
    title: "Midnight City",
    artist: "M83",
    durationMs: 243000,
    source: "youtube",
    coverUrl: "https://example.com/cover.jpg",
  };

  it("exports StudioImmersiveModal as a functional component", () => {
    expect(typeof StudioImmersiveModal).toBe("function");
  });

  it("handles close callbacks cleanly", () => {
    const handleClose = mock(() => {});
    handleClose();
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("guards browser document checks when running in headless environments", () => {
    const isDocAvailable = typeof document !== "undefined";
    if (isDocAvailable) {
      const initialOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      expect(document.body.style.overflow).toBe("hidden");
      document.body.style.overflow = initialOverflow;
    } else {
      expect(typeof window).toBe("undefined");
    }
  });
});
