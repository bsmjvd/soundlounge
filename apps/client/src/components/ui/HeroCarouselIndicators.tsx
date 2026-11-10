"use client";

import React from "react";

interface HeroCarouselIndicatorsProps {
  total: number;
  activeIndex: number;
  onChange: (index: number) => void;
}

export function HeroCarouselIndicators({ total, activeIndex, onChange }: HeroCarouselIndicatorsProps) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Featured slides">
      {Array.from({ length: total }).map((_, idx) => {
        const isActive = idx === activeIndex;
        return (
          <button
            key={idx}
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(idx);
            }}
            className={`h-1.5 rounded-full transition duration-300 cursor-pointer ${
              isActive
                ? "w-6 bg-accent shadow-[0_0_8px_rgba(0,229,255,0.6)]"
                : "w-1.5 bg-ink/20 hover:bg-ink/40"
            }`}
          />
        );
      })}
    </div>
  );
}
