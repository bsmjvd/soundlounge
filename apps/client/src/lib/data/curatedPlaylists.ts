// Curated playlists are stored as search queries, not hardcoded playlist IDs —
// at runtime each one resolves to the top matching YouTube Music playlist via
// /api/playlist?q=...&resolve=1, so the list never goes stale and no IDs are
// fabricated. coverUrl is a generated tile shown until/unless a real cover loads.

export interface CuratedPlaylist {
  id: string;
  title: string;
  description: string;
  query: string;
  coverUrl: string;
}

export const CURATED_PLAYLISTS: CuratedPlaylist[] = [
  {
    id: "pl_coke_studio",
    title: "Coke Studio Pakistan",
    description: "Pasoori, Afreen Afreen, Kana Yaari — the fusion franchise's greatest sessions",
    query: "Coke Studio Pakistan best songs",
    coverUrl: "/playlists/coke-studio.png",
  },
  {
    id: "pl_punjabi_hits",
    title: "Punjabi Hits",
    description: "Sidhu Moose Wala, Karan Aujla, Diljit — the loudest desi charts",
    query: "Top Punjabi songs",
    coverUrl: "/playlists/punjabi-hits.png",
  },
  {
    id: "pl_bollywood_hits",
    title: "Bollywood Top Hits",
    description: "Arijit Singh, Pritam, Shreya Ghoshal — the big-screen chartbusters",
    query: "Bollywood top hits latest",
    coverUrl: "/playlists/bollywood-hits.png",
  },
  {
    id: "pl_ghazal_classics",
    title: "Ghazal & Sufi Classics",
    description: "Mehdi Hassan, Jagjit Singh, Nusrat — timeless verses and harmoniums",
    query: "Best ghazals of all time",
    coverUrl: "/playlists/ghazal-classics.png",
  },
  {
    id: "pl_kashmiri_sufiana",
    title: "Kashmiri & Sufiana",
    description: "Santoor ragas, valley folk and Sufiana mausiqi from Kashmir",
    query: "Kashmiri songs santoor sufiana",
    coverUrl: "/playlists/kashmiri.png",
  },
  {
    id: "pl_pakistani_hiphop",
    title: "Pakistani Hip-Hop",
    description: "Young Stunners, Talha Anjum, Faris Shafi — Karachi's rap wave",
    query: "Pakistani rap hip hop hits",
    coverUrl: "/playlists/pakistani-hiphop.png",
  },
  {
    id: "pl_global_top",
    title: "Global Top Hits",
    description: "The Weeknd, Dua Lipa, Billie Eilish — worldwide chart-toppers",
    query: "Global top hits this week",
    coverUrl: "/playlists/global-top.png",
  },
  {
    id: "pl_lofi_chill",
    title: "Lo-Fi Chill",
    description: "Beats to study, code and unwind to",
    query: "Lo-fi chill beats playlist",
    coverUrl: "/playlists/lofi-chill.png",
  },
];
