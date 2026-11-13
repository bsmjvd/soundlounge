/**
 * Normalizes a song title to its core canonical form to detect duplicates across variations
 * (e.g. "Softly", "SOFTLY KARAN AUJLA", "Softly (Official Music Video)", "Softly - Lyrical").
 */
export function normalizeSongTitle(title: string, artist?: string): string {
  let s = (title || "").toLowerCase();

  // Strip pipe or bullet suffix additions (e.g. "| Official Video | Ikky")
  s = s.split(/\s*[|•]\s*/)[0];

  // Strip artist name if embedded in title (e.g. "SOFTLY KARAN AUJLA" -> "softly")
  if (artist && artist.trim().length >= 3) {
    const escaped = artist
      .trim()
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "");
  }

  // Strip common YouTube audio/video badges, parentheticals, and extra punctuation
  s = s
    .replace(/\s*[-–—:]\s*(lyrical|official|video|audio|full song|song).*/i, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/feat\..*|ft\..*/i, "")
    .replace(/official\s+(music\s+)?(video|audio|track)/gi, "")
    .replace(/lyric(al)?\s+(video|song|audio)/gi, "")
    .replace(/full\s+(audio|video|song)/gi, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}
