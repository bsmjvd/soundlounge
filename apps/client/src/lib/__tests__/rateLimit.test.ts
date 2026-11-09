import { describe, it, expect, afterEach, mock } from "bun:test";
import { isRateLimited } from "../rateLimit";

const realFetch = globalThis.fetch;
const req = () => new Request("https://app.example/api/search?q=x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });

function stubFetch(impl: (input: unknown, init?: RequestInit) => Promise<Response>) {
  const fn = mock(impl);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

function setEnv() {
  process.env.KV_REST_API_URL = "https://kv.example";
  process.env.KV_REST_API_TOKEN = "tok";
}

describe("isRateLimited", () => {
  it("skips limiting without fetching when KV env is absent", async () => {
    const fn = stubFetch(async () => new Response("[]"));
    expect(await isRateLimited(req(), "search", 30)).toBe(false);
    expect(fn).not.toHaveBeenCalled();
  });

  it("limits once the window count exceeds the limit", async () => {
    setEnv();
    const fn = stubFetch(async () => Response.json([{ result: 31 }, { result: 1 }]));
    expect(await isRateLimited(req(), "search", 30)).toBe(true);
    const [url, init] = fn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://kv.example/pipeline");
    const [[cmd, key]] = JSON.parse(String(init.body));
    expect(cmd).toBe("INCR");
    expect(key).toMatch(/^rl:search:1\.2\.3\.4:\d+$/);
  });

  it("allows while at or under the limit", async () => {
    setEnv();
    stubFetch(async () => Response.json([{ result: 30 }, { result: 1 }]));
    expect(await isRateLimited(req(), "search", 30)).toBe(false);
  });

  it("fails open when the Redis call throws", async () => {
    setEnv();
    stubFetch(async () => {
      throw new Error("network down");
    });
    expect(await isRateLimited(req(), "search", 30)).toBe(false);
  });
});
