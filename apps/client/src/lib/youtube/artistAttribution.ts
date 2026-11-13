// Shared YouTube artist attribution: identifies which artist a search result
// belongs to (the dictionary + word-boundary alias matching) and cleans raw
// video titles into displayable track titles. Used by /api/search and
// /api/artist-tracks.

export const RECORD_LABELS = [
  "sony music",
  "t-series",
  "yrf",
  "zee music",
  "tips",
  "saregama",
  "speed records",
  "universal music",
  "eros now",
  "aditya music",
  "think music",
  "lahari",
  "geet mp3",
  "white hill",
  "juke dock",
  "warner music",
  "times music",
  "venus",
  "desi music factory",
  "vyrl",
  "dm - desi melodies",
  "vevo",
  "official channel",
  "yrf music",
  "tseries",
  "coke studio",
];

export const ARTIST_DICTIONARY: { name: string; aliases: string[] }[] = [
  { name: "Arijit Singh", aliases: ["arijit singh", "arjit singh", "arijit", "arjit"] },
  { name: "Atif Aslam", aliases: ["atif aslam", "atif"] },
  { name: "Mohit Chauhan", aliases: ["mohit chauhan"] },
  { name: "KK", aliases: ["kk", "k.k.", "kay kay"] },
  { name: "Shreya Ghoshal", aliases: ["shreya ghoshal", "shreya"] },
  { name: "Sonu Nigam", aliases: ["sonu nigam"] },
  { name: "Jubin Nautiyal", aliases: ["jubin nautiyal", "jubin"] },
  { name: "Asees Kaur", aliases: ["asees kaur", "asees"] },
  { name: "Roop Kumar Rathod", aliases: ["roop kumar rathod", "roop kumar"] },
  { name: "Jagjit Singh", aliases: ["jagjit singh", "jagjit"] },
  { name: "Mehdi Hassan", aliases: ["mehdi hassan"] },
  { name: "Ghulam Ali", aliases: ["ghulam ali"] },
  { name: "Pankaj Udhas", aliases: ["pankaj udhas"] },
  { name: "Lata Mangeshkar", aliases: ["lata mangeshkar", "lata"] },
  { name: "Kishore Kumar", aliases: ["kishore Kumar", "kishore"] },
  { name: "Mohammed Rafi", aliases: ["mohammed rafi", "mohd rafi", "rafi"] },
  { name: "Asha Bhosle", aliases: ["asha bhosle", "asha"] },
  { name: "R.D. Burman", aliases: ["r.d. burman", "rd burman", "pancham"] },
  { name: "Mukesh", aliases: ["mukesh"] },
  { name: "Alka Yagnik", aliases: ["alka yagnik"] },
  { name: "Kumar Sanu", aliases: ["kumar sanu"] },
  { name: "Udit Narayan", aliases: ["udit narayan"] },
  { name: "Sunidhi Chauhan", aliases: ["sunidhi chauhan"] },
  { name: "Sidhu Moose Wala", aliases: ["sidhu moose wala", "sidhu moosewala", "sidhu"] },
  { name: "Karan Aujla", aliases: ["karan aujla"] },
  { name: "Diljit Dosanjh", aliases: ["diljit dosanjh", "diljit"] },
  { name: "AP Dhillon", aliases: ["ap dhillon"] },
  { name: "The Weeknd", aliases: ["the weeknd", "weeknd"] },
  { name: "Daft Punk", aliases: ["daft punk"] },
  { name: "Billie Eilish", aliases: ["billie eilish"] },
  { name: "Dua Lipa", aliases: ["dua lipa"] },
  { name: "Taylor Swift", aliases: ["taylor swift"] },
  { name: "Drake", aliases: ["drake"] },
  { name: "Ed Sheeran", aliases: ["ed sheeran"] },
  { name: "Justin Bieber", aliases: ["justin Bieber", "bieber"] },
  { name: "Post Malone", aliases: ["post malone"] },
  { name: "Coldplay", aliases: ["coldplay"] },
  { name: "Pritam", aliases: ["pritam"] },
  { name: "Mithoon", aliases: ["mithoon"] },
  { name: "A.R. Rahman", aliases: ["a.r. rahman", "ar rahman", "rahman"] },
  // Pakistani pop / Sufi / hip-hop
  { name: "Ali Sethi", aliases: ["ali sethi"] },
  { name: "Shae Gill", aliases: ["shae gill"] },
  { name: "Hasan Raheem", aliases: ["hasan raheem"] },
  { name: "Abdul Hannan", aliases: ["abdul hannan"] },
  { name: "Kaifi Khalil", aliases: ["kaifi khalil", "kaifi"] },
  { name: "Asim Azhar", aliases: ["asim azhar"] },
  { name: "Aima Baig", aliases: ["aima baig"] },
  { name: "Meesha Shafi", aliases: ["meesha shafi"] },
  { name: "Sajjad Ali", aliases: ["sajjad ali"] },
  { name: "Ali Zafar", aliases: ["ali zafar"] },
  { name: "Strings", aliases: ["strings band", "strings pakistani band"] },
  { name: "Annural Khalid", aliases: ["annural khalid"] },
  { name: "Umair", aliases: ["umair producer", "umair talha"] },
  { name: "Maanu", aliases: ["maanu"] },
  { name: "Young Stunners", aliases: ["young stunners"] },
  { name: "Talha Anjum", aliases: ["talha anjum"] },
  { name: "Talha Yunus", aliases: ["talha yunus"] },
  { name: "Faris Shafi", aliases: ["faris shafi"] },
  { name: "Eva B", aliases: ["eva b"] },
  { name: "Nusrat Fateh Ali Khan", aliases: ["nusrat fateh ali khan", "nusrat"] },
  { name: "Abida Parveen", aliases: ["abida parveen"] },
  { name: "Rahat Fateh Ali Khan", aliases: ["rahat fateh ali khan", "rahat fateh"] },
  { name: "Momina Mustehsan", aliases: ["momina mustehsan"] },
  { name: "Coke Studio Pakistan", aliases: ["coke studio pakistan", "coke studio"] },
  // Kashmiri
  { name: "Ali Saffudin", aliases: ["ali saffudin"] },
  { name: "MC Kash", aliases: ["mc kash"] },
  { name: "Shivkumar Sharma", aliases: ["shivkumar sharma", "shiv kumar sharma"] },
  { name: "Rahul Sharma", aliases: ["rahul sharma santoor", "rahul sharma"] },
];

interface AliasEntry {
  artistName: string;
  alias: string;
  regex: RegExp;
}

// Precompile and sort aliases by length descending so longer, specific artist names
// (e.g. "Karan Aujla") are matched before short 2-character abbreviations ("KK").
const SORTED_ARTIST_ALIASES: AliasEntry[] = ARTIST_DICTIONARY.flatMap((entry) =>
  entry.aliases.map((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return {
      artistName: entry.name,
      alias,
      regex: new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i"),
    };
  })
).sort((a, b) => b.alias.length - a.alias.length);

export function parseViewCount(viewCountText?: string, shortViewText?: string): number {
  if (viewCountText) {
    const numericStr = viewCountText.replace(/[^0-9]/g, "");
    const parsed = parseInt(numericStr, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (shortViewText) {
    const text = shortViewText.toUpperCase().trim();
    const match = text.match(/^([\d.]+)\s*([KMB])?/);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2];
      if (unit === "B") return val * 1_000_000_000;
      if (unit === "M") return val * 1_000_000;
      if (unit === "K") return val * 1_000;
      return val;
    }
  }
  return 0;
}

export function formatViews(views: number): string {
  if (!views || views <= 0) return "500K";
  if (views >= 1_000_000_000) {
    return (views / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (views >= 1_000_000) {
    return (views / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (views >= 1_000) {
    return (views / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return views.toLocaleString();
}

export function extractCleanTrackInfo(
  rawTitle: string,
  rawAuthor?: string,
  query: string = ""
): { title: string; artist: string } {
  const authorLower = (rawAuthor || "").toLowerCase().trim();
  const titleLower = (rawTitle || "").toLowerCase();
  const queryLower = (query || "").toLowerCase().trim();
  const isLabel =
    RECORD_LABELS.some((l) => authorLower.includes(l)) ||
    /music|records|company|entertainment|films|official|tseries|vevo/i.test(authorLower);

  // 1. Check title and author against sorted aliases with strict word-boundary matching
  let detectedArtist = "";
  for (const entry of SORTED_ARTIST_ALIASES) {
    if (entry.regex.test(titleLower) || entry.regex.test(authorLower)) {
      detectedArtist = entry.artistName;
      break;
    }
  }

  // 2. If query was searched for an artist (e.g. 'arjit' or 'karan')
  if (!detectedArtist && queryLower.length >= 3) {
    for (const entry of SORTED_ARTIST_ALIASES) {
      if (entry.regex.test(queryLower) || queryLower.includes(entry.alias)) {
        if (titleLower.includes(queryLower) || entry.regex.test(titleLower)) {
          detectedArtist = entry.artistName;
          break;
        }
      }
    }
  }

  // 3. Fallback: if not a record label, use author name
  if (!detectedArtist) {
    detectedArtist = isLabel ? "Various Artists" : rawAuthor || "Unknown Artist";
  }

  // Clean title: extract main song title before first | or • or separator
  let cleanTitle = rawTitle;
  const pipeParts = rawTitle.split(/\s*[|•]\s*/);
  if (pipeParts.length > 1) {
    cleanTitle = pipeParts[0];
  }

  cleanTitle = cleanTitle
    .replace(
      /\s*[-–—]\s*(lyrical song|lyric video|official audio|official video|full song|video song|audio song|song).*/i,
      ""
    )
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .trim();

  // If title ends with or contains the detected artist name, strip it to keep title clean
  if (detectedArtist && detectedArtist !== "Various Artists" && detectedArtist !== "Unknown Artist") {
    const artistRegex = new RegExp(`\\s*[-–—:]?\\s*${detectedArtist.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
    cleanTitle = cleanTitle.replace(artistRegex, "").trim();
  }

  return { title: cleanTitle || rawTitle, artist: detectedArtist };
}

// Word-boundary check that a result belongs to a specific artist
export function isTrackByArtist(trackArtist: string, trackTitle: string, artistName: string): boolean {
  const clean = artistName.toLowerCase().replace(/\s+/g, " ").trim();
  if (clean.length < 3) return false;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
  if (pattern.test(trackArtist.toLowerCase()) || pattern.test(trackTitle.toLowerCase())) {
    return true;
  }
  // Umbrella names: a result attributed to "Coke Studio" belongs to a
  // "Coke Studio Pakistan" request, but never the other way around
  const trackArtistClean = (trackArtist || "").toLowerCase().trim();
  if (
    trackArtistClean.length >= 3 &&
    trackArtistClean !== "various artists" &&
    trackArtistClean !== "unknown artist" &&
    clean.includes(trackArtistClean)
  ) {
    return true;
  }
  return false;
}
