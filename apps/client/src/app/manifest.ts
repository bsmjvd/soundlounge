import type { MetadataRoute } from "next";

// Completes the appleWebApp metadata in layout.tsx: a standalone home-screen app
// gets far better background-audio treatment on iOS than a browser tab.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Soundlounge",
    short_name: "Soundlounge",
    description: "Audiophile music player and collaborative listening lounge.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#060a11",
    theme_color: "#060a11",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
