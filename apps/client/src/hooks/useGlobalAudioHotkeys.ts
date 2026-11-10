"use client";

import { useEffect } from "react";

interface GlobalAudioHotkeysOptions {
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSeekRelative: (deltaMs: number) => void;
  onVolumeRelative: (deltaVolume: number) => void;
  onToggleStudio?: () => void;
  enabled?: boolean;
}

/**
 * Global Keyboard Hotkeys for Audiophile Playback
 * Space: Play/Pause (safely ignores active inputs)
 * M: Mute/Unmute
 * ArrowLeft / ArrowRight: Seek -5s / +5s (Shift for -15s / +15s)
 * ArrowUp / ArrowDown: Volume +5% / -5%
 * S: Toggle Audiophile Studio Immersion Mode
 */
export function useGlobalAudioHotkeys({
  onTogglePlay,
  onToggleMute,
  onSeekRelative,
  onVolumeRelative,
  onToggleStudio,
  enabled = true,
}: GlobalAudioHotkeysOptions) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore hotkeys when focus is on any interactive control, so Space
      // activates the control instead of toggling playback a second time.
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, button, a[href], [contenteditable='true'], [role='textbox'], [role='combobox'], [role='slider'], [role='button']"
        )
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          onTogglePlay();
          break;

        case "KeyM":
          e.preventDefault();
          onToggleMute();
          break;

        case "ArrowLeft":
          e.preventDefault();
          onSeekRelative(e.shiftKey ? -15000 : -5000);
          break;

        case "ArrowRight":
          e.preventDefault();
          onSeekRelative(e.shiftKey ? 15000 : 5000);
          break;

        case "ArrowUp":
          e.preventDefault();
          onVolumeRelative(0.05);
          break;

        case "ArrowDown":
          e.preventDefault();
          onVolumeRelative(-0.05);
          break;

        case "KeyS":
          if (onToggleStudio) {
            e.preventDefault();
            onToggleStudio();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onTogglePlay, onToggleMute, onSeekRelative, onVolumeRelative, onToggleStudio]);
}
