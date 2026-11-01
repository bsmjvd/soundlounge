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

export const AlbumTypeSchema = z.enum([
  "movie_soundtrack",
  "studio_album",
  "single_ep",
  "compilation",
]);
export type AlbumType = z.infer<typeof AlbumTypeSchema>;

export const MovieDetailsSchema = z.object({
  movieTitle: z.string(),
  releaseYear: z.number().int(),
  starCast: z.array(z.string()).default([]),
  musicDirectors: z.array(z.string()).default([]),
  lyricists: z.array(z.string()).optional(),
  director: z.string().optional(),
});
export type MovieDetails = z.infer<typeof MovieDetailsSchema>;

export const AlbumSchema = z.object({
  id: z.string(),
  title: z.string(),
  releaseYear: z.number().int(),
  type: AlbumTypeSchema,
  movieDetails: MovieDetailsSchema.optional(),
  primaryArtist: z.string(),
  featuredSingers: z.array(z.string()).default([]),
  coverUrl: z.string().url().optional(),
  disambiguationLabel: z.string(),
  genres: z.array(z.string()).default([]),
  tracks: z.array(TrackSchema).default([]),
  totalDurationMs: z.number().nonnegative().optional(),
  createdAt: z.number().optional(),
});
export type Album = z.infer<typeof AlbumSchema>;

export const ArtistRoleSchema = z.enum([
  "singer",
  "music_director",
  "band",
  "producer",
  "composer",
]);
export type ArtistRole = z.infer<typeof ArtistRoleSchema>;

export const ArtistDiscographyItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int(),
  coverUrl: z.string().url().optional(),
  type: AlbumTypeSchema.default("studio_album"),
  disambiguationLabel: z.string().optional(),
});
export type ArtistDiscographyItem = z.infer<typeof ArtistDiscographyItemSchema>;

export const ArtistProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  realName: z.string().optional(),
  avatarUrl: z.string().url(),
  bannerUrl: z.string().url().optional(),
  roles: z.array(ArtistRoleSchema).default(["singer"]),
  genres: z.array(z.string()).default([]),
  region: z.string().default("global"),
  regionLabel: z.string().optional(),
  bio: z.string().default(""),
  monthlyListeners: z.string().optional(),
  topTracks: z.array(TrackSchema).default([]),
  albums: z.array(ArtistDiscographyItemSchema).default([]),
});
export type ArtistProfile = z.infer<typeof ArtistProfileSchema>;

/**
 * Creates deterministic disambiguation keys when titles collide (e.g. "The Train" 2007 vs 1970 vs American Band).
 */
export function createDisambiguationKey(
  title: string,
  year?: number,
  secondaryIdentifier?: string
): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const yearPart = year ? `_${year}` : "";
  const secPart = secondaryIdentifier
    ? `_${secondaryIdentifier
        .toLowerCase()
        .replace(/[^\w]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 20)}`
    : "";
  return `${cleanTitle}${yearPart}${secPart}`;
}
