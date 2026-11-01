"use client";

import React, { useState, useEffect } from "react";
import { Music2 } from "lucide-react";

interface TrackArtworkProps {
  coverUrl?: string | null;
  trackId?: string | null;
  title?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * High-reliability Track Artwork component with multi-tier fallback.
 * Prevents broken cover images when YouTube maxresdefault returns 404
 * or when external CDNs fail.
 */
export function TrackArtwork({
  coverUrl,
  trackId,
  title = "Track artwork",
  className = "w-11 h-11 rounded-lg",
  iconClassName = "w-5 h-5",
}: TrackArtworkProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [fallbackStage, setFallbackStage] = useState<number>(0);

  const rawId = trackId?.startsWith("yt_") ? trackId.slice(3) : trackId;
  const isYouTubeId = rawId && /^[A-Za-z0-9_-]{11}$/.test(rawId);

  useEffect(() => {
    setHasError(false);
    setFallbackStage(0);

    if (coverUrl?.includes("googleusercontent.com")) {
      setImgSrc(coverUrl.replace(/=w\d+-h\d+[^"]*/, "=w500-h500-l90-rj"));
    } else if (coverUrl) {
      setImgSrc(coverUrl);
    } else if (isYouTubeId) {
      setImgSrc(`https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`);
    } else {
      setImgSrc(null);
    }
  }, [coverUrl, trackId, rawId, isYouTubeId]);

  const handleError = () => {
    if (isYouTubeId) {
      if (fallbackStage === 0) {
        setFallbackStage(1);
        setImgSrc(`https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`);
      } else if (fallbackStage === 1) {
        setFallbackStage(2);
        setImgSrc(`https://i.ytimg.com/vi/${rawId}/mqdefault.jpg`);
      } else {
        setHasError(true);
      }
    } else {
      setHasError(true);
    }
  };

  if (!imgSrc || hasError) {
    return (
      <div
        className={`${className} bg-[#141722] border border-[#222738] flex items-center justify-center text-[#5a6275] flex-shrink-0 select-none`}
        title={title}
      >
        <Music2 className={iconClassName} />
      </div>
    );
  }

  return (
    <div
      className={`${className} overflow-hidden bg-[#141722] border border-[#222738] flex-shrink-0 relative select-none`}
    >
      <img
        src={imgSrc}
        alt={title}
        onError={handleError}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}
