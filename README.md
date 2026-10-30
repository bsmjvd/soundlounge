# Soundlounge 🎧

> **Real-time, millisecond-accurate synchronized listening lounge for friends across the globe.**

Soundlounge is a modern, edge-native web application that lets friends listen to music together in perfect synchronization or enjoy personal solo sessions with zero setup and no mandatory accounts.

---

## ✨ Features

- **⚡ Instant Solo Streaming:** Solo sessions begin playing in under 2 seconds using streaming HTML5 audio without waiting for heavy file downloads or in-memory PCM decoding.
- **⏱️ Sub-30ms Multi-Device Sync:** Multi-listener rooms use a Huygens NTP probe-pair synchronization protocol with scheduled server epoch execution.
- **🎵 Multi-Source Music Ingestion:**
  - **YouTube & YouTube Music:** Instant playback, suggested auto-queue, and playlist import.
  - **SoundCloud:** Stream resolution and playlist queueing.
  - **Local Audio Uploads:** Direct-to-R2 upload via presigned URLs with zero server egress costs.
- **💾 Accountless On-Device Library:**
  - Liked tracks, custom playlists, and recently played history stored locally in browser `localStorage`.
  - **"Continue Listening"** auto-resumes your solo queue right where you left off.
- **🔒 Private Session Invite Security:**
  - One-click private sessions with cryptographic invite tokens (`?invite=<token>`).
  - Unauthorized visitors attempting to enter private rooms are safely rejected (`4003`).
- **🎛️ Headphone & Lock-Screen Controls:**
  - Full MediaSession API integration for macOS Control Center, Windows media keys, and mobile lock screens.
- **🌐 Serverless Edge Architecture:**
  - Cloudflare Workers + Durable Objects with embedded SQLite and WebSocket hibernation.
  - $0 idle server costs and low latency globally.

---

## 🏗️ Monorepo Structure

```
soundlounge/
├── apps/
│   ├── client/       # Next.js 15, React 19, Tailwind CSS, Web Audio + Solo Player
│   └── worker/       # Cloudflare Worker + Durable Object Room Actor (SQLite + WS)
├── packages/
│   └── shared/       # Shared TypeScript types, Zod schemas, and NTP protocols
├── docs/             # Architecture specifications and implementation plans
├── package.json      # Monorepo workspace configuration
└── turbo.json        # Turborepo task pipeline
```
