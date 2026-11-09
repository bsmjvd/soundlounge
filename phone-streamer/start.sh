#!/data/data/com.termux/files/usr/bin/sh
# Runs the streamer plus a Cloudflare quick tunnel; the tunnel prints the public https URL.
# Usage: sh start.sh   (reads SECRET from ~/.yt-secret, created on first run)
cd "$(dirname "$0")"
[ -f ~/.yt-secret ] || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' > ~/.yt-secret
export SECRET="$(cat ~/.yt-secret)"
termux-wake-lock
node streamer.mjs &
cloudflared tunnel --url http://localhost:8787
