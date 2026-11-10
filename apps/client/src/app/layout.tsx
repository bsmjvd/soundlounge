import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060a11",
  interactiveWidget: "resizes-content",
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
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
        <script src="https://www.youtube.com/iframe_api" async />
      </head>
      <body className="min-h-dvh bg-canvas text-ink font-sans antialiased selection:bg-accent/30 selection:text-ink">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
