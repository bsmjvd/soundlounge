# Long-lived yt-dlp worker for streamer.mjs: one JSON request per stdin line ({"id": "..."}), one JSON
# reply per stdout line ({"id": "...", "ok": true} or {"id": "...", "error": "..."}). Staying warm saves
# the Python start-up and keeps connections open; the visionos client needs no JS challenge and no
# forced pre-download wait, so a new track takes ~2-3 s instead of ~10-20 s with a fresh CLI run.
#
#   python extractor.py <cache dir>
import ipaddress
import json
import os
import socket
import sys
import threading
import time
import urllib.parse
import urllib.request
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait

# The phone's resolver randomly fails a lookup after ~6 s ("[Errno 7] No address associated with
# hostname"), often on the per-video googlevideo host. Race it against DNS-over-HTTPS (Cloudflare, by
# IP, so no lookup needed) after 1 s, take the first answer and keep it for 10 minutes.
_real_getaddrinfo = socket.getaddrinfo
_dns_cache = {}  # (host, port, family) -> (expires, result)
_dns_pool = ThreadPoolExecutor(max_workers=8)


def _doh(host, port, family):
    want_v4 = family == socket.AF_INET
    url = "https://[2606:4700:4700::1111]/dns-query?" + urllib.parse.urlencode({"name": host, "type": "A" if want_v4 else "AAAA"})
    req = urllib.request.Request(url, headers={"accept": "application/dns-json"})
    with urllib.request.urlopen(req, timeout=4) as r:
        answers = json.load(r).get("Answer", [])
    ips = [a["data"] for a in answers if a.get("type") == (1 if want_v4 else 28)]
    if not ips:
        raise socket.gaierror(f"DoH: no address for {host}")
    if want_v4:
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, port)) for ip in ips]
    return [(socket.AF_INET6, socket.SOCK_STREAM, 6, "", (ip, port, 0, 0)) for ip in ips]


def _is_hostname(host):
    if not isinstance(host, str) or host == "localhost":
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        return True


def _getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if not _is_hostname(host) or type not in (0, socket.SOCK_STREAM):
        return _real_getaddrinfo(host, port, family, type, proto, flags)
    key = (host, port, family)
    hit = _dns_cache.get(key)
    if hit and hit[0] > time.time():
        return hit[1]
    pending = {_dns_pool.submit(_real_getaddrinfo, host, port, family, type, proto, flags)}
    doh_started = False
    error = None
    while pending:
        done, pending = wait(pending, timeout=None if doh_started else 1.0, return_when=FIRST_COMPLETED)
        for f in done:
            if f.exception() is None:
                _dns_cache[key] = (time.time() + 600, f.result())
                return f.result()
            error = f.exception()
        if not doh_started:  # the phone's lookup is slow (1 s) or already failed
            pending.add(_dns_pool.submit(_doh, host, port, family))
            doh_started = True
    if hit:  # both failed: an old answer beats none
        return hit[1]
    raise error


def main(cache_dir):
    import yt_dlp

    socket.getaddrinfo = _getaddrinfo
    base = [
        "-f", "bestaudio[ext=m4a]/bestaudio",
        "-o", os.path.join(cache_dir, "%(id)s.%(ext)s"),
        # Keep ".part" files so a track only gets its final name once it's complete
        "--no-playlist", "--no-warnings", "--no-progress", "--quiet",
        # Home wifi IPv4 connects stall 7-13 s at random; IPv6 is a steady ~50 ms
        "--force-ipv6",
    ]
    attempts = [
        base + ["--extractor-args", "youtube:player_client=visionos;skip=hls"],
        # yt-dlp's default clients: slower (JS challenge + forced wait) but broader. Deno has no Android build, Node does.
        base + ["--no-js-runtimes", "--js-runtimes", "node"],
    ]
    opts = [yt_dlp.parse_options(args).ydl_opts for args in attempts]

    out = sys.stdout
    sys.stdout = sys.stderr  # anything yt-dlp prints must not corrupt the reply stream
    out_lock = threading.Lock()
    local = threading.local()

    def reply(msg):
        with out_lock:
            out.write(json.dumps(msg) + "\n")
            out.flush()

    def ydl(i):
        # One YoutubeDL per thread and attempt, reused so its HTTP connections stay warm
        if not hasattr(local, "ydls"):
            local.ydls = [yt_dlp.YoutubeDL(o) for o in opts]
        return local.ydls[i]

    def download(video_id):
        errors = []
        for i in range(len(opts)):
            try:
                if ydl(i).download([f"https://www.youtube.com/watch?v={video_id}"]) == 0:
                    return reply({"id": video_id, "ok": True})
            except Exception as e:  # noqa: BLE001 - report and try the next client
                errors.append(str(e).strip()[:200])
        reply({"id": video_id, "error": " | ".join(errors) or "download failed"})

    pool = ThreadPoolExecutor(max_workers=4)
    reply({"ready": True})
    for line in sys.stdin:
        try:
            video_id = json.loads(line)["id"]
        except (ValueError, KeyError, TypeError):
            continue
        pool.submit(download, video_id)


if __name__ == "__main__":
    main(sys.argv[1])
