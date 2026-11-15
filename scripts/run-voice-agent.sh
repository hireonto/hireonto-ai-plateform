#!/usr/bin/env bash
# Keep Tovia's LiveKit worker running; restart automatically if it exits.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/logs/ai-agent.log"
LOCK="$ROOT/logs/ai-agent.lock"
mkdir -p "$ROOT/logs"

if [[ -f "$LOCK" ]]; then
  old=$(cat "$LOCK" 2>/dev/null || true)
  if [[ -n "$old" ]] && kill -0 "$old" 2>/dev/null; then
    echo "Voice agent supervisor already running (pid $old)" >&2
    exit 0
  fi
fi
echo $$ >"$LOCK"
trap 'rm -f "$LOCK"' EXIT

cd "$ROOT/ai"
echo "$(date -Iseconds) voice agent supervisor started" >>"$LOG"
while true; do
  echo "$(date -Iseconds) starting agent.worker dev" >>"$LOG"
  ./.venv/bin/python -m agent.worker dev >>"$LOG" 2>&1 || true
  echo "$(date -Iseconds) agent exited ($?), restarting in 2s" >>"$LOG"
  sleep 2
done
