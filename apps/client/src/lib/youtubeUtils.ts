const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const NON_MUSIC_TITLE_PATTERN =
  /\b(full movie|complete movie|official movie|official trailer|teaser trailer|trailer|movie clip|full film|full episode|behind the scenes|gameplay|walkthrough|documentary)\b/i;

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (VIDEO_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id && VIDEO_ID_PATTERN.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id && VIDEO_ID_PATTERN.test(id) ? id : null;
      }
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0])) {
        const id = parts[1];
        return id && VIDEO_ID_PATTERN.test(id) ? id : null;
      }
    }
  } catch {
    // Not a valid URL
  }

  return null;
}

export function parseYouTubeDuration(input: string | number | undefined | null): number {
  if (typeof input === "number") {
    return Math.max(0, Math.floor(input * 1000));
  }

  if (typeof input === "string" && /^\d+(:\d{2}){1,2}$/.test(input.trim())) {
    const seconds = input
      .trim()
      .split(":")
      .reduce((acc, part) => acc * 60 + Number(part), 0);
    return seconds * 1000;
  }

  return 0;
}

export function isLikelySong(title: string, durationSeconds: number): boolean {
  // Typical songs are between 30 seconds and 13 minutes (780s)
  if (durationSeconds > 780 || durationSeconds < 30) {
    return false;
  }

  // Filter out movies, trailers, and film clips
  if (NON_MUSIC_TITLE_PATTERN.test(title)) {
    return false;
  }

  return true;
}
