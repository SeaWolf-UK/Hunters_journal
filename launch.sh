#!/usr/bin/env bash
set -e
cd /home/adrian/Projects/Hunters_Journal
export PATH="$HOME/.local/nodejs/bin:$PATH"

echo "Starting Hunters Journal..."
npm run dev &
PID=$!

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill $PID 2>/dev/null || true
  wait $PID 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

# Wait for Vite dev server to be ready
for i in {1..30}; do
  if curl -s -o /dev/null http://localhost:5173 2>/dev/null; then
    break
  fi
  sleep 1
done

xdg-open http://localhost:5173

echo ""
echo "Servers running. Press Ctrl+C to stop."
wait $PID
