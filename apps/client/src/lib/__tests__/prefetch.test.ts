import { describe, it, expect, afterEach, mock } from "bun:test";
import { prefetchTrack } from "../prefetch";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function stubFetch(impl: () => Promise<Response> = () => Promise.resolve(new Response(null, { status: 204 }))) {
  const fn = mock(impl);
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("prefetchTrack", () => {
  it("warms a YouTube track once, with prefetch=1 added to its stream URL", () => {
    const fetchFn = stubFetch();
    const track = { url: "/api/stream/youtube?id=abcdefghijk&title=X" };
    prefetchTrack(track);
    prefetchTrack(track);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0]?.[0]).toBe("/api/stream/youtube?id=abcdefghijk&title=X&prefetch=1");
  });

  it("ignores missing tracks and non-YouTube sources", () => {
    const fetchFn = stubFetch();
    prefetchTrack(undefined);
    prefetchTrack({ url: "https://r2.example/rooms/a/song.mp3" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("allows a retry after a failed warm-up", async () => {
    const fetchFn = stubFetch(() => Promise.reject(new Error("offline")));
    const track = { url: "/api/stream/youtube?id=zyxwvutsrqp" };
    prefetchTrack(track);
    await Promise.resolve();
    await Promise.resolve();
    prefetchTrack(track);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
