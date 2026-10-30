import {
  PRIVATE_ROOM_CLOSE_CODE,
  ClientActionSchema,
  TrackSchema,
  type ClientAction,
  type ServerAction,
  type Track,
  type RoomPlaybackState,
} from "@soundlounge/shared";
import {
  createNtpResponse,
  calculateBarrierExecutionTime,
  calculateLateJoinerPosition,
} from "./sync";

export interface Env {
  AUDIO_BUCKET?: any;
  R2_PUBLIC_URL_PREFIX?: string;
  ROOM_DO: any;
}

export class RoomDurableObject {
  private ctx: any;
  private env: Env;
  private clientRtts: Map<any, number> = new Map();

  constructor(ctx: any, env: Env) {
    this.ctx = ctx;
    this.env = env;
    this.initializeSchema();
  }

  private initializeSchema() {
    if (!this.ctx?.storage?.sql) return;

    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS room_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY,
        title TEXT,
        artist TEXT,
        duration_ms INTEGER,
        url TEXT,
        source TEXT,
        cover_url TEXT,
        r2_key TEXT,
        position INTEGER
      );
    `);
  }

  private getMeta(key: string, defaultValue: string = ""): string {
    if (!this.ctx?.storage?.sql) return defaultValue;
    const rows = [...this.ctx.storage.sql.exec("SELECT value FROM room_meta WHERE key = ?", key)];
    if (rows.length > 0 && rows[0]?.value !== undefined) {
      return rows[0].value;
    }
    return defaultValue;
  }

  private setMeta(key: string, value: string) {
    if (!this.ctx?.storage?.sql) return;
    this.ctx.storage.sql.exec("INSERT OR REPLACE INTO room_meta (key, value) VALUES (?, ?)", key, value);
  }

  private getQueue(): Track[] {
    if (!this.ctx?.storage?.sql) return [];
    const rows = [...this.ctx.storage.sql.exec("SELECT * FROM tracks ORDER BY position ASC")];
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      durationMs: Number(r.duration_ms),
      url: r.url,
      source: r.source,
      coverUrl: r.cover_url || undefined,
      r2Key: r.r2_key || undefined,
    }));
  }

  private getPlaybackState(): RoomPlaybackState {
    const status = (this.getMeta("status", "idle") as "idle" | "playing" | "paused") || "idle";
    const currentTrackId = this.getMeta("currentTrackId", "") || null;
    const positionMs = Number(this.getMeta("positionMs", "0"));
    const serverEpochStartTime = Number(this.getMeta("serverEpochStartTime", "0"));
    const updatedAt = Number(this.getMeta("updatedAt", String(Date.now())));

    // If currently playing, compute real-time elapsed position
    let computedPos = positionMs;
    if (status === "playing" && serverEpochStartTime > 0) {
      const queue = this.getQueue();
      const currentTrack = queue.find((t) => t.id === currentTrackId);
      const durationMs = currentTrack ? currentTrack.durationMs : 3600000;
      computedPos = calculateLateJoinerPosition(
        serverEpochStartTime,
        positionMs,
        Date.now(),
        durationMs
      );
    }

    return {
      status,
      currentTrackId,
      positionMs: computedPos,
      serverEpochStartTime,
      updatedAt,
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Invite token validation for private sessions
    const isPrivate = this.getMeta("isPrivate", "false") === "true";
    const expectedToken = this.getMeta("inviteToken", "");

    if (isPrivate && expectedToken) {
      const providedToken = url.searchParams.get("invite");
      if (providedToken !== expectedToken) {
        return new Response(
          JSON.stringify({
            error: "Private room: valid invite token required",
            code: PRIVATE_ROOM_CLOSE_CODE,
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      // In Cloudflare Worker runtime
      if (typeof (globalThis as any).WebSocketPair === "function") {
        const pair = new (globalThis as any).WebSocketPair();
        const client = pair[0];
        const server = pair[1];

        this.ctx.acceptWebSocket(server);

        // Send initial room state
        const stateMessage: ServerAction = {
          type: "ROOM_STATE",
          state: this.getPlaybackState(),
          queue: this.getQueue(),
          participantsCount: this.getConnectedSockets().length,
        };
        server.send(JSON.stringify(stateMessage));

        return new Response(null, { status: 101, webSocket: client } as any);
      }
    }

    return new Response(
      JSON.stringify({
        roomId: url.pathname.split("/")[3] || "unknown",
        state: this.getPlaybackState(),
        queue: this.getQueue(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  async webSocketMessage(ws: any, message: string | ArrayBuffer) {
    const rawString = typeof message === "string" ? message : new TextDecoder().decode(message);
    await this.handleSocketMessage(ws, rawString);
  }

  async webSocketClose(ws: any, code: number, reason: string, wasClean: boolean) {
    this.clientRtts.delete(ws);
    this.broadcastParticipantCount();
  }

  async webSocketError(ws: any, error: any) {
    this.clientRtts.delete(ws);
  }

  async handleSocketMessage(ws: any, rawData: string) {
    const t1 = Date.now();
    let data: any;
    try {
      data = JSON.parse(rawData);
    } catch {
      return;
    }

    const parsed = ClientActionSchema.safeParse(data);
    if (!parsed.success) {
      const err: ServerAction = {
        type: "ERROR",
        code: "INVALID_ACTION",
        message: "Invalid action payload structure",
      };
      ws.send(JSON.stringify(err));
      return;
    }

    const action = parsed.data;

    switch (action.type) {
      case "NTP_REQUEST": {
        const t2 = Date.now();
        if (action.clientRTT !== undefined) {
          this.clientRtts.set(ws, action.clientRTT);
        }
        const resp = createNtpResponse(action, t1, t2);
        ws.send(JSON.stringify(resp));
        break;
      }

      case "PLAY": {
        const queue = this.getQueue();
        const trackId = action.trackId || this.getMeta("currentTrackId") || (queue[0] ? queue[0].id : "");
        if (!trackId) return;

        const positionMs = action.positionMs ?? Number(this.getMeta("positionMs", "0"));
        const clientRttList = Array.from(this.clientRtts.values());
        const serverTimeToExecute = calculateBarrierExecutionTime(Date.now(), clientRttList);

        this.setMeta("status", "playing");
        this.setMeta("currentTrackId", trackId);
        this.setMeta("positionMs", String(positionMs));
        this.setMeta("serverEpochStartTime", String(serverTimeToExecute));
        this.setMeta("updatedAt", String(Date.now()));

        const broadcastMsg: ServerAction = {
          type: "SCHEDULED_PLAY",
          trackId,
          serverTimeToExecute,
          positionMs,
        };
        this.broadcast(broadcastMsg);
        break;
      }

      case "PAUSE": {
        const currentPos = action.positionMs ?? this.getPlaybackState().positionMs;
        const clientRttList = Array.from(this.clientRtts.values());
        const serverTimeToExecute = calculateBarrierExecutionTime(Date.now(), clientRttList);

        this.setMeta("status", "paused");
        this.setMeta("positionMs", String(currentPos));
        this.setMeta("serverEpochStartTime", "0");
        this.setMeta("updatedAt", String(Date.now()));

        const broadcastMsg: ServerAction = {
          type: "SCHEDULED_PAUSE",
          serverTimeToExecute,
          positionMs: currentPos,
        };
        this.broadcast(broadcastMsg);
        break;
      }

      case "SEEK": {
        const clientRttList = Array.from(this.clientRtts.values());
        const serverTimeToExecute = calculateBarrierExecutionTime(Date.now(), clientRttList);

        this.setMeta("positionMs", String(action.positionMs));
        if (this.getMeta("status") === "playing") {
          this.setMeta("serverEpochStartTime", String(serverTimeToExecute));
        }
        this.setMeta("updatedAt", String(Date.now()));

        const broadcastMsg: ServerAction = {
          type: "SCHEDULED_SEEK",
          serverTimeToExecute,
          positionMs: action.positionMs,
        };
        this.broadcast(broadcastMsg);
        break;
      }

      case "ADD_TRACK": {
        const queue = this.getQueue();
        let nextPos = queue.length;
        if (action.playNext && queue.length > 0) {
          const currentId = this.getMeta("currentTrackId");
          const currIdx = queue.findIndex((t) => t.id === currentId);
          nextPos = currIdx >= 0 ? currIdx + 1 : 0;
          // Shift existing items up
          for (let i = queue.length - 1; i >= nextPos; i--) {
            this.ctx.storage.sql.exec(
              "UPDATE tracks SET position = ? WHERE id = ?",
              i + 1,
              queue[i].id
            );
          }
        }

        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO tracks (id, title, artist, duration_ms, url, source, cover_url, r2_key, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          action.track.id,
          action.track.title,
          action.track.artist,
          action.track.durationMs,
          action.track.url,
          action.track.source,
          action.track.coverUrl || null,
          action.track.r2Key || null,
          nextPos
        );

        this.broadcast({
          type: "QUEUE_UPDATED",
          queue: this.getQueue(),
        });
        break;
      }

      case "REMOVE_TRACK": {
        this.ctx.storage.sql.exec("DELETE FROM tracks WHERE id = ?", action.trackId);
        // Reindex positions
        const remaining = this.getQueue();
        remaining.forEach((track, index) => {
          this.ctx.storage.sql.exec("UPDATE tracks SET position = ? WHERE id = ?", index, track.id);
        });

        this.broadcast({
          type: "QUEUE_UPDATED",
          queue: this.getQueue(),
        });
        break;
      }

      case "REORDER_QUEUE": {
        action.trackIds.forEach((id, index) => {
          this.ctx.storage.sql.exec("UPDATE tracks SET position = ? WHERE id = ?", index, id);
        });

        this.broadcast({
          type: "QUEUE_UPDATED",
          queue: this.getQueue(),
        });
        break;
      }

      case "CLEAR_QUEUE": {
        this.ctx.storage.sql.exec("DELETE FROM tracks");
        this.broadcast({
          type: "QUEUE_UPDATED",
          queue: [],
        });
        break;
      }

      case "REQUEST_SYNC": {
        const stateMsg: ServerAction = {
          type: "ROOM_STATE",
          state: this.getPlaybackState(),
          queue: this.getQueue(),
          participantsCount: this.getConnectedSockets().length,
        };
        ws.send(JSON.stringify(stateMsg));
        break;
      }
    }
  }

  private getConnectedSockets(): any[] {
    if (this.ctx?.getWebSockets) {
      return this.ctx.getWebSockets();
    }
    return [];
  }

  private broadcast(msg: ServerAction) {
    const payload = JSON.stringify(msg);
    for (const ws of this.getConnectedSockets()) {
      try {
        ws.send(payload);
      } catch {
        // Socket closed/stale
      }
    }
  }

  private broadcastParticipantCount() {
    const count = this.getConnectedSockets().length;
    const stateMsg: ServerAction = {
      type: "ROOM_STATE",
      state: this.getPlaybackState(),
      queue: this.getQueue(),
      participantsCount: count,
    };
    this.broadcast(stateMsg);
  }
}
