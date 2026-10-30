import { RoomDurableObject, type Env } from "./RoomDurableObject";
import { sanitizeR2Key, formatAudioPublicUrl, createPresignedR2PutUrl } from "./r2";

export { RoomDurableObject };

export interface WorkerEnv extends Env {
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

    // Direct audio upload presigning
    const uploadMatch = path.match(/^\/api\/rooms\/([^/]+)\/upload-url$/);
    if (uploadMatch && request.method === "POST") {
      const roomId = uploadMatch[1];
      try {
        const body = (await request.json()) as { fileName?: string; contentType?: string };
        const rawFileName = body.fileName || "audio.mp3";
        const contentType = body.contentType || "audio/mpeg";
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
