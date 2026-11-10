import { NextResponse, type NextRequest } from "next/server";
import { isRateLimited } from "./lib/rateLimit";

const COOKIE = "sl_auth";

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function sameHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Only same-site relative paths, so the form can't be used as an open redirect
export function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function loginPage(next: string, error = ""): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Soundlounge</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0a;color:#eee;font-family:system-ui,sans-serif}
form{display:grid;gap:12px;width:min(320px,calc(100vw - 32px))}h1{font-size:20px;margin:0 0 4px}
input,button{font:inherit;padding:12px;border-radius:10px;border:1px solid #333;background:#151515;color:inherit}
button{background:#eee;color:#000;border:0;cursor:pointer}p{margin:0;color:#f87171;font-size:14px}</style></head>
<body><form method="post" action="/login"><h1>Soundlounge</h1>
<label for="pw">Password</label><input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
<input type="hidden" name="next" value="${escapeAttr(next)}">${error ? `<p role="alert">${error}</p>` : ""}
<button type="submit">Enter</button></form></body></html>`;
  return new NextResponse(html, { status: 401, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  // shortcut: no password configured means no gate (local dev); set APP_PASSWORD in Vercel to enable
  if (!password) return NextResponse.next();

  const expected = await sha256Hex(`soundlounge:${password}`);
  const { pathname, search } = req.nextUrl;

  if (pathname === "/login" && req.method === "POST") {
    if (await isRateLimited(req, "login", 10)) return loginPage("/", "Too many attempts. Wait a minute.");
    const form = await req.formData().catch(() => null);
    const next = safeNext(form?.get("next"));
    const given = await sha256Hex(`soundlounge:${String(form?.get("password") ?? "")}`);
    if (!sameHex(given, expected)) return loginPage(next, "Wrong password.");

    const res = NextResponse.redirect(new URL(next, req.url), 303);
    res.cookies.set(COOKIE, expected, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  if (sameHex(req.cookies.get(COOKIE)?.value ?? "", expected)) return NextResponse.next();

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return loginPage(pathname === "/login" ? "/" : pathname + search);
}

export const config = {
  // Everything except Next internals and static files (anything with a file extension)
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
