export const INVIDIOUS_INSTANCES = ["https://yt.chocolatemoo53.com"];

// Our worker's /api/yt proxy; unset disables it and the stream route uses Invidious/ytdl/Saavn
export const WORKER_HTTP_URL = process.env.NEXT_PUBLIC_WORKER_HTTP_URL?.trim().replace(/\/+$/, "") || "";

// Invidious hands out stream URLs on its `issuer` node, a sibling host, so allow the
// instance's registrable domain (last two labels; fine for the current .com instances).
const ALLOWED_STREAM_DOMAINS = [
  "googlevideo.com",
  "saavncdn.com",
  ...INVIDIOUS_INSTANCES.map((inst) => new URL(inst).hostname.split(".").slice(-2).join(".")),
];

/** True if the stream route may redirect to this URL (https on a trusted host only). */
export function isAllowedStreamUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  // The configured worker is trusted config, even on http://localhost in dev
  if (WORKER_HTTP_URL && parsed.origin === new URL(WORKER_HTTP_URL).origin) return true;
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return ALLOWED_STREAM_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}
