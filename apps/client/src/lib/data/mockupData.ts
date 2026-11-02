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
    coverUrl: "/mockup/track-1.webp",
    url: "/api/stream/youtube?title=Young%20And%20Menace&artist=Fall%20Out%20Boy",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_id_thunder",
    title: "Thunder",
    artist: "Imagine Dragons",
    durationMs: 187000,
    coverUrl: "/mockup/track-2.webp",
    url: "/api/stream/youtube?title=Thunder&artist=Imagine%20Dragons",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_top_jumpsuit",
    title: "Jumpsuit",
    artist: "Twenty One Pilots",
    durationMs: 238000,
    coverUrl: "/mockup/track-3.webp",
    url: "/api/stream/youtube?title=Jumpsuit&artist=Twenty%20One%20Pilots",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_snoop_side_piece",
    title: "Side Piece",
    artist: "Snoop Dogg",
    durationMs: 254000,
    coverUrl: "/mockup/track-4.webp",
    url: "/api/stream/youtube?title=Side%20Piece&artist=Snoop%20Dogg",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_hurts_surrender",
    title: "Surrender",
    artist: "Hurts",
    durationMs: 240000,
    coverUrl: "/mockup/track-5.webp",
    url: "/api/stream/youtube?title=Surrender&artist=Hurts",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_paramore_told_you_so",
    title: "Told You So",
    artist: "Paramore",
    durationMs: 194000,
    coverUrl: "/mockup/track-6.webp",
    url: "/api/stream/youtube?title=Told%20You%20So&artist=Paramore",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_eminem_just_lose_it",
    title: "Just Lose It",
    artist: "Eminem",
    durationMs: 248000,
    coverUrl: "/mockup/track-7.webp",
    url: "/api/stream/youtube?title=Just%20Lose%20It&artist=Eminem",
    source: "youtube",
    createdAt: 0,
  },
  {
    id: "mock_lil_pump_at_the_door",
    title: "At the Door",
    artist: "Lil Pump",
    durationMs: 182000,
    coverUrl: "/mockup/track-8.webp",
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
    heroImageUrl: "/flume-face-feathered.png",
    accentColor: "#00e5ff",
    mainTrack: {
      id: "yt_flume_never_be_like_you",
      title: "Never Be Like You (feat. Kai)",
      artist: "Flume",
      durationMs: 234000,
      coverUrl: "/flume-face-feathered.png",
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
    coverUrl: "/mockup/album-1.webp",
    tracksCount: 11,
    tracks: [
      {
        id: "yt_cob_under_grass",
        title: "Under Grass and Clover",
        artist: "Children of Bodom",
        durationMs: 213000,
        coverUrl: "/mockup/album-1.webp",
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
    coverUrl: "/mockup/album-2.webp",
    tracksCount: 14,
    tracks: [
      {
        id: "yt_maruv_siren_song",
        title: "Siren Song",
        artist: "MARUV",
        durationMs: 171000,
        coverUrl: "/mockup/album-2.webp",
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
    coverUrl: "/mockup/album-3.webp",
    tracksCount: 13,
    tracks: [
      {
        id: "yt_pink_walk_me_home",
        title: "Walk Me Home",
        artist: "P!nk",
        durationMs: 177000,
        coverUrl: "/mockup/album-3.webp",
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
    coverUrl: "/mockup/album-4.webp",
    tracksCount: 12,
    tracks: [
      {
        id: "yt_script_superheroes",
        title: "Superheroes",
        artist: "The Script",
        durationMs: 245000,
        coverUrl: "/mockup/album-4.webp",
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
    coverUrl: "/mockup/album-5.webp",
    tracksCount: 10,
    tracks: [
      {
        id: "yt_troye_youth",
        title: "YOUTH",
        artist: "Troye Sivan",
        durationMs: 192000,
        coverUrl: "/mockup/album-5.webp",
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
    coverUrl: "/mockup/album-6.webp",
    tracksCount: 15,
    tracks: [
      {
        id: "yt_id_natural",
        title: "Natural",
        artist: "Imagine Dragons",
        durationMs: 189000,
        coverUrl: "/mockup/album-6.webp",
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
    avatarUrl: "/artists/lady-gaga.webp",
    genre: "Pop / Dance-Pop",
    listeners: "65.4M",
  },
  {
    id: "bruno-mars",
    name: "Bruno Mars",
    avatarUrl: "/artists/bruno-mars.webp",
    genre: "Pop / R&B / Funk",
    listeners: "78.2M",
  },
  {
    id: "beyonce",
    name: "Beyonce",
    avatarUrl: "/artists/beyonce.webp",
    genre: "R&B / Pop",
    listeners: "71.9M",
  },
  {
    id: "dua-lipa",
    name: "Dua Lipa",
    avatarUrl: "/artists/dua-lipa.webp",
    genre: "Dance-Pop",
    listeners: "82.1M",
  },
  {
    id: "maruv",
    name: "MARUV",
    avatarUrl: "/artists/maruv.webp",
    genre: "Electronic / Pop",
    listeners: "4.8M",
  },
  {
    id: "drake",
    name: "Drake",
    avatarUrl: "/artists/drake.webp",
    genre: "Hip-Hop / Rap",
    listeners: "84.3M",
  },
  {
    id: "tyga",
    name: "Tyga",
    avatarUrl: "/artists/tyga.webp",
    genre: "Hip-Hop / West Coast",
    listeners: "24.6M",
  },
  {
    id: "sidhu-moose-wala",
    name: "Sidhu Moose Wala",
    avatarUrl: "/artists/sidhu-moose-wala.webp",
    genre: "Punjabi Hip-Hop",
    listeners: "28.3M",
  },
  {
    id: "nusrat-fateh-ali-khan",
    name: "Nusrat Fateh Ali Khan",
    avatarUrl: "/artists/nusrat-fateh-ali-khan.webp",
    genre: "Qawwali / Ghazal",
    listeners: "8.9M",
  },
  {
    id: "the-weeknd",
    name: "The Weeknd",
    avatarUrl: "/artists/the-weeknd.webp",
    genre: "R&B / Synthwave",
    listeners: "114.2M",
  },
];
