// YouTube audio streamer for a phone on mobile data (Termux). googlevideo URLs are locked to the
// IP that resolved them, datacenter IPs are bot-walled, and direct URLs often 403 after the first
// MiB, so the phone downloads each track once with yt-dlp and serves it from disk with full Range
// support. Downloads go through a warm yt-dlp worker (extractor.py), with the yt-dlp CLI as the
// fallback when the worker can't run. Exposed through a Cloudflare quick tunnel.
//
//   SECRET=... node streamer.mjs
//   GET /health
//   GET /yt/:videoId?exp=&sig=        audio (Range supported)
//   GET /prefetch/:videoId?exp=&sig=  start downloading, return 204 immediately
// sig = hex HMAC-SHA256(SECRET, "<videoId>.<exp>"), exp = unix seconds.
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { execFile, spawn } from "node:child_process";

const SECRET = process.env.SECRET;
const PORT = Number(process.env.PORT || 8787);
const CACHE_DIR = process.env.CACHE_DIR || path.join(process.cwd(), "yt-cache");
const MAX_FILES = Number(process.env.MAX_FILES || 300); // ~1 GB at ~3.5 MB per song

const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const TYPES = { m4a: "audio/mp4", mp4: "audio/mp4", webm: "audio/webm", opus: "audio/ogg" };
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Range",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
};
const downloads = new Map(); // videoId -> Promise<file path>
const MAX_PREFETCHES = 2; // background downloads at once, so a play never waits behind them
let prefetching = 0;
let extractor = null; // { proc, pending: Map<videoId, { resolve, reject }> }

export function sign(secret, id, exp) {
  return crypto.createHmac("sha256", secret).update(`${id}.${exp}`).digest("hex");
}

function validSig(id, exp, sig) {
  if (!/^\d+$/.test(exp ?? "") || Number(exp) < Date.now() / 1000 || !/^[0-9a-f]{64}$/.test(sig ?? "")) return false;
  return crypto.timingSafeEqual(Buffer.from(sign(SECRET, id, exp), "hex"), Buffer.from(sig, "hex"));
}

function cachedFile(id) {
  // "<id>.temp.m4a" is yt-dlp's ffmpeg remux in progress, not a finished track
  const name = fs
    .readdirSync(CACHE_DIR)
    .find((f) => f.startsWith(`${id}.`) && !f.includes(".temp.") && TYPES[path.extname(f).slice(1)]);
  return name ? path.join(CACHE_DIR, name) : null;
}

function evict() {
  const files = fs
    .readdirSync(CACHE_DIR)
    .map((f) => ({ f, t: fs.statSync(path.join(CACHE_DIR, f)).atimeMs }))
    .sort((a, b) => a.t - b.t);
  for (const { f } of files.slice(0, Math.max(0, files.length - MAX_FILES))) fs.rmSync(path.join(CACHE_DIR, f), { force: true });
}

class ExtractorDown extends Error {}

function startExtractor() {
  const proc = spawn("python", [path.join(import.meta.dirname, "extractor.py"), CACHE_DIR], {
    stdio: ["pipe", "pipe", "inherit"],
  });
  const ex = { proc, pending: new Map() };
  const fail = (why) => {
    if (extractor === ex) extractor = null;
    for (const p of ex.pending.values()) p.reject(new ExtractorDown(why));
    ex.pending.clear();
  };
  readline.createInterface({ input: proc.stdout }).on("line", (line) => {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    const p = ex.pending.get(msg.id);
    if (!p) return;
    ex.pending.delete(msg.id);
    if (msg.ok) p.resolve();
    else p.reject(new Error(msg.error || "download failed"));
  });
  proc.stdin.on("error", () => {}); // EPIPE after a crash; "exit" below rejects the pending jobs
  proc.on("error", (err) => fail(`extractor failed to start: ${err.message}`));
  proc.on("exit", (code) => {
    console.error(`extractor exited (${code})`);
    fail("extractor exited");
  });
  return (extractor = ex);
}

function viaExtractor(id) {
  const ex = extractor ?? startExtractor();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ex.pending.delete(id);
      reject(new Error("extractor timed out"));
    }, 120_000);
    ex.pending.set(id, {
      resolve: () => (clearTimeout(timer), resolve()),
      reject: (err) => (clearTimeout(timer), reject(err)),
    });
    ex.proc.stdin.write(JSON.stringify({ id }) + "\n");
  });
}

// One download per track, shared by every request that arrives while it downloads
function download(id) {
  // In-flight first: a track being written must not be served half-finished
  if (downloads.has(id)) return downloads.get(id);
  const existing = cachedFile(id);
  if (existing) return Promise.resolve(existing);
  const job = viaExtractor(id)
    .catch((err) => {
      if (!(err instanceof ExtractorDown)) throw err;
      console.error(`[extractor] ${id}: ${err.message}; using the yt-dlp CLI`);
      return viaCli(id);
    })
    .then(() => {
      const file = cachedFile(id);
      if (!file) throw new Error("download finished but no file");
      evict();
      return file;
    })
    .finally(() => downloads.delete(id));
  downloads.set(id, job);
  return job;
}

function viaCli(id) {
  return new Promise((resolve, reject) => {
    execFile(
      "yt-dlp",
      [
        "-f", "bestaudio[ext=m4a]/bestaudio",
        "-o", path.join(CACHE_DIR, "%(id)s.%(ext)s"),
        "--no-playlist", "--no-warnings", "--no-progress", "--no-part",
        // Home wifi IPv4 connects stall 7-13 s at random; IPv6 is a steady ~50 ms
        "--force-ipv6",
        // YouTube's JS challenge needs a runtime; Deno has no Android build, Node does (Termux)
        "--no-js-runtimes", "--js-runtimes", "node",
        `https://www.youtube.com/watch?v=${id}`,
      ],
      { timeout: 120_000 },
      (err, _stdout, stderr) => {
        if (err) return reject(new Error((stderr || err.message || "download failed").trim().slice(0, 300)));
        resolve();
      }
    );
  });
}

function serveFile(file, req, res) {
  const size = fs.statSync(file).size;
  const headers = { ...CORS, "Accept-Ranges": "bytes", "Content-Type": TYPES[path.extname(file).slice(1)], "Cache-Control": "private, max-age=86400" };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
  let start = 0;
  let end = size - 1;
  if (m && (m[1] || m[2])) {
    start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start > end || start >= size) return send(res, 416, "Range not satisfiable", { "Content-Range": `bytes */${size}` });
    headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  }
  headers["Content-Length"] = String(end - start + 1);
  res.writeHead(m && (m[1] || m[2]) ? 206 : 200, headers);
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file, { start, end }).pipe(res);
}

function send(res, status, body, extra = {}) {
  res.writeHead(status, { ...CORS, "Content-Type": "text/plain", ...extra });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://phone");
  try {
    if (req.method === "OPTIONS") return send(res, 204, "");
    if (url.pathname === "/health") return send(res, 200, "ok");
    const m = /^\/(yt|prefetch)\/([^/]+)$/.exec(url.pathname);
    if (!m || !ID_RE.test(m[2]) || (req.method !== "GET" && req.method !== "HEAD")) return send(res, 404, "not found");
    if (!validSig(m[2], url.searchParams.get("exp"), url.searchParams.get("sig"))) return send(res, 403, "bad signature");
    if (m[1] === "prefetch") {
      if (!downloads.has(m[2]) && !cachedFile(m[2]) && prefetching < MAX_PREFETCHES) {
        prefetching++;
        download(m[2])
          .catch((err) => console.error(`[prefetch] ${m[2]}: ${err.message}`))
          .finally(() => prefetching--);
      }
      return send(res, 204, "");
    }
    serveFile(await download(m[2]), req, res);
  } catch (err) {
    console.error(`[yt] ${url.pathname}: ${err.message}`);
    if (!res.headersSent) send(res, 502, err.message);
    else res.destroy();
  }
});

if (process.argv[1]?.endsWith("streamer.mjs")) {
  if (!SECRET || SECRET.length < 16) throw new Error("Set SECRET (16+ chars)");
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  server.listen(PORT, () => console.log(`streamer on :${PORT}, cache ${CACHE_DIR}`));
  startExtractor(); // warm up now, not on the first play

}
