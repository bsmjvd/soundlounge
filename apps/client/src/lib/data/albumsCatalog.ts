import type { Album } from "@soundlounge/shared";

export const ALBUMS_CATALOG: Album[] = [
  // 1. The Train (2007) - Bollywood Film Soundtrack
  {
    id: "the_train_2007_mithoon",
    title: "The Train",
    releaseYear: 2007,
    type: "movie_soundtrack",
    disambiguationLabel: "2007 Bollywood Thriller • Mithoon, KK, Emraan Hashmi",
    primaryArtist: "Mithoon",
    featuredSingers: ["KK", "Shilpa Rao", "Zubeen Garg"],
    genres: ["Bollywood", "Romantic Rock", "Sufi Pop"],
    coverUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    movieDetails: {
      movieTitle: "The Train: An Inspiration",
      releaseYear: 2007,
      starCast: ["Emraan Hashmi", "Geeta Basra", "Sayali Bhagat"],
      musicDirectors: ["Mithoon"],
      lyricists: ["Sayeed Quadri"],
      director: "Hasnain Hyderabadwala, Raksha Mistry",
    },
    totalDurationMs: 1570000,
    tracks: [
      {
        id: "yt_d0oVZLquCMU",
        title: "Beete Lamhein",
        artist: "KK",
        durationMs: 312000,
        coverUrl:
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=d0oVZLquCMU",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_yFpcNTX1OwY",
        title: "Wo Ajnabee",
        artist: "Mithoon, Shilpa Rao",
        durationMs: 345000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=yFpcNTX1OwY",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_oO49x759V40",
        title: "Mausam",
        artist: "Mithoon",
        durationMs: 290000,
        coverUrl:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=oO49x759V40",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_p-hVqL1oK44",
        title: "Teri Tamanna",
        artist: "KK, Zubeen Garg",
        durationMs: 308000,
        coverUrl:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=p-hVqL1oK44",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_4P4Oa0pbZNQ",
        title: "Beete Lamhein (Lounge Version)",
        artist: "KK",
        durationMs: 315000,
        coverUrl:
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=4P4Oa0pbZNQ",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },

  // 2. The Train (1970) - Classic Bollywood Film Soundtrack
  {
    id: "the_train_1970_rd_burman",
    title: "The Train",
    releaseYear: 1970,
    type: "movie_soundtrack",
    disambiguationLabel: "1970 Classic Bollywood • R.D. Burman, Rajesh Khanna, Helen",
    primaryArtist: "R.D. Burman",
    featuredSingers: ["Lata Mangeshkar", "Mohammed Rafi", "Asha Bhosle"],
    genres: ["Bollywood", "Retro Classics", "Golden Era"],
    coverUrl:
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
    movieDetails: {
      movieTitle: "The Train",
      releaseYear: 1970,
      starCast: ["Rajesh Khanna", "Nanda", "Helen"],
      musicDirectors: ["R.D. Burman"],
      lyricists: ["Anand Bakshi"],
      director: "Ravikant Nagaich",
    },
    totalDurationMs: 987000,
    tracks: [
      {
        id: "yt_bHzofQbJIUw",
        title: "Kis Liye Maine Pyaar Kiya",
        artist: "Lata Mangeshkar",
        durationMs: 260000,
        coverUrl:
          "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=bHzofQbJIUw",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_hgi2MYAFgE8",
        title: "Gulabi Aankhen Jo Teri Dekhi",
        artist: "Mohammed Rafi",
        durationMs: 202000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=hgi2MYAFgE8",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_PIwGCRcsKvY",
        title: "O Meri Jaan Maine Kaha",
        artist: "Asha Bhosle, R.D. Burman",
        durationMs: 280000,
        coverUrl:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=PIwGCRcsKvY",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_oZfE2E-eLlo",
        title: "Mujhse Bhala Yeh Kajal",
        artist: "Lata Mangeshkar, Mohammed Rafi",
        durationMs: 245000,
        coverUrl:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=oZfE2E-eLlo",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },

  // 3. Train (American Pop-Rock Band) - Save Me, San Francisco
  {
    id: "train_2009_save_me_san_francisco",
    title: "Save Me, San Francisco",
    releaseYear: 2009,
    type: "studio_album",
    disambiguationLabel: "Train (US Pop-Rock Band) • 'Hey, Soul Sister'",
    primaryArtist: "Train",
    featuredSingers: ["Pat Monahan"],
    genres: ["Rock", "Pop Rock", "Alternative"],
    coverUrl:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80",
    totalDurationMs: 654000,
    tracks: [
      {
        id: "yt_kVpv8_5XWOI",
        title: "Hey, Soul Sister",
        artist: "Train",
        durationMs: 217000,
        coverUrl:
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=kVpv8-5XWOI",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_oxqnFJ3lp5k",
        title: "Drive By",
        artist: "Train",
        durationMs: 195000,
        coverUrl:
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=oxqnFJ3lp5k",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_CallingAllAngels_Train",
        title: "Calling All Angels",
        artist: "Train",
        durationMs: 242000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=CallingAllAngels_Train",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },

  // 4. Moose Tape (2021) - Sidhu Moose Wala
  {
    id: "moose_tape_2021_sidhu",
    title: "Moosetape",
    releaseYear: 2021,
    type: "studio_album",
    disambiguationLabel: "2021 Punjabi Album • Sidhu Moose Wala, The Kidd, Byg Byrd",
    primaryArtist: "Sidhu Moose Wala",
    featuredSingers: ["Sidhu Moose Wala", "Bohemia", "Raja Kumari"],
    genres: ["Punjabi", "Hip-Hop", "Gangsta Rap"],
    coverUrl:
      "https://yt3.googleusercontent.com/AWUDcXS-kaMI6gAtXWIsk7egvY4pASqy65fSF3AZ_210VBZlSQyyOuIObRLXbMMU9J1Nfd1J8Q=s800-c-k-c0x00ffffff-no-rj",
    totalDurationMs: 1250000,
    tracks: [
      {
        id: "yt_295",
        title: "295",
        artist: "Sidhu Moose Wala",
        durationMs: 270000,
        coverUrl:
          "https://yt3.googleusercontent.com/AWUDcXS-kaMI6gAtXWIsk7egvY4pASqy65fSF3AZ_210VBZlSQyyOuIObRLXbMMU9J1Nfd1J8Q=s800-c-k-c0x00ffffff-no-rj",
        url: "/api/stream/youtube?id=295",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_TheLastRide",
        title: "The Last Ride",
        artist: "Sidhu Moose Wala",
        durationMs: 260000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=TheLastRide",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_Levels_Sidhu",
        title: "Levels",
        artist: "Sidhu Moose Wala ft. Sunny Malton",
        durationMs: 232000,
        coverUrl:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=Levels_Sidhu",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_TheseDays_Sidhu",
        title: "These Days",
        artist: "Sidhu Moose Wala ft. Bohemia",
        durationMs: 210000,
        coverUrl:
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=TheseDays_Sidhu",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },

  // 5. Starboy (2016) - The Weeknd
  {
    id: "starboy_2016_weeknd",
    title: "Starboy",
    releaseYear: 2016,
    type: "studio_album",
    disambiguationLabel: "2016 Pop/R&B Studio Album • The Weeknd & Daft Punk",
    primaryArtist: "The Weeknd",
    featuredSingers: ["The Weeknd", "Daft Punk", "Lana Del Rey", "Kendrick Lamar"],
    genres: ["Pop", "Contemporary R&B", "Synthpop"],
    coverUrl:
      "https://yt3.googleusercontent.com/WHvw1ak1FcJaHeEiTmG2iN0dqEjjPxAtT_tA8ruJ3MlNr9I-RHsAur1iAenYeQN_d6LNPH2Z8Ic=s800-c-k-c0x00ffffff-no-rj",
    totalDurationMs: 964000,
    tracks: [
      {
        id: "yt_34Na4j8AVgA",
        title: "Starboy",
        artist: "The Weeknd ft. Daft Punk",
        durationMs: 230000,
        coverUrl:
          "https://yt3.googleusercontent.com/WHvw1ak1FcJaHeEiTmG2iN0dqEjjPxAtT_tA8ruJ3MlNr9I-RHsAur1iAenYeQN_d6LNPH2Z8Ic=s800-c-k-c0x00ffffff-no-rj",
        url: "/api/stream/youtube?id=34Na4j8AVgA",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_fHI8X480mxo",
        title: "Blinding Lights",
        artist: "The Weeknd",
        durationMs: 200000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=fHI8X480mxo",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_XXYlFuWEuKI",
        title: "Save Your Tears",
        artist: "The Weeknd",
        durationMs: 215000,
        coverUrl:
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=XXYlFuWEuKI",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_yzTuBuRdAyA",
        title: "The Hills",
        artist: "The Weeknd",
        durationMs: 242000,
        coverUrl:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=yzTuBuRdAyA",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },

  // 6. Discovery (2001) - Daft Punk
  {
    id: "discovery_2001_daft_punk",
    title: "Discovery",
    releaseYear: 2001,
    type: "studio_album",
    disambiguationLabel: "2001 French Electronic House • Daft Punk",
    primaryArtist: "Daft Punk",
    featuredSingers: ["Romanthony", "Todd Edwards"],
    genres: ["Electronic", "French House", "Synthpop"],
    coverUrl:
      "https://yt3.googleusercontent.com/9rW5L_V3Gk22dE9o9Rrh7iEw-3FvdP7N8vF_0b4m9H7I9L5F4D3C2A1E0=s800-c-k-c0x00ffffff-no-rj",
    totalDurationMs: 820000,
    tracks: [
      {
        id: "yt_gAjR4_CbPpQ",
        title: "One More Time",
        artist: "Daft Punk",
        durationMs: 320000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=gAjR4_CbPpQ",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_5NV6Rdv1a3I",
        title: "Get Lucky",
        artist: "Daft Punk ft. Pharrell Williams",
        durationMs: 248000,
        coverUrl:
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=5NV6Rdv1a3I",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_s9MszVE7aR4",
        title: "Harder, Better, Faster, Stronger",
        artist: "Daft Punk",
        durationMs: 224000,
        coverUrl:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=s9MszVE7aR4",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
];
