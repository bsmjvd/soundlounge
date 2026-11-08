import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0e1422",
};

export const metadata: Metadata = {
  title: "Soundlounge | Audiophile Music Experience",
  description:
    "Next-generation audiophile music player and collaborative listening lounge. Real-time sub-millisecond sync, high-fidelity audio, and cinematic studio immersion.",
  keywords: ["music", "sync", "audio", "collaboration", "real-time", "soundlounge", "audiophile"],
  authors: [{ name: "Soundlounge Team" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Soundlounge",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        <script src="https://www.youtube.com/iframe_api" async />
      </head>
      <body className="min-h-screen bg-[#07090e] text-[#f3f4f6] font-sans antialiased selection:bg-[#00e5ff]/30 selection:text-white">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
