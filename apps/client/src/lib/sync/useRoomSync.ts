"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PRIVATE_ROOM_CLOSE_CODE, ServerActionSchema, type ClientAction, type Track } from "@soundlounge/shared";
import { NtpSyncEngine, type BestNtpOffsetResult } from "./ntpClient";
import { AudioEngineCoordinator } from "../player";
import { useQueueStore } from "../store/useQueueStore";

export interface UseRoomSyncOptions {
  roomId: string;
  inviteToken?: string;
  coordinator: AudioEngineCoordinator;
  serverWsUrl?: string;
}

export function indexOfTrackOrZero(queue: Track[], trackId: string | null | undefined): number {
  const index = trackId ? queue.findIndex((t) => t.id === trackId) : -1;
  return index === -1 ? 0 : index;
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

    let disposed = false;
    let probeInterval: ReturnType<typeof setInterval> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryMs = 1000;
    // Room playback is only applied once the clock offset is known; until then barriers would be off by the offset
    let isCalibrated = false;

    const ntpEngine = new NtpSyncEngine(sendAction, (res: BestNtpOffsetResult) => {
      coordinator.getSyncedPlayer().setNtpOffset(res.bestOffsetMs, res.bestRTT);
      setPingMs(res.bestRTT);
      if (!isCalibrated) {
        isCalibrated = true;
        sendAction({ type: "REQUEST_SYNC" });
      }
    });
    ntpEngineRef.current = ntpEngine;

    const connect = () => {
      let socket: WebSocket;
      try {
        socket = new WebSocket(wsEndpoint);
        socketRef.current = socket;
      } catch {
        return;
      }
      isCalibrated = false;

      socket.onopen = () => {
        retryMs = 1000;
        setIsConnected(true);
        setIsAccessDenied(false);
        // Immediately start NTP probe sequence upon connect
        ntpEngine.startProbeSequence();
        // Periodically refresh NTP calibration every 30 seconds
        probeInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            ntpEngine.startProbeSequence();
          }
        }, 30000);
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
                useQueueStore
                  .getState()
                  .setQueue(action.queue, indexOfTrackOrZero(action.queue, action.state.currentTrackId));

                const syncedPlayer = coordinator.getSyncedPlayer();
                if (!isCalibrated) break;
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
                const store = useQueueStore.getState();
                store.setQueue(action.queue, indexOfTrackOrZero(action.queue, store.getCurrentTrack()?.id));
              }
              break;

            case "PARTICIPANTS_UPDATED":
              setParticipantsCount(action.participantsCount);
              break;

            case "SCHEDULED_PLAY": {
              if (coordinator.getMode() !== "synced") break;
              const store = useQueueStore.getState();
              const index = store.queue.findIndex((t) => t.id === action.trackId);
              if (index !== -1) {
                // Keep next/prev in step on clients that didn't initiate the play
                store.setCurrentIndex(index);
                coordinator
                  .getSyncedPlayer()
                  .schedulePlay(store.queue[index], action.serverTimeToExecute, action.positionMs);
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
        clearInterval(probeInterval);
        if (event.code === PRIVATE_ROOM_CLOSE_CODE) {
          setIsAccessDenied(true);
          return;
        }
        if (!disposed) {
          retryTimer = setTimeout(connect, retryMs);
          retryMs = Math.min(retryMs * 2, 30000);
        }
      };

      socket.onerror = () => {
        setIsConnected(false);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      clearInterval(probeInterval);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [roomId, inviteToken, coordinator, serverWsUrl, sendAction]);

  const sendPlay = useCallback(
    (trackId?: string, positionMs?: number) => {
      sendAction({ type: "PLAY", trackId, positionMs });
    },
    [sendAction],
  );

  const sendPause = useCallback(
    (positionMs?: number) => {
      sendAction({ type: "PAUSE", positionMs });
    },
    [sendAction],
  );

  const sendSeek = useCallback(
    (positionMs: number) => {
      sendAction({ type: "SEEK", positionMs });
    },
    [sendAction],
  );

  const sendAddTrack = useCallback(
    (track: Track, playNext?: boolean) => {
      // Object URLs only resolve in this tab; the track stays in the local queue only
      if (track.url.startsWith("blob:")) return;
      sendAction({ type: "ADD_TRACK", track, playNext });
    },
    [sendAction],
  );

  const sendRemoveTrack = useCallback(
    (trackId: string) => {
      sendAction({ type: "REMOVE_TRACK", trackId });
    },
    [sendAction],
  );

  const sendReorderQueue = useCallback(
    (trackIds: string[]) => {
      sendAction({ type: "REORDER_QUEUE", trackIds });
    },
    [sendAction],
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
