#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${NGROK_AUTHTOKEN:-}" ]]; then
  echo "Erro: defina NGROK_AUTHTOKEN no ambiente." >&2
  exit 1
fi

NGROK_BIN="${HOME}/.local/bin/ngrok"
if [[ ! -x "$NGROK_BIN" ]]; then
  echo "Erro: ngrok não encontrado em $NGROK_BIN" >&2
  exit 1
fi

"$NGROK_BIN" config add-authtoken "$NGROK_AUTHTOKEN" >/dev/null

LOG_FILE="/tmp/ngrok-luzia.log"
PID_FILE="/tmp/ngrok-luzia.pid"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  kill "$(cat "$PID_FILE")" || true
  sleep 1
fi

nohup "$NGROK_BIN" http 127.0.0.1:8000 --inspect=false --log=stdout >"$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

for _ in {1..30}; do
  if rg -q 'url=' "$LOG_FILE"; then
    break
  fi
  sleep 1
done

URL=$(rg -o 'https://[a-zA-Z0-9.-]+ngrok[-a-zA-Z0-9.]*' "$LOG_FILE" | head -n1 || true)
if [[ -z "$URL" ]]; then
  echo "Ngrok iniciado (PID $(cat "$PID_FILE")), mas URL ainda não foi detectada." >&2
  echo "Veja logs: $LOG_FILE" >&2
  exit 2
fi

echo "URL pública: $URL"
echo "Webhook Twilio: $URL/api/v1/bot/twilio/whatsapp"
