import { z } from "zod";

export const TrackSourceSchema = z.enum(["youtube", "soundcloud", "upload"]);
export type TrackSource = z.infer<typeof TrackSourceSchema>;

export const TrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string().default("Unknown Artist"),
  durationMs: z.number().nonnegative(),
  url: z.string().url(),
  source: TrackSourceSchema,
  coverUrl: z.string().url().optional(),
  r2Key: z.string().optional(),
  uploader: z.string().optional(),
  createdAt: z.number().optional(),
});
export type Track = z.infer<typeof TrackSchema>;

export const RoomPlaybackStatusSchema = z.enum(["idle", "playing", "paused"]);
export type RoomPlaybackStatus = z.infer<typeof RoomPlaybackStatusSchema>;

export const RoomPlaybackStateSchema = z.object({
  status: RoomPlaybackStatusSchema,
  currentTrackId: z.string().nullable(),
  positionMs: z.number().nonnegative(),
  serverEpochStartTime: z.number().nonnegative(),
  updatedAt: z.number().optional(),
});
export type RoomPlaybackState = z.infer<typeof RoomPlaybackStateSchema>;

export const RoomMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  isPrivate: z.boolean(),
  inviteToken: z.string().optional(),
  createdAt: z.number(),
  ownerId: z.string(),
});
export type RoomMetadata = z.infer<typeof RoomMetadataSchema>;

export const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tracks: z.array(TrackSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Playlist = z.infer<typeof PlaylistSchema>;
