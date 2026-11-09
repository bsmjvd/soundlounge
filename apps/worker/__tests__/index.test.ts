import { describe, it, expect } from "bun:test";
import worker from "../src/index";

describe("Worker Entrypoint & Routing", () => {
  const env: any = {
    R2_PUBLIC_URL_PREFIX: "https://r2.soundlounge.app",
    ROOM_DO: {
      idFromName: (name: string) => ({ toString: () => name }),
      get: (id: any) => ({
        fetch: async (req: Request) =>
          new Response(JSON.stringify({ routedRoomId: id.toString() }), {
            headers: { "Content-Type": "application/json" },
          }),
      }),
    },
  };

  it("responds to /api/health with status ok", async () => {
    const req = new Request("https://soundlounge.app/api/health");
    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe("ok");
    expect(body.name).toBe("soundlounge-worker");
  });

  it("handles CORS OPTIONS preflight request", async () => {
    const req = new Request("https://soundlounge.app/api/health", {
      method: "OPTIONS",
    });
    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });

  it("routes /api/rooms/:roomId/* to the correct Durable Object", async () => {
    const req = new Request("https://soundlounge.app/api/rooms/test-room-42/state");
    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.routedRoomId).toBe("test-room-42");
  });

  it("generates upload key and url for /api/rooms/:roomId/upload-url", async () => {
    const req = new Request("https://soundlounge.app/api/rooms/my-room/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: "beat.mp3",
        contentType: "audio/mpeg",
        size: 1024,
      }),
    });

    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.publicUrl).toContain("https://r2.soundlounge.app/rooms/my-room/beat___");
    expect(body.key).toContain("rooms/my-room/beat___");
  });

  const upload = (body: object, roomEnv = env, roomId = "my-room") =>
    worker.fetch(
      new Request(`https://soundlounge.app/api/rooms/${roomId}/upload-url`, { method: "POST", body: JSON.stringify(body) }),
      roomEnv,
      {} as any
    );

  it("rejects non-audio, missing or oversized uploads and bad room ids", async () => {
    expect((await upload({ fileName: "x.exe", contentType: "application/octet-stream", size: 10 })).status).toBe(400);
    expect((await upload({ fileName: "a.mp3", contentType: "audio/mpeg" })).status).toBe(400);
    expect((await upload({ fileName: "a.mp3", contentType: "audio/mpeg", size: 51 * 1024 * 1024 })).status).toBe(400);
    expect((await upload({ fileName: "a.mp3", contentType: "audio/mpeg", size: 10 }, env, "a.b")).status).toBe(400);
  });

  it("refuses uploads to a private room without its invite token", async () => {
    const privateEnv: any = {
      ...env,
      ROOM_DO: { ...env.ROOM_DO, get: () => ({ fetch: async () => new Response(null, { status: 403 }) }) },
    };
    expect((await upload({ fileName: "a.mp3", contentType: "audio/mpeg", size: 10 }, privateEnv)).status).toBe(403);
  });

  it("creates a private room with a random id and invite token", async () => {
    let initBody: any;
    let initPath = "";
    const createEnv: any = {
      ...env,
      ROOM_DO: {
        ...env.ROOM_DO,
        get: () => ({
          fetch: async (req: Request) => {
            initPath = new URL(req.url).pathname;
            initBody = await req.json();
            return new Response(null, { status: 204 });
          },
        }),
      },
    };
    const res = await worker.fetch(new Request("https://soundlounge.app/api/rooms", { method: "POST" }), createEnv, {} as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.roomId).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.inviteToken).toBe(initBody.inviteToken);
    expect(initPath).toBe("/init-private");
  });
});
