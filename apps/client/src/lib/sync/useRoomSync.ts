"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  PRIVATE_ROOM_CLOSE_CODE,
  ServerActionSchema,
  type ClientAction,
  type Track,
} from "@soundlounge/shared";
import { NtpSyncEngine, type BestNtpOffsetResult } from "./ntpClient";
import { AudioEngineCoordinator } from "../player";
import { useQueueStore } from "../store/useQueueStore";

interface ExtendedWebSocket extends WebSocket {
  _probeInterval?: ReturnType<typeof setInterval>;
}

export interface UseRoomSyncOptions {
  roomId: string;
  inviteToken?: string;
  coordinator: AudioEngineCoordinator;
  serverWsUrl?: string;
}

export function useRoomSync({
  roomId,
  inviteToken,
  coordinator,
  serverWsUrl = process.env.NEXT_PUBLIC_WORKER_WS_URL || "ws://localhost:8787",
}: UseRoomSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(1);
  const [pingMs, setPingMs] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const ntpEngineRef = useRef<NtpSyncEngine | null>(null);

  const sendAction = useCallback((action: ClientAction) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(action));
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const tokenParam = inviteToken ? `?invite=${encodeURIComponent(inviteToken)}` : "";
    const wsEndpoint = `${serverWsUrl.replace(/^http/, "ws")}/api/rooms/${roomId}/websocket${tokenParam}`;

    let socket: WebSocket;
    try {
      socket = new WebSocket(wsEndpoint);
      socketRef.current = socket;
    } catch {
      return;
    }

    const ntpEngine = new NtpSyncEngine(
      (action) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(action));
        }
      },
      (res: BestNtpOffsetResult) => {
        coordinator.getSyncedPlayer().setNtpOffset(res.bestOffsetMs, res.bestRTT);
        setPingMs(res.bestRTT);
      }
    );
    ntpEngineRef.current = ntpEngine;

    socket.onopen = () => {
      setIsConnected(true);
      setIsAccessDenied(false);
      // Immediately start NTP probe sequence upon connect
      ntpEngine.startProbeSequence();
      // Periodically refresh NTP calibration every 30 seconds
      const probeInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          ntpEngine.startProbeSequence();
        }
      }, 30000);
      (socket as ExtendedWebSocket)._probeInterval = probeInterval;
    };

    socket.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const parsed = ServerActionSchema.safeParse(raw);
        if (!parsed.success) return;

        const action = parsed.data;
        switch (action.type) {
          case "NTP_RESPONSE":
            ntpEngine.handleNtpResponse(action);
            break;

          case "ROOM_STATE": {
            setParticipantsCount(action.participantsCount);
            if (coordinator.getMode() === "synced") {
              useQueueStore.getState().setQueue(action.queue);

              const syncedPlayer = coordinator.getSyncedPlayer();
              if (action.state.status === "playing" && action.state.currentTrackId) {
                const current = action.queue.find((t) => t.id === action.state.currentTrackId);
                if (current) {
                  syncedPlayer.schedulePlay(current, action.state.serverEpochStartTime, action.state.positionMs);
                }
              } else if (action.state.status === "paused") {
                syncedPlayer.schedulePause(Date.now(), action.state.positionMs);
              }
            }
            break;
          }

          case "QUEUE_UPDATED":
            if (coordinator.getMode() === "synced") {
              useQueueStore.getState().setQueue(action.queue);
            }
            break;

          case "SCHEDULED_PLAY": {
            if (coordinator.getMode() !== "synced") break;
            const queue = useQueueStore.getState().queue;
            const track = queue.find((t) => t.id === action.trackId);
            if (track) {
              coordinator.getSyncedPlayer().schedulePlay(track, action.serverTimeToExecute, action.positionMs);
            }
            break;
          }

          case "SCHEDULED_PAUSE":
            if (coordinator.getMode() === "synced") {
              coordinator.getSyncedPlayer().schedulePause(action.serverTimeToExecute, action.positionMs);
            }
            break;

          case "SCHEDULED_SEEK":
            if (coordinator.getMode() === "synced") {
              coordinator.getSyncedPlayer().scheduleSeek(action.serverTimeToExecute, action.positionMs);
            }
            break;

          case "ERROR":
            if (action.code === String(PRIVATE_ROOM_CLOSE_CODE)) {
              setIsAccessDenied(true);
            }
            break;
        }
      } catch {}
    };

    socket.onclose = (event) => {
      setIsConnected(false);
      const extSocket = socket as ExtendedWebSocket;
      if (extSocket._probeInterval) {
        clearInterval(extSocket._probeInterval);
      }
      if (event.code === PRIVATE_ROOM_CLOSE_CODE) {
        setIsAccessDenied(true);
      }
    };

    socket.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      const extSocket = socketRef.current as ExtendedWebSocket | null;
      if (extSocket?._probeInterval) {
        clearInterval(extSocket._probeInterval);
      }
      socket.close();
      socketRef.current = null;
    };
  }, [roomId, inviteToken, coordinator, serverWsUrl]);

  const sendPlay = useCallback(
    (trackId?: string, positionMs?: number) => {
      sendAction({ type: "PLAY", trackId, positionMs });
    },
    [sendAction]
  );

  const sendPause = useCallback(
    (positionMs?: number) => {
      sendAction({ type: "PAUSE", positionMs });
    },
    [sendAction]
  );

  const sendSeek = useCallback(
    (positionMs: number) => {
      sendAction({ type: "SEEK", positionMs });
    },
    [sendAction]
  );

  const sendAddTrack = useCallback(
    (track: Track, playNext?: boolean) => {
      sendAction({ type: "ADD_TRACK", track, playNext });
    },
    [sendAction]
  );

  const sendRemoveTrack = useCallback(
    (trackId: string) => {
      sendAction({ type: "REMOVE_TRACK", trackId });
    },
    [sendAction]
  );

  const sendReorderQueue = useCallback(
    (trackIds: string[]) => {
      sendAction({ type: "REORDER_QUEUE", trackIds });
    },
    [sendAction]
  );

  const sendClearQueue = useCallback(() => {
    sendAction({ type: "CLEAR_QUEUE" });
  }, [sendAction]);

  return {
    isConnected,
    isAccessDenied,
    participantsCount,
    pingMs,
    sendPlay,
    sendPause,
    sendSeek,
    sendAddTrack,
    sendRemoveTrack,
    sendReorderQueue,
    sendClearQueue,
  };
}
