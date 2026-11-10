#!/data/data/com.termux/files/usr/bin/sh
# (Re)start everything in the background; safe to run over ssh. Logs: log.txt, tunnel.log
cd "$(dirname "$0")"
pkill -f "sh start[.]sh"
pkill -f "node streamer[.]mjs"
pkill -f "cloudflared tunnel --url"
sleep 1
nohup setsid sh start.sh > log.txt 2>&1 < /dev/null &
