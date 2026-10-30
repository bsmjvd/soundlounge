import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soundlounge — Ultra-Precision Synchronized & Solo Music Streaming",
  description:
    "Listen together in sub-30ms millisecond sync or stream solo instantly. Zero-account playlists, collaborative queues, and multi-source playback for YouTube, SoundCloud, and local uploads.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0d13] text-[#f3f4f6] antialiased">
        {children}
      </body>
    </html>
  );
}
