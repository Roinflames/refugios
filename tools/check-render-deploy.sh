#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${APP_URL:-}}"

if [ -z "${BASE_URL}" ]; then
  echo "Uso: APP_URL=https://tu-app.onrender.com $0"
  echo "  o: $0 https://tu-app.onrender.com"
  exit 2
fi

BASE_URL="${BASE_URL%/}"
TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

check_endpoint() {
  local path="$1"
  local code

  code="$(curl -sS -L -o "$TMP_FILE" -w "%{http_code}" "${BASE_URL}${path}")"
  echo "${path} -> HTTP ${code}"

  if [ "${code}" -ge 400 ]; then
    echo "Respuesta de error:"
    head -c 600 "$TMP_FILE"
    echo
    return 1
  fi

  head -c 300 "$TMP_FILE"
  echo
  return 0
}

echo "Verificando deploy en: ${BASE_URL}"

check_endpoint "/health"
check_endpoint "/api/dashboard/summary"

if [ -n "${RENDER_API_KEY:-}" ] && [ -n "${RENDER_SERVICE_ID:-}" ]; then
  echo
  echo "Consultando ultimo deploy via API de Render..."
  DEPLOYS_JSON="$(curl -sS -H "Authorization: Bearer ${RENDER_API_KEY}" "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys?limit=1")"

  node --input-type=module -e '
    const raw = process.argv[1];
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.log("No se pudo parsear respuesta de deploys");
      process.exit(0);
    }

    const first = Array.isArray(data) ? data[0] : (Array.isArray(data?.items) ? data.items[0] : null);
    if (!first) {
      console.log("No hay deploys en la respuesta");
      process.exit(0);
    }

    const status = first.status || first.state || "unknown";
    const commit = first.commit?.id || first.commitId || first.commit?.sha || "n/a";
    const createdAt = first.createdAt || "n/a";
    const updatedAt = first.updatedAt || first.finishedAt || "n/a";

    console.log(`deploy_status=${status}`);
    console.log(`deploy_commit=${commit}`);
    console.log(`deploy_created_at=${createdAt}`);
    console.log(`deploy_updated_at=${updatedAt}`);
  ' "$DEPLOYS_JSON"
else
  echo
  echo "Tip: para ver estado del ultimo deploy sin dashboard, exporta RENDER_API_KEY y RENDER_SERVICE_ID."
fi

echo

echo "OK: checks completados."
