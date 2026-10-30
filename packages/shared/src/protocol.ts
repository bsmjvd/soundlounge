import { z } from "zod";
import { TrackSchema, RoomPlaybackStateSchema } from "./models";

export const NtpRequestSchema = z.object({
  type: z.literal("NTP_REQUEST"),
  t0: z.number(),
  probeGroupId: z.number(),
  probeGroupIndex: z.number(),
  clientRTT: z.number().optional(),
});

export const PlayActionSchema = z.object({
  type: z.literal("PLAY"),
  trackId: z.string().optional(),
  positionMs: z.number().optional(),
});

export const PauseActionSchema = z.object({
  type: z.literal("PAUSE"),
  positionMs: z.number().optional(),
});

export const SeekActionSchema = z.object({
  type: z.literal("SEEK"),
  positionMs: z.number(),
});

export const AddTrackActionSchema = z.object({
  type: z.literal("ADD_TRACK"),
  track: TrackSchema,
  playNext: z.boolean().optional(),
});

export const RemoveTrackActionSchema = z.object({
  type: z.literal("REMOVE_TRACK"),
  trackId: z.string(),
});

export const ReorderQueueActionSchema = z.object({
  type: z.literal("REORDER_QUEUE"),
  trackIds: z.array(z.string()),
});

export const ClearQueueActionSchema = z.object({
  type: z.literal("CLEAR_QUEUE"),
});

export const RequestSyncActionSchema = z.object({
  type: z.literal("REQUEST_SYNC"),
});

export const ClientActionSchema = z.discriminatedUnion("type", [
  NtpRequestSchema,
  PlayActionSchema,
  PauseActionSchema,
  SeekActionSchema,
  AddTrackActionSchema,
  RemoveTrackActionSchema,
  ReorderQueueActionSchema,
  ClearQueueActionSchema,
  RequestSyncActionSchema,
]);
export type ClientAction = z.infer<typeof ClientActionSchema>;

export const NtpResponseSchema = z.object({
  type: z.literal("NTP_RESPONSE"),
  t0: z.number(),
  t1: z.number(),
  t2: z.number(),
  probeGroupId: z.number(),
  probeGroupIndex: z.number(),
});

export const ScheduledPlaySchema = z.object({
  type: z.literal("SCHEDULED_PLAY"),
  trackId: z.string(),
  serverTimeToExecute: z.number(),
  positionMs: z.number(),
});

export const ScheduledPauseSchema = z.object({
  type: z.literal("SCHEDULED_PAUSE"),
  serverTimeToExecute: z.number(),
  positionMs: z.number(),
});

export const ScheduledSeekSchema = z.object({
  type: z.literal("SCHEDULED_SEEK"),
  serverTimeToExecute: z.number(),
  positionMs: z.number(),
});

export const RoomStateBroadcastSchema = z.object({
  type: z.literal("ROOM_STATE"),
  state: RoomPlaybackStateSchema,
  queue: z.array(TrackSchema),
  participantsCount: z.number(),
});

export const QueueUpdatedBroadcastSchema = z.object({
  type: z.literal("QUEUE_UPDATED"),
  queue: z.array(TrackSchema),
});

export const RoomInviteBroadcastSchema = z.object({
  type: z.literal("ROOM_INVITE"),
  roomId: z.string(),
  token: z.string(),
});

export const ErrorBroadcastSchema = z.object({
  type: z.literal("ERROR"),
  code: z.string(),
  message: z.string(),
});

export const ServerActionSchema = z.discriminatedUnion("type", [
  NtpResponseSchema,
  ScheduledPlaySchema,
  ScheduledPauseSchema,
  ScheduledSeekSchema,
  RoomStateBroadcastSchema,
  QueueUpdatedBroadcastSchema,
  RoomInviteBroadcastSchema,
  ErrorBroadcastSchema,
]);
export type ServerAction = z.infer<typeof ServerActionSchema>;
