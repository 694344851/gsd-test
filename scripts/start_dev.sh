#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PORT="${DASHBOARD_API_PORT:-8000}"
WEB_PORT="${FRONTEND_PORT:-5173}"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"

API_PID=""
WEB_PID=""

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

port_in_use() {
  lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

wait_for_port() {
  local port="$1"
  local label="$2"
  local attempt

  for attempt in $(seq 1 50); do
    if port_in_use "$port"; then
      return 0
    fi
    sleep 0.2
  done

  echo "$label did not start on port $port" >&2
  exit 1
}

cleanup() {
  set +e

  if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" >/dev/null 2>&1; then
    kill "$WEB_PID" >/dev/null 2>&1
  fi

  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" >/dev/null 2>&1; then
    kill "$API_PID" >/dev/null 2>&1
  fi

  wait "$WEB_PID" >/dev/null 2>&1 || true
  wait "$API_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

require_command python3
require_command npm
require_command lsof

if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  echo "frontend/node_modules is missing. Run 'cd frontend && npm install' first." >&2
  exit 1
fi

if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
  echo "node_modules is missing at repo root. Run 'npm install' first." >&2
  exit 1
fi

if port_in_use "$API_PORT"; then
  echo "API port $API_PORT is already in use." >&2
  exit 1
fi

if port_in_use "$WEB_PORT"; then
  echo "Frontend port $WEB_PORT is already in use." >&2
  exit 1
fi

export DATABASE_URL
export DASHBOARD_API_PORT="$API_PORT"
export PATH="$ROOT_DIR/bin:$PATH"
export PYTHONPATH="$ROOT_DIR${PYTHONPATH:+:$PYTHONPATH}"

echo "Starting dashboard API on http://127.0.0.1:$API_PORT"
(
  cd "$ROOT_DIR"
  python3 scripts/run_dashboard_api.py
) &
API_PID="$!"

wait_for_port "$API_PORT" "Dashboard API"

echo "Starting frontend on http://127.0.0.1:$WEB_PORT"
(
  cd "$ROOT_DIR/frontend"
  npm run dev -- --host 127.0.0.1 --port "$WEB_PORT" --strictPort
) &
WEB_PID="$!"

wait_for_port "$WEB_PORT" "Frontend"

cat <<EOF

Dev environment is ready.

- Frontend: http://127.0.0.1:$WEB_PORT
- API: http://127.0.0.1:$API_PORT
- DATABASE_URL: $DATABASE_URL

Press Ctrl+C to stop both processes.
EOF

wait "$API_PID" "$WEB_PID"
