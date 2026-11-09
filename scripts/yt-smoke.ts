// Smoke-test YouTube playback over many catalog ids, not one.
// Usage: bun scripts/yt-smoke.ts [base-url] [max-ids]   (default https://soundlounge.vercel.app, 30)
// Run it off your home network (e.g. phone hotspot) so IP-locked URLs can't pass by accident.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv[2] || "https://soundlounge.vercel.app").replace(/\/+$/, "");
const max = Number(process.argv[3] || 30);

const dataDir = join(import.meta.dir, "../apps/client/src/lib/data");
const ids = [
  ...new Set(
    readdirSync(dataDir).filter((f) => f.endsWith(".ts")).flatMap((f) =>
      [...readFileSync(join(dataDir, f), "utf8").matchAll(/stream\/youtube\?id=([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/g)].map((m) => m[1])
    )
  ),
].slice(0, max);

async function check(id: string): Promise<string> {
  const t = performance.now();
  const res = await fetch(`${base}/api/stream/youtube?id=${id}`, { redirect: "manual" });
  const loc = res.headers.get("location");
  if (res.status !== 307 || !loc) return `FAIL ${id} route ${res.status} ${(await res.text()).slice(0, 120)}`;
  const head = await fetch(loc, { headers: { Range: "bytes=0-1" } });
  await head.body?.cancel();
  const total = Number(head.headers.get("content-range")?.split("/")[1]);
  if (head.status !== 206 || !(total > 1024)) return `FAIL ${id} first-range ${head.status} via ${new URL(loc).host}`;
  // A Range near the end catches streams that die after the first chunk
  const tail = await fetch(loc, { headers: { Range: `bytes=${total - 1024}-${total - 1}` } });
  const bytes = (await tail.arrayBuffer()).byteLength;
  if (tail.status !== 206 || bytes !== 1024) return `FAIL ${id} tail-range ${tail.status} ${bytes}B via ${new URL(loc).host}`;
  return `ok   ${id} ${Math.round(performance.now() - t)}ms via ${new URL(loc).host}`;
}

let failed = 0;
for (let i = 0; i < ids.length; i += 5) {
  const lines = await Promise.all(ids.slice(i, i + 5).map((id) => check(id).catch((e) => `FAIL ${id} ${e.message}`)));
  for (const line of lines) {
    if (line.startsWith("FAIL")) failed++;
    console.log(line);
  }
}
console.log(`\n${ids.length - failed}/${ids.length} passed against ${base}`);
process.exit(failed ? 1 : 0);
