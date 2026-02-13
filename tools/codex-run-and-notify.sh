#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <comando...>"
  exit 1
fi

START_TS="$(date +%s)"
COMMAND="$*"
PROJECT_NAME="${PROJECT_NAME:-cabanas-mvp}"
HOSTNAME_VAL="$(hostname)"

set +e
bash -lc "$COMMAND"
STATUS=$?
set -e

END_TS="$(date +%s)"
DURATION="$((END_TS - START_TS))"
NOW_ISO="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if [[ "$STATUS" -eq 0 ]]; then
  RESULT="OK"
else
  RESULT="ERROR ($STATUS)"
fi

MSG="[Codex] ${PROJECT_NAME} | ${RESULT} | ${DURATION}s | ${NOW_ISO} | ${HOSTNAME_VAL} | cmd: ${COMMAND}"

"$(dirname "$0")/notify-whatsapp.sh" "$MSG"

exit "$STATUS"
