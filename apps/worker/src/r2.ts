import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { R2_AUDIO_FILE_NAME_DELIMITER } from "@soundlounge/shared";

export function sanitizeR2Key(roomId: string, rawFileName: string, timestamp: number): string {
  const lastDotIdx = rawFileName.lastIndexOf(".");
  let baseName = rawFileName;
  let ext = "";
  if (lastDotIdx !== -1) {
    baseName = rawFileName.slice(0, lastDotIdx);
    ext = rawFileName.slice(lastDotIdx);
  }

  // Replace spaces and special characters with underscores
  const cleanBase = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `rooms/${roomId}/${cleanBase}${R2_AUDIO_FILE_NAME_DELIMITER}${timestamp}${ext}`;
}

export function formatAudioPublicUrl(cdnBaseUrl: string, key: string): string {
  const base = cdnBaseUrl.replace(/\/+$/, "");
  const cleanKey = key.replace(/^\/+/, "");
  return `${base}/${cleanKey}`;
}

export interface PresignedUrlParams {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

export async function createPresignedR2PutUrl(params: PresignedUrlParams): Promise<string> {
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${params.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: params.accessKeyId,
      secretAccessKey: params.secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: params.bucketName,
    Key: params.key,
    ContentType: params.contentType,
  });

  return getSignedUrl(s3, command, {
    expiresIn: params.expiresInSeconds ?? 900, // 15 min expiry
  });
}
