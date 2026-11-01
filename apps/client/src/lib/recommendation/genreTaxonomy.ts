export type MusicGenre =
  | "ghazal"
  | "punjabi"
  | "pop"
  | "hiphop"
  | "electronic"
  | "bollywood"
  | "rock"
  | "other";

export interface GenreDefinition {
  id: MusicGenre;
  label: string;
  coreArtists: string[];
  peerArtists: string[];
  keywords: string[];
}

export const GENRE_DEFINITIONS: Record<MusicGenre, GenreDefinition> = {
  ghazal: {
    id: "ghazal",
    label: "Ghazal & Sufi",
    coreArtists: [
      "jagjit singh",
      "mehdi hassan",
      "ghulam ali",
      "pankaj udhas",
      "hariharan",
      "farida khanum",
      "begum akhtar",
      "talat mahmood",
      "chitra singh",
      "bhupinder singh",
      "rahat fateh ali khan",
      "nusrat fateh ali khan",
      "abida parveen",
    ],
    peerArtists: [
      "Jagjit Singh",
      "Mehdi Hassan",
      "Ghulam Ali",
      "Pankaj Udhas",
      "Hariharan",
      "Farida Khanum",
      "Rahat Fateh Ali Khan",
      "Nusrat Fateh Ali Khan",
    ],
    keywords: [
      "ghazal",
      "qawwali",
      "sufi",
      "nazm",
      "shayari",
      "urdu poetry",
      "chupke chupke",
      "ranjish",
      "hoshwalon",
      "chitthi aayi hai",
      "hungama hai kyon",
      "tum itna jo",
      "jhuki jhuki",
      "woh kagaz ki kashti",
    ],
  },
  punjabi: {
    id: "punjabi",
    label: "Punjabi & Desi Hip-Hop",
    coreArtists: [
      "sidhu moose wala",
      "karan aujla",
      "diljit dosanjh",
      "ap dhillon",
      "shubh",
      "navaan sandhu",
      "dhanda nyoliwala",
      "prem dhillon",
      "amrit maan",
      "gurinder gill",
      "arjan dhillon",
      "jass manak",
      "ammy virk",
      "bohemia",
      "imran khan",
    ],
    peerArtists: [
      "Sidhu Moose Wala",
      "Karan Aujla",
      "Diljit Dosanjh",
      "AP Dhillon",
      "Shubh",
      "Navaan Sandhu",
      "Dhanda Nyoliwala",
      "Prem Dhillon",
    ],
    keywords: [
      "punjabi",
      "bhangra",
      "desi",
      "moose tape",
      "295",
      "so high",
      "the last ride",
      "winning speech",
      "softly",
      "goat",
      "lover",
      "kath lagda",
      "cheques",
      "baller",
      "elevated",
      "no love",
      "with you",
      "excuses",
    ],
  },
  pop: {
    id: "pop",
    label: "Pop & Global R&B",
    coreArtists: [
      "the weeknd",
      "dua lipa",
      "billie eilish",
      "bruno mars",
      "taylor swift",
      "ariana grande",
      "post malone",
      "justin bieber",
      "ed sheeran",
      "olivia rodrigo",
      "sza",
      "chappell roan",
      "sabrina carpenter",
      "lady gaga",
      "katy perry",
    ],
    peerArtists: [
      "The Weeknd",
      "Dua Lipa",
      "Billie Eilish",
      "Bruno Mars",
      "Taylor Swift",
      "Ariana Grande",
      "Post Malone",
      "Sabrina Carpenter",
    ],
    keywords: [
      "pop",
      "synthpop",
      "r&b",
      "dance pop",
      "blinding lights",
      "starboy",
      "save your tears",
      "levitating",
      "dont start now",
      "birds of a feather",
      "bad guy",
      "die with a smile",
      "espresso",
      "anti-hero",
    ],
  },
  hiphop: {
    id: "hiphop",
    label: "Hip-Hop / Rap",
    coreArtists: [
      "kendrick lamar",
      "drake",
      "travis scott",
      "j cole",
      "j. cole",
      "21 savage",
      "metro boomin",
      "future",
      "eminem",
      "kanye west",
      "a$ap rocky",
      "playboi carti",
      "lil baby",
    ],
    peerArtists: [
      "Kendrick Lamar",
      "Drake",
      "Travis Scott",
      "J. Cole",
      "21 Savage",
      "Metro Boomin",
      "Future",
    ],
    keywords: [
      "hip-hop",
      "hiphop",
      "rap",
      "trap",
      "not like us",
      "humble",
      "sicko mode",
      "gods plan",
      "feather",
      "no role modelz",
      "middle child",
      "superheroes",
    ],
  },
  electronic: {
    id: "electronic",
    label: "Electronic / Dance & Synthwave",
    coreArtists: [
      "daft punk",
      "kavinsky",
      "the midnight",
      "calvin harris",
      "david guetta",
      "avicii",
      "deadmau5",
      "swedish house mafia",
      "disclosure",
      "kygo",
      "martin garrix",
      "justice",
    ],
    peerArtists: [
      "Daft Punk",
      "Kavinsky",
      "The Midnight",
      "Calvin Harris",
      "Swedish House Mafia",
      "Avicii",
      "Disclosure",
    ],
    keywords: [
      "electronic",
      "dance",
      "synthwave",
      "house",
      "techno",
      "edm",
      "electro",
      "get lucky",
      "one more time",
      "around the world",
      "nightcall",
      "levels",
      "summer",
      "titanium",
    ],
  },
  bollywood: {
    id: "bollywood",
    label: "Bollywood & Hindi Melodies",
    coreArtists: [
      "arijit singh",
      "atif aslam",
      "shreya ghoshal",
      "mohit chauhan",
      "kk",
      "prateek kuhad",
      "anuv jain",
      "a.r. rahman",
      "pritam",
      "vishal mishra",
      "sonu nigam",
      "shaan",
      "jubin nautiyal",
    ],
    peerArtists: [
      "Arijit Singh",
      "Atif Aslam",
      "Shreya Ghoshal",
      "Mohit Chauhan",
      "Anuv Jain",
      "Prateek Kuhad",
      "A.R. Rahman",
    ],
    keywords: [
      "bollywood",
      "hindi",
      "romantic",
      "tum hi ho",
      "kesariya",
      "channa mereya",
      "baarishein",
      "jo tum mere ho",
      "kun faya kun",
      "phir se ud chala",
      "tera hone laga hoon",
    ],
  },
  rock: {
    id: "rock",
    label: "Rock & Alternative",
    coreArtists: [
      "coldplay",
      "imagine dragons",
      "linkin park",
      "queen",
      "nirvana",
      "arctic monkeys",
      "green day",
      "red hot chili peppers",
      "radiohead",
    ],
    peerArtists: [
      "Coldplay",
      "Imagine Dragons",
      "Linkin Park",
      "Queen",
      "Arctic Monkeys",
    ],
    keywords: [
      "rock",
      "alternative",
      "indie rock",
      "yellow",
      "viva la vida",
      "believer",
      "numb",
      "in the end",
      "bohemian rhapsody",
      "do i wanna know",
    ],
  },
  other: {
    id: "other",
    label: "Eclectic & Diverse",
    coreArtists: [],
    peerArtists: [],
    keywords: [],
  },
};

/**
 * Normalizes text for robust token and substring matching.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Classifies a track into a recognized MusicGenre with confidence and match reasoning.
 */
export function classifyGenre(track: {
  title?: string;
  artist?: string;
  genre?: string;
}): {
  genre: MusicGenre;
  confidence: number;
  matchedBy: "artist" | "keyword" | "fallback";
} {
  const normArtist = normalize(track.artist || "");
  const normTitle = normalize(track.title || "");
  const normGenre = normalize(track.genre || "");

  // 1. Direct artist match against coreArtists in each genre
  for (const [genreKey, def] of Object.entries(GENRE_DEFINITIONS)) {
    if (genreKey === "other") continue;
    const g = genreKey as MusicGenre;

    for (const coreArtist of def.coreArtists) {
      if (normArtist.includes(coreArtist) || coreArtist.includes(normArtist && normArtist.length > 3 ? normArtist : "___")) {
        return {
          genre: g,
          confidence: 0.95,
          matchedBy: "artist",
        };
      }
    }
  }

  // 2. Direct genre field match if supplied
  if (normGenre) {
    for (const [genreKey, def] of Object.entries(GENRE_DEFINITIONS)) {
      if (genreKey === "other") continue;
      const g = genreKey as MusicGenre;
      if (normGenre.includes(g) || def.keywords.some((k) => normGenre.includes(k))) {
        return {
          genre: g,
          confidence: 0.9,
          matchedBy: "keyword",
        };
      }
    }
  }

  // 3. Keyword scan in title or artist name
  for (const [genreKey, def] of Object.entries(GENRE_DEFINITIONS)) {
    if (genreKey === "other") continue;
    const g = genreKey as MusicGenre;

    for (const kw of def.keywords) {
      if (normTitle.includes(kw) || normArtist.includes(kw)) {
        return {
          genre: g,
          confidence: 0.85,
          matchedBy: "keyword",
        };
      }
    }
  }

  return {
    genre: "other",
    confidence: 0.2,
    matchedBy: "fallback",
  };
}

/**
 * Returns peer artists for a given artist name across genres.
 */
export function getPeerArtistsForArtist(artistName: string): string[] {
  const norm = normalize(artistName);

  for (const [genreKey, def] of Object.entries(GENRE_DEFINITIONS)) {
    if (genreKey === "other") continue;

    const matchesArtist = def.coreArtists.some(
      (a) => norm.includes(a) || a.includes(norm && norm.length > 3 ? norm : "___")
    );

    if (matchesArtist) {
      // Return peer artists excluding the artist themselves
      return def.peerArtists.filter((p) => !normalize(p).includes(norm) && !norm.includes(normalize(p)));
    }
  }

  return [];
}

/**
 * Returns all peer artists known for a specific genre.
 */
export function getPeerArtistsForGenre(genre: MusicGenre): string[] {
  const def = GENRE_DEFINITIONS[genre];
  return def ? [...def.peerArtists] : [];
}
