"use client";

import React from "react";
import { Compass, Library, ListMusic, Radio } from "lucide-react";
import type { TopNavTab } from "./TopBar";
import type { NavTab } from "./NavigationSidebar";
import { hapticLight } from "../lib/haptics";

interface MobileNavProps {
  activeTopTab: TopNavTab;
  activeTab: NavTab;
  onSelect: (tab: TopNavTab) => void;
  onOpenQueue: () => void;
  hasPlayer: boolean;
  queueCount?: number;
}

export function MobileNav({
  activeTopTab,
  activeTab,
  onSelect,
  onOpenQueue,
  hasPlayer,
  queueCount = 0,
}: MobileNavProps) {
  const isQueue = activeTab === "queue";
  const isDiscover = !isQueue && activeTopTab === "discover";
  const isLibrary = !isQueue && activeTopTab === "library";
  const isRadio = !isQueue && activeTopTab === "radio";

  const select = (tab: TopNavTab) => {
    hapticLight();
    onSelect(tab);
  };

  return (
    <nav
      aria-label="Primary"
      data-player={hasPlayer}
      className="mobile-nav-dock animate-view-in floating-surface fixed left-1/2 z-40 w-[calc(100%_-_1.25rem)] max-w-sm -translate-x-1/2 rounded-card border border-line-strong p-1 shadow-panel md:hidden"
    >
      <div className="grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => select("discover")}
          aria-current={isDiscover ? "page" : undefined}
          className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-control text-[11px] font-semibold transition-colors cursor-pointer ${
            isDiscover ? "bg-accent/10 text-accent" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
          }`}
        >
          <Compass className="h-[18px] w-[18px]" />
          <span>Discover</span>
        </button>

        <button
          type="button"
          onClick={() => select("library")}
          aria-current={isLibrary ? "page" : undefined}
          className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-control text-[11px] font-semibold transition-colors cursor-pointer ${
            isLibrary ? "bg-accent/10 text-accent" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
          }`}
        >
          <Library className="h-[18px] w-[18px]" />
          <span>Library</span>
        </button>

        <button
          type="button"
          onClick={() => select("radio")}
          aria-current={isRadio ? "page" : undefined}
          className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-control text-[11px] font-semibold transition-colors cursor-pointer ${
            isRadio ? "bg-accent/10 text-accent" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
          }`}
        >
          <Radio className="h-[18px] w-[18px]" />
          <span>Radio</span>
        </button>

        <button
          type="button"
          onClick={() => {
            hapticLight();
            onOpenQueue();
          }}
          aria-current={isQueue ? "page" : undefined}
          className={`relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-control text-[11px] font-semibold transition-colors cursor-pointer ${
            isQueue ? "bg-accent/10 text-accent" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
          }`}
        >
          <ListMusic className="h-[18px] w-[18px]" />
          <span>Queue</span>
          {queueCount > 0 && (
            <span className="absolute right-2 top-1 min-w-[14px] rounded-full bg-accent px-1 text-center font-mono text-[10px] leading-tight text-accent-foreground">
              {queueCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
