"use client";

import React, { useState } from "react";
import { Disc3, Music } from "lucide-react";

interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallbackTitle?: string;
  fallbackType?: "album" | "artist" | "track";
  containerClassName?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = "",
  containerClassName = "",
  fallbackTitle,
  fallbackType = "album",
  ...props
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(typeof src === "string" ? src : undefined);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Synchronize currentSrc when incoming src prop changes
  React.useEffect(() => {
    setCurrentSrc(typeof src === "string" ? src : undefined);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const handleImageError = () => {
    if (currentSrc && currentSrc.includes("maxresdefault.jpg")) {
      setCurrentSrc(currentSrc.replace("maxresdefault.jpg", "hqdefault.jpg"));
    } else if (currentSrc && currentSrc.includes("hqdefault.jpg")) {
      setCurrentSrc(currentSrc.replace("hqdefault.jpg", "mqdefault.jpg"));
    } else {
      setHasError(true);
    }
  };

  // If src is empty or errored, render the stylized audiophile fallback
  if (!currentSrc || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-sunken via-canvas to-surface text-ink-muted p-2 select-none relative overflow-hidden ${
          fallbackType === "artist" ? "rounded-full" : "rounded-xl"
        } ${containerClassName}`}
        role="img"
        aria-label={alt || fallbackTitle || "Cover"}
      >
        {/* Subtle radial disc pattern background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/30 via-transparent to-transparent pointer-events-none" />

        {fallbackType === "artist" ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-1">
              <Disc3 className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
            </div>
            {fallbackTitle && (
              <span className="text-[11px] font-semibold text-ink-secondary max-w-[80px] truncate px-1">
                {fallbackTitle}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center z-10">
            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-1.5 shadow-[0_0_12px_rgba(20,184,166,0.15)]">
              <Music className="w-4 h-4" />
            </div>
            {fallbackTitle && (
              <span className="text-[11px] font-medium text-ink-secondary max-w-[100px] truncate px-1 leading-tight">
                {fallbackTitle}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
      {/* Subtle skeleton shimmer until loaded */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-surface-raised/80 animate-pulse flex items-center justify-center z-0">
          <Disc3 className="w-5 h-5 text-ink-subtle animate-spin opacity-40" />
        </div>
      )}

      <img
        src={currentSrc}
        alt={alt || fallbackTitle || "Image"}
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        className={`${className} transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        {...props}
      />
    </div>
  );
}
