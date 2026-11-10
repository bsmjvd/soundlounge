import { describe, it, expect, afterEach } from "bun:test";
import { NextRequest } from "next/server";
import { middleware, safeNext } from "../middleware";

const BASE = "https://app.example";

afterEach(() => {
  delete process.env.APP_PASSWORD;
});

function login(password: string, next = "/?room=abc") {
  const body = new URLSearchParams({ password, next });
  return new NextRequest(`${BASE}/login`, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

describe("password gate middleware", () => {
  it("lets everything through when APP_PASSWORD is unset", async () => {
    const res = await middleware(new NextRequest(`${BASE}/api/search?q=x`));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("shows the login form for pages and 401 JSON for APIs without the cookie", async () => {
    process.env.APP_PASSWORD = "hunter2";
    const page = await middleware(new NextRequest(`${BASE}/?room=abc`));
    expect(page.status).toBe(401);
    expect(await page.text()).toContain('value="/?room=abc"');

    const api = await middleware(new NextRequest(`${BASE}/api/stream/youtube?id=x`));
    expect(api.status).toBe(401);
    expect(await api.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects a wrong password and sets a cookie that unlocks requests on the right one", async () => {
    process.env.APP_PASSWORD = "hunter2";
    expect((await middleware(login("nope"))).status).toBe(401);

    const ok = await middleware(login("hunter2"));
    expect(ok.status).toBe(303);
    expect(ok.headers.get("location")).toBe(`${BASE}/?room=abc`);
    const cookie = ok.cookies.get("sl_auth")?.value ?? "";
    expect(cookie).not.toBe("");

    const authed = await middleware(new NextRequest(`${BASE}/api/search?q=x`, { headers: { cookie: `sl_auth=${cookie}` } }));
    expect(authed.headers.get("x-middleware-next")).toBe("1");
  });

  it("only redirects to same-site relative paths", () => {
    expect(safeNext("/?room=1")).toBe("/?room=1");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext(null)).toBe("/");
  });
});
