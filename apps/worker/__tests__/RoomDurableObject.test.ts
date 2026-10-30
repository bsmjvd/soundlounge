import { describe, it, expect, beforeEach } from "bun:test";
import { RoomDurableObject } from "../src/RoomDurableObject";
import {
  PRIVATE_ROOM_CLOSE_CODE,
  type ClientAction,
  type ServerAction,
} from "@soundlounge/shared";

// Mock WebSocket & Storage for testing RoomDurableObject outside miniflare
class MockWebSocket {
  sentMessages: string[] = [];
  closeCode: number | null = null;
  closeReason: string | null = null;
  readyState = 1; // OPEN

  send(data: string) {
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string) {
    this.closeCode = code ?? 1000;
    this.closeReason = reason ?? "";
    this.readyState = 3; // CLOSED
  }
}

class MockSqlCursor {
  constructor(private rows: any[]) {}
  *[Symbol.iterator]() {
    for (const row of this.rows) {
      yield row;
    }
  }
  toArray() {
    return this.rows;
  }
}

class MockSqlStorage {
  private tables: Record<string, any[]> = {
    room_meta: [],
    tracks: [],
  };

  exec(query: string, ...bindings: any[]) {
    // Basic SQL mock for unit tests
    if (query.includes("CREATE TABLE")) {
      return new MockSqlCursor([]);
    }
    if (query.includes("SELECT value FROM room_meta WHERE key = ?")) {
      const key = bindings[0];
      const found = this.tables.room_meta.find((r) => r.key === key);
      return new MockSqlCursor(found ? [found] : []);
    }
    if (query.includes("INSERT OR REPLACE INTO room_meta")) {
      const [key, value] = bindings;
      const idx = this.tables.room_meta.findIndex((r) => r.key === key);
      if (idx >= 0) this.tables.room_meta[idx] = { key, value };
      else this.tables.room_meta.push({ key, value });
      return new MockSqlCursor([]);
    }
    if (query.includes("SELECT * FROM tracks ORDER BY position ASC")) {
      return new MockSqlCursor(this.tables.tracks);
    }
    if (query.includes("INSERT OR REPLACE INTO tracks")) {
      const [id, title, artist, duration_ms, url, source, cover_url, r2_key, position] = bindings;
      const idx = this.tables.tracks.findIndex((t) => t.id === id);
      const row = { id, title, artist, duration_ms, url, source, cover_url, r2_key, position };
      if (idx >= 0) this.tables.tracks[idx] = row;
      else this.tables.tracks.push(row);
      return new MockSqlCursor([]);
    }
    if (query.includes("DELETE FROM tracks WHERE id = ?")) {
      const id = bindings[0];
      this.tables.tracks = this.tables.tracks.filter((t) => t.id !== id);
      return new MockSqlCursor([]);
    }
    if (query.includes("DELETE FROM tracks")) {
      this.tables.tracks = [];
      return new MockSqlCursor([]);
    }
    return new MockSqlCursor([]);
  }
}

class MockDurableObjectContext {
  storage = {
    sql: new MockSqlStorage(),
  };
  sockets: MockWebSocket[] = [];

  acceptWebSocket(ws: any) {
    this.sockets.push(ws);
  }

  getWebSockets() {
    return this.sockets.filter((s) => s.readyState === 1);
  }
}

describe("RoomDurableObject", () => {
  let ctx: MockDurableObjectContext;
  let room: RoomDurableObject;

  beforeEach(() => {
    ctx = new MockDurableObjectContext();
    room = new RoomDurableObject(ctx as any, {} as any);
  });

  it("rejects unauthorized client if room is private and token is missing or invalid", async () => {
    // Configure room as private with token "secret123"
    ctx.storage.sql.exec("INSERT OR REPLACE INTO room_meta (key, value) VALUES (?, ?)", "isPrivate", "true");
    ctx.storage.sql.exec("INSERT OR REPLACE INTO room_meta (key, value) VALUES (?, ?)", "inviteToken", "secret123");

    const req = new Request("https://soundlounge.app/api/rooms/room-1/websocket", {
      headers: { Upgrade: "websocket" },
    });

    const res = await room.fetch(req);
    expect(res.status).toBe(403);
    const body = await res.json() as any;
    expect(body.code).toBe(PRIVATE_ROOM_CLOSE_CODE);
  });

  it("handles NTP probe pairs and responds immediately with t1 and t2", async () => {
    const ws = new MockWebSocket();
    ctx.acceptWebSocket(ws);

    const ntpAction: ClientAction = {
      type: "NTP_REQUEST",
      t0: 1700000000000,
      probeGroupId: 1,
      probeGroupIndex: 0,
    };

    await room.handleSocketMessage(ws as any, JSON.stringify(ntpAction));

    expect(ws.sentMessages.length).toBe(1);
    const parsed: ServerAction = JSON.parse(ws.sentMessages[0]);
    expect(parsed.type).toBe("NTP_RESPONSE");
    if (parsed.type === "NTP_RESPONSE") {
      expect(parsed.t0).toBe(1700000000000);
      expect(parsed.t1).toBeGreaterThanOrEqual(1700000000000);
      expect(parsed.t2).toBeGreaterThanOrEqual(parsed.t1);
    }
  });

  it("broadcasts scheduled play with barrier timestamp to all connected sockets", async () => {
    const ws1 = new MockWebSocket();
    const ws2 = new MockWebSocket();
    ctx.acceptWebSocket(ws1);
    ctx.acceptWebSocket(ws2);

    const playAction: ClientAction = {
      type: "PLAY",
      trackId: "track_1",
      positionMs: 0,
    };

    await room.handleSocketMessage(ws1 as any, JSON.stringify(playAction));

    expect(ws1.sentMessages.length).toBe(1);
    expect(ws2.sentMessages.length).toBe(1);

    const broadcast: ServerAction = JSON.parse(ws1.sentMessages[0]);
    expect(broadcast.type).toBe("SCHEDULED_PLAY");
    if (broadcast.type === "SCHEDULED_PLAY") {
      expect(broadcast.trackId).toBe("track_1");
      expect(broadcast.serverTimeToExecute).toBeGreaterThan(Date.now());
      expect(broadcast.positionMs).toBe(0);
    }
  });

  it("handles adding track and broadcasts updated queue", async () => {
    const ws = new MockWebSocket();
    ctx.acceptWebSocket(ws);

    const addTrackAction: ClientAction = {
      type: "ADD_TRACK",
      track: {
        id: "yt_test",
        title: "Test Track",
        artist: "Artist",
        durationMs: 200000,
        url: "https://r2.soundlounge.app/test.mp3",
        source: "youtube",
      },
    };

    await room.handleSocketMessage(ws as any, JSON.stringify(addTrackAction));

    expect(ws.sentMessages.length).toBe(1);
    const broadcast: ServerAction = JSON.parse(ws.sentMessages[0]);
    expect(broadcast.type).toBe("QUEUE_UPDATED");
    if (broadcast.type === "QUEUE_UPDATED") {
      expect(broadcast.queue.length).toBe(1);
      expect(broadcast.queue[0].id).toBe("yt_test");
    }
  });
});
