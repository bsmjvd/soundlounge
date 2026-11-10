import { RoomDurableObject, type Env } from "./RoomDurableObject";
import { sanitizeR2Key, formatAudioPublicUrl, createPresignedR2PutUrl } from "./r2";

export { RoomDurableObject };

export interface WorkerEnv extends Env {
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  PHONE_SECRET?: string;
  PHONE_KV?: { get(key: string): Promise<string | null>; put(key: string, value: string): Promise<void> };
}

// Cloudflare quick-tunnel hosts only, so a leaked secret can't point listeners at arbitrary sites
// (api.trycloudflare.com is cloudflared's own control host, never a tunnel)
const PHONE_URL_RE = /^https:\/\/(?!api\.)[a-z0-9-]+\.trycloudflare\.com$/;

async function sameSecret(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  // Compare fixed-length digests in constant time
  const [ha, hb] = (await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", enc.encode(s))))).map((d) => new Uint8Array(d));
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const ROOM_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: any): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === "/api/health" || path === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          name: "soundlounge-worker",
          timestamp: Date.now(),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Phone YouTube streamer registry: the phone POSTs its tunnel URL on start, the app GETs it
    if (path === "/api/phone") {
      if (!env.PHONE_KV) return json({ error: "Phone registry not configured" }, 503);
      if (request.method === "GET") return json({ url: await env.PHONE_KV.get("url") });
      if (request.method === "POST") {
        const auth = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
        if (!env.PHONE_SECRET || !(await sameSecret(auth, env.PHONE_SECRET))) return json({ error: "Unauthorized" }, 401);
        const body = (await request.json().catch(() => ({}))) as { url?: string };
        if (!body.url || !PHONE_URL_RE.test(body.url)) return json({ error: "Invalid tunnel URL" }, 400);
        await env.PHONE_KV.put("url", body.url);
        return json({ ok: true });
      }
    }

    // Private room creation: random id + token, so an existing room can't be taken over
    if (path === "/api/rooms" && request.method === "POST") {
      const roomId = crypto.randomUUID();
      const inviteToken = crypto.randomUUID();
      const stub = env.ROOM_DO.get(env.ROOM_DO.idFromName(roomId));
      const init = await stub.fetch(
        new Request("https://room/init-private", { method: "POST", body: JSON.stringify({ inviteToken }) })
      );
      if (!init.ok) return json({ error: "Failed to create room" }, 500);
      return json({ roomId, inviteToken });
    }

    // Direct audio upload presigning
    const uploadMatch = path.match(/^\/api\/rooms\/([^/]+)\/upload-url$/);
    if (uploadMatch && request.method === "POST") {
      const roomId = uploadMatch[1];
      if (!ROOM_ID_RE.test(roomId)) return json({ error: "Invalid room id" }, 400);

      // Same invite check the room applies to joiners
      const stub = env.ROOM_DO.get(env.ROOM_DO.idFromName(roomId));
      const access = await stub.fetch(
        new Request(`https://room/api/rooms/${roomId}/state${url.search}`)
      );
      if (access.status === 403) return json({ error: "Private room: valid invite token required" }, 403);

      try {
        const body = (await request.json()) as { fileName?: string; contentType?: string; size?: number };
        const rawFileName = body.fileName || "audio.mp3";
        const contentType = body.contentType || "audio/mpeg";
        const size = body.size;
        if (!contentType.startsWith("audio/")) return json({ error: "Only audio files can be uploaded" }, 400);
        if (typeof size !== "number" || !(size > 0) || size > MAX_UPLOAD_BYTES) {
          return json({ error: `File must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` }, 400);
        }
        const timestamp = Date.now();
        const key = sanitizeR2Key(roomId, rawFileName, timestamp);
        const cdnBase = env.R2_PUBLIC_URL_PREFIX || "https://r2.soundlounge.app";
        const publicUrl = formatAudioPublicUrl(cdnBase, key);

        let uploadUrl = publicUrl;
        if (
          env.R2_ACCOUNT_ID &&
          env.R2_ACCESS_KEY_ID &&
          env.R2_SECRET_ACCESS_KEY &&
          env.R2_BUCKET_NAME
        ) {
          uploadUrl = await createPresignedR2PutUrl({
            accountId: env.R2_ACCOUNT_ID,
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
            bucketName: env.R2_BUCKET_NAME,
            key,
            contentType,
            contentLength: size,
          });
        }

        return new Response(
          JSON.stringify({
            key,
            publicUrl,
            uploadUrl,
            method: "PUT",
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...CORS_HEADERS,
            },
          }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || "Failed to generate upload URL" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...CORS_HEADERS,
            },
          }
        );
      }
    }

    // Room DO routing: /api/rooms/:roomId/*
    const roomMatch = path.match(/^\/api\/rooms\/([^/]+)/);
    if (roomMatch) {
      const roomId = roomMatch[1];
      const doId = env.ROOM_DO.idFromName(roomId);
      const stub = env.ROOM_DO.get(doId);
      return stub.fetch(request);
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  },
};
