#!/usr/bin/env bash
# Start HireMind dev services with per-service log files, or print status / errors.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

port_open() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

http_ok() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 "$1" 2>/dev/null || echo '000')
  [[ "$code" =~ ^[23] ]]
}

wait_port() {
  local port=$1 tries=${2:-30}
  for ((i = 0; i < tries; i++)); do
    port_open "$port" && return 0
    sleep 1
  done
  return 1
}

start_bg() {
  local name=$1
  shift
  local log="$LOG_DIR/${name}.log"
  local pidfile="$LOG_DIR/${name}.pid"
  if [[ -f "$pidfile" ]]; then
    local oldpid
    oldpid=$(cat "$pidfile")
    if kill -0 "$oldpid" 2>/dev/null; then
      echo -e "${GREEN}✓${NC} $name already running (pid $oldpid)"
      return 0
    fi
  fi
  echo "→ Starting $name (log: logs/${name}.log)"
  if [[ "$name" != "ai-agent" ]]; then
    : >"$log"
  fi
  (cd "$ROOT" && "$@") >>"$log" 2>&1 &
  echo $! >"$pidfile"
}

print_log_tail() {
  local name=$1 lines=${2:-40}
  local log="$LOG_DIR/${name}.log"
  if [[ -f "$log" ]]; then
    echo -e "${YELLOW}--- last ${lines} lines of logs/${name}.log ---${NC}"
    tail -n "$lines" "$log"
  else
    echo "(no log file logs/${name}.log)"
  fi
}

cmd_start() {
  echo "Log directory: $LOG_DIR"
  echo ""

  # Dependencies (not started here — only checked)
  for dep in "postgres:5432" "redis:6379"; do
    local n=${dep%%:*} p=${dep##*:}
    if port_open "$p"; then
      echo -e "${GREEN}✓${NC} $n listening on :$p"
    else
      echo -e "${RED}✗${NC} $n not on :$p — start Postgres/Redis (e.g. docker compose up -d postgres redis)"
    fi
  done
  echo ""

  if ! port_open 7880; then
    if command -v livekit-server >/dev/null 2>&1; then
      start_bg livekit bash -c 'exec livekit-server --dev --bind 127.0.0.1'
      wait_port 7880 15 || echo -e "${RED}✗${NC} livekit failed to bind :7880"
    else
      echo -e "${RED}✗${NC} livekit-server not in PATH — install LiveKit CLI / livekit-server for voice"
    fi
  else
    echo -e "${GREEN}✓${NC} livekit already on :7880"
  fi

  if ! port_open 3001; then
    start_bg backend npm run start:dev
    wait_port 3001 45 || true
  else
    echo -e "${GREEN}✓${NC} backend already on :3001"
  fi

  if ! port_open 8000; then
    start_bg ai-api bash -c 'cd ai && exec uv run uvicorn app.main:app --port 8000'
    wait_port 8000 20 || true
  else
    echo -e "${GREEN}✓${NC} ai-api already on :8000"
  fi

  pkill -f 'run-voice-agent.sh' 2>/dev/null || true
  pkill -f 'python -m agent\.worker' 2>/dev/null || true
  rm -f "$LOG_DIR/ai-agent.pid" "$LOG_DIR/ai-agent.lock"
  if ! pgrep -f 'run-voice-agent.sh' >/dev/null 2>&1; then
    start_bg ai-agent bash -c 'exec bash scripts/run-voice-agent.sh'
    sleep 8
  else
    echo -e "${GREEN}✓${NC} ai-agent worker already running"
  fi

  if ! port_open 3000; then
    start_bg frontend bash -c 'cd frontend && exec npm run dev'
    wait_port 3000 20 || true
  else
    echo -e "${GREEN}✓${NC} frontend already on :3000"
  fi

  echo ""
  cmd_status || true
  echo ""
  print_runbook
}

print_runbook() {
  echo -e "${YELLOW}══════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}  HireMind — kya kya chalta hai (local dev)${NC}"
  echo -e "${YELLOW}══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "  Pehle (ek baar / jab DB band ho):"
  echo "    docker compose up -d postgres redis mailhog minio minio-init"
  echo ""
  echo "  Saara app stack (ye script / npm):"
  echo "    npm run dev:stack     ← sab start + status + ye list"
  echo "    npm run dev:status    ← sirf UP/DOWN"
  echo "    npm run dev:logs      ← last lines har service ki"
  echo "    npm run dev:tail      ← live logs terminal mein (Ctrl+C)"
  echo "    npm run dev:stop      ← band karo"
  echo ""
  echo -e "  ${GREEN}Service${NC}              ${GREEN}Port${NC}   ${GREEN}URL / command${NC}"
  echo "  ─────────────────────────────────────────────────────────"
  echo "  PostgreSQL            5432   (docker / local)"
  echo "  Redis                 6379   (docker)"
  echo "  LiveKit (voice)       7880   livekit-server --dev --bind 127.0.0.1"
  echo "  Backend (NestJS)      3001   npm run start:dev  →  http://localhost:3001/docs"
  echo "  AI API (FastAPI)      8000   cd ai && uv run uvicorn app.main:app --port 8000"
  echo "  Voice agent (Tovia)    —      bash scripts/run-voice-agent.sh  (LiveKit worker)"
  echo "  Frontend (Vite)       3000   cd frontend && npm run dev  →  http://localhost:3000"
  echo ""
  echo "  Log files: logs/livekit.log, logs/backend.log, logs/ai-api.log,"
  echo "             logs/ai-agent.log, logs/frontend.log"
  echo ""
  echo -e "  ${GREEN}Open in browser:${NC}  http://localhost:3000"
  echo -e "  ${GREEN}Staff login:${NC}      admin@acme.hiremind.local / ChangeMe123!"
  echo -e "${YELLOW}══════════════════════════════════════════════════════════════${NC}"
}

cmd_tail() {
  echo "Live logs (Ctrl+C to stop). Files under logs/"
  echo ""
  touch "$LOG_DIR/livekit.log" "$LOG_DIR/backend.log" "$LOG_DIR/ai-api.log" "$LOG_DIR/ai-agent.log" "$LOG_DIR/frontend.log"
  tail -f \
    "$LOG_DIR/livekit.log" \
    "$LOG_DIR/backend.log" \
    "$LOG_DIR/ai-api.log" \
    "$LOG_DIR/ai-agent.log" \
    "$LOG_DIR/frontend.log"
}

cmd_status() {
  local failed=0

  check_port_svc() {
    local label=$1 port=$2 hint=$3
    if port_open "$port"; then
      echo -e "${GREEN}UP${NC}   $label"
    else
      echo -e "${RED}DOWN${NC} $label — $hint"
      failed=1
    fi
  }

  check_http() {
    local label=$1 url=$2 logname=$3
    if http_ok "$url"; then
      echo -e "${GREEN}UP${NC}   $label"
    else
      echo -e "${RED}DOWN${NC} $label — see logs/${logname}.log"
      failed=1
    fi
  }

  check_port_svc "PostgreSQL :5432" 5432 "start postgres"
  check_port_svc "Redis :6379" 6379 "docker compose up -d redis"
  check_port_svc "LiveKit :7880" 7880 "logs/livekit.log"
  check_http "Backend :3001" "http://localhost:3001/docs" backend
  check_http "AI API :8000" "http://localhost:8000/health" ai-api
  check_http "Frontend :3000" "http://localhost:3000/" frontend

  agent_up=0
  if pgrep -f 'run-voice-agent.sh' >/dev/null 2>&1 || pgrep -f 'python -m agent\.worker' >/dev/null 2>&1; then
    agent_up=1
  elif [[ -f "$LOG_DIR/ai-agent.pid" ]] && kill -0 "$(cat "$LOG_DIR/ai-agent.pid")" 2>/dev/null; then
    agent_up=1
  fi
  if [[ $agent_up -eq 1 ]]; then
    echo -e "${GREEN}UP${NC}   Voice agent (Tovia supervisor + agent.worker)"
  else
    echo -e "${RED}DOWN${NC} Voice agent — run: bash scripts/run-voice-agent.sh (see logs/ai-agent.log)"
    failed=1
  fi

  if curl -s --connect-timeout 2 http://localhost:8000/health 2>/dev/null | grep -q '"voiceReady":true'; then
    echo -e "${GREEN}OK${NC}   AI voiceReady=true (Gemini + Cartesia + LiveKit keys in ai/.env)"
  else
    echo -e "${YELLOW}WARN${NC} AI voiceReady=false — voice interviews fall back to chat; check ai/.env keys"
  fi

  echo ""
  if [[ $failed -eq 1 ]]; then
    echo -e "Some services are down. Run: ${YELLOW}npm run dev:logs${NC} or ${YELLOW}bash scripts/dev-stack.sh logs${NC}"
  else
    echo -e "${GREEN}All core services look up.${NC} Frontend → http://localhost:3000  API → http://localhost:3001/docs"
  fi
  return $failed
}

cmd_logs() {
  local names=(livekit backend ai-api ai-agent frontend)
  for n in "$@"; do names=("$n"); done
  for n in "${names[@]}"; do
    print_log_tail "$n" 50
    echo ""
  done
}

cmd_stop() {
  for pidfile in "$LOG_DIR"/*.pid; do
    [[ -f "$pidfile" ]] || continue
    pid=$(cat "$pidfile")
    name=$(basename "$pidfile" .pid)
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      echo "Stopped $name (pid $pid)"
    fi
    rm -f "$pidfile"
  done
  pkill -f 'run-voice-agent.sh' 2>/dev/null || true
  pkill -f 'python -m agent\.worker' 2>/dev/null || true
  rm -f "$LOG_DIR/ai-agent.lock"
}

case "${1:-start}" in
  start) cmd_start ;;
  status) cmd_status ;;
  runbook) print_runbook ;;
  logs) shift; cmd_logs "$@" ;;
  tail) cmd_tail ;;
  stop) cmd_stop ;;
  *)
    echo "Usage: $0 {start|status|runbook|logs [service]|tail|stop}"
    exit 1
    ;;
esac
