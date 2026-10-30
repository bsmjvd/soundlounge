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
      }),
    });

    const res = await worker.fetch(req, env, {} as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.publicUrl).toContain("https://r2.soundlounge.app/rooms/my-room/beat___");
    expect(body.key).toContain("rooms/my-room/beat___");
  });
});
