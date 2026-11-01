import type { Track } from "@soundlounge/shared";

export type RegionKey =
  | "all"
  | "bollywood"
  | "ghazal"
  | "punjabi"
  | "retro"
  | "global"
  | "rock"
  | "hiphop"
  | "electronic";

export interface ArtistAlbumReference {
  id: string;
  title: string;
  releaseYear: number;
  coverUrl: string;
  type: "movie_soundtrack" | "studio_album" | "single_ep" | "compilation";
  role?: string;
}

export interface ArtistProfileData {
  id: string;
  name: string;
  realName: string;
  genre: string;
  region: RegionKey;
  regionLabel: string;
  roles?: string[];
  avatarUrl: string;
  bannerUrl: string;
  monthlyListeners: string;
  bio: string;
  topTracks: Track[];
  albums?: ArtistAlbumReference[];
  singlesAndEPs?: Track[];
  collaborations?: Track[];
}

export const ARTISTS_CATALOG: ArtistProfileData[] = [
  // 1. Arijit Singh
  {
    id: "arijit-singh",
    name: "Arijit Singh",
    realName: "Arijit Singh",
    genre: "Bollywood / Romantic / Sufi Pop",
    region: "bollywood",
    regionLabel: "South Asia / Bollywood",
    roles: ["Playback Singer", "Music Producer"],
    avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "112.5M",
    bio: "Widely regarded as one of the most versatile and celebrated playback vocalists in Indian music history. Recipient of multiple National Film Awards and Filmfare Awards.",
    albums: [
      {
        id: "aashiqui_2_2013",
        title: "Aashiqui 2",
        releaseYear: 2013,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80",
        type: "movie_soundtrack",
        role: "Lead Playback Vocalist (Tum Hi Ho, Chahun Main Ya Naa)",
      },
    ],
    topTracks: [
      {
        id: "yt_IJq0yyWug1k",
        title: "Tum Hi Ho",
        artist: "Arijit Singh",
        durationMs: 262000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=IJq0yyWug1k",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_BddP6PYo2gs",
        title: "Kesariya",
        artist: "Arijit Singh",
        durationMs: 268000,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=BddP6PYo2gs",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_bzSTpdcs-EI",
        title: "Channa Mereya",
        artist: "Arijit Singh",
        durationMs: 289000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=bzSTpdcs-EI",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_T3qCg4P-2k4",
        title: "Hamari Adhuri Kahani",
        artist: "Arijit Singh",
        durationMs: 398000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=T3qCg4P-2k4",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_sK7riqg2mr4",
        title: "Agar Tum Saath Ho",
        artist: "Arijit Singh & Alka Yagnik",
        durationMs: 341000,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=sK7riqg2mr4",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_ElZfdU54Cp8",
        title: "Apna Bana Le",
        artist: "Arijit Singh",
        durationMs: 261000,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ElZfdU54Cp8",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 2. KK (Krishnakumar Kunnath)
  {
    id: "kk",
    name: "KK",
    realName: "Krishnakumar Kunnath",
    genre: "Bollywood / Romantic Rock / Indie Pop",
    region: "bollywood",
    regionLabel: "India / Bollywood Rock",
    roles: ["Playback Singer", "Rock Vocalist"],
    avatarUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "24.8M",
    bio: "Beloved playback icon who shaped the sound of youth and romance across two decades. Sang unforgettable anthems including 'Beete Lamhein' (The Train 2007), 'Zara Sa' (Jannat), 'Pal', and 'Yaaron'.",
    albums: [
      {
        id: "the_train_2007_mithoon",
        title: "The Train",
        releaseYear: 2007,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
        type: "movie_soundtrack",
        role: "Playback Singer (Beete Lamhein, Teri Tamanna)",
      },
    ],
    topTracks: [
      {
        id: "yt_d0oVZLquCMU",
        title: "Beete Lamhein",
        artist: "KK",
        durationMs: 312000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=d0oVZLquCMU",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_p-hVqL1oK44",
        title: "Teri Tamanna",
        artist: "KK, Zubeen Garg",
        durationMs: 308000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=p-hVqL1oK44",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_Gcg9u1O-g8g",
        title: "Zara Sa",
        artist: "KK",
        durationMs: 304000,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=Gcg9u1O-g8g",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_gZpZ9g0mG2M",
        title: "Kya Mujhe Pyaar Hai",
        artist: "KK",
        durationMs: 265000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=gZpZ9g0mG2M",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_1e7-k0N-mGk",
        title: "Pal",
        artist: "KK",
        durationMs: 235000,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=1e7-k0N-mGk",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_zX9xN0mP2kI",
        title: "Yaaron",
        artist: "KK",
        durationMs: 278000,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=zX9xN0mP2kI",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 3. Mithoon
  {
    id: "mithoon",
    name: "Mithoon",
    realName: "Mithun Sharma",
    genre: "Bollywood / Sufi Rock / Soundtrack",
    region: "bollywood",
    regionLabel: "India / Bollywood Composer",
    roles: ["Music Director", "Composer", "Singer"],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "19.2M",
    bio: "Acclaimed music director and composer. Created the historic soundtracks of The Train (2007) featuring 'Beete Lamhein' & 'Wo Ajnabee', Aashiqui 2 ('Tum Hi Ho'), Anwar ('Maula Mere Maula'), and Sanam Re.",
    albums: [
      {
        id: "the_train_2007_mithoon",
        title: "The Train",
        releaseYear: 2007,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
        type: "movie_soundtrack",
        role: "Primary Composer & Music Director",
      },
      {
        id: "aashiqui_2_2013",
        title: "Aashiqui 2",
        releaseYear: 2013,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80",
        type: "movie_soundtrack",
        role: "Composer (Tum Hi Ho)",
      },
    ],
    topTracks: [
      {
        id: "yt_yFpcNTX1OwY",
        title: "Wo Ajnabee",
        artist: "Mithoon, Shilpa Rao",
        durationMs: 345000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=yFpcNTX1OwY",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_oO49x759V40",
        title: "Mausam",
        artist: "Mithoon",
        durationMs: 290000,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=oO49x759V40",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_IJq0yyWug1k",
        title: "Tum Hi Ho",
        artist: "Arijit Singh (Composed by Mithoon)",
        durationMs: 262000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=IJq0yyWug1k",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_d0oVZLquCMU",
        title: "Beete Lamhein",
        artist: "KK (Composed by Mithoon)",
        durationMs: 312000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=d0oVZLquCMU",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_s8xP9q0L1wE",
        title: "Sanam Re",
        artist: "Mithoon, Arijit Singh",
        durationMs: 308000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=s8xP9q0L1wE",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 4. Train (The American Rock Band)
  {
    id: "train-band",
    name: "Train",
    realName: "Train (American Rock Band)",
    genre: "Pop Rock / Roots Rock / Alternative",
    region: "rock",
    regionLabel: "San Francisco, USA / Global Rock",
    roles: ["Rock Band", "Songwriters"],
    avatarUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "31.4M",
    bio: "Multi-Grammy-winning American rock band formed in San Francisco in 1993, fronted by Pat Monahan. Chart-topping global hits include 'Hey, Soul Sister', 'Drops of Jupiter', 'Drive By', and 'Calling All Angels'. Distinct from film soundtracks sharing the name.",
    albums: [
      {
        id: "train_drops_of_jupiter_2001",
        title: "Drops of Jupiter",
        releaseYear: 2001,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
        type: "studio_album",
        role: "Studio Album",
      },
    ],
    topTracks: [
      {
        id: "yt_kVpv8-5XWOI",
        title: "Hey, Soul Sister",
        artist: "Train",
        durationMs: 216000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=kVpv8-5XWOI",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_7Xf-Lesrkuc",
        title: "Drops of Jupiter (Tell Me)",
        artist: "Train",
        durationMs: 260000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=7Xf-Lesrkuc",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_oxqnFJ3lp5k",
        title: "Drive By",
        artist: "Train",
        durationMs: 196000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=oxqnFJ3lp5k",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_TaG9SDxwPBg",
        title: "Calling All Angels",
        artist: "Train",
        durationMs: 242000,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=TaG9SDxwPBg",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_ghZt2cILcCU",
        title: "Marry Me",
        artist: "Train",
        durationMs: 212000,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ghZt2cILcCU",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 5. Lata Mangeshkar
  {
    id: "lata-mangeshkar",
    name: "Lata Mangeshkar",
    realName: "Lata Mangeshkar",
    genre: "Classic Bollywood / Ghazal / Retro",
    region: "retro",
    regionLabel: "India / Nightingale of India",
    roles: ["Playback Singer", "Cultural Icon"],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "28.9M",
    bio: "The Nightingale of India and Bharat Ratna recipient. Voiced legendary classics including 'Kis Liye Maine Pyaar Kiya' (The Train 1970), 'Lag Ja Gale', 'Aap Ki Nazron Ne Samjha', and 'Tujhe Dekha Toh'.",
    albums: [
      {
        id: "the_train_1970_rd_burman",
        title: "The Train (1970)",
        releaseYear: 1970,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
        type: "movie_soundtrack",
        role: "Playback Singer (Kis Liye Maine Pyaar Kiya)",
      },
    ],
    topTracks: [
      {
        id: "yt_PIwGCRcsKvY",
        title: "Kis Liye Maine Pyaar Kiya",
        artist: "Lata Mangeshkar",
        durationMs: 260000,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=PIwGCRcsKvY",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_TFr6G5zveS8",
        title: "Lag Ja Gale",
        artist: "Lata Mangeshkar",
        durationMs: 258000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=TFr6G5zveS8",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_cNVtKJOHc_0",
        title: "Aap Ki Nazron Ne Samjha",
        artist: "Lata Mangeshkar",
        durationMs: 235000,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=cNVtKJOHc_0",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_Gcg9u1O-g8g",
        title: "Tujhe Dekha Toh",
        artist: "Lata Mangeshkar, Kumar Sanu",
        durationMs: 302000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=Gcg9u1O-g8g",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_s8xP9q0L1wE",
        title: "Kabhie Kabhie Mere Dil Mein",
        artist: "Lata Mangeshkar, Mukesh",
        durationMs: 292000,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=s8xP9q0L1wE",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 6. R.D. Burman
  {
    id: "rd-burman",
    name: "R.D. Burman",
    realName: "Rahul Dev Burman (Pancham Da)",
    genre: "Retro Bollywood / Fusion / Soundtrack",
    region: "retro",
    regionLabel: "India / Golden Era Composer",
    roles: ["Music Director", "Composer", "Singer"],
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "21.6M",
    bio: "Pioneering composer Pancham Da transformed Indian cinema music by infusing jazz, funk, rock, and Latin rhythms into classical compositions. Composed the score for The Train (1970), Sholay, Yaadon Ki Baaraat, and Teesri Manzil.",
    albums: [
      {
        id: "the_train_1970_rd_burman",
        title: "The Train (1970)",
        releaseYear: 1970,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
        type: "movie_soundtrack",
        role: "Primary Composer & Music Director",
      },
    ],
    topTracks: [
      {
        id: "yt_4U7LKDvbfws",
        title: "O Meri Jaan Maine Kaha",
        artist: "R.D. Burman, Asha Bhosle",
        durationMs: 320000,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=4U7LKDvbfws",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_PIwGCRcsKvY",
        title: "Kis Liye Maine Pyaar Kiya",
        artist: "Lata Mangeshkar (Composed by R.D. Burman)",
        durationMs: 260000,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=PIwGCRcsKvY",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_7Xf-Lesrkuc",
        title: "Dum Maro Dum",
        artist: "Asha Bhosle (Composed by R.D. Burman)",
        durationMs: 276000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=7Xf-Lesrkuc",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_oxqnFJ3lp5k",
        title: "Mehbooba Mehbooba",
        artist: "R.D. Burman",
        durationMs: 245000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=oxqnFJ3lp5k",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 7. Atif Aslam
  {
    id: "atif-aslam",
    name: "Atif Aslam",
    realName: "Muhammad Atif Aslam",
    genre: "Bollywood / Sufi Rock / Romantic",
    region: "bollywood",
    regionLabel: "Pakistan & South Asia",
    roles: ["Playback Singer", "Songwriter"],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "42.8M",
    bio: "Superstar vocalist renowned for his distinctive vocal belting technique, emotional range, and iconic Bollywood soundtrack hits across decades.",
    topTracks: [
      {
        id: "yt_1e7-k0N-mGk",
        title: "Woh Lamhe",
        artist: "Atif Aslam",
        durationMs: 318000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=1e7-k0N-mGk",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_zX9xN0mP2kI",
        title: "Aadat",
        artist: "Atif Aslam",
        durationMs: 270000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=zX9xN0mP2kI",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_Gcg9u1O-g8g",
        title: "Jeene Laga Hoon",
        artist: "Atif Aslam, Shreya Ghoshal",
        durationMs: 235000,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=Gcg9u1O-g8g",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_gZpZ9g0mG2M",
        title: "Pehli Nazar Mein",
        artist: "Atif Aslam",
        durationMs: 312000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=gZpZ9g0mG2M",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_s8xP9q0L1wE",
        title: "Tajdar-e-Haram",
        artist: "Atif Aslam",
        durationMs: 610000,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=s8xP9q0L1wE",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 8. The Weeknd
  {
    id: "the-weeknd",
    name: "The Weeknd",
    realName: "Abel Makkonen Tesfaye",
    genre: "Contemporary R&B / Pop / Synthwave",
    region: "global",
    regionLabel: "Global / Canada",
    roles: ["Singer-Songwriter", "Producer"],
    avatarUrl:
      "https://yt3.googleusercontent.com/WHvw1ak1FcJaHeEiTmG2iN0dqEjjPxAtT_tA8ruJ3MlNr9I-RHsAur1iAenYeQN_d6LNPH2Z8Ic=s800-c-k-c0x00ffffff-no-rj",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "115.4M",
    bio: "Canadian singer, songwriter, and producer known for his sonic versatility and dark lyrical themes. One of the best-selling music artists of all time.",
    albums: [
      {
        id: "starboy_2016_weeknd",
        title: "Starboy",
        releaseYear: 2016,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
        type: "studio_album",
        role: "Studio Album",
      },
    ],
    topTracks: [
      {
        id: "yt_34Na4j8AVgA",
        title: "Starboy",
        artist: "The Weeknd ft. Daft Punk",
        durationMs: 230000,
        coverUrl:
          "https://yt3.googleusercontent.com/WHvw1ak1FcJaHeEiTmG2iN0dqEjjPxAtT_tA8ruJ3MlNr9I-RHsAur1iAenYeQN_d6LNPH2Z8Ic=s800-c-k-c0x00ffffff-no-rj",
        url: "/api/stream/youtube?id=34Na4j8AVgA",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_fHI8X480mxo",
        title: "Blinding Lights",
        artist: "The Weeknd",
        durationMs: 200000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=fHI8X480mxo",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_XXYlFuWEuKI",
        title: "Save Your Tears",
        artist: "The Weeknd",
        durationMs: 215000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=XXYlFuWEuKI",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 9. Sidhu Moose Wala
  {
    id: "sidhu-moose-wala",
    name: "Sidhu Moose Wala",
    realName: "Shubhdeep Singh Sidhu",
    genre: "Punjabi / Desi Hip-Hop / Folk",
    region: "punjabi",
    regionLabel: "Punjab & Global Hip-Hop",
    roles: ["Singer", "Rapper", "Songwriter"],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "18.3M",
    bio: "Pioneering Indian-Punjabi singer, rapper, and songwriter who revolutionized modern Punjabi music with raw narrative lyricism and international drill/trap sounds.",
    albums: [
      {
        id: "moosetape_2021_sidhu",
        title: "Moosetape",
        releaseYear: 2021,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
        type: "studio_album",
        role: "Studio Album",
      },
    ],
    topTracks: [
      {
        id: "yt_QYvfY4MtLAI",
        title: "295",
        artist: "Sidhu Moose Wala",
        durationMs: 270000,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=QYvfY4MtLAI",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_h6p5qEsm0v4",
        title: "The Last Ride",
        artist: "Sidhu Moose Wala",
        durationMs: 260000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=h6p5qEsm0v4",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_cl0a3i2wFcc",
        title: "So High",
        artist: "Sidhu Moose Wala",
        durationMs: 228000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=cl0a3i2wFcc",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 10. Jagjit Singh
  {
    id: "jagjit-singh",
    name: "Jagjit Singh",
    realName: "Jagmohan Singh Dhiman",
    genre: "Ghazal / Urdu Poetry",
    region: "ghazal",
    regionLabel: "South Asia / Ghazal Legend",
    roles: ["Ghazal Maestro", "Composer"],
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "8.7M",
    bio: "The Ghazal King of India. Credited with democratizing the traditional ghazal into accessible modern arrangements without losing its classical Urdu lyrical beauty.",
    topTracks: [
      {
        id: "yt_Ju6kNKaBOQ8",
        title: "Tum Itna Jo Muskura Rahe Ho",
        artist: "Jagjit Singh",
        durationMs: 318000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=Ju6kNKaBOQ8",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_tEomN5_KjW0",
        title: "Hoshwalon Ko Khabar Kya",
        artist: "Jagjit Singh",
        durationMs: 302000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=tEomN5_KjW0",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_42_K6J30o30",
        title: "Chitthi Na Koi Sandesh",
        artist: "Jagjit Singh",
        durationMs: 395000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=42_K6J30o30",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_P_nLgM1VqF0",
        title: "Jhuki Jhuki Si Nazar",
        artist: "Jagjit Singh",
        durationMs: 284000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=P_nLgM1VqF0",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_49rS29FwU_o",
        title: "Woh Kagaz Ki Kashti",
        artist: "Jagjit Singh",
        durationMs: 248000,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=49rS29FwU_o",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 11. Mehdi Hassan
  {
    id: "mehdi-hassan",
    name: "Mehdi Hassan",
    realName: "Mehdi Hassan Khan",
    genre: "Ghazal / Classical Thumri",
    region: "ghazal",
    regionLabel: "South Asia / Shahenshah-e-Ghazal",
    roles: ["Shahenshah-e-Ghazal", "Classical Maestro"],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "4.2M",
    bio: "Shahenshah-e-Ghazal (Emperor of Ghazals). Lata Mangeshkar famously remarked of his voice: 'It sounds as if God speaks through his throat.'",
    topTracks: [
      {
        id: "yt_RanjishHiSahi",
        title: "Ranjish Hi Sahi",
        artist: "Mehdi Hassan",
        durationMs: 360000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=RanjishHiSahi",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_GulonMeinRang",
        title: "Gulon Mein Rang Bhare",
        artist: "Mehdi Hassan",
        durationMs: 340000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=GulonMeinRang",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_ZindagiMeinToh",
        title: "Zindagi Mein Toh Sabhi Pyaar Kiya Karte Hain",
        artist: "Mehdi Hassan",
        durationMs: 380000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ZindagiMeinToh",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 12. Ghulam Ali
  {
    id: "ghulam-ali",
    name: "Ghulam Ali",
    realName: "Ustad Ghulam Ali",
    genre: "Ghazal / Patiala Gharana",
    region: "ghazal",
    regionLabel: "South Asia / Classical Ghazal",
    roles: ["Ustad", "Classical Singer"],
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "3.8M",
    bio: "Patiala Gharana master known for blending classical Pakistani ghazal gaayaki with intricate taans and timeless compositions.",
    topTracks: [
      {
        id: "yt_ChupkeChupke",
        title: "Chupke Chupke Raat Din",
        artist: "Ghulam Ali",
        durationMs: 460000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ChupkeChupke",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_HungamaHaiKyon",
        title: "Hungama Hai Kyon Barpa",
        artist: "Ghulam Ali",
        durationMs: 510000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=HungamaHaiKyon",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_ApniDhunMein",
        title: "Apni Dhun Mein Rehta Hoon",
        artist: "Ghulam Ali",
        durationMs: 380000,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ApniDhunMein",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 13. Pankaj Udhas
  {
    id: "pankaj-udhas",
    name: "Pankaj Udhas",
    realName: "Pankaj Udhas",
    genre: "Ghazal / Nazm",
    region: "ghazal",
    regionLabel: "South Asia / Ghazal",
    roles: ["Ghazal Maestro"],
    avatarUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "5.1M",
    bio: "Pioneering Indian ghazal singer known for his soft, melodic touch and heartfelt storytelling, achieving immortal fame with 'Chitthi Aayi Hai'.",
    topTracks: [
      {
        id: "yt_ChitthiAayiHai",
        title: "Chitthi Aayi Hai",
        artist: "Pankaj Udhas",
        durationMs: 430000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ChitthiAayiHai",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_ChandiJaisaRang",
        title: "Chandi Jaisa Rang Hai Tera",
        artist: "Pankaj Udhas",
        durationMs: 330000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ChandiJaisaRang",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_AapJinkeKareeb",
        title: "Aap Jinke Kareeb Hote Hain",
        artist: "Pankaj Udhas",
        durationMs: 310000,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=AapJinkeKareeb",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 14. Nusrat Fateh Ali Khan
  {
    id: "nusrat-fateh-ali-khan",
    name: "Nusrat Fateh Ali Khan",
    realName: "Pervez Fateh Ali Khan",
    genre: "Qawwali / Ghazal / Sufi",
    region: "ghazal",
    regionLabel: "South Asia / Shahenshah-e-Qawwali",
    roles: ["Shahenshah-e-Qawwali", "Sufi Maestro", "Ghazal Vocalist"],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "8.9M",
    bio: "Shahenshah-e-Qawwali (King of Kings of Qawwali). Universally acclaimed as one of the greatest voices ever recorded, bringing Sufi devotional music and profound Ghazals to global prominence.",
    topTracks: [
      {
        id: "yt_MujheTumYaad",
        title: "Mujhe Tum Yaad Aate Ho",
        artist: "Nusrat Fateh Ali Khan",
        durationMs: 322000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=Mujhe%20Tum%20Yaad%20Aate%20Ho&artist=Nusrat%20Fateh%20Ali%20Khan",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_YeJoHalkaHalka",
        title: "Ye Jo Halka Halka Suroor Hai",
        artist: "Nusrat Fateh Ali Khan",
        durationMs: 440000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=Ye%20Jo%20Halka%20Halka%20Suroor%20Hai&artist=Nusrat%20Fateh%20Ali%20Khan",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_AfreenAfreenOriginal",
        title: "Afreen Afreen",
        artist: "Nusrat Fateh Ali Khan",
        durationMs: 410000,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=Afreen%20Afreen&artist=Nusrat%20Fateh%20Ali%20Khan",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_MereRashkeQamar",
        title: "Mere Rashke Qamar",
        artist: "Nusrat Fateh Ali Khan",
        durationMs: 380000,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=Mere%20Rashke%20Qamar&artist=Nusrat%20Fateh%20Ali%20Khan",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_KinnaSohna",
        title: "Kinna Sohna Tenu Rab Ne Banaya",
        artist: "Nusrat Fateh Ali Khan",
        durationMs: 360000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?title=Kinna%20Sohna%20Tenu%20Rab%20Ne%20Banaya&artist=Nusrat%20Fateh%20Ali%20Khan",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 14. Coldplay
  {
    id: "coldplay",
    name: "Coldplay",
    realName: "Coldplay (British Rock Band)",
    genre: "Alternative Rock / Stadium Pop",
    region: "rock",
    regionLabel: "London, UK / Global Rock",
    roles: ["Rock Band"],
    avatarUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "88.2M",
    bio: "British rock band formed in London in 1997. Known for emotional stadium anthems, melodic piano motifs, and record-breaking world tours.",
    topTracks: [
      {
        id: "yt_yKNxeF4KMsY",
        title: "Yellow",
        artist: "Coldplay",
        durationMs: 269000,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=yKNxeF4KMsY",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_k4V3Mo61fJM",
        title: "Fix You",
        artist: "Coldplay",
        durationMs: 295000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=k4V3Mo61fJM",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_dvgZkm1xWPE",
        title: "Viva La Vida",
        artist: "Coldplay",
        durationMs: 242000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=dvgZkm1xWPE",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 15. Taylor Swift
  {
    id: "taylor-swift",
    name: "Taylor Swift",
    realName: "Taylor Alison Swift",
    genre: "Pop / Country / Indie Folk",
    region: "global",
    regionLabel: "USA / Global Pop",
    roles: ["Singer-Songwriter", "Producer"],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "105.8M",
    bio: "Global phenomenon and Grammy-sweeping artist celebrated for narrative songwriting, artistic autonomy, and generational era-defining tours.",
    topTracks: [
      {
        id: "yt_ic8j13piAhQ",
        title: "Cruel Summer",
        artist: "Taylor Swift",
        durationMs: 178000,
        coverUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ic8j13piAhQ",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_e-ORhEE9VVg",
        title: "Blank Space",
        artist: "Taylor Swift",
        durationMs: 231000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=e-ORhEE9VVg",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_b1kbLwvqugk",
        title: "Anti-Hero",
        artist: "Taylor Swift",
        durationMs: 200000,
        coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=b1kbLwvqugk",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 16. Daft Punk
  {
    id: "daft-punk",
    name: "Daft Punk",
    realName: "Thomas Bangalter & Guy-Manuel",
    genre: "French House / Synthwave / Electronic",
    region: "electronic",
    regionLabel: "France / Global Electronic",
    roles: ["Electronic Duo", "Producers"],
    avatarUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "22.1M",
    bio: "Pioneering French electronic music duo. One of the most acclaimed dance and electronic acts in history, fusing funk, disco, and futuristic robotics.",
    topTracks: [
      {
        id: "yt_5NV6Rdv1a3I",
        title: "Get Lucky",
        artist: "Daft Punk ft. Pharrell Williams",
        durationMs: 248000,
        coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=5NV6Rdv1a3I",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_L93-7vRte34",
        title: "Harder, Better, Faster, Stronger",
        artist: "Daft Punk",
        durationMs: 224000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=L93-7vRte34",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_FGBhQbmPwH8",
        title: "One More Time",
        artist: "Daft Punk",
        durationMs: 320000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=FGBhQbmPwH8",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 17. Dua Lipa
  {
    id: "dua-lipa",
    name: "Dua Lipa",
    realName: "Dua Lipa",
    genre: "Nu-Disco / Dance Pop",
    region: "global",
    regionLabel: "UK & Albania / Global Pop",
    roles: ["Pop Vocalist", "Songwriter"],
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "74.8M",
    bio: "English and Albanian singer celebrated for her distinct mezzo-soprano vocal signature and revitalizing nu-disco dance pop on 'Future Nostalgia'.",
    topTracks: [
      {
        id: "yt_TUVcZfQe-Kw",
        title: "Levitating",
        artist: "Dua Lipa",
        durationMs: 203000,
        coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=TUVcZfQe-Kw",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_oygrmJFKYZY",
        title: "Don't Start Now",
        artist: "Dua Lipa",
        durationMs: 183000,
        coverUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=oygrmJFKYZY",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 18. Billie Eilish
  {
    id: "billie-eilish",
    name: "Billie Eilish",
    realName: "Billie Eilish Pirate Baird O'Connell",
    genre: "Alt-Pop / Electropop / Dark Pop",
    region: "global",
    regionLabel: "USA / Global Alt-Pop",
    roles: ["Singer-Songwriter"],
    avatarUrl: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "93.4M",
    bio: "Multiple Academy and Grammy Award-winning prodigy acclaimed for intimate, whisper-close vocal delivery, boundary-pushing bass production, and genre subversion.",
    topTracks: [
      {
        id: "yt_DyDfgMOUjCI",
        title: "bad guy",
        artist: "Billie Eilish",
        durationMs: 194000,
        coverUrl: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=DyDfgMOUjCI",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_viimfQi_pUw",
        title: "when the party's over",
        artist: "Billie Eilish",
        durationMs: 196000,
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=viimfQi_pUw",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 19. Diljit Dosanjh
  {
    id: "diljit-dosanjh",
    name: "Diljit Dosanjh",
    realName: "Daljit Singh Dosanjh",
    genre: "Punjabi Folk-Pop / Global Desi",
    region: "punjabi",
    regionLabel: "Punjab & Global",
    roles: ["Singer", "Actor", "Global Headliner"],
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "22.4M",
    bio: "Global Punjabi icon and Coachella headliner bridging traditional Punjabi folk music with contemporary world pop and high-octane stadium energy.",
    topTracks: [
      {
        id: "yt_L7Zp1Lp9P98",
        title: "G.O.A.T.",
        artist: "Diljit Dosanjh",
        durationMs: 224000,
        coverUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=L7Zp1Lp9P98",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_cl0a3i2wFcc",
        title: "Lover",
        artist: "Diljit Dosanjh",
        durationMs: 191000,
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=cl0a3i2wFcc",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 20. Karan Aujla
  {
    id: "karan-aujla",
    name: "Karan Aujla",
    realName: "Jaskaran Singh Aujla",
    genre: "Punjabi Trap / Hip-Hop",
    region: "punjabi",
    regionLabel: "Punjab & Canada",
    roles: ["Rapper", "Songwriter", "Singer"],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "19.5M",
    bio: "Geetan Di Machine (Machine of Songs). Canadian-based Punjabi singer and lyricist celebrated for razor-sharp penmanship, punchy flows, and Billboard charting hits.",
    topTracks: [
      {
        id: "yt_TaG9SDxwPBg",
        title: "Softly",
        artist: "Karan Aujla",
        durationMs: 156000,
        coverUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=TaG9SDxwPBg",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_ghZt2cILcCU",
        title: "Winning Speech",
        artist: "Karan Aujla",
        durationMs: 204000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ghZt2cILcCU",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 21. AP Dhillon
  {
    id: "ap-dhillon",
    name: "AP Dhillon",
    realName: "Amritpal Singh Dhillon",
    genre: "Punjabi Wave / Desi Trap / R&B",
    region: "punjabi",
    regionLabel: "Canada & Punjab",
    roles: ["Singer", "Rapper", "Producer"],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "16.8M",
    bio: "Pioneered the modern brown-wave sound blending Punjabi folk melodies with Western synth-pop, trap 808s, and contemporary R&B aesthetics.",
    topTracks: [
      {
        id: "yt_VNs_cCtdbPc",
        title: "Brown Munde",
        artist: "AP Dhillon, Gurinder Gill, Shinda Kahlon",
        durationMs: 265000,
        coverUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=VNs_cCtdbPc",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_vX2cDW8LUWk",
        title: "Excuses",
        artist: "AP Dhillon, Gurinder Gill",
        durationMs: 176000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=vX2cDW8LUWk",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 22. Asha Bhosle
  {
    id: "asha-bhosle",
    name: "Asha Bhosle",
    realName: "Asha Bhosle",
    genre: "Classic Bollywood / Cabaret / Ghazal",
    region: "retro",
    regionLabel: "India / Golden Era Legend",
    roles: ["Playback Singer", "Cultural Icon"],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "15.4M",
    bio: "Dadasaheb Phalke and Padma Vibhushan awardee. Acknowledged as the most-recorded artist in music history, renowned for versatile cabaret and classical numbers.",
    topTracks: [
      {
        id: "yt_7Xf-Lesrkuc",
        title: "Dum Maro Dum",
        artist: "Asha Bhosle",
        durationMs: 276000,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=7Xf-Lesrkuc",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_4U7LKDvbfws",
        title: "O Meri Jaan Maine Kaha",
        artist: "Asha Bhosle, R.D. Burman",
        durationMs: 320000,
        coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=4U7LKDvbfws",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 23. A.R. Rahman
  {
    id: "ar-rahman",
    name: "A.R. Rahman",
    realName: "Allah Rakha Rahman",
    genre: "Film Score / World Music / Sufi Fusion",
    region: "bollywood",
    regionLabel: "India & Global / Oscar Winner",
    roles: ["Music Director", "Composer", "Singer"],
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "32.1M",
    bio: "Two-time Academy Award and two-time Grammy winner. The Mozart of Madras who revolutionized Indian film music worldwide.",
    topTracks: [
      {
        id: "yt_kVpv8-5XWOI",
        title: "Jai Ho",
        artist: "A.R. Rahman, Sukhwinder Singh",
        durationMs: 220000,
        coverUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=kVpv8-5XWOI",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },

  // 24. Kendrick Lamar
  {
    id: "kendrick-lamar",
    name: "Kendrick Lamar",
    realName: "Kendrick Lamar Duckworth",
    genre: "Conscious Hip-Hop / West Coast Rap",
    region: "hiphop",
    regionLabel: "Compton, USA / Global Hip-Hop",
    roles: ["Rapper", "Lyricist", "Producer"],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "68.7M",
    bio: "Pulitzer Prize and multi-Grammy-winning rapper from Compton, acclaimed as the defining poetic voice of modern hip-hop.",
    topTracks: [
      {
        id: "yt_tvTRZJ-4EyI",
        title: "HUMBLE.",
        artist: "Kendrick Lamar",
        durationMs: 177000,
        coverUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=tvTRZJ-4EyI",
        source: "youtube",
        createdAt: 0,
      },
      {
        id: "yt_NLZRYQMLDW4",
        title: "Alright",
        artist: "Kendrick Lamar",
        durationMs: 219000,
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=NLZRYQMLDW4",
        source: "youtube",
        createdAt: 0,
      },
    ],
  },
];

/**
 * Returns all catalog artists.
 */
export function getAllCatalogArtists(): ArtistProfileData[] {
  return [...ARTISTS_CATALOG];
}

/**
 * Filters artists by starting letter (A-Z) or non-alpha (#)
 */
export function getArtistsByLetter(letter: string): ArtistProfileData[] {
  const norm = letter.toUpperCase().trim();
  if (!norm || norm === "ALL") return ARTISTS_CATALOG;

  if (norm === "#") {
    return ARTISTS_CATALOG.filter((a) => !/^[A-Za-z]/.test(a.name));
  }

  return ARTISTS_CATALOG.filter((a) => a.name.toUpperCase().startsWith(norm));
}

/**
 * Filters artists by musical region / genre key
 */
export function getArtistsByRegion(region: RegionKey): ArtistProfileData[] {
  if (region === "all") return ARTISTS_CATALOG;
  return ARTISTS_CATALOG.filter((a) => a.region === region);
}

/**
 * Fast multi-dimensional artist search filter
 */
export function searchArtistsCatalog(
  query: string,
  options?: { region?: RegionKey; letter?: string }
): ArtistProfileData[] {
  let list = ARTISTS_CATALOG;

  if (options?.region && options.region !== "all") {
    list = list.filter((a) => a.region === options.region);
  }

  if (options?.letter && options.letter !== "ALL") {
    const l = options.letter.toUpperCase().trim();
    if (l === "#") {
      list = list.filter((a) => !/^[A-Za-z]/.test(a.name));
    } else {
      list = list.filter((a) => a.name.toUpperCase().startsWith(l));
    }
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.realName.toLowerCase().includes(q) ||
        a.genre.toLowerCase().includes(q) ||
        a.regionLabel.toLowerCase().includes(q) ||
        a.bio.toLowerCase().includes(q) ||
        a.roles?.some((r) => r.toLowerCase().includes(q))
    );
  }

  return list;
}
