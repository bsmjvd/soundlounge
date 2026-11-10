#!/data/data/com.termux/files/usr/bin/sh
# Runs the streamer plus a Cloudflare quick tunnel, and registers the tunnel's (random, per-run)
# URL with the soundlounge worker so the app can find it. Both restart if they die.
# Usage: sh start.sh   (reads SECRET from ~/.yt-secret, created on first run)
cd "$(dirname "$0")"
[ -f ~/.yt-secret ] || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' > ~/.yt-secret
export SECRET="$(cat ~/.yt-secret)"
WORKER="${WORKER:-https://soundlounge-worker.bsmjvd.workers.dev}"
termux-wake-lock

(while true; do node streamer.mjs; echo "streamer exited, restarting"; sleep 2; done) &

while true; do
  cloudflared tunnel --url http://localhost:8787 > tunnel.log 2>&1 &
  CF=$!
  URL=""
  for i in $(seq 60); do
    # cloudflared also logs its own API host (api.trycloudflare.com) when a request fails
    URL=$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' tunnel.log | grep -v '//api\.' | head -1)
    [ -n "$URL" ] && break
    # cloudflared exits at once when DNS isn't up yet (e.g. right after boot): retry sooner
    kill -0 $CF 2>/dev/null || break
    sleep 1
  done
  # DNS on this network is flaky, so keep retrying the registration
  for i in $(seq 30); do
    [ -z "$URL" ] && break
    curl -fsS --max-time 10 -X POST "$WORKER/api/phone" \
      -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
      -d "{\"url\":\"$URL\"}" > /dev/null && echo "registered $URL" && break
    sleep 5
  done
  wait $CF
  echo "tunnel exited, restarting"
  sleep 5
done
