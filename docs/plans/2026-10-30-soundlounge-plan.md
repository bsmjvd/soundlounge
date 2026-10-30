# Soundlounge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build **Soundlounge**, a standalone edge-native listening lounge supporting multi-source music (YouTube, SoundCloud, local uploads), instant solo streaming, on-device playlists, and millisecond-accurate multi-device synchronization.

**Architecture:** Monorepo with Turborepo. Cloudflare Workers + Durable Objects with embedded SQLite and WebSocket hibernation for zero-idle-cost stateful room coordination. Audio files upload directly to Cloudflare R2 via presigned URLs and stream through R2 CDN. Client uses Next.js 15, React 19, Tailwind CSS, an on-device local library (`localStorage`), and a dual-engine audio player (instant `<audio>` streaming for solo mode, sample-accurate Web Audio API + NTP probe pairs for synced rooms).

**Tech Stack:** Cloudflare Workers, Cloudflare Durable Objects (SQLite), Cloudflare R2, Bun / TypeScript, Zod, Next.js 15, React 19, Zustand, Tailwind CSS, Lucide icons, Web Audio API, MediaSession API.

---

## Global Constraints

- **Repository Root:** `C:\Users\basim\projects\soundlounge`
- **Zero Server Audio Proxying:** Worker acts strictly as a metadata coordinator and presigner; audio streams directly from R2 CDN, YouTube stream endpoints, or SoundCloud CDN.
- **Accountless Operation:** No login required. Playlists, liked songs, and session snapshots persist in `localStorage` (`soundlounge:library-v1`).
- **Private Room Protection:** Private sessions require an invite token (`?invite=<token>`); unauthorized connections are rejected with close code `4003`.
- **Latency & Sync:** Multi-listener rooms achieve sub-30ms sync using Huygens coded probe pairs; solo sessions start playing in under 2 seconds.

---

### Phase 1: Monorepo Scaffolding & Shared Protocol

#### Task 1: Initialize Monorepo & Shared Package
- [ ] Create root `package.json`, `turbo.json`, `bunfig.toml`, `.gitignore`.
- [ ] Scaffold `packages/shared` workspace with `package.json` and `tsconfig.json`.
- [ ] Implement `packages/shared/types/models.ts`:
  - `TrackSchema` (`id`, `title`, `artist`, `durationMs`, `url`, `source: "youtube" | "soundcloud" | "upload"`, `coverUrl?`, `r2Key?`)
  - `RoomPlaybackStateSchema` (`status`, `currentTrackId`, `positionMs`, `serverEpochStartTime`)
- [ ] Implement `packages/shared/types/protocol.ts`:
  - Discriminated union for `ClientActionSchema` (`NTP_REQUEST`, `PLAY`, `PAUSE`, `SEEK`, `ADD_TRACK`, `REMOVE_TRACK`, `REORDER_TRACKS`, `SEND_CHAT`)
  - Discriminated union for `ServerActionSchema` (`NTP_RESPONSE`, `SCHEDULED_PLAY`, `SCHEDULED_PAUSE`, `ROOM_STATE`, `ROOM_INVITE`, `CHAT_MESSAGE`)
- [ ] Export constants in `packages/shared/constants.ts` (`PRIVATE_ROOM_CLOSE_CODE = 4003`, `PROBE_GAP_MS = 25`, `PROBE_GAP_TOLERANCE_MS = 5`).
- [ ] Verify test suite passes with `bun test`.

---

### Phase 2: Cloudflare Edge Backend (`apps/worker`)

#### Task 2: Worker Router & Multi-Source Resolvers
- [ ] Scaffold `apps/worker` with `wrangler.toml` and TypeScript config.
- [ ] Implement R2 presigned upload generator (`POST /api/rooms/:roomId/upload-url`) with audio MIME validation (`audio/mpeg`, `audio/wav`, `audio/flac`, `audio/ogg`, `audio/aac`, `audio/m4a`).
- [ ] Implement multi-source metadata resolvers:
  - YouTube search and stream URL resolver (`/api/search/youtube`).
  - SoundCloud search and stream resolver (`/api/search/soundcloud`).
- [ ] Wire `/ws/:roomId` router to forward WebSocket upgrades to `RoomDurableObject`.

#### Task 3: Room Durable Object Actor (SQLite + Hibernation)
- [ ] Implement `RoomDurableObject` with embedded SQLite tables (`room_meta`, `tracks`, `messages`).
- [ ] Add private room invite token generation and enforce close code `4003` for unauthorized entrants.
- [ ] Implement Huygens NTP probe handler stamping server timestamps ($t_1, t_2$).
- [ ] Implement scheduled playback barrier timing:
  $$T_{\text{execute}} = \text{now} + \max(\text{clientRTT}) \times 1.5 + 400\text{ms}$$
- [ ] Add non-blocking late-joiner synchronization.

---

### Phase 3: Client Dual-Engine Audio Player (`apps/client/src/lib/player/`)

#### Task 4: Audio Engine Implementation
- [ ] Implement `SoloPlayer`: streaming HTML5 `<audio>` element with MediaSession API integration (<2s startup, lock-screen controls).
- [ ] Implement `SyncedPlayer`: Web Audio API `AudioContext` with hardware timeline scheduling and NTP clock offset adjustment.
- [ ] Implement `AudioEngineCoordinator`: seamless handover between Solo and Synced engines when friends join or leave without resetting track position.

---

### Phase 4: Frontend State, Library & User Interface (`apps/client`)

#### Task 5: On-Device Library Store & Session Restore
- [ ] Implement `useLibraryStore` with Zustand persist (`localStorage: soundlounge:library-v1`):
  - Liked tracks (heart button).
  - Custom user playlists (create, rename, delete, reorder, add-all-to-queue).
  - Recently played history (50 tracks).
- [ ] Implement `saveResumeSnapshot` and `loadResumeSnapshot` to power the "Continue Listening" home card.

#### Task 6: UI & Queue Experience
- [ ] Build Dark-Mode Navigation & TopBar with room code, invite link with QR token, and Solo toggle.
- [ ] Build Multi-Source Search & Upload Input:
  - Search tabs: YouTube / SoundCloud.
  - Drag-and-drop local audio uploader.
- [ ] Build Queue Manager with contextual actions: "Play next", "Add to playlist", "Clear queue", "Save queue as playlist".
- [ ] Build 4003 Private Session Access Denied screen.
