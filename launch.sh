#!/usr/bin/env bash
set -e
set -m  # Enable job control

cd /home/adrian/Projects/Hunters_Journal
export PATH="$HOME/.local/nodejs/bin:$PATH"

CLEANUP_DONE=0

cleanup() {
  if [ "$CLEANUP_DONE" -eq 1 ]; then
    return
  fi
  CLEANUP_DONE=1

  echo ""
  echo "Shutting down Hunters Journal..."

  # Kill the background npm run dev job
  if [ -n "$DEV_PID" ] && kill -0 "$DEV_PID" 2>/dev/null; then
    kill "$DEV_PID" 2>/dev/null || true
    # Give it a moment to terminate children
    sleep 0.5
  fi

  # Kill known process names that may have been orphaned
  pkill -f "tsx watch src/index.ts" 2>/dev/null || true
  pkill -f "concurrently.*server,client" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true

  wait 2>/dev/null || true
  exit 0
}

# Trap ALL exit paths
trap cleanup EXIT INT TERM HUP

echo "Starting Hunters Journal..."
npm run dev &
DEV_PID=$!

# Wait for backend to be ready
for i in {1..30}; do
  if curl -s -o /dev/null http://localhost:3001/api/health 2>/dev/null; then
    break
  fi
  sleep 1
done

# Wait for frontend to be ready
for i in {1..30}; do
  if curl -s -o /dev/null http://localhost:5173 2>/dev/null; then
    break
  fi
  sleep 1
done

# Open browser in background
(xdg-open http://localhost:5173 &) 2>/dev/null || true

echo ""
echo "Servers running. Close this window to stop."

# Keep shell alive until the dev server dies or user closes the window
wait $DEV_PID
