#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${APP_URL:-}}"
BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD)}"
INTERVAL="${RENDER_WAIT_INTERVAL:-10}"
TIMEOUT="${RENDER_WAIT_TIMEOUT:-900}"

if [ -z "${BASE_URL}" ]; then
  echo "Uso: APP_URL=https://tu-app.onrender.com $0"
  echo "  o: $0 https://tu-app.onrender.com [rama]"
  exit 2
fi

BASE_URL="${BASE_URL%/}"

echo "Push a origin/${BRANCH}..."
git push origin "${BRANCH}"

echo "Esperando deploy en ${BASE_URL}"
echo "Timeout: ${TIMEOUT}s | Intervalo: ${INTERVAL}s"

start_ts="$(date +%s)"
tmp_health="$(mktemp)"
tmp_summary="$(mktemp)"
trap 'rm -f "$tmp_health" "$tmp_summary"' EXIT

while true; do
  now="$(date +%s)"
  elapsed="$((now - start_ts))"

  health_code="$(curl -sS -L -o "$tmp_health" -w "%{http_code}" "${BASE_URL}/health" || true)"
  summary_code="$(curl -sS -L -o "$tmp_summary" -w "%{http_code}" "${BASE_URL}/api/dashboard/summary" || true)"

  printf '[%ss] /health=%s | /api/dashboard/summary=%s\n' "$elapsed" "$health_code" "$summary_code"

  if [ "$health_code" = "200" ] && [ "$summary_code" = "200" ]; then
    echo "Deploy OK."
    echo "Health: $(head -c 180 "$tmp_health")"
    echo
    echo "Summary: $(head -c 220 "$tmp_summary")"
    echo
    exit 0
  fi

  if [ "$elapsed" -ge "$TIMEOUT" ]; then
    echo "Timeout esperando deploy sano."
    echo "Ultima respuesta /health:"
    head -c 400 "$tmp_health" || true
    echo
    echo "Ultima respuesta /api/dashboard/summary:"
    head -c 600 "$tmp_summary" || true
    echo
    exit 1
  fi

  sleep "$INTERVAL"
done
