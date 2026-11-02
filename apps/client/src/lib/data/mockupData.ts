import type { Track } from "@soundlounge/shared";

/**
 * Default tracks featured in the Playlist Sidebar (matching reference design)
 */
export const MOCKUP_SIDEBAR_TRACKS: Track[] = [
  {
    id: "mock_fob_young_menace",
    title: "Young And Menace",
    artist: "Fall Out Boy",
    durationMs: 224000,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    url: "/api/stream/youtube?title=Young%20And%20Menace&artist=Fall%20Out%20Boy",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_id_thunder",
    title: "Thunder",
    artist: "Imagine Dragons",
    durationMs: 187000,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    url: "/api/stream/youtube?title=Thunder&artist=Imagine%20Dragons",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_top_jumpsuit",
    title: "Jumpsuit",
    artist: "Twenty One Pilots",
    durationMs: 238000,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    url: "/api/stream/youtube?title=Jumpsuit&artist=Twenty%20One%20Pilots",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_snoop_side_piece",
    title: "Side Piece",
    artist: "Snoop Dogg",
    durationMs: 254000,
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    url: "/api/stream/youtube?title=Side%20Piece&artist=Snoop%20Dogg",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_hurts_surrender",
    title: "Surrender",
    artist: "Hurts",
    durationMs: 240000,
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    url: "/api/stream/youtube?title=Surrender&artist=Hurts",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_paramore_told_you_so",
    title: "Told You So",
    artist: "Paramore",
    durationMs: 194000,
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
    url: "/api/stream/youtube?title=Told%20You%20So&artist=Paramore",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_eminem_just_lose_it",
    title: "Just Lose It",
    artist: "Eminem",
    durationMs: 248000,
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80",
    url: "/api/stream/youtube?title=Just%20Lose%20It&artist=Eminem",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_lil_pump_at_the_door",
    title: "At the Door",
    artist: "Lil Pump",
    durationMs: 182000,
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    url: "/api/stream/youtube?title=At%20the%20Door&artist=Lil%20Pump",
    source: "youtube",
    createdAt: 0,
  },
];

/**
 * Featured Hero Spotlight Data (matching reference design "Flume: Skin")
 */
export interface FeaturedSpotlight {
  id: string;
  tagline: string;
  title: string;
  subtitle: string;
  description: string;
  artistName: string;
  heroImageUrl: string;
  accentColor: string;
  mainTrack: Track;
}

export const FEATURED_SPOTLIGHTS: FeaturedSpotlight[] = [
  {
    id: "flume_skin",
    tagline: "Featured Album",
    title: "Flume: Skin",
    subtitle: "Future Bass & Electronic",
    description: `Flume walks us through his 'weird' new album, 'Skin'. He has one goal: "I wanna make weird stuff."`,
    artistName: "Flume",
    heroImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&auto=format&fit=crop&q=85",
    accentColor: "#00e5ff",
    mainTrack: {
      id: "yt_flume_never_be_like_you",
      title: "Never Be Like You (feat. Kai)",
      artist: "Flume",
      durationMs: 234000,
      coverUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
      url: "/api/stream/youtube?title=Never%20Be%20Like%20You&artist=Flume",
      source: "youtube",
      createdAt: 0,
    },
  },
  {
    id: "sidhu_moosetape",
    tagline: "Trending Release",
    title: "Moosetape: Sidhu Moose Wala",
    subtitle: "Punjabi Hip-Hop Legend",
    description:
      "The record-shattering magnum opus that redefined global Desi Hip-Hop with raw storytelling and monumental production.",
    artistName: "Sidhu Moose Wala",
    heroImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&auto=format&fit=crop&q=85",
    accentColor: "#ff6b00",
    mainTrack: {
      id: "yt_295",
      title: "295",
      artist: "Sidhu Moose Wala",
      durationMs: 270000,
      coverUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
      url: "/api/stream/youtube?title=295&artist=Sidhu%20Moose%20Wala",
      source: "youtube",
      createdAt: 0,
    },
  },
  {
    id: "weeknd_after_hours",
    tagline: "Global Hit",
    title: "After Hours: The Weeknd",
    subtitle: "Synthwave / Dark R&B",
    description: "An evocative cinematic odyssey through heartbreak, 80s synthwave pulses, and neon-lit melancholia.",
    artistName: "The Weeknd",
    heroImageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=85",
    accentColor: "#ff0055",
    mainTrack: {
      id: "yt_fHI8X480mxo",
      title: "Blinding Lights",
      artist: "The Weeknd",
      durationMs: 200000,
      coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
      url: "/api/stream/youtube?title=Blinding%20Lights&artist=The%20Weeknd",
      source: "youtube",
      createdAt: 0,
    },
  },
];

/**
 * Popular Albums from the mockup
 */
export interface DisplayAlbum {
  id: string;
  title: string;
  artist: string;
  subtitle: string;
  coverUrl: string;
  tracksCount?: number;
  tracks?: Track[];
}

export const POPULAR_ALBUMS_MOCKUP: DisplayAlbum[] = [
  {
    id: "album_hexed_cob",
    title: "Children of Bodom",
    artist: "Hexed",
    subtitle: "Hexed",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    tracksCount: 11,
    tracks: [
      {
        id: "yt_cob_under_grass",
        title: "Under Grass and Clover",
        artist: "Children of Bodom",
        durationMs: 213000,
        coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=Under%20Grass%20and%20Clover&artist=Children%20of%20Bodom",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },
  {
    id: "album_black_water_maruv",
    title: "Black Water",
    artist: "MARUV",
    subtitle: "MARUV",
    coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    tracksCount: 14,
    tracks: [
      {
        id: "yt_maruv_siren_song",
        title: "Siren Song",
        artist: "MARUV",
        durationMs: 171000,
        coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=Siren%20Song&artist=MARUV",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },
  {
    id: "album_hurts_2b_human_pink",
    title: "Hurts 2B Human",
    artist: "P!nk",
    subtitle: "Pink",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    tracksCount: 13,
    tracks: [
      {
        id: "yt_pink_walk_me_home",
        title: "Walk Me Home",
        artist: "P!nk",
        durationMs: 177000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=Walk%20Me%20Home&artist=Pink",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },
  {
    id: "album_no_sound_without_script",
    title: "No Sound Without",
    artist: "The Script",
    subtitle: "The Script",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    tracksCount: 12,
    tracks: [
      {
        id: "yt_script_superheroes",
        title: "Superheroes",
        artist: "The Script",
        durationMs: 245000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=Superheroes&artist=The%20Script",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },
  {
    id: "album_blue_neighbourhood_troye",
    title: "Blue Neighbourho..",
    artist: "Troye Sivan",
    subtitle: "Troye Sivan",
    coverUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    tracksCount: 10,
    tracks: [
      {
        id: "yt_troye_youth",
        title: "YOUTH",
        artist: "Troye Sivan",
        durationMs: 192000,
        coverUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=YOUTH&artist=Troye%20Sivan",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },
  {
    id: "album_origins_imagine_dragons",
    title: "Origins",
    artist: "Imagine Dragons",
    subtitle: "Imagine Dragons",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    tracksCount: 15,
    tracks: [
      {
        id: "yt_id_natural",
        title: "Natural",
        artist: "Imagine Dragons",
        durationMs: 189000,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=Natural&artist=Imagine%20Dragons",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },
];

/**
 * Popular Artists from the mockup
 */
export interface DisplayArtist {
  id: string;
  name: string;
  avatarUrl: string;
  genre: string;
  listeners?: string;
}

export const POPULAR_ARTISTS_MOCKUP: DisplayArtist[] = [
  {
    id: "lady-gaga",
    name: "Lady Gaga",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    genre: "Pop / Dance-Pop",
    listeners: "65.4M",
  },
  {
    id: "bruno-mars",
    name: "Bruno Mars",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    genre: "Pop / R&B / Funk",
    listeners: "78.2M",
  },
  {
    id: "beyonce",
    name: "Beyonce",
    avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80",
    genre: "R&B / Pop",
    listeners: "71.9M",
  },
  {
    id: "dua-lipa",
    name: "Dua Lipa",
    avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80",
    genre: "Dance-Pop",
    listeners: "82.1M",
  },
  {
    id: "maruv",
    name: "MARUV",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
    genre: "Electronic / Pop",
    listeners: "4.8M",
  },
  {
    id: "drake",
    name: "Drake",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
    genre: "Hip-Hop / Rap",
    listeners: "84.3M",
  },
  {
    id: "tyga",
    name: "Tyga",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80",
    genre: "Hip-Hop / West Coast",
    listeners: "24.6M",
  },
  {
    id: "sidhu-moose-wala",
    name: "Sidhu Moose Wala",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80",
    genre: "Punjabi Hip-Hop",
    listeners: "28.3M",
  },
  {
    id: "nusrat-fateh-ali-khan",
    name: "Nusrat Fateh Ali Khan",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80",
    genre: "Qawwali / Ghazal",
    listeners: "8.9M",
  },
  {
    id: "the-weeknd",
    name: "The Weeknd",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80",
    genre: "R&B / Synthwave",
    listeners: "114.2M",
  },
];
