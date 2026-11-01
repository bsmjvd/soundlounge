import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-[#07090e] text-[#f3f4f6] font-sans antialiased selection:bg-indigo-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
