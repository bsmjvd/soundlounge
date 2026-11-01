import type { Track } from "@soundlounge/shared";

export type RegionKey = "all" | "global" | "punjabi" | "electronic" | "hiphop" | "ghazal";

export interface ArtistProfileData {
  id: string;
  name: string;
  realName: string;
  genre: string;
  region: "global" | "punjabi" | "electronic" | "hiphop" | "ghazal";
  regionLabel: string;
  avatarUrl: string;
  bannerUrl: string;
  monthlyListeners: string;
  bio: string;
  topTracks: Track[];
}

export const ARTISTS_CATALOG: ArtistProfileData[] = [
  {
    id: "the-weeknd",
    name: "The Weeknd",
    realName: "Abel Makkonen Tesfaye",
    genre: "Contemporary R&B / Pop",
    region: "global",
    regionLabel: "Global / Canada",
    avatarUrl:
      "https://yt3.googleusercontent.com/WHvw1ak1FcJaHeEiTmG2iN0dqEjjPxAtT_tA8ruJ3MlNr9I-RHsAur1iAenYeQN_d6LNPH2Z8Ic=s800-c-k-c0x00ffffff-no-rj",
    bannerUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "115.4M",
    bio: "Canadian singer, songwriter, and producer known for his sonic versatility and dark lyrical themes. One of the best-selling music artists of all time.",
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
      {
        id: "yt_CtyytBCHA9U",
        title: "Earned It",
        artist: "The Weeknd",
        durationMs: 277000,
        coverUrl:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=CtyytBCHA9U",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "sidhu-moose-wala",
    name: "Sidhu Moose Wala",
    realName: "Shubhdeep Singh Sidhu",
    genre: "Punjabi Hip-Hop / Gangsta Rap",
    region: "punjabi",
    regionLabel: "South Asia / Punjabi",
    avatarUrl:
      "https://yt3.googleusercontent.com/AWUDcXS-kaMI6gAtXWIsk7egvY4pASqy65fSF3AZ_210VBZlSQyyOuIObRLXbMMU9J1Nfd1J8Q=s800-c-k-c0x00ffffff-no-rj",
    bannerUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "24.8M",
    bio: "Legendary Indian singer, rapper, and songwriter regarded as one of the greatest Punjabi music artists of his generation. Pioneered the fusion of traditional folk with Western hip-hop.",
    topTracks: [
      {
        id: "yt_4PfE2aB_sH0",
        title: "295",
        artist: "Sidhu Moose Wala",
        durationMs: 270000,
        coverUrl:
          "https://yt3.googleusercontent.com/AWUDcXS-kaMI6gAtXWIsk7egvY4pASqy65fSF3AZ_210VBZlSQyyOuIObRLXbMMU9J1Nfd1J8Q=s800-c-k-c0x00ffffff-no-rj",
        url: "/api/stream/youtube?id=4PfE2aB_sH0",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_qbn4hGotslc",
        title: "Love Sick",
        artist: "Sidhu Moose Wala ft. AR Paisley",
        durationMs: 230000,
        coverUrl:
          "https://yt3.googleusercontent.com/j-Sx5WjdPbAY34KzWoz_MahQxg093tboc9yeUBobfqho-L7FkrWbU5DFhF42ijNUyJUnwbIxcj28TTg=w800-h800-l90-rj",
        url: "/api/stream/youtube?id=qbn4hGotslc",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_bT_KjUvdUis",
        title: "The Last Ride",
        artist: "Sidhu Moose Wala",
        durationMs: 261000,
        coverUrl:
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=bT_KjUvdUis",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_fK_e2c-2gV8",
        title: "Same Beef",
        artist: "Sidhu Moose Wala ft. Bohemia",
        durationMs: 284000,
        coverUrl:
          "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=fK_e2c-2gV8",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_m4v-4u4m4a0",
        title: "Levels",
        artist: "Sidhu Moose Wala ft. Sunny Malton",
        durationMs: 232000,
        coverUrl:
          "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=m4v-4u4m4a0",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "daft-punk",
    name: "Daft Punk",
    realName: "Thomas Bangalter & Guy-Manuel de Homem-Christo",
    genre: "French House / Synthwave / Electronic",
    region: "electronic",
    regionLabel: "Europe / France",
    avatarUrl:
      "https://yt3.googleusercontent.com/_PRcwn8VqgteNAiU9btPy1mOUnZYD5QuBBGUX-PumwmuwytIHIlIvccS8BOUun7T6JjsYERD=s800-c-k-c0x00ffffff-no-rj",
    bannerUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "22.1M",
    bio: "French electronic music duo formed in 1993 in Paris. Pioneered the French house movement, revolutionizing electronic dance music worldwide.",
    topTracks: [
      {
        id: "yt_5NV6Rdv1a3I",
        title: "Get Lucky",
        artist: "Daft Punk ft. Pharrell Williams",
        durationMs: 248000,
        coverUrl:
          "https://yt3.googleusercontent.com/_PRcwn8VqgteNAiU9btPy1mOUnZYD5QuBBGUX-PumwmuwytIHIlIvccS8BOUun7T6JjsYERD=s800-c-k-c0x00ffffff-no-rj",
        url: "/api/stream/youtube?id=5NV6Rdv1a3I",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_FGBhQbmMxH8",
        title: "One More Time",
        artist: "Daft Punk",
        durationMs: 320000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=FGBhQbmMxH8",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_gAjR4_CbPpQ",
        title: "Harder, Better, Faster, Stronger",
        artist: "Daft Punk",
        durationMs: 224000,
        coverUrl:
          "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=gAjR4_CbPpQ",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_sFZjqVnWBhc",
        title: "Instant Crush",
        artist: "Daft Punk ft. Julian Casablancas",
        durationMs: 337000,
        coverUrl:
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=sFZjqVnWBhc",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_yca6TwrmFBI",
        title: "Around The World",
        artist: "Daft Punk",
        durationMs: 242000,
        coverUrl:
          "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=yca6TwrmFBI",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "kendrick-lamar",
    name: "Kendrick Lamar",
    realName: "Kendrick Lamar Duckworth",
    genre: "Conscious Hip-Hop / West Coast",
    region: "hiphop",
    regionLabel: "North America / USA",
    avatarUrl:
      "https://yt3.googleusercontent.com/j1szYhuen1uT1D1icpjxHMFyBc0xINWK1eMtSzrB0TL5jliB7t3JB_wJ6UA9twV7VelxpKEc=s800-c-k-c0x00ffffff-no-rj",
    bannerUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "71.9M",
    bio: "American rapper and songwriter from Compton, California. Widely regarded as one of the most influential and lyrically brilliant hip-hop artists in history. Pulitzer Prize winner.",
    topTracks: [
      {
        id: "yt_H58vbez_m4E",
        title: "Not Like Us",
        artist: "Kendrick Lamar",
        durationMs: 274000,
        coverUrl:
          "https://yt3.googleusercontent.com/j1szYhuen1uT1D1icpjxHMFyBc0xINWK1eMtSzrB0TL5jliB7t3JB_wJ6UA9twV7VelxpKEc=s800-c-k-c0x00ffffff-no-rj",
        url: "/api/stream/youtube?id=H58vbez_m4E",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_tvTRZJ-4EyI",
        title: "HUMBLE.",
        artist: "Kendrick Lamar",
        durationMs: 177000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=tvTRZJ-4EyI",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_nlcIKh6sB3g",
        title: "DNA.",
        artist: "Kendrick Lamar",
        durationMs: 185000,
        coverUrl:
          "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=nlcIKh6sB3g",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_J3t3W33rRoc",
        title: "Alright",
        artist: "Kendrick Lamar",
        durationMs: 212000,
        coverUrl:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=J3t3W33rRoc",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_Z-48u_WA81s",
        title: "Money Trees",
        artist: "Kendrick Lamar ft. Jay Rock",
        durationMs: 386000,
        coverUrl:
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=Z-48u_WA81s",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "billie-eilish",
    name: "Billie Eilish",
    realName: "Billie Eilish Pirate Baird O'Connell",
    genre: "Electropop / Alt-Pop",
    region: "global",
    regionLabel: "Global / USA",
    avatarUrl:
      "https://yt3.googleusercontent.com/dirvtoDAmx-u0UR76-pxfhYL6Wxj2vfL2geUcxDwk62tTWWhGG6QDGc63RG3NdOz38-yBwRHDQ=s800-c-k-c0x00ffffff-no-rj",
    bannerUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "98.7M",
    bio: "American singer and songwriter who first gained public attention in 2015. Known for her whisper-soft vocal style, introspective lyrics, and boundary-pushing productions.",
    topTracks: [
      {
        id: "yt_V9PVRfjEBTI",
        title: "Birds of a Feather",
        artist: "Billie Eilish",
        durationMs: 198000,
        coverUrl:
          "https://yt3.googleusercontent.com/dirvtoDAmx-u0UR76-pxfhYL6Wxj2vfL2geUcxDwk62tTWWhGG6QDGc63RG3NdOz38-yBwRHDQ=s800-c-k-c0x00ffffff-no-rj",
        url: "/api/stream/youtube?id=V9PVRfjEBTI",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_DyDfgMOUjCI",
        title: "bad guy",
        artist: "Billie Eilish",
        durationMs: 194000,
        coverUrl:
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=DyDfgMOUjCI",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_OORBa32WFrc",
        title: "Happier Than Ever",
        artist: "Billie Eilish",
        durationMs: 298000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=OORBa32WFrc",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_viimfQi_pUw",
        title: "when the party's over",
        artist: "Billie Eilish",
        durationMs: 196000,
        coverUrl:
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=viimfQi_pUw",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_4I_6B-6r0pI",
        title: "LUNCH",
        artist: "Billie Eilish",
        durationMs: 180000,
        coverUrl:
          "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=4I_6B-6r0pI",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "dua-lipa",
    name: "Dua Lipa",
    realName: "Dua Lipa",
    genre: "Disco Pop / Dance-Pop",
    region: "global",
    regionLabel: "Global / UK",
    avatarUrl:
      "https://yt3.googleusercontent.com/c3upBFWLu55hnBvqncQS9ZEF_hkvHsNTQiB7m7ZYYavLFMzfyn9Bwo-1VF4HSPGo3G2EdwGtgWg=s800-c-k-c0x00ffffff-no-rj",
    bannerUrl:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "83.6M",
    bio: "English and Albanian singer and songwriter. Known for her signature mezzo-soprano vocal range and modern disco-inspired dance-pop sound.",
    topTracks: [
      {
        id: "yt_TUVcZfQe-Kw",
        title: "Levitating",
        artist: "Dua Lipa",
        durationMs: 203000,
        coverUrl:
          "https://yt3.googleusercontent.com/c3upBFWLu55hnBvqncQS9ZEF_hkvHsNTQiB7m7ZYYavLFMzfyn9Bwo-1VF4HSPGo3G2EdwGtgWg=s800-c-k-c0x00ffffff-no-rj",
        url: "/api/stream/youtube?id=TUVcZfQe-Kw",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_oygrmJFKYZY",
        title: "Don't Start Now",
        artist: "Dua Lipa",
        durationMs: 183000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=oygrmJFKYZY",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_k2qgadSvNyU",
        title: "New Rules",
        artist: "Dua Lipa",
        durationMs: 209000,
        coverUrl:
          "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=k2qgadSvNyU",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_njA3T_6eR5c",
        title: "Houdini",
        artist: "Dua Lipa",
        durationMs: 185000,
        coverUrl:
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=njA3T_6eR5c",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_r3rS-z8m7a0",
        title: "Physical",
        artist: "Dua Lipa",
        durationMs: 193000,
        coverUrl:
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=r3rS-z8m7a0",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "karan-aujla",
    name: "Karan Aujla",
    realName: "Jaskaran Singh Aujla",
    genre: "Punjabi Trap / Desi Pop",
    region: "punjabi",
    regionLabel: "South Asia / Punjabi",
    avatarUrl:
      "https://yt3.googleusercontent.com/Da4zbrS4XLxzb3xVNT14aKr22aBg1blJCuCBppbYglO_uDmElYopgoDk7XV6UWNxthI96XOYrw=s800-c-k-c0x00ffffff-no-rj",
    bannerUrl:
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "19.3M",
    bio: "Prominent Indian singer, rapper, and lyricist known for chart-topping Punjabi anthems and international collaborations across Canada, UK, and India.",
    topTracks: [
      {
        id: "yt_Ta3c3fQe7a0",
        title: "Tauba Tauba",
        artist: "Karan Aujla",
        durationMs: 206000,
        coverUrl:
          "https://yt3.googleusercontent.com/Da4zbrS4XLxzb3xVNT14aKr22aBg1blJCuCBppbYglO_uDmElYopgoDk7XV6UWNxthI96XOYrw=s800-c-k-c0x00ffffff-no-rj",
        url: "/api/stream/youtube?id=Ta3c3fQe7a0",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_Softly_Aujla",
        title: "Softly",
        artist: "Karan Aujla ft. Ikky",
        durationMs: 155000,
        coverUrl:
          "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=Softly_Aujla",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_WinningSpeech",
        title: "Winning Speech",
        artist: "Karan Aujla ft. Mxrci",
        durationMs: 218000,
        coverUrl:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=WinningSpeech",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "diljit-dosanjh",
    name: "Diljit Dosanjh",
    realName: "Diljit Singh Dosanjh",
    genre: "Punjabi Pop / Folk Fusion",
    region: "punjabi",
    regionLabel: "South Asia / Punjabi",
    avatarUrl:
      "https://yt3.googleusercontent.com/7EYXXMXY594V8y4sZT2aawmdKgDAGTu5jNm9C-HpR3jY9cZJ0NMxS__nZKBdWZ1PUpJPjc2BAA=s800-c-k-c0x00ffffff-no-rj",
    bannerUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "21.6M",
    bio: "Global Punjabi icon and actor. First Punjabi artist to perform at Coachella, breaking worldwide records with high-energy arena tours and timeless folk fusions.",
    topTracks: [
      {
        id: "yt_Lover_Diljit",
        title: "Lover",
        artist: "Diljit Dosanjh",
        durationMs: 192000,
        coverUrl:
          "https://yt3.googleusercontent.com/7EYXXMXY594V8y4sZT2aawmdKgDAGTu5jNm9C-HpR3jY9cZJ0NMxS__nZKBdWZ1PUpJPjc2BAA=s800-c-k-c0x00ffffff-no-rj",
        url: "/api/stream/youtube?id=Lover_Diljit",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_BornToShine",
        title: "Born to Shine",
        artist: "Diljit Dosanjh",
        durationMs: 214000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=BornToShine",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_Naina_Diljit",
        title: "Naina",
        artist: "Diljit Dosanjh ft. Badshah",
        durationMs: 180000,
        coverUrl:
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=Naina_Diljit",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "jagjit-singh",
    name: "Jagjit Singh",
    realName: "Jagmohan Singh Dhiman",
    genre: "Ghazal / Urdu Poetry",
    region: "ghazal",
    regionLabel: "South Asia / Ghazal",
    avatarUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    bannerUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "8.9M",
    bio: "Revered as 'The King of Ghazals', Jagjit Singh revolutionized the genre by making traditional Urdu poetry accessible and deeply emotive to modern listeners worldwide.",
    topTracks: [
      {
        id: "yt_Ju6kNKaBOQ8",
        title: "Tum Itna Jo Muskura Rahe Ho",
        artist: "Jagjit Singh",
        durationMs: 318000,
        coverUrl:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=Ju6kNKaBOQ8",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_tEomN5_KjW0",
        title: "Hoshwalon Ko Khabar Kya",
        artist: "Jagjit Singh",
        durationMs: 302000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=tEomN5_KjW0",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_42_K6J30o30",
        title: "Chitthi Na Koi Sandesh",
        artist: "Jagjit Singh",
        durationMs: 395000,
        coverUrl:
          "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=42_K6J30o30",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_P_nLgM1VqF0",
        title: "Jhuki Jhuki Si Nazar",
        artist: "Jagjit Singh",
        durationMs: 284000,
        coverUrl:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=P_nLgM1VqF0",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_49rS29FwU_o",
        title: "Woh Kagaz Ki Kashti",
        artist: "Jagjit Singh",
        durationMs: 240000,
        coverUrl:
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=49rS29FwU_o",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "mehdi-hassan",
    name: "Mehdi Hassan",
    realName: "Mehdi Hassan Khan",
    genre: "Classical Ghazal / Thumri",
    region: "ghazal",
    regionLabel: "South Asia / Ghazal",
    avatarUrl:
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
    bannerUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "4.2M",
    bio: "The 'Shahenshah-e-Ghazal' (Emperor of Ghazals), celebrated for his immaculate baritone, profound classical ornamentation, and mastery over traditional ragas.",
    topTracks: [
      {
        id: "yt_RanjishHiSahi",
        title: "Ranjish Hi Sahi",
        artist: "Mehdi Hassan",
        durationMs: 380000,
        coverUrl:
          "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=RanjishHiSahi",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_GulonMeinRang",
        title: "Gulon Mein Rang Bhare",
        artist: "Mehdi Hassan",
        durationMs: 320000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=GulonMeinRang",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_DuniyaKisiKe",
        title: "Duniya Kisi Ke Pyaar Mein",
        artist: "Mehdi Hassan",
        durationMs: 295000,
        coverUrl:
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=DuniyaKisiKe",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_ZindagiMeinToh",
        title: "Zindagi Mein Toh Sabhi Pyaar",
        artist: "Mehdi Hassan",
        durationMs: 310000,
        coverUrl:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ZindagiMeinToh",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "ghulam-ali",
    name: "Ghulam Ali",
    realName: "Ustad Ghulam Ali",
    genre: "Ghazal / Hindustani Classical",
    region: "ghazal",
    regionLabel: "South Asia / Ghazal",
    avatarUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    bannerUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "3.7M",
    bio: "Patiala Gharana maestro renowned for seamlessly blending intricate classical sargam and taans into romantic, melancholic Ghazal renditions.",
    topTracks: [
      {
        id: "yt_ChupkeChupke",
        title: "Chupke Chupke Raat Din",
        artist: "Ghulam Ali",
        durationMs: 440000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ChupkeChupke",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_HungamaHaiKyon",
        title: "Hungama Hai Kyon Barpa",
        artist: "Ghulam Ali",
        durationMs: 360000,
        coverUrl:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=HungamaHaiKyon",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_ApniDhunMein",
        title: "Apni Dhun Mein Rehta Hoon",
        artist: "Ghulam Ali",
        durationMs: 315000,
        coverUrl:
          "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ApniDhunMein",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
  {
    id: "pankaj-udhas",
    name: "Pankaj Udhas",
    realName: "Pankaj Udhas",
    genre: "Ghazal / Nazm",
    region: "ghazal",
    regionLabel: "South Asia / Ghazal",
    avatarUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    bannerUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80",
    monthlyListeners: "5.1M",
    bio: "Pioneering Indian ghazal singer known for his soft, melodic touch and heartfelt storytelling, achieving immortal fame with 'Chitthi Aayi Hai'.",
    topTracks: [
      {
        id: "yt_ChitthiAayiHai",
        title: "Chitthi Aayi Hai",
        artist: "Pankaj Udhas",
        durationMs: 430000,
        coverUrl:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ChitthiAayiHai",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_ChandiJaisaRang",
        title: "Chandi Jaisa Rang Hai Tera",
        artist: "Pankaj Udhas",
        durationMs: 330000,
        coverUrl:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=ChandiJaisaRang",
        source: "youtube",
        createdAt: Date.now(),
      },
      {
        id: "yt_AapJinkeKareeb",
        title: "Aap Jinke Kareeb Hote Hain",
        artist: "Pankaj Udhas",
        durationMs: 310000,
        coverUrl:
          "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        url: "/api/stream/youtube?id=AapJinkeKareeb",
        source: "youtube",
        createdAt: Date.now(),
      },
    ],
  },
];
